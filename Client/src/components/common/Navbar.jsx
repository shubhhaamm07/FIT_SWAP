import { useEffect, useState } from "react";
import { Dumbbell, Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const navigationItems = ["Marketplace", "How It Works", "Partner Gyms", "Pricing"];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navigateLanding = (item) => {
    setMenuOpen(false);

    if (item === "Marketplace") return navigate("/login");
    if (item === "How It Works") return document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
    if (item === "Partner Gyms") return document.getElementById("marketplace-preview")?.scrollIntoView({ behavior: "smooth" });
    return navigate("/register");
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`landing-web3-nav fixed left-0 top-0 z-50 w-full transition-all duration-500 ${scrolled || menuOpen ? "is-scrolled" : ""}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link to="/" className="group flex min-w-0 items-center gap-2.5 sm:gap-3" onClick={() => setMenuOpen(false)}>
          <div className="landing-web3-brand grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white transition duration-300 group-hover:rotate-12 group-hover:scale-110 sm:h-12 sm:w-12 sm:rounded-2xl">
            <Dumbbell size={21} className="sm:hidden" />
            <Dumbbell size={24} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold tracking-wide sm:text-2xl">Fit<span className="landing-web3-brand-accent">Swap</span></h1>
            <p className="-mt-1 hidden text-xs text-zinc-500 sm:block">Gym Marketplace</p>
          </div>
        </Link>

        <div className="hidden items-center gap-7 xl:flex">
          {navigationItems.map((item) => <NavButton key={item} item={item} onClick={navigateLanding} />)}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <Link to="/login" className="landing-web3-login hidden rounded-full px-3 py-2.5 text-sm transition sm:inline-flex lg:px-5">Login</Link>
          <Link to="/register" className="landing-web3-register rounded-full px-3 py-2.5 text-xs font-semibold text-[#18141a] transition sm:px-5 sm:text-sm lg:px-6 lg:py-3">Get started</Link>
          <button type="button" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((isOpen) => !isOpen)} className="landing-web3-menu grid h-10 w-10 place-items-center rounded-xl text-zinc-100 transition xl:hidden">
            {menuOpen ? <X size={19} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="landing-web3-mobile border-t px-4 py-4 xl:hidden">
          <div className="mx-auto grid max-w-7xl gap-1">
            {navigationItems.map((item) => <button key={item} type="button" onClick={() => navigateLanding(item)} className="flex min-h-11 items-center rounded-xl px-4 text-left text-sm font-medium text-zinc-200 transition hover:bg-violet-500/12 hover:text-violet-100">{item}</button>)}
            <Link to="/login" onClick={() => setMenuOpen(false)} className="mt-2 flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/10 sm:hidden">Login</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavButton({ item, onClick }) {
  return <button type="button" onClick={() => onClick(item)} className="landing-web3-link relative text-sm transition-colors duration-300 after:absolute after:-bottom-2 after:left-0 after:h-px after:w-0 after:transition-all after:duration-300 hover:after:w-full">{item}</button>;
}

export default Navbar;
