import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getCurrentUser, getProfileImage } from "../../../api/auth.api";

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    const closeMenu = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    let active = true;
    let objectUrl = "";

    const loadAvatar = async () => {
      try {
        const profileResponse = await getCurrentUser();
        if (!profileResponse.user?.hasAvatar) return;

        const image = await getProfileImage("avatar");
        objectUrl = URL.createObjectURL(image);
        if (active) setAvatarUrl(objectUrl);
      } catch {
        if (active) setAvatarUrl("");
      }
    };

    void loadAvatar();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [user?.hasAvatar]);

  const goTo = (path) => {
    setOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  const roleLabel = user?.role === "GYM_OWNER" ? "Gym Owner" : user?.role === "ADMIN" ? "Administrator" : "Member";

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open account menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-[#17171F] sm:gap-3"
      >
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-sm font-bold text-white">{avatarUrl ? <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" /> : user?.firstName?.charAt(0) || "U"}</div>
        <div className="hidden text-left sm:block"><h4 className="text-sm font-semibold text-white">{user?.firstName || "User"}</h4><p className="text-[11px] text-zinc-500">{roleLabel}</p></div>
        <ChevronDown size={16} className={`hidden text-zinc-500 transition sm:block ${open ? "rotate-180" : ""}`} />
      </button>

      {open && <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-56 overflow-hidden rounded-2xl border border-white/[0.1] bg-[#15161f] p-2 shadow-2xl shadow-black/50"><div className="border-b border-white/[0.08] px-3 py-2.5"><p className="truncate text-sm font-semibold text-white">{[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "FitSwap member"}</p><p className="mt-0.5 truncate text-xs text-zinc-500">{user?.email || roleLabel}</p></div><MenuItem icon={UserRound} label="View profile" onClick={() => goTo("/profile")} /><MenuItem icon={Settings} label="Settings" onClick={() => goTo("/settings")} /><div className="my-1 border-t border-white/[0.08]" /><MenuItem danger icon={LogOut} label="Log out" onClick={handleLogout} /></div>}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger = false }) {
  return <button type="button" onClick={onClick} className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${danger ? "text-red-300 hover:bg-red-500/10" : "text-zinc-300 hover:bg-white/[0.06] hover:text-white"}`}><Icon size={16} />{label}</button>;
}

export default UserMenu;
