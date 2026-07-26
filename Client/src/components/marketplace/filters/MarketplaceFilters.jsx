import {
  SlidersHorizontal,
  IndianRupee,
  MapPin,
  CalendarDays,
  Building2,
  RotateCcw,
} from "lucide-react";

import SearchBar from "./SearchBar";

const MarketplaceFilters = ({ filters, updateFilter, resetFilters }) => {
  return (
    <aside className="sticky top-6 rounded-xl border border-white/[0.08] bg-[#0e0f15] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2"><SlidersHorizontal size={16} className="text-violet-400" /><h2 className="text-sm font-semibold text-white">Filters</h2></div>
        <button onClick={resetFilters} className="text-xs text-violet-400 hover:text-violet-300">Reset</button>
      </div>

      {/* Search */}

      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-zinc-300">
          Search
        </label>

        <SearchBar
          value={filters.search}
          onChange={(value) => updateFilter("search", value)}
        />
      </div>

      {/* Location */}

      <div className="mb-4">
        <label className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-300">
          <Building2 size={14} /> Location
        </label>

        <select
          value={filters.city}
          onChange={(e) => updateFilter("city", e.target.value)}
          className="w-full rounded-lg border border-white/[0.08] bg-[#15161e] px-3 py-2.5 text-xs text-white outline-none"
        >
          <option value="all">Select location</option>
          <option value="Chandigarh">Chandigarh</option>
          <option value="Delhi">Delhi</option>
          <option value="Mumbai">Mumbai</option>
          <option value="Mohali">Mohali</option>
        </select>
      </div>

      {/* Distance */}

      <div className="mb-4">
        <label className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-300">
          <MapPin size={14} /> Distance
        </label>

        <select
          value={filters.distance}
          onChange={(e) => updateFilter("distance", e.target.value)}
          className="w-full rounded-lg border border-white/[0.08] bg-[#15161e] px-3 py-2.5 text-xs text-white outline-none"
        >
          <option value="10">Within 10 km</option>
          <option value="25">Within 25 km</option>
          <option value="50">Within 50 km</option>
          <option value="75">Within 75 km</option>
        </select>
      </div>

      {/* Price */}

      <div className="mb-5">
        <label className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-300">
          <IndianRupee size={14} />
          Price Range
        </label>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => updateFilter("minPrice", e.target.value)}
            className="rounded-lg border border-white/[0.08] bg-[#15161e] px-3 py-2.5 text-xs text-white outline-none placeholder:text-zinc-500"
          />

          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => updateFilter("maxPrice", e.target.value)}
            className="rounded-lg border border-white/[0.08] bg-[#15161e] px-3 py-2.5 text-xs text-white outline-none placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Membership type */}

      <div className="mb-5">
        <label className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-300">
          <CalendarDays size={14} /> Remaining Days
        </label>

        <select
          value={filters.duration}
          onChange={(e) => updateFilter("duration", e.target.value)}
          className="w-full rounded-lg border border-white/[0.08] bg-[#15161e] px-3 py-2.5 text-xs text-white outline-none"
        >
          <option value="all">Any duration</option>
          <option value="30">30+ Days</option>
          <option value="60">60+ Days</option>
          <option value="90">90+ Days</option>
          <option value="180">180+ Days</option>
        </select>
      </div>

      {/* Listing Type */}

      <div className="mb-5">
        <label className="mb-3 block text-xs font-medium text-zinc-300">
          Amenities
        </label>

        <div className="space-y-2.5">
          <label className="flex items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={filters.verifiedOnly}
              onChange={(e) => updateFilter("verifiedOnly", e.target.checked)}
              className="h-4 w-4 accent-violet-600"
            />
            Swimming Pool
          </label>

          <label className="flex items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={filters.featuredOnly}
              onChange={(e) => updateFilter("featuredOnly", e.target.checked)}
              className="h-4 w-4 accent-violet-600"
            />
            Personal Training
          </label>
        </div>
      </div>

      {/* Buttons */}

      <button onClick={resetFilters} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300"><RotateCcw size={13} /> Show more</button>
    </aside>
  );
};

export default MarketplaceFilters;
