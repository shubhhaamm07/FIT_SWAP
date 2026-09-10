import { MapPin, Phone, ArrowRight } from "lucide-react";

import Button from "../../ui/Button";

function GymCard({ gym }) {
  return (
    <div
      className="
        rounded-2xl
        overflow-hidden
        border
        border-white/10
        bg-[#12121A]
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-violet-500/30
      "
    >
      <div className="h-32 bg-gradient-to-br from-blue-700 via-violet-700 to-purple-700" />

      <div className="p-5">
        <h3 className="text-lg font-bold">{gym.name}</h3>

        <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
          {gym.description}
        </p>

        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <MapPin size={15} />
            {gym.city}, {gym.state}
          </div>

          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Phone size={15} />

            {gym.phone}
          </div>
        </div>

        <Button className="w-full mt-6 h-10 text-sm">
          View Gym
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}

export default GymCard;
