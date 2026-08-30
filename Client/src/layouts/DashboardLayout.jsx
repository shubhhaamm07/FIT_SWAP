import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import Sidebar from "../components/dashboard/Sidebar/Sidebar";
import Topbar from "../components/dashboard/Topbar/Topbar";

function DashboardLayout({ children, rightSidebar }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isMobileMenuOpen]);

  return (
    <div className="app-dashboard h-screen overflow-hidden text-white">
      <div className="flex h-full">
        <aside className="app-sidebar hidden h-full w-[248px] shrink-0 overflow-hidden border-r border-white/[0.08] bg-[#0c0d13] lg:block">
          <Sidebar />
        </aside>

        <div className="min-w-0 flex-1 overflow-y-auto overscroll-contain">
          <main className="min-h-full min-w-0">
            <div className="sticky top-0 z-20 bg-[#08090d]/95 px-4 pt-4 backdrop-blur-xl sm:px-6 sm:pt-5 xl:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  aria-label="Open navigation"
                  aria-expanded={isMobileMenuOpen}
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-[#11121a] text-zinc-200 transition hover:border-violet-500/30 hover:text-white lg:hidden"
                >
                  <Menu size={20} />
                </button>
                <div className="min-w-0 flex-1">
                  <Topbar />
                </div>
              </div>
            </div>

            <div className="app-page mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 xl:px-8">{children}</div>
          </main>
        </div>

        {rightSidebar && (
          <aside
            className="
              hidden h-full w-[320px] shrink-0 overflow-y-auto border-l border-white/[0.08]
              bg-[#0c0d13]/95 p-5 shadow-[-14px_0_40px_rgba(0,0,0,0.12)] xl:block
            "
          >
            <div className="space-y-5">{rightSidebar}</div>
          </aside>
        )}
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <aside className="app-sidebar relative h-full w-[min(19rem,calc(100vw-2rem))] overflow-hidden border-r border-white/[0.08] bg-[#0c0d13] shadow-2xl shadow-black/60">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-lg border border-white/[0.08] bg-black/30 text-zinc-300 transition hover:text-white"
            >
              <X size={18} />
            </button>
            <Sidebar onNavigate={() => setIsMobileMenuOpen(false)} />
          </aside>
        </div>
      )}
    </div>
  );
}

export default DashboardLayout;
