function WhyFitSwapSection() {
  return (
    <section className="py-24 bg-[#0B0B0F]">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold">
            Why
            <span className="text-violet-500"> FitSwap?</span>
          </h2>

          <p className="text-zinc-400 mt-5 text-lg">
            A smarter way to manage gym memberships.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Buy */}
          <div
            className="
              bg-[#16161D]/80
              backdrop-blur-md
              border
              border-zinc-800
              rounded-3xl
              p-8

              hover:border-violet-500
              hover:-translate-y-2

              transition-all
              duration-300
            "
          >
            <div className="text-5xl mb-6">💳</div>

            <h3 className="text-2xl font-semibold">Buy Memberships</h3>

            <p className="text-zinc-400 mt-4">
              Purchase active memberships at discounted prices from verified
              users.
            </p>
          </div>

          {/* Sell */}
          <div
            className="
              bg-[#16161D]/80
              backdrop-blur-md
              border
              border-zinc-800
              rounded-3xl
              p-8

              hover:border-violet-500
              hover:-translate-y-2

              transition-all
              duration-300
            "
          >
            <div className="text-5xl mb-6">💰</div>

            <h3 className="text-2xl font-semibold">Sell Memberships</h3>

            <p className="text-zinc-400 mt-4">
              Recover your money by listing unused memberships in the
              marketplace.
            </p>
          </div>

          {/* Transfer */}
          <div
            className="
              bg-[#16161D]/80
              backdrop-blur-md
              border
              border-zinc-800
              rounded-3xl
              p-8

              hover:border-violet-500
              hover:-translate-y-2

              transition-all
              duration-300
            "
          >
            <div className="text-5xl mb-6">🔄</div>

            <h3 className="text-2xl font-semibold">Easy Transfers</h3>

            <p className="text-zinc-400 mt-4">
              Secure transfer workflow with approvals, notifications and
              ownership updates.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhyFitSwapSection;
