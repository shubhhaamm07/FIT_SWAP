import { ChevronDown, Search } from "lucide-react";

function MembershipFilters({ search, setSearch, sortBy, setSortBy }) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="relative w-full sm:max-w-[340px]">
        <Search
          size={18}
          className="
            absolute
            left-4
            top-1/2
            -translate-y-1/2
            text-zinc-500
          "
        />

        <input
          type="text"
          placeholder="Search gym or membership..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            h-11
            w-full
            rounded-lg
            border
            border-white/10
            bg-[#090E17]
            pl-11
            pr-4
            text-sm
            text-white
            outline-none
            transition
            focus:border-violet-500
          "
        />
      </div>

      <div className="relative w-full sm:w-[220px]">
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="h-11 w-full appearance-none rounded-lg border border-white/10 bg-[#090E17] px-4 pr-10 text-sm text-zinc-300 outline-none transition focus:border-violet-500"
        >
          <option value="NEWEST">Sort by: Recently Added</option>
          <option value="OLDEST">Sort by: Oldest</option>
          <option value="EXPIRING">Sort by: Expiring Soon</option>
          <option value="PRICE_HIGH">Sort by: Price High to Low</option>
          <option value="PRICE_LOW">Sort by: Price Low to High</option>
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
      </div>
    </div>
  );
}

export default MembershipFilters;
