import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  CircleAlert,
  LocateFixed,
  LoaderCircle,
  MapPinned,
  Navigation,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getAllGyms } from "../../api/gym.api";
import DashboardLayout from "../../layouts/DashboardLayout";

const DEFAULT_RADIUS = "25";

const asCoordinate = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getGymCoordinates = (gym) => {
  const latitude = asCoordinate(gym?.latitude);
  const longitude = asCoordinate(gym?.longitude);
  if (latitude === null || longitude === null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
};

const distanceInKilometres = (first, second) => {
  const earthRadius = 6371;
  const radians = (degrees) => degrees * (Math.PI / 180);
  const latitudeDelta = radians(second.latitude - first.latitude);
  const longitudeDelta = radians(second.longitude - first.longitude);
  const firstLatitude = radians(first.latitude);
  const secondLatitude = radians(second.latitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const osmEmbedUrl = ({ latitude, longitude }) => {
  const latitudeRange = 0.018;
  const longitudeRange = 0.025;
  const boundingBox = [
    longitude - longitudeRange,
    latitude - latitudeRange,
    longitude + longitudeRange,
    latitude + latitudeRange,
  ].join(",");

  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(boundingBox)}&layer=mapnik&marker=${encodeURIComponent(`${latitude},${longitude}`)}`;
};

const gymAddress = (gym) => [gym.address, gym.city, gym.state, gym.pincode].filter(Boolean).join(", ");

function NearbyGymsPage() {
  const navigate = useNavigate();
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("ALL");
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [sort, setSort] = useState("NEAREST");
  const [selectedGymId, setSelectedGymId] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        setGyms(await getAllGyms());
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load nearby gyms.");
      } finally {
        setLoading(false);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const cities = useMemo(
    () => [...new Set(gyms.map((gym) => gym.city).filter(Boolean))].sort((first, second) => first.localeCompare(second)),
    [gyms],
  );

  const visibleGyms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const maximumDistance = Number(radius);

    return gyms
      .map((gym) => {
        const coordinates = getGymCoordinates(gym);
        const distance = userLocation && coordinates
          ? distanceInKilometres(userLocation, coordinates)
          : null;
        return { ...gym, coordinates, distance };
      })
      .filter((gym) => {
        const searchable = `${gym.name || ""} ${gymAddress(gym)}`.toLowerCase();
        const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
        const matchesCity = city === "ALL" || gym.city === city;
        const matchesRadius = !userLocation || radius === "ALL" || (gym.distance !== null && gym.distance <= maximumDistance);
        return matchesQuery && matchesCity && matchesRadius;
      })
      .sort((first, second) => {
        if (sort === "NAME") return first.name.localeCompare(second.name);
        if (sort === "CITY") return `${first.city} ${first.name}`.localeCompare(`${second.city} ${second.name}`);
        if (first.distance === null && second.distance === null) return first.name.localeCompare(second.name);
        if (first.distance === null) return 1;
        if (second.distance === null) return -1;
        return first.distance - second.distance;
      });
  }, [city, gyms, query, radius, sort, userLocation]);

  const selectedGym = visibleGyms.find((gym) => gym.id === selectedGymId) || visibleGyms[0] || null;

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Location is not supported by this browser. You can still filter by city.");
      return;
    }

    setLocating(true);
    setLocationMessage("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setLocationMessage("Location added. Gyms are now sorted by distance.");
        setSort("NEAREST");
        setLocating(false);
      },
      (locationError) => {
        const denied = locationError.code === locationError.PERMISSION_DENIED;
        setLocationMessage(denied
          ? "Location permission was denied. Allow it in your browser or use the city filter."
          : "Your location could not be detected. Please try again or use the city filter.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  const clearFilters = () => {
    setQuery("");
    setCity("ALL");
    setRadius(DEFAULT_RADIUS);
    setSort(userLocation ? "NEAREST" : "NAME");
  };

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-7xl space-y-6 pb-8">
        <section className="overflow-hidden rounded-[28px] border border-cyan-400/15 bg-[radial-gradient(circle_at_82%_18%,rgba(6,182,212,.20),transparent_30%),radial-gradient(circle_at_12%_8%,rgba(124,58,237,.22),transparent_30%),#11121a] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-cyan-300"><MapPinned size={17} /> Nearby gym finder</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Find a gym around you.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Use your location or filter by city, then compare approved FitSwap gyms on the map.</p>
            </div>
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={locating}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-500 disabled:cursor-wait disabled:opacity-60"
            >
              {locating ? <LoaderCircle size={17} className="animate-spin" /> : <LocateFixed size={17} />}
              {locating ? "Finding location…" : userLocation ? "Update my location" : "Use my location"}
            </button>
          </div>
          {locationMessage && <p aria-live="polite" className="mt-4 text-sm text-cyan-100/80">{locationMessage}</p>}
        </section>

        <section aria-label="Gym filters" className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.5fr)_1fr_1fr_1fr_auto]">
            <label className="relative block">
              <span className="sr-only">Search gyms</span>
              <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Gym, area, or pincode" className="w-full rounded-xl border border-white/[0.1] bg-black/15 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-400/60" />
            </label>
            <FilterSelect label="City" value={city} onChange={setCity}>
              <option value="ALL">All cities</option>
              {cities.map((item) => <option key={item} value={item}>{item}</option>)}
            </FilterSelect>
            <FilterSelect label="Distance" value={radius} onChange={setRadius} disabled={!userLocation}>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
              <option value="ALL">Any distance</option>
            </FilterSelect>
            <FilterSelect label="Sort gyms" value={sort} onChange={setSort}>
              <option value="NEAREST">Nearest first</option>
              <option value="NAME">Name A–Z</option>
              <option value="CITY">City A–Z</option>
            </FilterSelect>
            <button type="button" onClick={clearFilters} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.1] px-4 text-sm font-semibold text-zinc-300 hover:bg-white/[0.05] hover:text-white"><SlidersHorizontal size={16} /> Reset</button>
          </div>
          {!userLocation && <p className="mt-3 text-xs text-zinc-500">Enable your location to unlock distance filtering and nearest-first results.</p>}
        </section>

        {error && <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300"><CircleAlert size={17} /> {error}</div>}

        {loading ? (
          <div className="flex min-h-80 items-center justify-center gap-2 text-sm text-zinc-400"><LoaderCircle size={19} className="animate-spin text-cyan-300" /> Loading nearby gyms…</div>
        ) : visibleGyms.length ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
            <section aria-label="Nearby gym results" className="space-y-3">
              <div className="flex items-center justify-between px-1"><h2 className="font-semibold text-white">{visibleGyms.length} gym{visibleGyms.length === 1 ? "" : "s"} found</h2><span className="text-xs text-zinc-500">Approved partners</span></div>
              <div className="max-h-[620px] space-y-3 overflow-y-auto pr-1">
                {visibleGyms.map((gym) => (
                  <GymResultCard
                    key={gym.id}
                    gym={gym}
                    selected={selectedGym?.id === gym.id}
                    onSelect={() => setSelectedGymId(gym.id)}
                    onOpen={() => navigate(`/gyms/${gym.id}`)}
                  />
                ))}
              </div>
            </section>
            <GymMap gym={selectedGym} />
          </div>
        ) : (
          <section className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-white/[0.1] bg-[#11121a] p-8 text-center">
            <div><Building2 size={28} className="mx-auto text-zinc-500" /><h2 className="mt-4 font-semibold text-white">No gyms match these filters</h2><p className="mt-2 text-sm text-zinc-500">Increase the distance, select another city, or reset the filters.</p><button type="button" onClick={clearFilters} className="mt-4 text-sm font-semibold text-cyan-300 hover:text-cyan-200">Reset all filters</button></div>
          </section>
        )}
      </main>
    </DashboardLayout>
  );
}

function FilterSelect({ label, value, onChange, disabled, children }) {
  return <label className="block"><span className="sr-only">{label}</span><select aria-label={label} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full rounded-xl border border-white/[0.1] bg-black/15 px-3 text-sm text-zinc-300 outline-none focus:border-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-45">{children}</select></label>;
}

function GymResultCard({ gym, selected, onSelect, onOpen }) {
  return (
    <article className={`rounded-2xl border p-4 transition ${selected ? "border-cyan-400/45 bg-cyan-500/[0.07]" : "border-white/[0.08] bg-[#11121a] hover:border-white/[0.16]"}`}>
      <button type="button" onClick={onSelect} className="w-full text-left" aria-pressed={selected}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><h3 className="truncate font-semibold text-white">{gym.name}</h3><p className="mt-1 flex items-start gap-1.5 text-sm leading-5 text-zinc-500"><Navigation size={14} className="mt-0.5 shrink-0" /> {gymAddress(gym)}</p></div>
          {gym.distance !== null && <span className="shrink-0 rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-200">{gym.distance < 10 ? gym.distance.toFixed(1) : Math.round(gym.distance)} km</span>}
        </div>
        {!gym.coordinates && <p className="mt-3 text-xs text-amber-300/80">Map location awaiting confirmation by the gym</p>}
      </button>
      <button type="button" onClick={onOpen} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 hover:text-violet-200">View gym and plans <ArrowRight size={14} /></button>
    </article>
  );
}

function GymMap({ gym }) {
  if (!gym) return null;
  const coordinates = gym.coordinates;
  const searchUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(gymAddress(gym))}`;

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11121a] xl:sticky xl:top-24 xl:h-fit">
      <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] p-4 sm:p-5">
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">Selected gym</p><h2 className="mt-1 font-semibold text-white">{gym.name}</h2><p className="mt-1 text-sm text-zinc-500">{gymAddress(gym)}</p></div>
        {gym.distance !== null && <span className="shrink-0 text-sm font-bold text-cyan-200">{gym.distance.toFixed(1)} km</span>}
      </div>
      {coordinates ? (
        <iframe
          title={`Map showing ${gym.name}`}
          src={osmEmbedUrl(coordinates)}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-[430px] w-full border-0 grayscale-[20%] contrast-[1.05]"
        />
      ) : (
        <div className="grid h-[430px] place-items-center bg-[radial-gradient(circle_at_center,rgba(6,182,212,.09),transparent_38%),#0c0d13] p-8 text-center">
          <div><MapPinned size={34} className="mx-auto text-cyan-300" /><h3 className="mt-4 font-semibold text-white">Exact map pin is not available yet</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">The gym owner needs to add verified coordinates. You can still search this address on OpenStreetMap.</p><a href={searchUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 px-4 py-2.5 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/10">Open address <ArrowRight size={15} /></a></div>
        </div>
      )}
      <div className="border-t border-white/[0.08] px-4 py-3 text-xs text-zinc-500">Map data © OpenStreetMap contributors</div>
    </section>
  );
}

export default NearbyGymsPage;
