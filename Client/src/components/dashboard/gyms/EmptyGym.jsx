import { Dumbbell, MapPin } from "lucide-react";
import Button from "../../ui/Button";

function EmptyGym() {
  return (
    <div
      className="
        rounded-3xl
        border
        border-dashed
        border-white/10
        bg-gradient-to-br
        from-[#17171F]
        to-[#101015]
        py-16
        px-10
        text-center
      "
    >
      <div
        className="
          mx-auto
          flex
          h-20
          w-20
          items-center
          justify-center
          rounded-2xl
          border
          border-blue-500/20
          bg-blue-500/10
        "
      >
        <Dumbbell size={36} className="text-blue-400" />
      </div>

      <h3 className="mt-6 text-3xl font-bold">No Gyms Found</h3>

      <p className="mx-auto mt-3 max-w-md leading-7 text-zinc-400">
        We couldn't find any verified gyms in your area. Try searching another
        location or explore all gyms.
      </p>

      <div className="mt-8 flex justify-center gap-4">
        <Button className="h-12 px-8 text-base">
          <MapPin size={18} />
          Find Nearby
        </Button>

        <Button variant="secondary" className="h-12 px-8 text-base">
          Browse All Gyms
        </Button>
      </div>
    </div>
  );
}

export default EmptyGym;
