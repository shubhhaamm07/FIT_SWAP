import SkeletonMembership from "../../dashboard/Skeletons/SkeletonMembership";

function MembershipSkeletonGrid() {
  return (
    <div
      className="
        grid
        grid-cols-1
        lg:grid-cols-2
        xl:grid-cols-3
        gap-6
      "
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <SkeletonMembership key={index} />
      ))}
    </div>
  );
}

export default MembershipSkeletonGrid;
