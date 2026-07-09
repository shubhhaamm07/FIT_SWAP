import { Search } from "lucide-react";

function SearchBar() {
  return (
    <div
      className="
        w-[500px]
        h-14
        rounded-2xl
        bg-[#13131B]
        border
        border-white/10
        flex
        items-center
        gap-4
        px-5
        transition-all
        duration-300
        hover:border-violet-500
        focus-within:border-violet-500
      "
    >
      <Search size={20} className="text-zinc-500" />

      <input
        type="text"
        placeholder="Search gyms, memberships, trainers..."
        className="
          flex-1
          bg-transparent
          outline-none
          text-white
          placeholder:text-zinc-500
        "
      />

      <kbd
        className="
          rounded-lg
          border
          border-white/10
          px-2
          py-1
          text-xs
          text-zinc-500
        "
      >
        ⌘ K
      </kbd>
    </div>
  );
}

export default SearchBar;
