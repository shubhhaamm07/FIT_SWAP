const ListingCardSkeleton = () => {
  return (
    <div className="animate-pulse overflow-hidden rounded-3xl border border-white/10 bg-[#11131A]">
      <div className="h-52 bg-[#1A1D24]" />

      <div className="space-y-4 p-6">
        <div className="h-6 w-2/3 rounded bg-[#1A1D24]" />

        <div className="h-4 w-1/2 rounded bg-[#1A1D24]" />

        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-[#1A1D24]" />
          <div className="h-4 w-5/6 rounded bg-[#1A1D24]" />
          <div className="h-4 w-3/4 rounded bg-[#1A1D24]" />
        </div>

        <div className="h-10 w-1/2 rounded bg-[#1A1D24]" />

        <div className="h-12 rounded-xl bg-[#1A1D24]" />
      </div>
    </div>
  );
};

export default ListingCardSkeleton;
