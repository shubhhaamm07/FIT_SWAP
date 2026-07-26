import {
  calculateMembershipProgress,
  getDaysRemaining,
} from "../utils/membershipProgress";

function MembershipProgress({ startDate, endDate }) {
  const progress = calculateMembershipProgress(startDate, endDate);

  const remaining = getDaysRemaining(endDate);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">Membership Progress</span>

        <span className="font-semibold text-white">{progress}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[#1B1B24]">
        <div
          style={{
            width: `${progress}%`,
          }}
          className="
            h-full
            rounded-full
            bg-gradient-to-r
            from-violet-500
            to-fuchsia-500
            transition-all
            duration-700
          "
        />
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{remaining} days remaining</span>

        <span>{100 - progress}% left</span>
      </div>
    </div>
  );
}

export default MembershipProgress;
