import { ChevronRight, Clock4 } from "lucide-react";

function MembershipFooter({ membership }) {
  const endDate = new Date(membership.endDate).toLocaleDateString();

  return (
    <div
      className="
        mt-6
        flex
        items-center
        justify-between
        border-t
        border-white/10
        pt-5
      "
    >
      <div>
        <p className="text-xs text-zinc-500">Expires On</p>

        <div className="mt-1 flex items-center gap-2">
          <Clock4 size={15} className="text-violet-400" />

          <span className="text-sm font-medium">{endDate}</span>
        </div>
      </div>

      <button
        className="
          flex
          items-center
          gap-2
          rounded-xl
          bg-violet-600/10
          px-4
          py-2
          text-sm
          font-medium
          text-violet-400
          transition-all
          duration-300
          hover:bg-violet-600
          hover:text-white
        "
      >
        View Details
        <ChevronRight size={17} />
      </button>
    </div>
  );
}

export default MembershipFooter;
