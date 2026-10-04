import { useEffect } from "react";
import { CONFIG } from "../config";
import policies from "./policies.json";

type Block = string | string[];
interface Policy { title: string; path: string; updated: string; sections: { h: string; b: Block[] }[] }
const P = policies as Record<string, Policy>;
const fill = (t: string) => t.replace("{EMAIL}", CONFIG.businessEmail);

export default function Legal({ page }: { page: string }) {
  const d = P[page];
  useEffect(() => { document.title = `${d.title} | ${CONFIG.brand}`; window.scrollTo(0, 0); }, [d]);
  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <a href="/" className="font-display text-xl font-extrabold">{CONFIG.brand}</a>
          <a href="/" className="text-sm text-accent-soft hover:underline">← Back to website</a>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-4xl font-extrabold md:text-5xl">{d.title}</h1>
        <p className="mt-3 text-sm text-zinc-500">Website: {CONFIG.brand} · Last updated: {d.updated}</p>
        {d.sections.map((s) => (
          <section key={s.h} className="mt-10">
            <h2 className="text-xl font-bold md:text-2xl">{s.h}</h2>
            <div className="mt-3 space-y-3 leading-relaxed text-zinc-300">
              {s.b.map((b, i) => typeof b === "string"
                ? <p key={i}>{fill(b)}</p>
                : <ul key={i} className="list-disc space-y-1.5 pl-6">{b.map((x) => <li key={x}>{x}</li>)}</ul>)}
            </div>
          </section>
        ))}
        <nav aria-label="Other policies" className="mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-6 text-sm">
          {Object.entries(P).filter(([k]) => k !== page).map(([k, v]) => <a key={k} href={v.path} className="text-accent-soft hover:underline">{v.title}</a>)}
        </nav>
      </main>
    </div>
  );
}
