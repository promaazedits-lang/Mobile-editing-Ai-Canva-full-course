import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Menu, X, Play } from "lucide-react";
import { CONFIG } from "../config";
import { api } from "../lib/api";
import Player from "../components/Player";

interface Lesson { id: number; title: string; description: string; duration: string; thumbnail: string }
interface Mod { id: number; title: string; lessons: Lesson[] }

export default function Dashboard() {
  const [me, setMe] = useState<any>(null); const [course, setCourse] = useState<{ modules: Mod[]; done: number[] } | null>(null);
  const [locked, setLocked] = useState(false); const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState<Lesson | null>(null); const [url, setUrl] = useState(""); const [wm, setWm] = useState(""); const [err, setErr] = useState("");
  const [sessions, setSessions] = useState<any[]>([]); const [pw, setPw] = useState({ current: "", next: "" }); const [pwMsg, setPwMsg] = useState("");

  const loadSessions = () => api("/sessions").then(setSessions);
  useEffect(() => {
    api("/me").then(async (m) => {
      setMe(m); loadSessions();
      try { setCourse(await api("/course")); } catch (e: any) { if (e.status === 402) setLocked(true); else setErr(e.message); }
    }).catch(() => { sessionStorage.setItem("next", "#/dashboard"); location.hash = "#/login"; });
  }, []);

  const lessons = course?.modules.flatMap((m) => m.lessons) ?? []; const done = course?.done ?? [];
  const pct = lessons.length ? Math.round((done.length / lessons.length) * 100) : 0;
  const next = lessons.find((l) => !done.includes(l.id));

  const play = useCallback(async (l: Lesson) => {
    setPlaying(l); setUrl(""); setWm(""); setErr("");
    try { const r = await api(`/lessons/${l.id}/play`); setWm(r.watermark); setUrl(r.url); window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e: any) { setErr(e.message); }
  }, []);
  const toggle = async (id: number) => {
    const d = !done.includes(id); await api("/progress", "POST", { lessonId: id, done: d });
    setCourse((c) => c && { ...c, done: d ? [...c.done, id] : c.done.filter((x) => x !== id) });
  };
  const logout = async () => { await api("/auth/logout", "POST"); location.hash = "#/login"; };
  const changePw = async (e: FormEvent) => { e.preventDefault(); try { await api("/account/password", "POST", pw); setPwMsg("Password changed. Other devices were signed out."); setPw({ current: "", next: "" }); loadSessions(); } catch (x: any) { setPwMsg(x.message); } };

  if (!me) return <p className="p-10">Loading…</p>;
  const nav = (
    <ul className="space-y-1 p-4">
      {course?.modules.map((m, i) => <li key={m.id}><a href={`#m${m.id}`} onClick={(e) => { e.preventDefault(); setOpen(false); document.getElementById(`m${m.id}`)?.scrollIntoView({ behavior: "smooth" }); }} className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5">Chapter {i + 1}: {m.title}</a></li>)}
      <li><a href="#account" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5">Account settings</a></li>
    </ul>
  );

  return (
    <div className="min-h-screen md:grid md:grid-cols-[280px_1fr]">
      <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r border-line bg-panel md:block">
        <p className="p-5 font-display text-lg font-extrabold">{CONFIG.brand}</p>{nav}
        {me.user.role === "admin" && <a href="#/admin" className="block p-5 pb-0 text-sm text-accent-soft">Admin panel</a>}
        <a href="#top" className="block p-5 text-sm text-accent-soft">← Back to website</a>
      </aside>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-ink/90 px-4 py-3 backdrop-blur md:hidden">
        <span className="font-display font-bold">{CONFIG.brand}</span>
        <button aria-label={open ? "Close modules" : "Open modules"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && <div className="border-b border-line bg-panel md:hidden">{nav}</div>}
      <main className="px-5 py-10 md:px-10">
        <h1 className="text-3xl font-extrabold md:text-4xl">Welcome to the Complete 3-in-1 Editing Masterclass</h1>
        {locked && <div className="mt-8 max-w-xl rounded-2xl border border-accent/50 bg-panel p-6"><p>You're not enrolled yet.</p><a href="#/enroll" className="mt-4 inline-block rounded-xl bg-accent px-6 py-3 font-semibold">Enroll Now – ₹{CONFIG.price}</a></div>}
        {err && <p role="alert" className="mt-4 text-red-400">{err}</p>}
        {course && <>
          <div className="mt-6 max-w-xl">
            <div className="flex justify-between text-sm text-zinc-400"><span>Course progress</span><span>{pct}%</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} /></div>
            {next && <button onClick={() => play(next)} className="mt-4 rounded-xl bg-accent px-5 py-2.5 font-semibold">{done.length ? "Continue learning" : "Start learning"}: {next.title}</button>}
          </div>
          {playing && (
            <div className="mt-8 max-w-4xl">
              {url && wm ? <Player key={url} title={playing.title} url={url} wm={wm} /> : (
                <div className="relative aspect-video overflow-hidden rounded-2xl bg-black"><p className="p-6 text-zinc-500">Loading video…</p></div>
              )}
              <h2 className="mt-3 text-xl font-bold">{playing.title}</h2><p className="text-zinc-400">{playing.description}</p>
            </div>
          )}
          <div className="mt-10 space-y-12">
            {course.modules.map((m, mi) => (
              <section key={m.id} id={`m${m.id}`} className="scroll-mt-20">
                <h2 className="text-2xl font-bold">Chapter {mi + 1}: {m.title}</h2>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {m.lessons.map((l) => {
                    const ok = done.includes(l.id);
                    return (
                      <article key={l.id} className="rounded-2xl border border-line bg-panel p-4">
                        <button onClick={() => play(l)} className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-black text-zinc-400" aria-label={`Play ${l.title}`}>
                          {l.thumbnail ? <img src={l.thumbnail} alt="" className="h-full w-full object-cover" /> : <><Play className="mr-2 h-5 w-5" />Watch lesson</>}
                        </button>
                        <h3 className="mt-3 font-semibold">{l.title}</h3>
                        <p className="text-sm text-zinc-500">Duration: {l.duration || "—"}</p>
                        <button onClick={() => toggle(l.id)} aria-pressed={ok} className={`mt-3 rounded-lg px-4 py-2 text-sm font-semibold transition ${ok ? "bg-emerald-600/80" : "border border-line hover:border-accent-soft"}`}>{ok ? "✓ Completed" : "Mark as Complete"}</button>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
            {!course.modules.length && <p className="text-zinc-400">Lessons will appear here once they are published.</p>}
          </div>
        </>}
        <section id="account" className="mt-16 scroll-mt-20 max-w-3xl border-t border-line pt-10">
          <h2 className="text-2xl font-bold">Account settings</h2>
          <p className="mt-2 text-zinc-400">{me.user.name} • {me.user.email}</p>
          <h3 className="mt-6 font-semibold">Signed-in devices</h3>
          <ul className="mt-3 space-y-2">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel p-3 text-sm">
                <span className="min-w-0"><span className="block truncate">{s.label || "Unknown device"}{s.id === me.sessionId && " (this device)"}</span><span className="text-zinc-500">Last active {new Date(s.last_seen).toLocaleString()}</span></span>
                {s.id !== me.sessionId && <button className="shrink-0 rounded-lg border border-line px-3 py-1.5 hover:border-accent-soft" onClick={async () => { await api(`/sessions/${s.id}`, "DELETE"); loadSessions(); }}>Sign out</button>}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-3">
            <button className="rounded-lg border border-line px-4 py-2 text-sm hover:border-accent-soft" onClick={async () => { await api("/sessions/revoke-others", "POST"); loadSessions(); }}>Sign out other devices</button>
            <button className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold" onClick={logout}>Log out</button>
          </div>
          <form onSubmit={changePw} className="mt-8 grid max-w-sm gap-3">
            <h3 className="font-semibold">Change password</h3>
            <input type="password" required autoComplete="current-password" placeholder="Current password" aria-label="Current password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className="rounded-xl border border-line bg-ink px-4 py-3" />
            <input type="password" required minLength={8} autoComplete="new-password" placeholder="New password" aria-label="New password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className="rounded-xl border border-line bg-ink px-4 py-3" />
            <button className="rounded-xl border border-line px-4 py-2.5 hover:border-accent-soft">Update password</button>
            {pwMsg && <p role="status" className="text-sm text-zinc-400">{pwMsg}</p>}
          </form>
        </section>
      </main>
    </div>
  );
}
