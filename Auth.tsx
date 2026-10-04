import { useEffect, useRef, useState, type FormEvent } from "react";
import { CONFIG } from "../config";
import { api } from "../lib/api";

const field = "w-full rounded-xl border border-line bg-ink px-4 py-3 outline-none focus:border-accent-soft";
const btn = "w-full rounded-xl bg-accent px-6 py-3.5 font-semibold transition hover:bg-[#6a49f0] disabled:opacity-60";

export function Auth({ mode }: { mode: "login" | "signup" }) {
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { await api(`/auth/${mode}`, "POST", f); const n = sessionStorage.getItem("next") || "#/dashboard"; sessionStorage.removeItem("next"); location.hash = n; }
    catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  };
  // "Continue with Google": the button only shows if the server has GOOGLE_CLIENT_ID configured
  const gbtn = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const { googleClientId } = await api("/auth/config"); if (!googleClientId || off) return;
        if (!(window as any).google?.accounts) await new Promise<void>((ok, no) => { const s = document.createElement("script"); s.src = "https://accounts.google.com/gsi/client"; s.async = true; s.onload = () => ok(); s.onerror = () => no(new Error("gsi")); document.head.appendChild(s); });
        const g = (window as any).google.accounts.id;
        g.initialize({ client_id: googleClientId, callback: async (r: any) => {
          setErr(""); try { await api("/auth/google", "POST", { credential: r.credential }); const n = sessionStorage.getItem("next") || "#/dashboard"; sessionStorage.removeItem("next"); location.hash = n; } catch (x: any) { setErr(x.message); }
        } });
        if (gbtn.current) g.renderButton(gbtn.current, { theme: "filled_black", size: "large", text: mode === "signup" ? "signup_with" : "signin_with", width: 320 });
      } catch { /* Google sign-in is optional; email + password still works */ }
    })();
    return () => { off = true; };
  }, [mode]);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-3xl border border-line bg-panel p-8">
        <a href="#top" className="font-display text-xl font-extrabold">{CONFIG.brand}</a>
        <h1 className="text-2xl font-bold">{mode === "signup" ? "Create your account" : "Log in"}</h1>
        {mode === "signup" && <input className={field} placeholder="Full name" autoComplete="name" required value={f.name} onChange={set("name")} aria-label="Full name" />}
        <input className={field} type="email" placeholder="Email" autoComplete="email" required value={f.email} onChange={set("email")} aria-label="Email" />
        <input className={field} type="password" placeholder="Password (min 8 characters)" minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} required value={f.password} onChange={set("password")} aria-label="Password" />
        {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
        <button className={btn} disabled={busy}>{mode === "signup" ? "Sign up" : "Log in"}</button>
        <div ref={gbtn} className="flex min-h-0 justify-center" />
        <p className="text-center text-sm text-zinc-400">
          {mode === "signup" ? <>Already have an account? <a className="text-accent-soft" href="#/login">Log in</a></> : <>New here? <a className="text-accent-soft" href="#/signup">Create account</a></>}
        </p>
      </form>
    </main>
  );
}

declare global { interface Window { Razorpay: any } }
const loadCheckout = () => new Promise<void>((ok, no) => {
  if (window.Razorpay) return ok();
  const s = document.createElement("script"); s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.onload = () => ok(); s.onerror = () => no(new Error("Could not load Razorpay")); document.body.appendChild(s);
});

export function Enroll() {
  const [msg, setMsg] = useState("Preparing secure checkout…"); const [run, setRun] = useState(0);
  useEffect(() => {
    (async () => {
      let me;
      try { me = await api("/me"); } catch { sessionStorage.setItem("next", "#/enroll"); location.hash = "#/signup"; return; }
      if (me.enrolled) { location.hash = "#/dashboard"; return; }
      try {
        await loadCheckout(); const o = await api("/pay/order", "POST");
        new window.Razorpay({
          key: o.keyId, amount: o.amount, currency: "INR", order_id: o.orderId, name: CONFIG.brand, description: "Complete 3-in-1 Editing Masterclass",
          prefill: { name: me.user.name, email: me.user.email }, theme: { color: "#7c5cff" },
          handler: async (r: any) => { setMsg("Verifying payment…"); try { await api("/pay/verify", "POST", r); location.hash = "#/dashboard"; } catch (e: any) { setMsg(e.message); } },
          modal: { ondismiss: () => setMsg("Payment window closed.") },
        }).open();
      } catch (e: any) { setMsg(e.message); }
    })();
  }, [run]);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
      <p role="status" className="text-lg">{msg}</p>
      <button onClick={() => setRun(run + 1)} className="rounded-xl border border-line px-5 py-2.5 hover:border-accent-soft">Try again</button>
      <a href="#/dashboard" className="text-sm text-accent-soft">Go to dashboard</a>
    </main>
  );
}
