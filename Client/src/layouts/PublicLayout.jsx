import Navbar from "../components/common/Navbar";
import Footer from "../components/landing/Footer";

export default function PublicLayout({ children }) {
  return <div className="site-shell fitswap-web3 min-h-screen bg-[#0b0b0f] text-white">
    <Navbar />
    <main id="main-content" className="mx-auto w-full max-w-7xl px-5 pb-16 pt-28 sm:px-8 sm:pt-32">{children}</main>
    <Footer />
  </div>;
}
