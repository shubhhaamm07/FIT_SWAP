import { Building2, MapPin, ShieldCheck } from "lucide-react";

const GymInfo = ({ listing }) => {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#11131A] p-6">
      <h2 className="mb-6 text-2xl font-bold text-white">Gym Information</h2>

      <div className="space-y-5">
        <div className="flex justify-between">
          <span className="text-zinc-400">Gym Name</span>

          <span className="flex items-center gap-2 text-white">
            <Building2 size={16} />
            {listing.gym}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-400">Location</span>

          <span className="flex items-center gap-2 text-white">
            <MapPin size={16} />
            {listing.location}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-400">Verification</span>

          <span className="flex items-center gap-2 text-green-400">
            <ShieldCheck size={16} />
            Verified Gym
          </span>
        </div>
      </div>
    </div>
  );
};

export default GymInfo;
