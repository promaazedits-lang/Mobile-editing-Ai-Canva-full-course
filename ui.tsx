import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { paymentHref } from "../lib/payment";

export function CTAButton({ children, variant = "primary", to = paymentHref, className = "" }: { children: ReactNode; variant?: "primary" | "ghost"; to?: string; className?: string }) {
  const base = "inline-flex items-center justify-center rounded-xl px-6 py-3.5 font-semibold transition duration-200 active:scale-[.98]";
  const styles = variant === "primary"
    ? "bg-accent text-white shadow-lg shadow-accent/25 hover:bg-[#6a49f0] hover:-translate-y-0.5"
    : "border border-line text-white hover:border-accent-soft hover:bg-white/5";
  return <a href={to} className={`${base} ${styles} ${className}`}>{children}</a>;
}

export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return setSeen(true);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${seen ? "in" : ""} ${className}`}>{children}</div>;
}

export function Section({ id, title, intro, children, tone = "base" }: { id?: string; title: string; intro?: string; children: ReactNode; tone?: "base" | "panel" }) {
  return (
    <section id={id} className={`px-5 py-20 md:py-28 ${tone === "panel" ? "bg-panel/60 border-y border-line" : ""}`}>
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="max-w-3xl text-3xl font-bold md:text-5xl">{title}</h2>
          {intro && <p className="mt-4 max-w-2xl text-lg text-zinc-400">{intro}</p>}
        </Reveal>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

export interface AccItem { title: string; hint?: string; body: ReactNode }
export function Accordion({ items, defaultOpen = 0 }: { items: AccItem[]; defaultOpen?: number | null }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  return (
    <div className="space-y-3">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className={`rounded-2xl border transition-colors ${isOpen ? "border-accent/60 bg-panel" : "border-line bg-panel/50"}`}>
            <h3>
              <button type="button" aria-expanded={isOpen} aria-controls={`acc-${i}`} onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left md:px-6 md:py-5">
                <span>
                  <span className="block text-lg font-semibold">{it.title}</span>
                  {it.hint && <span className="text-sm text-zinc-400">{it.hint}</span>}
                </span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-accent-soft transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
              </button>
            </h3>
            <div id={`acc-${i}`} role="region" className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden"><div className="px-5 pb-5 text-zinc-300 md:px-6">{it.body}</div></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
