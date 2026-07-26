import { CalendarDays, Clock3, Dumbbell } from "lucide-react";

const MembershipInfo = ({ listing }) => {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#11131A] p-6">
      <h2 className="mb-6 text-2xl font-bold text-white">
        Membership Information
      </h2>

      <div className="space-y-5">
        <div className="flex justify-between">
          <span className="text-zinc-400">Membership</span>

          <span className="font-medium text-white">{listing.membership}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-400">Gym</span>

          <span className="font-medium text-white">{listing.gym}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-400">Remaining Days</span>

          <span className="flex items-center gap-2 text-white">
            <CalendarDays size={16} />
            {listing.remainingDays}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-400">Transfer Fee</span>

          <span className="text-white">₹{listing.transferFee}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-400">Access</span>

          <span className="flex items-center gap-2 text-white">
            <Dumbbell size={16} />
            Full Gym Access
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-400">Valid Until</span>

          <span className="flex items-center gap-2 text-white">
            <Clock3 size={16} />
            12 Dec 2026
          </span>
        </div>
      </div>
    </div>
  );
};

export default MembershipInfo;
