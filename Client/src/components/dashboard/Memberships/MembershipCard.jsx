import { CalendarDays, Clock3, Snowflake, ArrowRightLeft } from "lucide-react";
import { formatDate, getDaysRemaining } from "../../../utils/date";
import Button from "../../ui/Button";

function MembershipCard({ membership }) {
  const { plan, startDate, endDate, status } = membership;

  return (
    <div
      className="
        rounded-2xl
        border
        border-white/10
        bg-[#12121A]
        overflow-hidden
        transition-all
        duration-300
        hover:border-violet-500/30
        hover:-translate-y-1
      "
    >
      <div className="h-2 bg-gradient-to-r from-violet-600 to-purple-500" />

      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold">{plan.name}</h3>

            <p className="text-sm text-zinc-500 mt-1">₹{plan.price}</p>
          </div>

          <span
            className="
              rounded-full
              bg-green-500/10
              text-green-400
              text-[11px]
              px-3
              py-1
            "
          >
            {status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="flex gap-2">
            <CalendarDays size={16} className="text-violet-400 mt-1" />

            <div>
              <p className="text-[11px] text-zinc-500">Started</p>

              <p className="text-sm">{formatDate(startDate)}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Clock3 size={16} className="text-red-400 mt-1" />

            <div>
              <p className="text-[11px] text-zinc-500">Expires</p>
              <p
                className={`
    mt-4
    text-xs
    font-medium
    ${getDaysRemaining(endDate) <= 7 ? "text-red-400" : "text-green-400"}
  `}
              >
                {getDaysRemaining(endDate)} Days Remaining
              </p>
              <p className="text-sm">{formatDate(endDate)}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" className="flex-1 h-10 text-sm">
            <Snowflake size={16} />
            Freeze
          </Button>

          <Button className="flex-1 h-10 text-sm">
            <ArrowRightLeft size={16} />
            Sell
          </Button>
        </div>
      </div>
    </div>
  );
}

export default MembershipCard;
