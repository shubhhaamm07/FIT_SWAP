function CTASection() {
  return (
    <section className="py-28 bg-[#0B0B0F]">
      <div className="max-w-6xl mx-auto px-8">
        <div
          className="
            relative
            overflow-hidden
            rounded-[32px]

            border
            border-violet-500/20

            bg-gradient-to-r
            from-violet-600/20
            via-[#18181B]
            to-[#18181B]

            p-12
            md:p-16
          "
        >
          {/* Purple Glow */}
          <div
            className="
              absolute
              -top-24
              -right-24

              h-72
              w-72

              rounded-full
              bg-violet-600/20

              blur-3xl
            "
          />

          <div className="relative z-10 text-center">
            <h2 className="text-5xl font-bold leading-tight">
              Ready to Save on Your
              <span className="text-violet-500"> Next Gym Membership?</span>
            </h2>

            <p className="mt-6 text-zinc-400 text-lg max-w-2xl mx-auto">
              Join thousands of fitness enthusiasts buying and selling verified
              memberships securely on FitSwap.
            </p>

            <div className="mt-10 flex justify-center gap-5 flex-wrap">
              <button
                className="
                  px-8
                  py-4

                  rounded-xl

                  bg-violet-600
                  hover:bg-violet-700

                  font-semibold

                  transition-all
                  duration-300
                "
              >
                Explore Marketplace
              </button>

              <button
                className="
                  px-8
                  py-4

                  rounded-xl

                  border
                  border-zinc-700

                  hover:border-violet-500
                  hover:bg-zinc-900

                  transition-all
                  duration-300
                "
              >
                Join FitSwap
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTASection;
