import { useEffect, useState } from "react";
import { Navbar, Hero, TrustBar, Problems, Benefits, Curriculum, Outcomes, Audience, Pricing, HowItWorks, Instructor, FAQ, FinalCTA, Footer } from "./components/Landing";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Legal from "./pages/Legal";
import { Auth, Enroll } from "./pages/Auth";

const PATHS: Record<string, string> = { "/terms-and-conditions": "terms", "/privacy-policy": "privacy", "/refund-policy": "refund" };
const route = () => PATHS[location.pathname.replace(/\/$/, "")] ?? (location.hash.startsWith("#/") ? location.hash.slice(2).split(/[/?]/)[0] : "");

export default function App() {
  const [r, setR] = useState(route());
  useEffect(() => {
    const on = () => { const n = route(); setR((p) => { if (p !== n) window.scrollTo(0, 0); return n; }); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  if (r === "dashboard") return <Dashboard />;
  if (r === "admin") return <Admin />;
  if (r === "login" || r === "signup") return <Auth key={r} mode={r} />;
  if (r === "enroll") return <Enroll />;
  if (["terms", "privacy", "refund"].includes(r)) return <Legal page={r} />;
  return (
    <>
      <Navbar />
      <main>
        <Hero /><TrustBar /><Problems /><Benefits /><Curriculum /><Outcomes /><Audience />
        <Pricing /><HowItWorks /><Instructor /><FAQ /><FinalCTA />
      </main>
      <Footer />
    </>
  );
}
