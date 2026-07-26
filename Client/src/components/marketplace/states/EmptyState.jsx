import { SearchX } from "lucide-react";

const EmptyState = () => {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#11131A] p-10 text-center">
      <div className="mb-6 rounded-full bg-violet-600/10 p-5">
        <SearchX className="text-violet-500" size={48} />
      </div>

      <h2 className="text-2xl font-bold text-white">No Listings Found</h2>

      <p className="mt-3 max-w-md text-zinc-400">
        We couldn't find any memberships matching your filters. Try changing the
        search criteria or resetting the filters.
      </p>

      <button
        className="
          mt-8
          rounded-xl
          bg-violet-600
          px-6
          py-3
          font-medium
          text-white
          transition
          hover:bg-violet-700
        "
      >
        Reset Filters
      </button>
    </div>
  );
};

export default EmptyState;
