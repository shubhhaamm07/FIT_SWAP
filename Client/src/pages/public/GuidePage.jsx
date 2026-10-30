import { ArrowRight, Mail } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import PublicLayout from "../../layouts/PublicLayout";
import { publicGuides } from "../../content/publicGuides";

export default function GuidePage() {
  const { pathname } = useLocation();
  const guide = publicGuides[pathname];
  return <PublicLayout>
    <header className="max-w-3xl">
      <p className={`text-xs font-bold uppercase tracking-[.18em] ${guide.draft ? "text-amber-300" : "text-violet-300"}`}>{guide.eyebrow}</p>
      <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">{guide.title}</h1>
      <p className="mt-5 text-base leading-7 text-zinc-300">{guide.intro}</p>
    </header>
    <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">{guide.sections.map((section) => <section key={section.title} className="rounded-2xl border border-white/10 bg-[#12121b] p-6 sm:p-7">
        <h2 className="text-xl font-bold">{section.title}</h2><p className="mt-3 text-sm leading-7 text-zinc-400">{section.text}</p>
      </section>)}</div>
      <aside className="rounded-2xl border border-violet-400/20 bg-violet-500/[.06] p-5 lg:sticky lg:top-28">
        <h2 className="font-bold">Explore FitSwap</h2>
        <nav aria-label="Help and service information" className="mt-4 grid gap-4">
          {[["/marketplace", "Browse memberships"], ["/gyms", "Partner gyms"], ["/how-it-works", "How it works"], ["/transfer-guide", "Eligibility & verification"], ["/fees-and-payments", "Fees, payments & disputes"], ["/help", "Help & contact"]].filter(([path]) => path !== pathname).map(([path, label]) => <Link key={path} to={path} className="flex items-center justify-between gap-2 text-sm text-zinc-300 hover:text-violet-200">{label}<ArrowRight size={14} /></Link>)}
        </nav>
        <a href="mailto:support@fitswap.in" className="mt-6 flex items-center gap-2 border-t border-white/10 pt-5 text-sm text-violet-200"><Mail size={16} /> support@fitswap.in</a>
      </aside>
    </div>
  </PublicLayout>;
}
