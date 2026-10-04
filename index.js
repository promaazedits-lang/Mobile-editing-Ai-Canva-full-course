import "dotenv/config";
import express from "express"; import helmet from "helmet"; import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser"; import bcrypt from "bcryptjs"; import crypto from "node:crypto";
import Database from "better-sqlite3"; import Razorpay from "razorpay"; import { z } from "zod";
import path from "node:path"; import { fileURLToPath } from "node:url";
const E = process.env, PROD = E.NODE_ENV === "production", MAX_DEV = +(E.MAX_DEVICES || 2);
const rz = new Razorpay({ key_id: E.RAZORPAY_KEY_ID || "x", key_secret: E.RAZORPAY_KEY_SECRET || "x" });
const db = new Database(E.DB_PATH || "data.db"); db.pragma("journal_mode = WAL"); db.pragma("foreign_keys = ON");
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, pass_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'student', blocked INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS devices(user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, device_id TEXT NOT NULL, label TEXT, first_seen INTEGER, PRIMARY KEY(user_id, device_id));
CREATE TABLE IF NOT EXISTS sessions(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, device_id TEXT NOT NULL, token_hash TEXT UNIQUE NOT NULL, ip TEXT, label TEXT, created_at INTEGER NOT NULL, last_seen INTEGER NOT NULL, revoked INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS modules(id INTEGER PRIMARY KEY, title TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0, published INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS lessons(id INTEGER PRIMARY KEY, module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT DEFAULT '', duration TEXT DEFAULT '', thumbnail TEXT DEFAULT '', video_id TEXT DEFAULT '', position INTEGER NOT NULL DEFAULT 0, published INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS payments(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), order_id TEXT UNIQUE NOT NULL, payment_id TEXT, amount INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'created', created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS enrollments(user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, payment_id TEXT, created_at INTEGER NOT NULL, revoked INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS progress(user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE, completed_at INTEGER NOT NULL, PRIMARY KEY(user_id, lesson_id));`);

const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
const hmac = (k, d) => crypto.createHmac("sha256", k).update(d).digest("hex");
const safeEq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const wrap = (f) => (q, s, n) => Promise.resolve(f(q, s, n)).catch(n);
const enrolled = (uid) => !!db.prepare("SELECT 1 FROM enrollments WHERE user_id=? AND revoked=0").get(uid);
const conv = (d) => Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined).map(([k, v]) => [k, typeof v === "boolean" ? +v : v]));

function grant(orderId, paymentId) {
  db.transaction(() => {
    const p = db.prepare("SELECT * FROM payments WHERE order_id=?").get(orderId); if (!p) return;
    db.prepare("UPDATE payments SET status='paid', payment_id=? WHERE order_id=?").run(paymentId, orderId);
    db.prepare("INSERT INTO enrollments(user_id,payment_id,created_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET revoked=0, payment_id=excluded.payment_id").run(p.user_id, paymentId, Date.now());
  })();
}

const app = express(); app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'", "https://checkout.razorpay.com", "https://accounts.google.com/gsi/client"], frameSrc: ["https://api.razorpay.com", "https://iframe.mediadelivery.net", "https://accounts.google.com/gsi/"], connectSrc: ["'self'", "https://lumberjack.razorpay.com", "https://api.razorpay.com", "https://video.bunnycdn.com", "https://accounts.google.com/gsi/"], imgSrc: ["'self'", "data:", "https:"], styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com/gsi/style"], fontSrc: ["https://fonts.gstatic.com"] } } }));
// Razorpay webhook: raw body, signature verified with the webhook secret. Grants access even if the browser closes mid-payment.
app.post("/api/pay/webhook", express.raw({ type: "application/json" }), (req, res) => {
  if (!E.RAZORPAY_WEBHOOK_SECRET || !safeEq(hmac(E.RAZORPAY_WEBHOOK_SECRET, req.body), req.headers["x-razorpay-signature"] || "")) return res.sendStatus(400);
  const ev = JSON.parse(req.body);
  if (ev.event === "payment.captured") {
    const p = ev.payload.payment.entity, row = db.prepare("SELECT * FROM payments WHERE order_id=?").get(p.order_id);
    if (row && row.amount === p.amount) grant(p.order_id, p.id);
  }
  res.json({ ok: true });
});
app.use(express.json({ limit: "50kb" })); app.use(cookieParser());
app.use("/api", rateLimit({ windowMs: 60_000, limit: 300 }));
// CSRF: cookies are SameSite=Lax and every write needs a custom header (which cross-site forms cannot send)
app.use("/api", (q, s, n) => (q.method === "GET" || q.headers["x-csrf"] === "1" ? n() : s.status(403).json({ error: "Bad request" })));

const cookieOpts = { httpOnly: true, secure: PROD, sameSite: "lax", path: "/" };
function startSession(user, req, res) {
  let did = req.cookies.did; if (!/^[a-f0-9]{32}$/.test(did || "")) did = crypto.randomBytes(16).toString("hex");
  const label = (req.headers["user-agent"] || "").slice(0, 90), now = Date.now();
  // Device limit: signing in on a new device signs out the least recently used device(s)
  const others = db.prepare("SELECT device_id FROM sessions WHERE user_id=? AND revoked=0 AND device_id!=? GROUP BY device_id ORDER BY MAX(last_seen) DESC").all(user.id, did);
  for (const d of others.slice(Math.max(MAX_DEV - 1, 0))) db.prepare("UPDATE sessions SET revoked=1 WHERE user_id=? AND device_id=?").run(user.id, d.device_id);
  db.prepare("INSERT OR IGNORE INTO devices VALUES(?,?,?,?)").run(user.id, did, label, now);
  const token = crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions(user_id,device_id,token_hash,ip,label,created_at,last_seen) VALUES(?,?,?,?,?,?,?)").run(user.id, did, sha(token), req.ip, label, now, now);
  res.cookie("sid", token, { ...cookieOpts, maxAge: 30 * 864e5 }); res.cookie("did", did, { ...cookieOpts, maxAge: 365 * 864e5 });
}
const auth = (req, res, next) => {
  const t = req.cookies.sid; if (!t) return res.status(401).json({ error: "Please log in" });
  const s = db.prepare("SELECT s.id AS sid, u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.revoked=0 AND s.created_at>?").get(sha(t), Date.now() - 30 * 864e5);
  if (!s || s.blocked) return res.status(401).json({ error: "Session expired. Please log in again." });
  db.prepare("UPDATE sessions SET last_seen=? WHERE id=?").run(Date.now(), s.sid); req.user = s; next();
};
const admin = [auth, (q, s, n) => (q.user.role === "admin" ? n() : s.status(403).json({ error: "Forbidden" }))];

const authLimit = rateLimit({ windowMs: 15 * 60_000, limit: 20, message: { error: "Too many attempts. Try again later." } });
const cred = z.object({ email: z.string().email().max(200).transform((s) => s.toLowerCase()), password: z.string().min(8).max(200) });
app.post("/api/auth/signup", authLimit, wrap((req, res) => {
  const d = cred.extend({ name: z.string().trim().min(1).max(80) }).parse(req.body);
  if (db.prepare("SELECT 1 FROM users WHERE email=?").get(d.email)) return res.status(409).json({ error: "Email already registered" });
  const role = E.ADMIN_EMAIL && d.email === E.ADMIN_EMAIL.toLowerCase() ? "admin" : "student";
  const id = db.prepare("INSERT INTO users(email,name,pass_hash,role,created_at) VALUES(?,?,?,?,?)").run(d.email, d.name, bcrypt.hashSync(d.password, 12), role, Date.now()).lastInsertRowid;
  startSession({ id }, req, res); res.json({ ok: true });
}));
const DUMMY = bcrypt.hashSync("dummy-password", 12);
app.post("/api/auth/login", authLimit, wrap((req, res) => {
  const d = cred.parse(req.body), u = db.prepare("SELECT * FROM users WHERE email=?").get(d.email);
  const ok = bcrypt.compareSync(d.password, u ? u.pass_hash : DUMMY); // constant-ish time whether or not the user exists
  if (!u || !ok || u.blocked) return res.status(401).json({ error: "Wrong email or password" });
  startSession(u, req, res); res.json({ ok: true });
}));
// ---- Sign in with Google (optional: only active when GOOGLE_CLIENT_ID is set). Email + password keeps working. ----
app.get("/api/auth/config", (q, s) => s.json({ googleClientId: E.GOOGLE_CLIENT_ID || null }));
app.post("/api/auth/google", authLimit, wrap(async (req, res) => {
  if (!E.GOOGLE_CLIENT_ID) return res.status(404).json({ error: "Google sign-in is not enabled" });
  const { credential } = z.object({ credential: z.string().min(20).max(5000) }).parse(req.body);
  // Google checks the signature and expiry of the token for us; we then check it was issued for OUR app and the email is verified.
  const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!r.ok) return res.status(401).json({ error: "Google sign-in failed. Please try again." });
  const g = await r.json();
  if (g.aud !== E.GOOGLE_CLIENT_ID || !["accounts.google.com", "https://accounts.google.com"].includes(g.iss) || g.email_verified !== "true" || !g.email)
    return res.status(401).json({ error: "Google sign-in failed. Please try again." });
  const email = String(g.email).toLowerCase(), name = String(g.name || email.split("@")[0]).trim().slice(0, 80);
  let u = db.prepare("SELECT * FROM users WHERE email=?").get(email);
  if (!u) {
    const role = E.ADMIN_EMAIL && email === E.ADMIN_EMAIL.toLowerCase() ? "admin" : "student";
    const id = db.prepare("INSERT INTO users(email,name,pass_hash,role,created_at) VALUES(?,?,?,?,?)").run(email, name, bcrypt.hashSync(crypto.randomBytes(32).toString("hex"), 12), role, Date.now()).lastInsertRowid;
    u = { id };
  } else if (u.blocked) return res.status(401).json({ error: "This account is blocked" });
  startSession(u, req, res); res.json({ ok: true });
}));
app.post("/api/auth/logout", auth, (req, res) => { db.prepare("UPDATE sessions SET revoked=1 WHERE id=?").run(req.user.sid); res.clearCookie("sid", cookieOpts); res.json({ ok: true }); });
app.get("/api/me", auth, (req, res) => { const { id, name, email, role } = req.user; res.json({ user: { id, name, email, role }, enrolled: enrolled(id), sessionId: req.user.sid }); });
app.get("/api/sessions", auth, (req, res) => res.json(db.prepare("SELECT id,label,ip,created_at,last_seen FROM sessions WHERE user_id=? AND revoked=0 ORDER BY last_seen DESC").all(req.user.id)));
app.delete("/api/sessions/:id", auth, (req, res) => { db.prepare("UPDATE sessions SET revoked=1 WHERE id=? AND user_id=?").run(+req.params.id, req.user.id); res.json({ ok: true }); });
app.post("/api/sessions/revoke-others", auth, (req, res) => { db.prepare("UPDATE sessions SET revoked=1 WHERE user_id=? AND id!=?").run(req.user.id, req.user.sid); res.json({ ok: true }); });
app.post("/api/account/password", auth, wrap((req, res) => {
  const d = z.object({ current: z.string(), next: z.string().min(8).max(200) }).parse(req.body);
  if (!bcrypt.compareSync(d.current, req.user.pass_hash)) return res.status(400).json({ error: "Current password is wrong" });
  db.prepare("UPDATE users SET pass_hash=? WHERE id=?").run(bcrypt.hashSync(d.next, 12), req.user.id);
  db.prepare("UPDATE sessions SET revoked=1 WHERE user_id=? AND id!=?").run(req.user.id, req.user.sid); res.json({ ok: true });
}));

// ---- Payments (amount always comes from the server, never from the browser) ----
app.post("/api/pay/order", auth, wrap(async (req, res) => {
  if (enrolled(req.user.id)) return res.status(409).json({ error: "Already enrolled" });
  const amount = +E.COURSE_PRICE_PAISE; if (!amount) return res.status(500).json({ error: "Price not configured" });
  const o = await rz.orders.create({ amount, currency: "INR", receipt: `u${req.user.id}_${Date.now()}` });
  db.prepare("INSERT INTO payments(user_id,order_id,amount,created_at) VALUES(?,?,?,?)").run(req.user.id, o.id, amount, Date.now());
  res.json({ orderId: o.id, amount, keyId: E.RAZORPAY_KEY_ID });
}));
app.post("/api/pay/verify", auth, wrap(async (req, res) => {
  const b = z.object({ razorpay_order_id: z.string(), razorpay_payment_id: z.string(), razorpay_signature: z.string() }).parse(req.body);
  const p = db.prepare("SELECT * FROM payments WHERE order_id=? AND user_id=?").get(b.razorpay_order_id, req.user.id);
  if (!p) return res.status(404).json({ error: "Order not found" });
  if (!safeEq(hmac(E.RAZORPAY_KEY_SECRET, `${b.razorpay_order_id}|${b.razorpay_payment_id}`), b.razorpay_signature)) return res.status(400).json({ error: "Payment verification failed" });
  const rp = await rz.payments.fetch(b.razorpay_payment_id); // double-check with Razorpay itself
  if (rp.order_id !== p.order_id || rp.amount !== p.amount || rp.status !== "captured") return res.status(402).json({ error: "Payment is still processing. Access unlocks automatically once it is confirmed." });
  grant(p.order_id, rp.id); res.json({ ok: true });
}));

// ---- Course (enrolled students only). Video ids never reach the browser; only short-lived signed URLs do. ----
const needEnrolled = (q, s, n) => (enrolled(q.user.id) || q.user.role === "admin" ? n() : s.status(402).json({ error: "Enrollment required" }));
app.get("/api/course", auth, needEnrolled, (req, res) => {
  const mods = db.prepare("SELECT id,title FROM modules WHERE published=1 ORDER BY position,id").all();
  const les = db.prepare("SELECT id,module_id,title,description,duration,thumbnail FROM lessons WHERE published=1 ORDER BY position,id").all();
  const done = db.prepare("SELECT lesson_id FROM progress WHERE user_id=?").pluck().all(req.user.id);
  res.json({ modules: mods.map((m) => ({ ...m, lessons: les.filter((l) => l.module_id === m.id) })), done });
});
const playLimit = rateLimit({ windowMs: 60_000, limit: 30 });
// Bunny Stream: the token security key stays on the server. Only a logged-in, enrolled student (or the admin)
// gets a signed embed URL, valid for 2 hours: token = SHA256_HEX(security_key + video_id + expires)
// (Bunny docs: "Embed view token authentication").
app.get("/api/lessons/:id/play", auth, needEnrolled, playLimit, wrap((req, res) => {
  const l = db.prepare("SELECT l.video_id FROM lessons l JOIN modules m ON m.id=l.module_id WHERE l.id=? AND l.published=1 AND m.published=1").get(+req.params.id);
  if (!l || !l.video_id) return res.status(404).json({ error: "Video not available" });
  if (!E.BUNNY_LIBRARY_ID || !E.BUNNY_TOKEN_KEY) return res.status(500).json({ error: "Video service not configured" });
  const expires = Math.floor(Date.now() / 1000) + 7200, token = sha(E.BUNNY_TOKEN_KEY + l.video_id + expires);
  res.set("Cache-Control", "no-store");
  // watermark text is taken from the logged-in account here on the server, never from anything the client sends
  res.json({ url: `https://iframe.mediadelivery.net/embed/${encodeURIComponent(E.BUNNY_LIBRARY_ID)}/${encodeURIComponent(l.video_id)}?token=${token}&expires=${expires}`, watermark: `${req.user.name} • ${req.user.email}` });
}));
app.post("/api/progress", auth, needEnrolled, wrap((req, res) => {
  const d = z.object({ lessonId: z.number().int(), done: z.boolean() }).parse(req.body);
  if (d.done) db.prepare("INSERT OR IGNORE INTO progress VALUES(?,?,?)").run(req.user.id, d.lessonId, Date.now());
  else db.prepare("DELETE FROM progress WHERE user_id=? AND lesson_id=?").run(req.user.id, d.lessonId);
  res.json({ ok: true });
}));

// ---- Admin ----
const T = z.string().trim().min(1).max(200), pos = z.number().int().default(0), pub = z.boolean().default(false);
const modS = z.object({ title: T, position: pos, published: pub });
// Bunny Stream Video ID (a GUID such as 32d140e2-e4f4-4eec-9d53-20371e9be607)
const bunnyId = z.string().trim().max(100).regex(/^[\w-]*$/, "Bunny Stream Video ID can only contain letters, numbers and dashes");
const lesS = z.object({ module_id: z.number().int(), title: T, description: z.string().max(3000).default(""), duration: z.string().max(20).default(""), thumbnail: z.string().url().or(z.literal("")).default(""), video_id: bunnyId.default(""), position: pos, published: pub });
const ins = (t, S) => wrap((q, s) => { const d = conv(S.parse(q.body)), k = Object.keys(d); s.json({ id: db.prepare(`INSERT INTO ${t}(${k}) VALUES(${k.map((x) => "@" + x)})`).run(d).lastInsertRowid }); });
const upd = (t, S) => wrap((q, s) => { const d = conv(S.partial().parse(q.body)), k = Object.keys(d); if (k.length) db.prepare(`UPDATE ${t} SET ${k.map((x) => x + "=@" + x)} WHERE id=@id`).run({ ...d, id: +q.params.id }); s.json({ ok: true }); });
const del = (t) => (q, s) => { db.prepare(`DELETE FROM ${t} WHERE id=?`).run(+q.params.id); s.json({ ok: true }); };
app.get("/api/admin/course", admin, (q, s) => s.json({ modules: db.prepare("SELECT * FROM modules ORDER BY position,id").all(), lessons: db.prepare("SELECT * FROM lessons ORDER BY position,id").all() }));
app.post("/api/admin/modules", admin, ins("modules", modS)); app.put("/api/admin/modules/:id", admin, upd("modules", modS)); app.delete("/api/admin/modules/:id", admin, del("modules"));
// Video upload (Bunny Stream TUS presigned upload): the server creates the video entry and signs the upload
// (signature = SHA256_HEX(libraryId + apiKey + expires + videoId)); the API key itself is never sent to the browser.
// The admin's browser then uploads straight to Bunny, so large videos never pass through this server.
app.post("/api/admin/videos/upload", admin, wrap(async (q, s) => {
  const { title } = z.object({ title: T }).parse(q.body);
  if (!E.BUNNY_LIBRARY_ID || !E.BUNNY_STREAM_API_KEY) return s.status(500).json({ error: "BUNNY_LIBRARY_ID / BUNNY_STREAM_API_KEY are not set" });
  const r = await fetch(`https://video.bunnycdn.com/library/${encodeURIComponent(E.BUNNY_LIBRARY_ID)}/videos`, { method: "POST", headers: { AccessKey: E.BUNNY_STREAM_API_KEY, accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ title }) });
  if (!r.ok) { console.error("Bunny create-video error", r.status); return s.status(502).json({ error: "Bunny Stream refused the request. Check BUNNY_LIBRARY_ID and BUNNY_STREAM_API_KEY." }); }
  const { guid } = await r.json(), expires = Math.floor(Date.now() / 1000) + 6 * 3600;
  s.json({ videoId: guid, libraryId: E.BUNNY_LIBRARY_ID, expires, signature: sha(`${E.BUNNY_LIBRARY_ID}${E.BUNNY_STREAM_API_KEY}${expires}${guid}`) });
}));
app.post("/api/admin/lessons", admin, ins("lessons", lesS)); app.put("/api/admin/lessons/:id", admin, upd("lessons", lesS)); app.delete("/api/admin/lessons/:id", admin, del("lessons"));
app.get("/api/admin/students", admin, (q, s) => s.json(db.prepare("SELECT u.id,u.email,u.name,u.blocked,u.created_at,e.created_at AS enrolled_at,e.revoked,(SELECT COUNT(*) FROM progress p WHERE p.user_id=u.id) AS done FROM users u LEFT JOIN enrollments e ON e.user_id=u.id WHERE u.role='student' ORDER BY u.id DESC").all()));
app.patch("/api/admin/students/:id", admin, wrap((q, s) => {
  const d = z.object({ blocked: z.boolean().optional(), revoked: z.boolean().optional() }).parse(q.body), id = +q.params.id;
  if (d.blocked !== undefined) { db.prepare("UPDATE users SET blocked=? WHERE id=? AND role='student'").run(+d.blocked, id); if (d.blocked) db.prepare("UPDATE sessions SET revoked=1 WHERE user_id=?").run(id); }
  if (d.revoked !== undefined) db.prepare("UPDATE enrollments SET revoked=? WHERE user_id=?").run(+d.revoked, id);
  s.json({ ok: true });
}));

if (PROD) { const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), "../dist"); app.use(express.static(dist)); app.get("*", (q, s) => s.sendFile(path.join(dist, "index.html"))); }
app.use((err, q, s, n) => { if (err instanceof z.ZodError) return s.status(400).json({ error: err.issues[0]?.message || "Invalid input" }); console.error(err); s.status(500).json({ error: "Server error" }); });
app.listen(E.PORT || 3001, () => console.log("API on :" + (E.PORT || 3001)));
