import { Search } from "lucide-react";

function SearchBar() {
  return (
    <div
      className="
        h-12
        w-full
        max-w-[520px]
        rounded-xl
        bg-[#11121a]
        border
        border-white/10
        flex
        items-center
        gap-4
        px-4
        transition-all
        duration-300
        hover:border-violet-500
        focus-within:border-violet-500
      "
    >
      <Search size={20} className="text-zinc-500" />

      <input
        type="text"
        placeholder="Search gyms, locations or membership types..."
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
          hidden
          rounded-lg
          border
          border-white/10
          px-2
          py-1
          text-xs
          text-zinc-500
          sm:inline-flex
        "
      >
        ⌘ K
      </kbd>
    </div>
  );
}

export default SearchBar;
