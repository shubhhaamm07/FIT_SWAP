function Footer() {
  return (
    <footer className="bg-[#09090B] border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <h2 className="text-3xl font-bold">
              Fit<span className="text-violet-500">Swap</span>
            </h2>

            <p className="mt-5 text-zinc-400 leading-7">
              India's modern marketplace for buying, selling and transferring
              gym memberships securely.
            </p>

            <div className="flex gap-4 mt-6">
              <button className="w-10 h-10 rounded-full bg-[#16161D] hover:bg-violet-600 transition-all">
                G
              </button>

              <button className="w-10 h-10 rounded-full bg-[#16161D] hover:bg-violet-600 transition-all">
                L
              </button>

              <button className="w-10 h-10 rounded-full bg-[#16161D] hover:bg-violet-600 transition-all">
                @
              </button>
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="font-semibold text-lg mb-5">Marketplace</h3>

            <ul className="space-y-3 text-zinc-400">
              <li className="hover:text-violet-500 cursor-pointer transition">
                Browse Listings
              </li>

              <li className="hover:text-violet-500 cursor-pointer transition">
                Sell Membership
              </li>

              <li className="hover:text-violet-500 cursor-pointer transition">
                My Listings
              </li>

              <li className="hover:text-violet-500 cursor-pointer transition">
                Transfer Requests
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-lg mb-5">Company</h3>

            <ul className="space-y-3 text-zinc-400">
              <li className="hover:text-violet-500 cursor-pointer transition">
                About Us
              </li>

              <li className="hover:text-violet-500 cursor-pointer transition">
                Contact
              </li>

              <li className="hover:text-violet-500 cursor-pointer transition">
                Careers
              </li>

              <li className="hover:text-violet-500 cursor-pointer transition">
                FAQs
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-lg mb-5">Legal</h3>

            <ul className="space-y-3 text-zinc-400">
              <li className="hover:text-violet-500 cursor-pointer transition">
                Privacy Policy
              </li>

              <li className="hover:text-violet-500 cursor-pointer transition">
                Terms & Conditions
              </li>

              <li className="hover:text-violet-500 cursor-pointer transition">
                Support
              </li>

              <li className="hover:text-violet-500 cursor-pointer transition">
                Help Center
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}

        <div
          className="
            mt-14
            pt-8
            border-t
            border-zinc-800

            flex
            flex-col
            md:flex-row

            justify-between
            items-center

            gap-6
          "
        >
          <p className="text-zinc-500">© 2026 FitSwap. All Rights Reserved.</p>

          <button
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            className="
              bg-violet-600
              hover:bg-violet-700

              px-5
              py-3

              rounded-xl

              transition-all
            "
          >
            ↑ Back to Top
          </button>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
