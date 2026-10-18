import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CircleHelp,
  ClipboardCheck,
  CreditCard,
  ListChecks,
  Search,
  ShieldCheck,
  Tag,
  X,
} from "lucide-react";

const guides = {
  buy: {
    heading: "Buying a membership",
    description: "See what happens before a membership moves to your account.",
    steps: [
      { icon: Search, title: "Find a listing", text: "Compare the gym, plan, remaining days, price, and transfer terms." },
      { icon: CreditCard, title: "Choose an available payment method", text: "Generate a UPI QR or request a cash handover when the gym allows it." },
      { icon: ClipboardCheck, title: "Confirm the handover", text: "For UPI, submit your payment reference. The seller checks the payment in their own bank app; for cash, arrange payment directly with the seller." },
      { icon: BadgeCheck, title: "Get gym approval if required", text: "After the required checks and approvals, the membership moves to your account. Track each step in Transfer Requests." },
    ],
  },
  sell: {
    heading: "Selling a membership",
    description: "Turn unused membership time into a listing, with a clear handover trail.",
    steps: [
      { icon: ShieldCheck, title: "Check eligibility", text: "Choose an active membership. FitSwap checks the gym's transfer policy before you can list it." },
      { icon: Tag, title: "Set your price", text: "Create a listing at a price within the allowed range." },
      { icon: ClipboardCheck, title: "Review the buyer's request", text: "Confirm a UPI payment only after you see it in your own bank app, or confirm an agreed cash handover." },
      { icon: BadgeCheck, title: "Finish the transfer", text: "The gym owner approves when the policy requires it. Ownership changes only after the required checks are complete." },
    ],
  },
};

const MarketplaceGuide = () => {
  const dialogRef = useRef(null);
  const [mode, setMode] = useState("buy");
  const guide = guides[mode];

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-black/25 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:border-violet-400 hover:bg-violet-500/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
      >
        <CircleHelp size={17} /> How it works
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="marketplace-guide-title"
        aria-describedby="marketplace-guide-description"
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(42rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-white/15 bg-[#11121b] p-0 text-white shadow-2xl shadow-black/60 backdrop:bg-black/75"
      >
        <div className="border-b border-white/10 bg-gradient-to-br from-violet-600/20 via-[#11121b] to-[#11121b] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-violet-300"><ListChecks size={15} /> FitSwap guide</p>
              <h2 id="marketplace-guide-title" className="mt-2 text-2xl font-bold">How the marketplace works</h2>
              <p id="marketplace-guide-description" className="mt-2 text-sm text-zinc-400">A quick guide to buying and selling—no video needed.</p>
            </div>
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close guide" className="rounded-lg border border-white/10 p-2 text-zinc-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-violet-400"><X size={18} /></button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2" aria-label="Choose a guide">
            <button type="button" aria-pressed={mode === "buy"} onClick={() => setMode("buy")} className={`rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-violet-400 ${mode === "buy" ? "bg-violet-600 text-white" : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"}`}>I want to buy</button>
            <button type="button" aria-pressed={mode === "sell"} onClick={() => setMode("sell")} className={`rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-violet-400 ${mode === "sell" ? "bg-violet-600 text-white" : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"}`}>I want to sell</button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <h3 className="text-lg font-semibold">{guide.heading}</h3>
          <p className="mt-1 text-sm text-zinc-400">{guide.description}</p>
          <ol className="mt-5 space-y-3">
            {guide.steps.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="flex gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 sm:p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-500/15 text-violet-300"><Icon size={18} /></span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-violet-300">Step {index + 1}</p>
                  <h4 className="mt-0.5 font-semibold">{title}</h4>
                  <p className="mt-1 text-sm leading-5 text-zinc-400">{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-5 rounded-lg border border-amber-300/15 bg-amber-300/5 p-3 text-xs leading-5 text-amber-100/80">FitSwap does not hold the payment in escrow. Always verify UPI payments in your own bank app and follow the transfer status in FitSwap.</p>
          <div className="mt-5 flex justify-end">
            {mode === "sell" ? (
              <Link to="/marketplace/sell" className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500">Start a listing <ArrowRight size={16} /></Link>
            ) : (
              <button type="button" onClick={() => dialogRef.current?.close()} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500">Browse listings <ArrowRight size={16} /></button>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
};

export default MarketplaceGuide;
