import {
  ArrowRightLeft,
  Bell,
  Building2,
  ChartNoAxesCombined,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Settings,
  UserCircle2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";

import SidebarSection from "./SidebarSection";
import { sidebarSections } from "./sidebar.data";

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const roleLabel =
    user?.role === "ADMIN"
      ? "Administrator"
      : user?.role === "GYM_OWNER"
        ? "Gym Owner"
        : "Member";
  const isGymOwner = user?.role === "GYM_OWNER";
  const visibleSections = isGymOwner
    ? [
        {
          title: "Overview",
          items: [{ label: "Owner Dashboard", to: "/owner/dashboard", icon: LayoutDashboard }],
        },
        {
          title: "Business",
          items: [
            { label: "My Gyms", to: "/owner/gyms", icon: Building2 },
            { label: "Membership Plans", to: "/owner/plans", icon: CreditCard },
            { label: "Members", to: "/owner/members", icon: UsersRound },
          ],
        },
        {
          title: "Performance",
          items: [
            { label: "Sales & Revenue", to: "/owner/sales", icon: ChartNoAxesCombined },
            { label: "Transfer Oversight", to: "/owner/transfers", icon: ArrowRightLeft },
          ],
        },
        {
          title: "Account",
          items: [
            { label: "Notifications", to: "/notifications", icon: Bell },
            { label: "Profile", to: "/profile", icon: UserRound },
            { label: "Settings", to: "/settings", icon: Settings },
          ],
        },
      ]
    : sidebarSections;

  return (
    <aside
      className="
        flex
        h-full
        w-full
        flex-col
        bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.12),_transparent_30%),#0D0D12]
      "
    >
      {/* Logo */}

      <div className="border-b border-white/[0.08] px-5 py-5">
        <h1 className="flex items-center gap-2.5 text-[22px] font-black tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-950/50"><Dumbbell size={18} /></span>Fit<span className="text-violet-400">Swap</span></h1>
        <p className="mt-2 pl-11 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">{isGymOwner ? "Owner portal" : "Member portal"}</p>
      </div>

      {/* Navigation */}

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        {visibleSections.map((section) => (
          <SidebarSection
            key={section.title}
            title={section.title}
            items={section.items}
          />
        ))}
      </div>

      {/* User */}

      <div className="shrink-0 border-t border-white/[0.08] bg-black/10 p-3">
        <div className="mb-3 rounded-2xl border border-violet-500/15 bg-violet-500/[0.06] p-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20 text-violet-300"><Dumbbell size={19} /></div>
          <p className="mt-3 text-sm font-semibold text-white">{isGymOwner ? "Manage your business" : "List a membership"}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{isGymOwner ? "Review sales, member activity, and your gym plans." : "Turn unused membership time into value."}</p>
          <button type="button" onClick={() => navigate(isGymOwner ? "/owner/dashboard" : "/marketplace/sell")} className="mt-3 w-full rounded-xl bg-violet-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500">{isGymOwner ? "Open Owner Centre" : "Create Listing"}</button>
        </div>
        <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
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

        <div className="mt-3 border-t border-white/[0.08] pt-3">
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
