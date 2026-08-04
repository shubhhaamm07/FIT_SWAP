import Sidebar from "../components/dashboard/Sidebar/Sidebar";
import Topbar from "../components/dashboard/Topbar/Topbar";

function DashboardLayout({ children, rightSidebar }) {
  return (
    <div className="h-screen overflow-hidden bg-[#08090d] text-white">
      <div className="flex h-full">
        <aside className="hidden h-full w-[248px] shrink-0 overflow-hidden border-r border-white/[0.08] bg-[#0c0d13] lg:block">
          <Sidebar />
        </aside>

        <div className="min-w-0 flex-1 overflow-y-auto overscroll-contain">
          <main className="min-h-full min-w-0">
            <div className="sticky top-0 z-20 bg-[#08090d]/95 px-4 pt-4 backdrop-blur-xl sm:px-6 sm:pt-5 xl:px-8">
              <Topbar />
            </div>

            <div className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 xl:px-8">{children}</div>
          </main>
        </div>

        {rightSidebar && (
          <aside
            className="
              hidden h-full w-[320px] shrink-0 overflow-y-auto border-l border-white/[0.08]
              bg-[#0c0d13]/95 p-5 xl:block
            "
          >
            <div className="space-y-5">{rightSidebar}</div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default DashboardLayout;
