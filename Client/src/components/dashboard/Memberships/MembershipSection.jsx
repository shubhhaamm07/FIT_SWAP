import MembershipCard from "./MembershipCard";
import EmptyMembership from "./EmptyMembership";
import SkeletonMembership from "../Skeletons/SkeletonMembership";

function MembershipSection({ memberships = [], loading = false }) {
  return (
    <section className="mt-8">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-2xl font-bold">My Memberships</h2>

          <p className="text-sm text-zinc-500 mt-1">
            Manage all your active memberships.
          </p>
        </div>
      </div>

      {loading ? (
        <SkeletonMembership />
      ) : memberships.length === 0 ? (
        <EmptyMembership />
      ) : (
        <div className="space-y-4">
          {memberships.map((membership) => (
            <MembershipCard key={membership.id} membership={membership} />
          ))}
        </div>
      )}
    </section>
  );
}

export default MembershipSection;
