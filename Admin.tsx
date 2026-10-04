import { useEffect, useState } from "react";
import * as tus from "tus-js-client";
import { api } from "../lib/api";

const inp = "w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm";
type Row = Record<string, any>;

function LessonEditor({ l, reload }: { l: Row; reload: () => void }) {
  const [d, setD] = useState<Row>(l);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD({ ...d, [k]: e.target.value });
  const save = async () => { const { id, module_id, ...rest } = d; await api(`/admin/lessons/${l.id}`, "PUT", { ...rest, position: +rest.position || 0, published: !!rest.published }); reload(); };
  const [pct, setPct] = useState<number | null>(null); const [msg, setMsg] = useState("");
  const upload = async (file: File) => {
    try {
      setMsg("Starting upload…"); setPct(0);
      const { videoId, libraryId, expires, signature } = await api("/admin/videos/upload", "POST", { title: d.title || file.name });
      await new Promise<void>((ok, no) => {
        new tus.Upload(file, {
          endpoint: "https://video.bunnycdn.com/tusupload", retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: { AuthorizationSignature: signature, AuthorizationExpire: String(expires), VideoId: videoId, LibraryId: String(libraryId) },
          metadata: { filetype: file.type, title: d.title || file.name }, removeFingerprintOnSuccess: true,
          onProgress: (a, b) => setPct(Math.round((a / b) * 100)), onSuccess: () => ok(), onError: (e) => no(e),
        }).start();
      });
      await api(`/admin/lessons/${l.id}`, "PUT", { video_id: videoId });
      setD((p) => ({ ...p, video_id: videoId }));
      setMsg("Uploaded. Bunny Stream is processing it; it can take a few minutes before it plays.");
    } catch (e: any) { setMsg(e.message); setPct(null); }
  };
  return (
    <div className="grid gap-2 rounded-xl border border-line bg-ink p-3 sm:grid-cols-2">
      <input className={inp} value={d.title} onChange={set("title")} placeholder="Title" aria-label="Lesson title" />
      <input className={inp} value={d.duration} onChange={set("duration")} placeholder="Duration e.g. 08:30" aria-label="Duration" />
      <input className={inp} value={d.video_id} onChange={set("video_id")} placeholder="Bunny Stream Video ID" aria-label="Bunny Stream Video ID" />
      <input className={inp} value={d.thumbnail} onChange={set("thumbnail")} placeholder="Thumbnail image URL" aria-label="Thumbnail URL" />
      <div className="sm:col-span-2">
        <label className="text-sm text-zinc-400">Upload video file (goes to Bunny Stream)
          <input type="file" accept="video/*" className="mt-1 block w-full text-sm" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
        </label>
        {pct !== null && <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} /></div>}
        {msg && <p role="status" className="mt-1 text-sm text-zinc-400">{msg}{pct !== null && pct < 100 ? ` ${pct}%` : ""}</p>}
      </div>
      <textarea className={`${inp} sm:col-span-2`} value={d.description} onChange={set("description")} placeholder="Description" aria-label="Description" />
      <input className={inp} type="number" value={d.position} onChange={set("position")} aria-label="Position" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!d.published} onChange={(e) => setD({ ...d, published: e.target.checked })} />Published</label>
      <div className="flex gap-2 sm:col-span-2">
        <button onClick={save} className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold">Save</button>
        <button onClick={async () => { if (confirm("Delete this lesson?")) { await api(`/admin/lessons/${l.id}`, "DELETE"); reload(); } }} className="rounded-lg border border-line px-4 py-1.5 text-sm text-red-400">Delete</button>
      </div>
    </div>
  );
}

function ModuleEditor({ m, lessons, reload }: { m: Row; lessons: Row[]; reload: () => void }) {
  const [t, setT] = useState(m.title);
  const put = (b: Row) => api(`/admin/modules/${m.id}`, "PUT", b).then(reload);
  return (
    <section className="rounded-2xl border border-line bg-panel p-4">
      <div className="flex flex-wrap items-center gap-2">
        <input className={`${inp} max-w-sm`} value={t} onChange={(e) => setT(e.target.value)} aria-label="Chapter title" />
        <button onClick={() => put({ title: t })} className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold">Save</button>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!m.published} onChange={(e) => put({ published: e.target.checked })} />Published</label>
        <button onClick={async () => { if (confirm("Delete chapter and its lessons?")) { await api(`/admin/modules/${m.id}`, "DELETE"); reload(); } }} className="ml-auto text-sm text-red-400">Delete chapter</button>
      </div>
      <div className="mt-4 space-y-3">{lessons.map((l) => <LessonEditor key={`${l.id}-${JSON.stringify(l)}`} l={l} reload={reload} />)}</div>
      <button onClick={async () => { await api("/admin/lessons", "POST", { module_id: m.id, title: "New lesson", position: lessons.length + 1 }); reload(); }} className="mt-3 rounded-lg border border-line px-4 py-1.5 text-sm hover:border-accent-soft">+ Add lesson</button>
    </section>
  );
}

export default function Admin() {
  const [c, setC] = useState<{ modules: Row[]; lessons: Row[] }>({ modules: [], lessons: [] }); const [st, setSt] = useState<Row[]>([]);
  const [title, setTitle] = useState(""); const [err, setErr] = useState("");
  const reload = () => { api("/admin/course").then(setC); api("/admin/students").then(setSt); };
  useEffect(() => { api("/admin/course").then((x) => { setC(x); api("/admin/students").then(setSt); }).catch((e) => { setErr(e.message); if (e.status === 401) location.hash = "#/login"; }); }, []);
  const patch = (id: number, b: Row) => api(`/admin/students/${id}`, "PATCH", b).then(reload);
  if (err) return <p className="p-10 text-red-400">{err}</p>;
  return (
    <main className="mx-auto max-w-5xl space-y-10 px-5 py-10">
      <header className="flex items-center justify-between"><h1 className="text-3xl font-extrabold">Admin panel</h1><a href="#/dashboard" className="text-accent-soft">← Dashboard</a></header>
      <div>
        <h2 className="mb-4 text-2xl font-bold">Chapters & lessons</h2>
        <form className="mb-4 flex gap-2" onSubmit={async (e) => { e.preventDefault(); await api("/admin/modules", "POST", { title, position: c.modules.length + 1 }); setTitle(""); reload(); }}>
          <input className={`${inp} max-w-sm`} required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New chapter title" aria-label="New chapter title" />
          <button className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold">Add chapter</button>
        </form>
        <div className="space-y-4">{c.modules.map((m) => <ModuleEditor key={`${m.id}-${m.published}-${m.title}`} m={m} lessons={c.lessons.filter((l) => l.module_id === m.id)} reload={reload} />)}</div>
      </div>
      <div>
        <h2 className="mb-4 text-2xl font-bold">Students ({st.length})</h2>
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-panel text-zinc-400"><tr>{["Name", "Email", "Enrolled", "Done", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>{st.map((s) => (
              <tr key={s.id} className="border-t border-line">
                <td className="px-4 py-3">{s.name}</td><td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3">{s.enrolled_at ? (s.revoked ? "Revoked" : "Yes") : "No"}</td><td className="px-4 py-3">{s.done}</td>
                <td className="space-x-2 px-4 py-3 text-right">
                  {s.enrolled_at && <button className="rounded-lg border border-line px-3 py-1" onClick={() => patch(s.id, { revoked: !s.revoked })}>{s.revoked ? "Restore access" : "Revoke access"}</button>}
                  <button className="rounded-lg border border-line px-3 py-1" onClick={() => patch(s.id, { blocked: !s.blocked })}>{s.blocked ? "Unblock" : "Block"}</button>
                </td>
              </tr>))}</tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
