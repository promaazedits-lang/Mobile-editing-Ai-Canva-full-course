import { useState } from "react";
import { Menu, X, Check, Play, Scissors, Layers, Type, Music, Palette, Gauge, Film, Share2, Sparkles, Wand2, Download, Zap, User } from "lucide-react";
import { CONFIG, href } from "../config";
import { paymentHref } from "../lib/payment";
import { modules, problems, outcomes, audience, includes, stats, steps } from "../data";
import { Accordion, CTAButton, Reveal, Section } from "./ui";

const links = [["Home", "#top"], ["Course", "#course"], ["Curriculum", "#curriculum"], ["FAQ", "#faq"]];

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="#top" className="font-display text-xl font-extrabold">{CONFIG.brand}</a>
        <ul className="hidden items-center gap-8 text-sm text-zinc-300 md:flex">
          {links.map(([l, h]) => <li key={l}><a href={h} className="transition hover:text-white">{l}</a></li>)}
        </ul>
        <div className="flex items-center gap-2">
          <a href={paymentHref} className="hidden rounded-lg bg-accent px-4 py-2 text-sm font-semibold transition hover:bg-[#6a49f0] sm:block">Enroll Now</a>
          <button className="rounded-lg p-2 md:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="border-t border-line bg-ink px-5 pb-5 md:hidden">
          <ul className="py-2">
            {links.map(([l, h]) => <li key={l}><a href={h} onClick={() => setOpen(false)} className="block py-3 text-lg">{l}</a></li>)}
          </ul>
          <CTAButton className="w-full">Enroll Now</CTAButton>
        </div>
      )}
    </header>
  );
}

function PhoneMockup() {
  const clips = ["from-violet-500 to-indigo-700", "from-fuchsia-500 to-purple-800", "from-sky-500 to-blue-800", "from-indigo-400 to-violet-700"];
  return (
    <div className="relative mx-auto w-64 md:w-72" aria-hidden="true">
      <div className="absolute -inset-10 -z-10 rounded-full bg-accent/20 blur-3xl" />
      <div className="rounded-[2.5rem] border border-line bg-black p-2.5 shadow-2xl shadow-accent/20">
        <div className="overflow-hidden rounded-[2rem] bg-panel">
          <div className="relative flex aspect-[9/13] items-center justify-center bg-gradient-to-br from-violet-600/60 via-indigo-900 to-black">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-ink"><Play className="ml-1 h-7 w-7 fill-current" /></div>
            <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-1 text-xs">Hook • 00:03</span>
            <span className="absolute inset-x-4 bottom-4 rounded-lg bg-black/50 px-3 py-2 text-center font-display text-lg font-bold">Edit like a pro</span>
          </div>
          <div className="relative space-y-2 p-3">
            <div className="flex gap-1.5">{clips.map((c, i) => <div key={i} className={`h-10 flex-1 rounded-md bg-gradient-to-br ${c}`} />)}</div>
            <div className="flex gap-1.5"><div className="h-5 w-2/5 rounded bg-accent/70" /><div className="h-5 flex-1 rounded bg-zinc-700" /></div>
            <div className="flex h-5 items-center gap-0.5">{Array.from({ length: 28 }).map((_, i) => <span key={i} className="w-full rounded-full bg-accent-soft/70" style={{ height: `${25 + ((i * 37) % 70)}%` }} />)}</div>
            <div className="playhead absolute bottom-3 top-3 w-0.5 bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden px-5 pb-20 pt-10 md:pb-28 md:pt-16">
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl md:text-6xl">Complete 3-in-1 Editing Masterclass.</h1>
        <img src="/instructor.jpg" alt={`${CONFIG.instructorName}, your instructor`} width={1600} height={904} className="mt-6 w-full rounded-2xl border border-line shadow-2xl shadow-accent/20" />
        <p className="mt-6 text-2xl font-display font-extrabold leading-[1.05] tracking-[-0.02em] text-accent-soft sm:text-3xl md:text-4xl">Learn CapCut Editing + AI Editing + Canva Editing — Using Only Your Mobile Phone.</p>
        <p className="mt-6 max-w-xl text-lg text-zinc-400">Learn everything step by step using free tools/free versions on your mobile phone. No laptop or PC is required. All three for just ₹{CONFIG.price}.</p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <CTAButton>Join the Course – ₹{CONFIG.price}</CTAButton>
          <CTAButton variant="ghost" to="#course">Explore Course</CTAButton>
        </div>
        <p className="mt-5 text-sm text-zinc-500">Beginner Friendly • Step by Step • Mobile Phone Only</p>
        <div className="mt-16 w-full"><PhoneMockup /></div>
      </div>
    </section>
  );
}

export function TrustBar() {
  return (
    <div className="border-y border-line bg-panel/60 px-5 py-10">
      <div className="mx-auto max-w-6xl text-center">
        <p className="font-display text-2xl font-bold md:text-3xl">Learn • Edit • Create • Grow</p>
        <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => <li key={s} className="rounded-xl border border-line bg-ink px-4 py-4 text-sm font-medium text-zinc-300">{s}</li>)}
        </ul>
      </div>
    </div>
  );
}

export function Problems() {
  return (
    <Section title="Still Struggling To Make Professional Videos?">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {problems.map((p) => <li key={p} className="rounded-xl border border-line bg-panel px-5 py-4 text-zinc-300"><X className="mr-2 inline h-4 w-4 text-red-400" />{p}</li>)}
      </ul>
      <p className="mt-10 font-display text-2xl font-bold text-accent-soft md:text-3xl">This course gives you a clear step-by-step system.</p>
    </Section>
  );
}

const features = [
  [Scissors, "Professional Mobile Editing"], [Film, "Reels & Shorts Editing"], [Zap, "Transitions"], [Type, "Text Animation"],
  [Music, "Beat Sync Editing"], [Sparkles, "Effects & Filters"], [Palette, "Color Correction"], [Layers, "Audio & Sound Effects"],
  [Gauge, "Speed Ramping"], [Wand2, "Cinematic Editing"], [Download, "Export Settings"], [Share2, "Social Media Optimization"],
] as const;

export function Benefits() {
  return (
    <Section id="course" title="What You'll Learn" intro="Learn CapCut Editing + AI Editing + Canva Editing — Using Only Your Mobile Phone." tone="panel">
      <div className="grid gap-4 md:grid-cols-3">
        {["CapCut Full Editing Course", "AI Editing Course", "Canva Editing Course"].map((t, i) => (
          <div key={t} className="rounded-2xl border border-accent/40 bg-ink p-6">
            <p className="text-sm text-accent-soft">Part {i + 1}</p>
            <h3 className="mt-1 font-display text-xl font-bold">{t}</h3>
            <p className="mt-2 text-zinc-400">Taught in full detail, step by step, from beginner level.</p>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-2xl border border-line bg-ink p-6">
        <p className="text-lg font-semibold">Learn everything step by step using free tools/free versions on your mobile phone. No laptop or PC is required.</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">{["Mobile phone only", "Free tools / free versions", "No laptop or PC required", "Beginner-friendly, step-by-step learning"].map((t) => <li key={t} className="flex gap-2 text-zinc-300"><Check className="mt-1 h-4 w-4 shrink-0 text-accent-soft" />{t}</li>)}</ul>
      </div>
      <h3 className="mb-4 mt-12 text-xl font-bold">Inside the CapCut Full Editing Course</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(([Icon, label]) => (
          <div key={label} className="rounded-2xl border border-line bg-ink p-5 transition duration-200 hover:-translate-y-1 hover:border-accent/60">
            <Icon className="h-6 w-6 text-accent-soft" aria-hidden="true" />
            <p className="mt-4 font-semibold">{label}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Curriculum() {
  return (
    <Section id="curriculum" title="Complete 3-in-1 Curriculum" intro="Three full courses in one. Each is taught in detail, step by step, from beginner level.">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h3 className="text-xl font-bold">Part 1: CapCut Full Editing Course</h3>
        <span className="rounded-full border border-accent/60 bg-accent/15 px-3 py-1 text-sm font-semibold text-accent-soft">Beginner to Advanced</span>
      </div>
      <p className="mb-4 text-zinc-300">CapCut will be taught from beginner to advanced.</p>
      <Accordion items={modules.map((m, i) => ({
        title: `Module ${String(i + 1).padStart(2, "0")}: ${m.title}`,
        hint: `${m.topics.length} topics`,
        body: <ul className="grid gap-2 sm:grid-cols-2">{m.topics.map((t) => <li key={t}><Check className="mr-2 inline h-4 w-4 text-accent-soft" />{t}</li>)}</ul>,
      }))} />
      <div className="mt-10">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-xl font-bold">Part 2: AI Editing Course</h3>
          <span className="rounded-full border border-accent/60 bg-accent/15 px-3 py-1 text-sm font-semibold text-accent-soft">10 AI tools</span>
          <span className="rounded-full border border-accent/60 bg-accent/15 px-3 py-1 text-sm font-semibold text-accent-soft">Beginner to Advanced</span>
        </div>
        <Accordion items={[{ title: "AI Editing Course", hint: "10 AI tools will be taught", body: <><p className="font-semibold text-white">10 AI tools will be taught, from beginner to advanced.</p><p className="mt-2">Taught in full detail, step by step, from beginner level.</p></> }]} />
      </div>
      <div className="mt-10">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h3 className="text-xl font-bold">Part 3: Canva Editing Course</h3>
          <span className="rounded-full border border-accent/60 bg-accent/15 px-3 py-1 text-sm font-semibold text-accent-soft">Beginner to Advanced</span>
        </div>
        <p className="mb-4 text-zinc-300">Canva will be taught from beginner to advanced.</p>
        <Accordion items={[{ title: "Canva Editing Course", hint: "Full course", body: <p>Taught in full detail, step by step, from beginner level.</p> }]} />
      </div>
    </Section>
  );
}

export function Outcomes() {
  return (
    <Section title="By The End Of This Course, You'll Be Able To..." tone="panel">
      <ul className="grid gap-3 md:grid-cols-2">
        {outcomes.map((o) => (
          <li key={o} className="flex items-center gap-3 rounded-xl border border-line bg-ink px-5 py-4">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent"><Check className="h-4 w-4" /></span>{o}
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function Audience() {
  return (
    <Section title="Who This Course Is For">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {audience.map((a) => <div key={a} className="rounded-2xl border border-line bg-panel p-6 font-display text-lg font-bold">{a}</div>)}
      </div>
      <div className="mt-8 rounded-2xl border border-dashed border-line p-6">
        <h3 className="text-xl font-bold">Who doesn't need this course?</h3>
        <p className="mt-2 max-w-2xl text-zinc-400">If you're already highly experienced with professional desktop editing software, a beginner-focused mobile course may not add much for you.</p>
      </div>
    </Section>
  );
}

export function Pricing() {
  return (
    <Section id="pricing" title="Start Editing Like A Pro" tone="panel">
      <div className="mx-auto max-w-lg rounded-3xl border border-accent/60 bg-gradient-to-b from-panel to-ink p-8 shadow-2xl shadow-accent/10">
        <p className="text-sm text-accent-soft">Course</p>
        <h3 className="text-2xl font-bold">Complete 3-in-1 Editing Masterclass</h3>
        <p className="mt-1 text-zinc-400">CapCut + AI Editing + Canva Editing, all included, using only your mobile phone</p>
        <p className="mt-6 flex items-end gap-3">
          <span className="font-display text-5xl font-extrabold">₹{CONFIG.price}</span>
          {CONFIG.originalPrice && <span className="pb-1 text-zinc-500 line-through">₹{CONFIG.originalPrice}</span>}
        </p>
        <ul className="mt-6 space-y-3">
          {[...includes, CONFIG.bonus].filter(Boolean).map((i) => <li key={i} className="flex gap-3"><Check className="mt-0.5 h-5 w-5 shrink-0 text-accent-soft" />{i}</li>)}
        </ul>
        <CTAButton className="mt-8 w-full">Enroll Now – ₹{CONFIG.price}</CTAButton>
        <p className="mt-4 text-center text-sm text-zinc-500">Secure payment • Instant access after successful enrollment</p>
      </div>
    </Section>
  );
}

export function HowItWorks() {
  return (
    <Section title="How It Works">
      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map(([t, d], i) => (
          <li key={t} className="rounded-2xl border border-line bg-panel p-6">
            <span className="font-display text-4xl font-extrabold text-accent-soft">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-3 text-xl font-bold">{t}</h3>
            <p className="mt-2 text-zinc-400">{d}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function Instructor() {
  return (
    <Section title="Meet Your Instructor">
      <div>
        <h3 className="text-2xl font-bold">{CONFIG.instructorName}</h3>
        <p className="mt-3 max-w-xl text-zinc-400">{CONFIG.instructorBio}</p>
        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          {[["Teaching approach", "Simple, step-by-step lessons"], ["Made for beginners", "No previous editing experience needed"], ["Learn on mobile", "Everything is taught in CapCut on a phone"]].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-line bg-panel p-4"><dt className="font-semibold">{k}</dt><dd className="mt-1 text-sm text-zinc-400">{v}</dd></div>
          ))}
        </dl>
      </div>
    </Section>
  );
}

export function FAQ() {
  const qa: [string, string][] = [
    ["Is this course suitable for beginners?", "Yes. All three courses are taught step by step, starting from beginner level."],
    ["What does the course include?", "One purchase gives you the complete 3-in-1 course: CapCut Full Editing, AI Editing and Canva Editing, each taught in full detail."],
    ["Do I need a laptop or PC?", "No. Everything is taught using only a mobile phone. No laptop or PC is required."],
    ["Do I need to pay for any app?", "The course is taught using free tools/free versions on your mobile phone. Apps can change what is free or add paid options, so some features may not be available in every free version."],
    ["Which apps are covered?", "CapCut, AI editing and Canva."],
    ["Can I learn at my own pace?", "Yes."],
    ["How will I receive course access?", "Access instructions are shown after successful enrollment/payment."],
    ["Is the course lifetime access?", CONFIG.accessPolicy],
    ["Is there a refund policy?", CONFIG.refundPolicy],
  ];
  return (
    <Section id="faq" title="Frequently Asked Questions" tone="panel">
      <div className="mx-auto max-w-3xl"><Accordion defaultOpen={null} items={qa.map(([q, a]) => ({ title: q, body: <p>{a}</p> }))} /></div>
    </Section>
  );
}

export function FinalCTA() {
  return (
    <section className="px-5 py-20 md:py-28">
      <div className="mx-auto max-w-4xl rounded-3xl border border-accent/40 bg-gradient-to-br from-accent/25 via-panel to-ink px-6 py-16 text-center md:px-12">
        <h2 className="text-3xl font-extrabold md:text-5xl">Learn CapCut, AI Editing and Canva Using Only Your Phone.</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-300">Step by step, using free tools/free versions. No laptop or PC required.</p>
        <CTAButton className="mt-8">Join the 3-in-1 Masterclass</CTAButton>
      </div>
    </section>
  );
}

export function Footer() {
  const { legal, socials } = CONFIG;
  const nav: [string, string][] = [["Home", "#top"], ["Course", "#course"], ["Curriculum", "#curriculum"], ["FAQ", "#faq"], ["Contact", href(legal.contact)], ["Terms & Conditions", href(legal.terms)], ["Privacy Policy", href(legal.privacy)], ["Refund Policy", href(legal.refund)], ["Student Login", "#/login"]];
  return (
    <footer className="border-t border-line px-5 py-12">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_auto]">
        <div>
          <p className="font-display text-xl font-extrabold">{CONFIG.brand}</p>
          <p className="mt-1 text-zinc-400">Learn. Edit. Create.</p>
          <ul className="mt-5 flex flex-wrap gap-3">
            {Object.entries(socials).filter(([, u]) => u).map(([n, u]) => <li key={n}><a href={href(u)} aria-label={n} className="rounded-lg border border-line px-3 py-1.5 text-sm text-zinc-300 transition hover:border-accent-soft hover:text-white">{n}</a></li>)}
          </ul>
        </div>
        <ul className="grid gap-2 text-sm text-zinc-400 sm:grid-cols-2 sm:gap-x-10">
          {nav.map(([l, h]) => <li key={l}><a href={h} className="transition hover:text-white">{l}</a></li>)}
        </ul>
      </div>
      <p className="mx-auto mt-10 max-w-6xl text-sm text-zinc-500">© 2026 {CONFIG.brand}. All rights reserved.</p>
    </footer>
  );
}
