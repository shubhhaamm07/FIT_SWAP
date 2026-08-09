import { ArrowUp, BriefcaseBusiness, Code2, Dumbbell, Mail, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const socialLinks = [
  { label: "GitHub", icon: Code2, href: "https://github.com" },
  { label: "LinkedIn", icon: BriefcaseBusiness, href: "https://linkedin.com" },
  { label: "Email", icon: Mail, href: "mailto:support@fitswap.in" },
];

function Footer() {
  return <footer className="landing-footer-wave border-t border-white/[0.08] bg-[#08090d]"><div className="mx-auto max-w-7xl px-6 py-16 sm:px-8"><div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4"><div><Link to="/" className="inline-flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 text-white shadow-lg shadow-violet-950/40"><Dumbbell size={19} /></span><span className="text-xl font-black tracking-tight">Fit<span className="text-violet-300">Swap</span></span></Link><p className="mt-5 max-w-xs text-sm leading-6 text-zinc-400">A modern marketplace for buying, selling, and transferring gym memberships with clarity.</p><div className="mt-6 flex gap-2">{socialLinks.map((social) => <a key={social.label} href={social.href} target={social.href.startsWith("http") ? "_blank" : undefined} rel={social.href.startsWith("http") ? "noreferrer" : undefined} aria-label={social.label} className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-zinc-300 transition hover:-translate-y-1 hover:border-sky-300/40 hover:bg-sky-500/10 hover:text-sky-100"><social.icon size={16} /></a>)}</div></div><FooterColumn title="Marketplace" links={["Browse listings", "Sell membership", "Transfer requests"]} /><FooterColumn title="FitSwap" links={["How it works", "Partner gyms", "Support"]} /><div><h3 className="text-sm font-semibold text-white">Trust</h3><div className="mt-5 rounded-2xl border border-emerald-300/10 bg-emerald-500/[0.06] p-4"><ShieldCheck size={20} className="text-emerald-300" /><p className="mt-3 text-sm font-medium text-emerald-100">Built around ownership clarity</p><p className="mt-2 text-xs leading-5 text-zinc-400">Every transfer is designed to keep its status and next step visible.</p></div></div></div><div className="mt-14 flex flex-col gap-4 border-t border-white/[0.08] pt-7 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between"><p>© 2026 FitSwap. All rights reserved.</p><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="inline-flex items-center gap-2 self-start text-zinc-300 transition hover:text-sky-200 sm:self-auto">Back to top <ArrowUp size={15} /></button></div></div></footer>;
}

function FooterColumn({ title, links }) { return <div><h3 className="text-sm font-semibold text-white">{title}</h3><ul className="mt-5 space-y-3">{links.map((link) => <li key={link}><Link to="/login" className="text-sm text-zinc-400 transition hover:text-sky-200">{link}</Link></li>)}</ul></div>; }

export default Footer;
