import Sidebar from "../components/dashboard/Sidebar/Sidebar";
import Topbar from "../components/dashboard/Topbar/Topbar";

function DashboardLayout({ children, rightSidebar }) {
  return (
    <div className="min-h-screen bg-[#09090B] text-white flex overflow-hidden">
      {/* Sidebar */}

      <Sidebar />

      {/* Main Content */}

      <div className="flex-1 flex">
        <main className="flex-1 px-6 py-5">
          <Topbar />

          <div className="mt-6">{children}</div>
        </main>

        {/* Right Sidebar */}

        <aside
          className="
            w-[290px]
            border-l
            border-white/10
            bg-[#0E0E14]
            p-5
            space-y-5
          "
        >
          {rightSidebar}
        </aside>
      </div>
    </div>
  );
}

export default DashboardLayout;
