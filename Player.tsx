import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

// Bunny Stream player with a student watermark on top. The watermark text (name + email) comes from the server's
// /play response, which reads it from the logged-in user's account, so the student cannot edit it.
// The video is fullscreened through our own wrapper (not the iframe's native fullscreen) so the watermark stays visible.
export default function Player({ title, url, wm }: { title: string; url: string; wm: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [fs, setFs] = useState(false); const [wmKey, setWmKey] = useState(0); const [strikes, setStrikes] = useState(0);

  const toggle = () => {
    if (!fs) { setFs(true); const p: any = box.current?.requestFullscreen?.(); p?.catch?.(() => {}); }
    else { setFs(false); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); }
  };
  useEffect(() => {
    const onFs = () => { if (!document.fullscreenElement) setFs(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFs(false); };
    document.addEventListener("fullscreenchange", onFs); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("fullscreenchange", onFs); document.removeEventListener("keydown", onKey); };
  }, []);
  useEffect(() => { document.body.style.overflow = fs ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [fs]);

  // Tamper check: if the watermark is removed, hidden or edited (e.g. via browser dev tools) it is rebuilt;
  // after 3 failed attempts the video is hidden until the page is reloaded.
  useEffect(() => {
    const el = box.current; if (!el) return;
    const intact = () => {
      const marks = Array.from(el.querySelectorAll<HTMLElement>("[data-wm]"));
      return marks.length === 2 && marks.every((m) => { const s = getComputedStyle(m); return m.textContent === wm && s.display !== "none" && s.visibility === "visible" && +s.opacity >= 0.15 && m.offsetWidth > 0; });
    };
    const check = () => { if (!intact()) { setStrikes((n) => n + 1); setWmKey((k) => k + 1); } };
    const mo = new MutationObserver(check); mo.observe(el, { childList: true, subtree: true, attributes: true, characterData: true });
    const t = setInterval(check, 3000);
    return () => { mo.disconnect(); clearInterval(t); };
  }, [wm]);

  const blocked = strikes >= 3;
  return (
    <div ref={box} className={fs ? "fixed inset-0 z-[60] bg-black" : "relative aspect-video overflow-hidden rounded-2xl bg-black"} style={{ containerType: "size" }}>
      {blocked ? <p className="p-6 text-zinc-400">The student watermark was removed. Please reload the page to keep watching.</p> : (
        <iframe title={title} src={url} className="h-full w-full" allow="encrypted-media; autoplay; picture-in-picture" />
      )}
      {!blocked && (
        <div key={wmKey} className="pointer-events-none absolute inset-0 z-10 select-none overflow-hidden" aria-hidden="true">
          {[0, 1].map((i) => (
            <span key={i} data-wm className="wm-drift absolute left-0 top-0" style={{ animationDelay: i ? "-12s" : "0s" }}>{wm}</span>
          ))}
        </div>
      )}
      <button onClick={toggle} className="absolute right-2 top-2 z-20 rounded-lg bg-black/60 p-2 text-white" aria-label={fs ? "Exit fullscreen" : "Fullscreen"}>
        {fs ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </button>
    </div>
  );
}
