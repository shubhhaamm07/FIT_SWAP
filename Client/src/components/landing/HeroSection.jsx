import { motion } from "framer-motion";
import heroImage from "../../assets/images/hero.png";

function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden flex items-center">
      {/* Background Image */}
      <img
        src={heroImage}
        alt="Gym"
        className="absolute inset-0 w-full h-full object-cover opacity-20 scale-105"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0F] via-[#0B0B0F]/90 to-[#0B0B0F]/60" />

      {/* Purple Glow */}
      <div className="absolute top-40 left-20 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-8 lg:px-12 w-full">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm mb-8">
            India's First Gym Membership Marketplace
          </div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 1,
              ease: "easeOut",
            }}
            className="text-6xl md:text-7xl font-extrabold leading-tight"
          >
            Buy, Sell &<span className="text-violet-500"> Transfer</span>
            <br />
            Gym Memberships
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 1,
              delay: 0.3,
            }}
            className="mt-8 text-xl text-zinc-300 max-w-2xl leading-relaxed"
          >
            Stop wasting unused memberships. Discover premium gym plans at lower
            prices, transfer memberships securely and save money.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.6,
            }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <button className="px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-700 transition-all duration-300 font-semibold shadow-lg shadow-violet-500/30">
              Explore Marketplace
            </button>

            <button className="px-8 py-4 rounded-xl border border-zinc-700 hover:border-violet-500 hover:bg-zinc-900 transition-all duration-300">
              Learn More
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 1,
              delay: 0.9,
            }}
            className="mt-12 flex gap-8 flex-wrap"
          >
            <div>
              <h3 className="text-2xl font-bold text-violet-500">500+</h3>
              <p className="text-zinc-400">Members</p>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-violet-500">50+</h3>
              <p className="text-zinc-400">Gyms</p>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-violet-500">1000+</h3>
              <p className="text-zinc-400">Listings</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
