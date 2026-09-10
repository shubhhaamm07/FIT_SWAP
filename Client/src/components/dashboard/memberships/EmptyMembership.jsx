import { CreditCard, ArrowRight } from "lucide-react";
import Button from "../../ui/Button";

function EmptyMembership() {
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
          bg-violet-500/10
          border
          border-violet-500/20
        "
      >
        <CreditCard size={36} className="text-violet-400" />
      </div>

      <h3 className="mt-6 text-3xl font-bold">No Memberships Yet</h3>

      <p className="mx-auto mt-3 max-w-md text-zinc-400 leading-7">
        Buy your first gym membership from the FitSwap marketplace and start
        your fitness journey today.
      </p>

      <div className="mt-8 flex justify-center">
        <Button className="h-12 px-8 text-base">
          Browse Marketplace
          <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}

export default EmptyMembership;
