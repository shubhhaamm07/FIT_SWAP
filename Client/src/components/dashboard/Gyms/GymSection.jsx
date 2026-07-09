import GymCard from "./GymCard";
import SkeletonGym from "../Skeletons/SkeletonGym";
import EmptyGym from "./EmptyGym";
function GymSection({ gyms = [], loading = false }) {
  if (loading) {
    return (
      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-5">Nearby Gyms</h2>

        <div className="grid grid-cols-3 gap-5">
          {[1, 2, 3].map((item) => (
            <SkeletonGym key={item} />
          ))}
        </div>
      </section>
    );
  }
  return (
    <section className="mt-8 mb-10">
      <div className="mb-5">
        <h2 className="text-2xl font-bold">Nearby Gyms</h2>

        <p className="text-sm text-zinc-500 mt-1">
          Discover verified fitness centers.
        </p>
      </div>

      {gyms.length === 0 ? (
        <EmptyGym />
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {gyms.map((gym) => (
            <GymCard key={gym.id} gym={gym} />
          ))}
        </div>
      )}
    </section>
  );
}

export default GymSection;
