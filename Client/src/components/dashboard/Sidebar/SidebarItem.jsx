import { Link, useLocation } from "react-router-dom";

function SidebarItem({ icon: Icon, label, to, disabled = false }) {
  const { pathname } = useLocation();

  const isActive = pathname === to || pathname.startsWith(`${to}/`);

  return (
    <Link
      to={disabled ? "#" : to}
      aria-current={isActive ? "page" : undefined}
      className={`
        group flex items-center gap-3 rounded-xl border px-3 py-2.5
        text-sm transition-all duration-200
        ${
          isActive
            ? "border-violet-500/25 bg-violet-500/12 text-white shadow-[0_8px_24px_rgba(76,29,149,0.16)]"
            : "border-transparent text-zinc-400 hover:bg-white/[0.05] hover:text-white"
        }

        ${disabled ? "pointer-events-none opacity-50" : ""}
      `}
    >
      <Icon
        size={20}
        className={`
          transition-colors
          ${isActive ? "text-violet-300" : "group-hover:text-violet-300"}
        `}
      />

      <span className="font-medium">{label}</span>

      {disabled && (
        <span
          className="
            ml-auto
            rounded-full
            bg-zinc-800
            px-2
            py-1
            text-[10px]
            uppercase
            tracking-wider
          "
        >
          Soon
        </span>
      )}
    </Link>
  );
}

export default SidebarItem;
