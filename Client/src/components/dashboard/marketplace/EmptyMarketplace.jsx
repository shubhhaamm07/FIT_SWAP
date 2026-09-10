import { Store, ArrowRight } from "lucide-react";
import Button from "../../ui/Button";

function EmptyMarketplace() {
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
          border-green-500/20
          bg-green-500/10
        "
      >
        <Store size={36} className="text-green-400" />
      </div>

      <h3 className="mt-6 text-3xl font-bold">No Listings Available</h3>

      <p className="mx-auto mt-3 max-w-md leading-7 text-zinc-400">
        There are currently no memberships available in the marketplace. Check
        back later or explore nearby gyms.
      </p>

      <div className="mt-8 flex justify-center gap-4">
        <Button className="h-12 px-8 text-base">Refresh Listings</Button>

        <Button variant="secondary" className="h-12 px-8 text-base">
          Explore Gyms
          <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}

export default EmptyMarketplace;
