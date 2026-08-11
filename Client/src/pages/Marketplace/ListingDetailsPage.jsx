import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarDays, CircleCheck, Clock3, Dumbbell, MapPin, ShieldCheck, Ticket, UserRound } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getListingById } from "../../api/marketplace.api";
import { useAuth } from "../../hooks/useAuth";
import PurchaseCard from "../../components/marketplace/details/PurchaseCard";
import formatPrice from "../../components/marketplace/utils/formatPrice";
import calculateDiscount from "../../components/marketplace/utils/calculateDiscount";

const ListingDetailsPage = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState("");
  const [purchased, setPurchased] = useState(false);

  useEffect(() => {
    const loadListing = async () => {
      try {
        setError("");
        setListing(await getListingById(listingId));
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load this listing.");
      }
    };

    void loadListing();
  }, [listingId]);

  if (!listing && !error) return <PageState message="Loading listing details…" />;
  if (!listing) return <PageState message={error || "Listing not found."} error />;

  const discount = calculateDiscount(listing.originalPrice, listing.price);
  const membershipOwnerId = listing.raw?.membership?.user?.id;
  const hasPurchased = purchased || (
    listing.status === "SOLD"
    && Boolean(user?.id)
    && membershipOwnerId === user.id
  );

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-6xl pb-10">
        <Link to="/marketplace" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition hover:text-white"><ArrowLeft size={16} /> Back to marketplace</Link>

        {hasPurchased && (
          <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-start gap-3">
              <CircleCheck className="mt-0.5 shrink-0 text-emerald-300" size={22} />
              <div><h2 className="font-semibold text-emerald-100">This membership is now yours</h2><p className="mt-1 text-sm text-emerald-100/70">Your online payment was verified and the membership was transferred to your account.</p></div>
            </div>
            <button type="button" onClick={() => navigate("/memberships")} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400">View memberships <ArrowRight size={16} /></button>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-white/[0.1] bg-[#11121a] lg:grid lg:grid-cols-[1.05fr_1fr]">
          <div className="relative min-h-[280px] overflow-hidden lg:min-h-[420px]">
            <img src={listing.image} alt={listing.gym} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a10] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#11121a]" />
            <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-[#130b26]/80 px-3 py-1.5 text-xs font-semibold text-violet-200 backdrop-blur"><Ticket size={13} /> Verified listing</span>
          </div>
          <div className="flex flex-col justify-between p-6 sm:p-8">
            <div>
              <p className="text-sm font-medium text-violet-400">{listing.membership}</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">{listing.gym}</h1>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-zinc-400"><MapPin size={15} /> {listing.location}</p>
              <div className="mt-7 flex flex-wrap items-end gap-x-4 gap-y-2"><p className="text-4xl font-bold text-white">{formatPrice(listing.price)}</p>{discount > 0 && <><span className="pb-1 text-sm text-zinc-500 line-through">{formatPrice(listing.originalPrice)}</span><span className="mb-1 rounded bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-400">{discount}% off</span></>}</div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/[0.08] pt-5"><MiniStat icon={CalendarDays} label="Valid until" value={listing.validTill} /><MiniStat icon={Clock3} label="Time remaining" value={listing.remainingDays + " days"} /></div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6">
              <SectionTitle icon={Dumbbell} title="Membership details" description="Everything included with this transferable plan." />
              <div className="mt-6 grid gap-3 sm:grid-cols-2"><Detail label="Membership type" value={listing.membership} /><Detail label="Gym location" value={listing.location} /><Detail label="Remaining validity" value={listing.remainingDays + " days"} /><Detail label="Access" value="Full gym access" /></div>
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6">
              <SectionTitle icon={ShieldCheck} title="Safe transfer process" description="FitSwap keeps the handover clear for both members." />
              <div className="mt-6 grid gap-4 sm:grid-cols-3"><Process number="01" title="Request" text="Send your transfer request." /><Process number="02" title="Review" text="The seller reviews the request." /><Process number="03" title="Transfer" text="Membership moves after approval." /></div>
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6">
              <SectionTitle icon={UserRound} title="Seller information" description="This member has a verified FitSwap profile." />
              <div className="mt-5 flex items-center gap-4 rounded-xl border border-white/[0.07] bg-black/10 p-4"><div className="grid h-12 w-12 place-items-center rounded-full bg-violet-600 text-lg font-bold text-white">{listing.seller?.charAt(0)}</div><div><p className="font-semibold text-white">{listing.seller}</p><p className="mt-1 flex items-center gap-1 text-xs text-emerald-400"><BadgeCheck size={14} /> Verified seller</p></div></div>
            </section>
          </div>
          <aside><PurchaseCard listing={listing} onPurchased={() => setPurchased(true)} isPurchased={hasPurchased} /></aside>
        </div>
      </main>
    </DashboardLayout>
  );
};

function PageState({ message, error = false }) { return <DashboardLayout><div className={"py-28 text-center " + (error ? "text-red-400" : "text-zinc-400")}>{message}</div></DashboardLayout>; }
function MiniStat({ icon: Icon, label, value }) { return <div><p className="flex items-center gap-1.5 text-xs text-zinc-500"><Icon size={13} /> {label}</p><p className="mt-1.5 text-sm font-semibold text-white">{value}</p></div>; }
function SectionTitle({ icon: Icon, title, description }) { return <div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/12 text-violet-400"><Icon size={19} /></span><div><h2 className="font-semibold text-white">{title}</h2><p className="mt-0.5 text-sm text-zinc-500">{description}</p></div></div>; }
function Detail({ label, value }) { return <div className="rounded-xl border border-white/[0.07] bg-black/10 p-4"><p className="text-xs text-zinc-500">{label}</p><p className="mt-1.5 text-sm font-medium text-white">{value}</p></div>; }
function Process({ number, title, text }) { return <div className="rounded-xl border border-white/[0.07] bg-black/10 p-4"><span className="text-xs font-bold text-violet-400">{number}</span><h3 className="mt-3 text-sm font-semibold text-white">{title}</h3><p className="mt-1 text-xs leading-5 text-zinc-500">{text}</p><CircleCheck className="mt-4 text-emerald-400" size={17} /></div>; }

export default ListingDetailsPage;
