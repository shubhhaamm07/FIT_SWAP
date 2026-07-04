import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Dumbbell } from "lucide-react";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`
        fixed
        top-0
        left-0
        w-full
        z-50

        transition-all
        duration-500

        ${
          scrolled
            ? `
              bg-black/75
              backdrop-blur-xl
              border-b
              border-zinc-800
              shadow-xl
              shadow-black/20
            `
            : "bg-transparent"
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div
            className="
              w-12
              h-12

              rounded-2xl

              bg-violet-600

              flex
              items-center
              justify-center

              shadow-lg
              shadow-violet-600/30

              group-hover:rotate-12
              group-hover:scale-110

              transition-all
              duration-300
            "
          >
            <Dumbbell size={24} className="text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-wide">
              Fit
              <span className="text-violet-500">Swap</span>
            </h1>

            <p className="text-xs text-zinc-500 -mt-1">Gym Marketplace</p>
          </div>
        </Link>

        {/* Navigation */}
        <div className="hidden lg:flex items-center gap-10">
          {["Marketplace", "How It Works", "Partner Gyms", "Pricing"].map(
            (item) => (
              <button
                key={item}
                className="
                relative
                text-zinc-300
                hover:text-white

                transition-colors
                duration-300

                after:absolute
                after:left-0
                after:-bottom-2
                after:h-[2px]
                after:w-0
                after:bg-violet-500

                hover:after:w-full
                after:transition-all
                after:duration-300
              "
              >
                {item}
              </button>
            ),
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="
              px-5
              py-2.5

              rounded-xl

              text-zinc-300

              hover:text-white
              hover:bg-white/5

              transition-all
              duration-300
            "
          >
            Login
          </Link>

          <Link
            to="/register"
            className="
              px-6
              py-3

              rounded-xl

              bg-violet-600

              text-white
              font-semibold

              shadow-lg
              shadow-violet-600/30

              hover:bg-violet-700
              hover:scale-105

              transition-all
              duration-300
            "
          >
            Register →
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
