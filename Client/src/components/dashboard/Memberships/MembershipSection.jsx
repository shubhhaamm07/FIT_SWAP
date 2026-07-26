import MembershipCard from "./MembershipCard";
import EmptyMembership from "./EmptyMembership";
import SkeletonMembership from "../Skeletons/SkeletonMembership";

function MembershipSection({ memberships = [], loading = false }) {
  return (
    <section className="mt-8">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Memberships</h2>

          <p className="text-sm text-zinc-500 mt-1">
            Manage your active plans in one place.
          </p>
        </div>
      </div>

      {loading ? (
        <SkeletonMembership />
      ) : memberships.length === 0 ? (
        <EmptyMembership />
      ) : (
        <div className="max-h-[560px] space-y-4 overflow-y-auto pr-1 [scrollbar-color:rgba(139,92,246,0.65)_transparent] [scrollbar-width:thin]">
          {memberships.map((membership) => (
            <MembershipCard key={membership.id} membership={membership} />
          ))}
        </div>
      )}
    </section>
  );
}

export default MembershipSection;
