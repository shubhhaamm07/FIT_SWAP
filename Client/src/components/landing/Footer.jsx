import { ArrowUp, Dumbbell, Mail, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const marketplaceLinks = [
  ["Browse listings", "/marketplace"], ["Partner gyms", "/gyms"],
  ["Sell membership", "/marketplace/sell"], ["Transfer requests", "/transfers"],
];
const informationLinks = [
  ["How it works", "/how-it-works"], ["Eligibility & verification", "/transfer-guide"],
  ["Fees, payments & disputes", "/fees-and-payments"], ["Help & contact", "/help"],
];

export default function Footer() {
  return <footer className="landing-footer-wave border-t border-white/[0.08] bg-[#08090d]">
    <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8">
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="inline-flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-500"><Dumbbell size={19} /></span><span className="text-xl font-black">Fit<span className="text-violet-300">Swap</span></span></Link>
          <p className="mt-5 max-w-xs text-sm leading-6 text-zinc-400">An online marketplace for buying, selling and transferring eligible gym memberships.</p>
          <a href="mailto:support@fitswap.in" className="mt-5 inline-flex items-center gap-2 text-sm text-violet-200"><Mail size={15} /> support@fitswap.in</a>
        </div>
        <FooterColumn title="Marketplace" links={marketplaceLinks} />
        <FooterColumn title="FitSwap guides" links={informationLinks} />
        <div><h2 className="text-sm font-semibold">Clear handovers</h2><div className="mt-5 rounded-2xl border border-emerald-300/10 bg-emerald-500/[.06] p-4"><ShieldCheck size={20} className="text-emerald-300" /><p className="mt-3 text-sm text-emerald-100">Know the next step.</p><p className="mt-2 text-xs leading-5 text-zinc-400">Read the plan conditions and direct-payment details before starting a transfer.</p><Link to="/fees-and-payments" className="mt-3 inline-block text-xs text-violet-200 underline">Understand payments</Link></div></div>
      </div>
      <div className="mt-12 flex flex-wrap items-center justify-between gap-5 border-t border-white/[.08] pt-7 text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} FitSwap.</p>
        <div className="flex flex-wrap gap-5"><Link to="/terms" className="hover:text-white">Service terms (draft)</Link><Link to="/privacy" className="hover:text-white">Privacy notice (draft)</Link><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="inline-flex items-center gap-2 text-zinc-300">Back to top <ArrowUp size={15} /></button></div>
      </div>
    </div>
  </footer>;
}

function FooterColumn({ title, links }) {
  return <nav aria-label={title}><h2 className="text-sm font-semibold">{title}</h2><ul className="mt-5 space-y-3">{links.map(([label, to]) => <li key={to}><Link to={to} className="text-sm text-zinc-400 transition hover:text-sky-200">{label}</Link></li>)}</ul></nav>;
}
