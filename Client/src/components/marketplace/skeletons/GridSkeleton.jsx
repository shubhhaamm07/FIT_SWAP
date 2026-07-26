import ListingCardSkeleton from "./ListingCardSkeleton";

const GridSkeleton = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <ListingCardSkeleton key={index} />
      ))}
    </div>
  );
};

export default GridSkeleton;
