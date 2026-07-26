import { Search } from "lucide-react";

const SearchBar = ({ value, onChange }) => {
  return (
    <div className="relative">
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
      />

      <input
        type="text"
        placeholder="Search by gym, membership or city..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full
          rounded-xl
          border
          border-white/10
          bg-[#181B22]
          py-3
          pl-11
          pr-4
          text-sm
          text-white
          outline-none
          placeholder:text-zinc-500
          focus:border-violet-500
        "
      />
    </div>
  );
};

export default SearchBar;
