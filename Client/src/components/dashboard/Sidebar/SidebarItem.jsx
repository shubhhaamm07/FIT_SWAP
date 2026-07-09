import { Link, useLocation } from "react-router-dom";

function SidebarItem({ icon: Icon, label, path, disabled = false }) {
  const { pathname } = useLocation();

  const isActive = pathname === path;

  return (
    <Link
      to={disabled ? "#" : path}
      className={`
        group
        flex
        items-center
        gap-4

        px-4
        py-3

        rounded-2xl

        transition-all
        duration-300

        ${
          isActive
            ? "bg-violet-600/15 border-l-4 border-violet-500 text-violet-400"
            : "text-zinc-400 hover:bg-[#18181F] hover:text-white"
        }

        ${disabled ? "pointer-events-none opacity-50" : ""}
      `}
    >
      <Icon
        size={20}
        className={`
          transition-colors

          ${isActive ? "text-violet-400" : "group-hover:text-violet-400"}
        `}
      />

      <span className="font-medium text-[15px]">{label}</span>

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
