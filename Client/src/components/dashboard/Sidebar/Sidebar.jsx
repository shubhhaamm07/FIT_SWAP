import { Settings, LogOut, UserCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";

import SidebarSection from "./SidebarSection";
import { sidebarSections } from "./sidebar.data";

function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside
      className="
        w-[220px]
        h-screen
        bg-[#0D0D12]
        border-r
        border-white/10
        flex
        flex-col
      "
    >
      {/* Logo */}

      <div className="px-6 py-7 border-b border-white/10">
        <h1 className="text-3xl font-black tracking-tight">
          Fit
          <span className="text-violet-500">Swap</span>
        </h1>

        <p className="text-xs text-zinc-500 mt-1">Fitness Marketplace</p>
      </div>

      {/* Navigation */}

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {sidebarSections.map((section) => (
          <SidebarSection
            key={section.title}
            title={section.title}
            items={section.items}
          />
        ))}
      </div>

      {/* Bottom */}

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div
            className="
              w-10
              h-10
              rounded-full
              bg-gradient-to-r
              from-violet-600
              to-purple-600
              flex
              items-center
              justify-center
            "
          >
            <UserCircle2 size={22} />
          </div>

          <div className="flex-1 overflow-hidden">
            <h3 className="font-medium text-sm truncate">{user?.firstName}</h3>

            <p className="text-xs text-zinc-500 truncate">{user?.role}</p>
          </div>
        </div>

        <div className="mt-4 space-y-1">
          <Link
            to="/settings"
            className="
              flex
              items-center
              gap-3
              px-3
              py-2
              rounded-xl
              text-sm
              text-zinc-400
              hover:bg-[#17171F]
            "
          >
            <Settings size={18} />
            Settings
          </Link>

          <button
            onClick={logout}
            className="
              w-full
              flex
              items-center
              gap-3
              px-3
              py-2
              rounded-xl
              text-sm
              text-red-400
              hover:bg-red-500/10
            "
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
