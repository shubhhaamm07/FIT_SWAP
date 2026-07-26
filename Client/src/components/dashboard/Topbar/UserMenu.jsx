import { ChevronDown } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

function UserMenu() {
  const { user } = useAuth();

  return (
    <button
      className="
        flex
        items-center
        gap-2 sm:gap-3
        px-2
        py-1
        rounded-xl
        hover:bg-[#17171F]
      "
    >
      <div
        className="
          w-9
          h-9
          rounded-full
          bg-gradient-to-r
          from-violet-600
          to-purple-600
          flex
          items-center
          justify-center
          text-sm
          font-bold
        "
      >
        {user?.firstName?.charAt(0)}
      </div>

      <div className="hidden text-left sm:block">
        <h4 className="text-sm font-semibold">{user?.firstName}</h4>

        <p className="text-[11px] text-zinc-500">{user?.role}</p>
      </div>

      <ChevronDown size={16} className="hidden text-zinc-500 sm:block" />
    </button>
  );
}

export default UserMenu;
