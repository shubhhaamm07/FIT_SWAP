import { Dumbbell, LogOut, UserCircle2 } from "lucide-react";

import { useAuth } from "../../../context/AuthContext";

import SidebarSection from "./SidebarSection";
import { sidebarSections } from "./sidebar.data";

function Sidebar() {
  const { user, logout } = useAuth();

  const roleLabel =
    user?.role === "ADMIN"
      ? "Administrator"
      : user?.role === "OWNER"
        ? "Gym Owner"
        : "Member";

  return (
    <aside
      className="
        flex
        h-screen
        w-[220px]
        flex-col
        border-r
        border-white/10
        bg-[#0D0D12]
      "
    >
      {/* Logo */}

      <div className="border-b border-white/10 px-6 py-7">
        <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight"><span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-600 text-white"><Dumbbell size={17} /></span>Fit<span className="text-violet-500">Swap</span></h1>
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

      {/* User */}

      <div className="border-t border-white/10 p-4">
        <div className="mb-5 rounded-xl border border-white/[0.08] bg-[#11121a] p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400"><Dumbbell size={19} /></div>
          <p className="mt-3 text-sm font-semibold">List Your Membership</p><p className="mt-1 text-xs leading-5 text-zinc-500">Earn money by listing your unused membership</p>
          <button className="mt-3 w-full rounded-lg bg-violet-600 py-2 text-xs font-semibold hover:bg-violet-500">Create Listing</button>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-gradient-to-r
              from-violet-600
              to-purple-600
            "
          >
            <UserCircle2 size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium">
              {user?.firstName || "User"}
            </h3>

            <p className="truncate text-xs text-zinc-500">{roleLabel}</p>
          </div>
        </div>

        {/* Logout */}

        <div className="mt-5 border-t border-white/10 pt-4">
          <button
            onClick={logout}
            className="
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              px-3
              py-2
              text-sm
              text-red-400
              transition-colors
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
