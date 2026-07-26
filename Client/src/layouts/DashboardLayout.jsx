import Sidebar from "../components/dashboard/Sidebar/Sidebar";
import Topbar from "../components/dashboard/Topbar/Topbar";

function DashboardLayout({ children, rightSidebar }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#08090d] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-[220px] shrink-0 border-r border-white/[0.08] bg-[#0c0d13] lg:block">
          <Sidebar />
        </aside>

        <div className="min-w-0 flex-1">
          <main className="min-w-0 px-4 py-4 sm:px-6 sm:py-5 xl:px-8">
            <Topbar />

            <div className="mx-auto mt-6 w-full max-w-[1320px]">{children}</div>
          </main>
        </div>

        {rightSidebar && (
          <aside
            className="
              hidden w-[320px] shrink-0 border-l border-white/[0.08]
              bg-[#0c0d13]/95 p-5 xl:block
            "
          >
            <div className="sticky top-5 space-y-5">{rightSidebar}</div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default DashboardLayout;
