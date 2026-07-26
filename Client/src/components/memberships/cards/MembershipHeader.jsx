import { CalendarRange, MapPin } from "lucide-react";

function MembershipHeader({ membership }) {
  const plan = membership.plan;

  const gym = plan?.gym;

  return (
    <div className="relative h-48 overflow-hidden rounded-t-3xl">
      <img
        src={gym?.image || "/gym-placeholder.jpg"}
        alt={gym?.name}
        className="h-full w-full object-cover"
      />

      <div
        className="
          absolute
          inset-0
          bg-gradient-to-t
          from-[#12121A]
          via-black/40
          to-transparent
        "
      />

      <div
        className="
          absolute
          bottom-5
          left-5
        "
      >
        <h2 className="text-2xl font-bold">{gym?.name}</h2>

        <p className="mt-1 text-violet-400">{plan?.name}</p>

        <div className="mt-3 flex gap-4 text-sm text-zinc-300">
          <div className="flex items-center gap-2">
            <MapPin size={15} />
            {gym?.city}
          </div>

          <div className="flex items-center gap-2">
            <CalendarRange size={15} />
            {plan?.durationInDays} Days
          </div>
        </div>
      </div>
    </div>
  );
}

export default MembershipHeader;
