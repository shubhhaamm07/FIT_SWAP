import {
  SlidersHorizontal,
  IndianRupee,
  MapPin,
  CalendarDays,
  Building2,
  LocateFixed,
  LoaderCircle,
  RotateCcw,
} from "lucide-react";

import SearchBar from "./SearchBar";

const MarketplaceFilters = ({
  filters,
  updateFilter,
  resetFilters,
  locationOptions,
  userLocation,
  locationStatus,
  requestUserLocation,
  clearUserLocation,
}) => {
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
          <Building2 size={14} /> State
        </label>

        <input
          list="marketplace-states"
          value={filters.state}
          onChange={(event) => updateFilter("state", event.target.value)}
          placeholder="All available states"
          autoComplete="off"
          className="w-full rounded-lg border border-white/[0.08] bg-[#15161e] px-3 py-2.5 text-xs text-white outline-none placeholder:text-zinc-500 focus:border-violet-400"
        />
        <datalist id="marketplace-states">
          {locationOptions.states.map((state) => <option key={state} value={state} />)}
        </datalist>

        <label className="mb-2 mt-3 block text-xs font-medium text-zinc-300">
          City or district
        </label>
        <input
          list="marketplace-cities"
          value={filters.city}
          onChange={(event) => updateFilter("city", event.target.value)}
          placeholder="All available cities"
          autoComplete="off"
          className="w-full rounded-lg border border-white/[0.08] bg-[#15161e] px-3 py-2.5 text-xs text-white outline-none placeholder:text-zinc-500 focus:border-violet-400"
        />
        <datalist id="marketplace-cities">
          {locationOptions.cities.map((city) => <option key={city} value={city} />)}
        </datalist>
        <p className="mt-2 text-[11px] leading-4 text-zinc-500">
          Suggestions are created automatically from gyms with active listings.
        </p>
      </div>

      {/* Distance */}

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-300">
            <MapPin size={14} /> Distance
          </label>
          {userLocation && <button type="button" onClick={clearUserLocation} className="text-[11px] font-semibold text-zinc-400 hover:text-white">Clear</button>}
        </div>

        <button
          type="button"
          onClick={requestUserLocation}
          disabled={locationStatus.state === "loading"}
          className="mb-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-violet-400/25 bg-violet-500/[0.07] px-3 text-xs font-semibold text-violet-200 hover:bg-violet-500/10 disabled:opacity-50"
        >
          {locationStatus.state === "loading" ? <LoaderCircle size={14} className="animate-spin" /> : <LocateFixed size={14} />}
          {locationStatus.state === "loading" ? "Finding location…" : userLocation ? "Update my location" : "Use my location"}
        </button>

        <select
          value={filters.distance}
          onChange={(e) => updateFilter("distance", e.target.value)}
          disabled={!userLocation}
          className="w-full rounded-lg border border-white/[0.08] bg-[#15161e] px-3 py-2.5 text-xs text-white outline-none disabled:cursor-not-allowed disabled:opacity-45"
        >
          <option value="all">Any distance</option>
          <option value="5">Within 5 km</option>
          <option value="10">Within 10 km</option>
          <option value="25">Within 25 km</option>
          <option value="50">Within 50 km</option>
          <option value="75">Within 75 km</option>
        </select>
        {locationStatus.message && <p aria-live="polite" className={`mt-2 text-[11px] leading-4 ${locationStatus.state === "error" ? "text-amber-300" : "text-zinc-400"}`}>{locationStatus.message}</p>}
        {userLocation && filters.distance !== "all" && (
          <p className="mt-2 text-[11px] leading-4 text-zinc-500">
            Gyms without map coordinates are excluded from distance results.
          </p>
        )}
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
