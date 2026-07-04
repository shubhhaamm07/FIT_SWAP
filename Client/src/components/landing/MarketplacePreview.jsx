import { motion } from "framer-motion";

function MarketplacePreview() {
  return (
    <section className="py-24 bg-[#0B0B0F]">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold">
            Featured
            <span className="text-violet-500"> Marketplace Listings</span>
          </h2>

          <p className="text-zinc-400 mt-5">
            Discover active memberships available at discounted prices.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <motion.div
            whileHover={{
              y: -12,
              scale: 1.02,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
            }}
            className="
    group
    bg-[#16161D]
    rounded-3xl
    overflow-hidden

    border
    border-zinc-800

    hover:border-violet-500
    hover:shadow-2xl
    hover:shadow-violet-500/20

    transition-all
    duration-300
  "
          >
            {/* Image */}
            <div className="overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48"
                alt="Gold's Gym"
                className="
        h-56
        w-full
        object-cover

        group-hover:scale-110

        transition-transform
        duration-700
      "
              />
            </div>

            <div className="p-6">
              {/* Badge */}
              <div
                className="
        inline-block
        px-3
        py-1

        rounded-full

        text-xs

        bg-violet-500/10
        text-violet-300

        border
        border-violet-500/20
      "
              >
                Premium Plan
              </div>

              <h3 className="text-2xl font-bold mt-4">Gold's Gym Premium</h3>

              <p className="text-zinc-400 mt-2">180 Days Remaining</p>

              <div
                className="
        mt-5
        flex
        justify-between
        items-center
      "
              >
                <div>
                  <p className="text-zinc-500 text-sm">Starting From</p>

                  <span
                    className="
            text-violet-500
            text-3xl
            font-bold
          "
                  >
                    ₹8,999
                  </span>
                </div>

                <button
                  className="
          bg-violet-600
          hover:bg-violet-700

          px-5
          py-3

          rounded-xl

          transition-all
          duration-300
        "
                >
                  View Details
                </button>
              </div>
            </div>
          </motion.div>
          <motion.div
            whileHover={{
              y: -12,
              scale: 1.02,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
            }}
            className="
    group
    bg-[#16161D]
    rounded-3xl
    overflow-hidden

    border
    border-zinc-800

    hover:border-violet-500
    hover:shadow-2xl
    hover:shadow-violet-500/20

    transition-all
    duration-300
  "
          >
            {/* Image */}
            <div className="overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1623874106686-5be2b325c8f1?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Wolf Gym"
                className="
        h-56
        w-full
        object-cover

        group-hover:scale-110

        transition-transform
        duration-700
      "
              />
            </div>

            <div className="p-6">
              {/* Badge */}
              <div
                className="
        inline-block
        px-3
        py-1

        rounded-full

        text-xs

        bg-violet-500/10
        text-violet-300

        border
        border-violet-500/20
      "
              >
                Premium Plan
              </div>

              <h3 className="text-2xl font-bold mt-4">Wolf Gym Premium</h3>

              <p className="text-zinc-400 mt-2">300 Days Remaining</p>

              <div
                className="
        mt-5
        flex
        justify-between
        items-center
      "
              >
                <div>
                  <p className="text-zinc-500 text-sm">Starting From</p>

                  <span
                    className="
            text-violet-500
            text-3xl
            font-bold
          "
                  >
                    ₹10,999
                  </span>
                </div>

                <button
                  className="
          bg-violet-600
          hover:bg-violet-700

          px-5
          py-3

          rounded-xl

          transition-all
          duration-300
        "
                >
                  View Details
                </button>
              </div>
            </div>
          </motion.div>
          <motion.div
            whileHover={{
              y: -12,
              scale: 1.02,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
            }}
            className="
    group
    bg-[#16161D]
    rounded-3xl
    overflow-hidden

    border
    border-zinc-800

    hover:border-violet-500
    hover:shadow-2xl
    hover:shadow-violet-500/20

    transition-all
    duration-300
  "
          >
            {/* Image */}
            <div className="overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1685633224597-294ff1adfd6f?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Zml0JTIwaGl0JTIwZ3ltfGVufDB8fDB8fHww"
                alt="Fit Hit Gym Premium"
                className="
        h-56
        w-full
        object-cover

        group-hover:scale-110

        transition-transform
        duration-700
      "
              />
            </div>

            <div className="p-6">
              {/* Badge */}
              <div
                className="
        inline-block
        px-3
        py-1

        rounded-full

        text-xs

        bg-violet-500/10
        text-violet-300

        border
        border-violet-500/20
      "
              >
                Premium Plan
              </div>

              <h3 className="text-2xl font-bold mt-4">Fit Hit Gym Premium</h3>

              <p className="text-zinc-400 mt-2">190 Days Remaining</p>

              <div
                className="
        mt-5
        flex
        justify-between
        items-center
      "
              >
                <div>
                  <p className="text-zinc-500 text-sm">Starting From</p>

                  <span
                    className="
            text-violet-500
            text-3xl
            font-bold
          "
                  >
                    ₹7,999
                  </span>
                </div>

                <button
                  className="
          bg-violet-600
          hover:bg-violet-700

          px-5
          py-3

          rounded-xl

          transition-all
          duration-300
        "
                >
                  View Details
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default MarketplacePreview;
