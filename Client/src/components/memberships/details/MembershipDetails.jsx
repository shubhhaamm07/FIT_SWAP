import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock3,
  IndianRupee,
  MapPin,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";

import MembershipOverview from "../cards/MembershipOverview";
import MembershipBenefits from "../cards/MembershipBenefits";
import MembershipProgress from "../cards/MembershipProgress";
import MembershipTimeline from "./MembershipTimeline";
import MembershipHistory from "./MembershipHistory";

import { getMembershipById } from "../../../api/membership.api";
import {
  formatCurrency,
  formatDate,
  getGymLocation,
} from "../utils/membershipHelpers";
import dashboardHero from "../../../assets/images/dashboard-hero.png";

function MembershipDetails() {
  const { membershipId } = useParams();
  const navigate = useNavigate();
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMembership = async () => {
      try {
        setLoading(true);
        const response = await getMembershipById(membershipId);
        setMembership(response.data);
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load membership.");
      } finally {
        setLoading(false);
      }
    };

    fetchMembership();
  }, [membershipId]);

  if (loading) {
    return <div className="min-h-screen bg-[#08090d] py-28 text-center text-zinc-400">Loading membership...</div>;
  }

  if (error || !membership) {
    return <div className="min-h-screen bg-[#08090d] py-28 text-center text-red-400">{error || "Membership not found."}</div>;
  }

  const plan = membership.plan ?? {};
  const gym = plan.gym ?? {};
  const gymImage = gym.images?.find((image) => image.isPrimary)?.imageUrl || gym.images?.[0]?.imageUrl;
  const isFrozen = membership.status === "FROZEN";

  return (
    <DashboardLayout>
    <main className="relative min-h-[calc(100vh-100px)] overflow-hidden bg-[#08090d] text-white">
      <div className="pointer-events-none absolute -left-36 -top-32 h-[520px] w-[520px] rounded-full bg-violet-700/10 blur-[150px]" />
      <div className="pointer-events-none absolute right-0 top-80 h-[420px] w-[420px] rounded-full bg-fuchsia-700/10 blur-[150px]" />

      <div className="relative mx-auto w-full max-w-[1680px] px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
        <button
          type="button"
          onClick={() => navigate("/memberships")}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={17} /> Back to memberships
        </button>

        <section className="relative isolate mt-5 min-h-[280px] overflow-hidden rounded-2xl border border-violet-400/20 bg-[#160d2d]">
          <img
            src={gymImage || dashboardHero}
            alt=""
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[72%_center] opacity-45"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#170a35] via-[#170a35]/92 to-[#170a35]/20" />
          <div className="absolute inset-0 -z-10 opacity-[0.1] [background-image:linear-gradient(to_right,#c4b5fd_1px,transparent_1px),linear-gradient(to_bottom,#c4b5fd_1px,transparent_1px)] [background-size:28px_28px]" />

          <div className="flex min-h-[280px] flex-col justify-between p-6 sm:p-8 lg:p-9">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-xl border border-violet-200/20 bg-violet-400/15 px-3 py-2 text-xs font-semibold text-violet-100 backdrop-blur">
                <Building2 size={15} /> {gym.name || "Your gym membership"}
              </div>
              <span className={`rounded-full px-4 py-2 text-xs font-bold uppercase backdrop-blur ${isFrozen ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"}`}>{membership.status}</span>
            </div>

            <div className="mt-8 max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{plan.name || "Membership Details"}</h1>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-violet-100/80"><MapPin size={15} /> {getGymLocation(gym) || "Location unavailable"}</p>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3 lg:max-w-[680px]">
              <div className="rounded-xl border border-white/10 bg-[#0d0920]/60 px-4 py-3 backdrop-blur-sm"><p className="flex items-center gap-1.5 text-xs text-zinc-400"><IndianRupee size={13} /> Plan price</p><p className="mt-1 text-lg font-semibold">{formatCurrency(plan.price)}</p></div>
              <div className="rounded-xl border border-white/10 bg-[#0d0920]/60 px-4 py-3 backdrop-blur-sm"><p className="flex items-center gap-1.5 text-xs text-zinc-400"><CalendarDays size={13} /> Started</p><p className="mt-1 text-sm font-semibold">{formatDate(membership.startDate)}</p></div>
              <div className="rounded-xl border border-white/10 bg-[#0d0920]/60 px-4 py-3 backdrop-blur-sm"><p className="flex items-center gap-1.5 text-xs text-zinc-400"><Clock3 size={13} /> Valid until</p><p className="mt-1 text-sm font-semibold">{formatDate(membership.endDate)}</p></div>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-purple-500" />
        </section>

        <section className="mt-6">
          <MembershipOverview membership={membership} />
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold">Membership features</h2>
          <p className="mt-1 text-sm text-zinc-400">Plan availability and benefits at a glance.</p>
          <MembershipBenefits membership={membership} />
        </section>

        <section className="mt-6 rounded-2xl border border-white/[0.1] bg-[#10111a] p-5 sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-500/15"><CalendarDays size={18} className="text-violet-400" /></span>
              <div><h2 className="font-semibold">Membership progress</h2><p className="text-xs text-zinc-500">Your plan usage from start to expiry.</p></div>
            </div>
            <p className="text-xs font-medium text-violet-300">{plan.durationInDays || 0} day plan</p>
          </div>
          <MembershipProgress startDate={membership.startDate} endDate={membership.endDate} />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <MembershipTimeline membership={membership} />
          <MembershipHistory membership={membership} />
        </section>
      </div>
    </main>
    </DashboardLayout>
  );
}

export default MembershipDetails;
