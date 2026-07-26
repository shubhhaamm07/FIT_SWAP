import { CreditCard, Store } from "lucide-react";
import Button from "../../ui/Button";

function MembershipEmptyState() {
  return (
    <div
      className="
        flex
        flex-col
        items-center
        justify-center
        rounded-3xl
        border
        border-dashed
        border-white/10
        bg-[#12121A]
        py-20
        text-center
      "
    >
      <div
        className="
          flex
          h-20
          w-20
          items-center
          justify-center
          rounded-full
          bg-violet-600/10
        "
      >
        <CreditCard size={36} className="text-violet-400" />
      </div>
      x<h2 className="mt-6 text-2xl font-bold">No Memberships Found</h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400">
        You don't have any memberships yet. Explore gyms and purchase a
        membership to begin your fitness journey.
      </p>
      <Button className="mt-8">
        <Store size={18} />
        Browse Memberships
      </Button>
    </div>
  );
}

export default MembershipEmptyState;
