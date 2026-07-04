function HowItWorksSection() {
  return (
    <section className="py-24 bg-[#0B0B0F]">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold">
            How
            <span className="text-violet-500"> FitSwap Works</span>
          </h2>

          <p className="text-zinc-400 mt-5 text-lg">
            Transfer gym memberships in a secure and transparent way.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-6">
          {/* Step 1 */}
          <div
            className="
              bg-[#16161D]
              border
              border-zinc-800
              rounded-3xl
              p-6
              text-center
              hover:border-violet-500
              hover:-translate-y-2
              transition-all
              duration-300
            "
          >
            <div className="text-4xl mb-4">🏋️</div>

            <h3 className="font-semibold text-lg">Buy Membership</h3>

            <p className="text-zinc-400 mt-3 text-sm">
              Purchase a membership from a gym.
            </p>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center text-violet-500 text-4xl">
            →
          </div>

          {/* Step 2 */}
          <div
            className="
              bg-[#16161D]
              border
              border-zinc-800
              rounded-3xl
              p-6
              text-center
              hover:border-violet-500
              hover:-translate-y-2
              transition-all
              duration-300
            "
          >
            <div className="text-4xl mb-4">📢</div>

            <h3 className="font-semibold text-lg">Create Listing</h3>

            <p className="text-zinc-400 mt-3 text-sm">
              List unused memberships in the marketplace.
            </p>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center text-violet-500 text-4xl">
            →
          </div>

          {/* Step 3 */}
          <div
            className="
              bg-[#16161D]
              border
              border-zinc-800
              rounded-3xl
              p-6
              text-center
              hover:border-violet-500
              hover:-translate-y-2
              transition-all
              duration-300
            "
          >
            <div className="text-4xl mb-4">🔄</div>

            <h3 className="font-semibold text-lg">Transfer Request</h3>

            <p className="text-zinc-400 mt-3 text-sm">
              Buyers send transfer requests.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
