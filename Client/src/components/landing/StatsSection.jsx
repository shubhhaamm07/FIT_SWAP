function StatsSection({ gymCount, listingCount }) {
  return (
    <section className="bg-[#0B0B0F] py-20">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div
            className="
              bg-[#16161D]
              rounded-2xl
              p-6
              border
              border-zinc-800

              hover:border-violet-500
              hover:-translate-y-2

              transition-all
              duration-300
            "
          >
            <h2 className="text-4xl font-bold text-violet-500">{listingCount || "—"}</h2>

            <p className="text-zinc-400 mt-2">Active Listings</p>
          </div>

          {/* Card 2 */}
          <div
            className="
              bg-[#16161D]
              rounded-2xl
              p-6
              border
              border-zinc-800

              hover:border-violet-500
              hover:-translate-y-2

              transition-all
              duration-300
            "
          >
            <h2 className="text-4xl font-bold text-violet-500">{gymCount || "—"}</h2>

            <p className="text-zinc-400 mt-2">Partner Gyms</p>
          </div>

          {/* Card 3 */}
          <div
            className="
              bg-[#16161D]
              rounded-2xl
              p-6
              border
              border-zinc-800

              hover:border-violet-500
              hover:-translate-y-2

              transition-all
              duration-300
            "
          >
            <h2 className="text-4xl font-bold text-violet-500">100%</h2>

            <p className="text-zinc-400 mt-2">Secure Transfers</p>
          </div>

          {/* Card 4 */}
          <div
            className="
              bg-[#16161D]
              rounded-2xl
              p-6
              border
              border-zinc-800

              hover:border-violet-500
              hover:-translate-y-2

              transition-all
              duration-300
            "
          >
            <h2 className="text-4xl font-bold text-violet-500">24/7</h2>

            <p className="text-zinc-400 mt-2">Marketplace Access</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default StatsSection;
