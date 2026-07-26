import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-10 flex items-center justify-between rounded-2xl border border-white/10 bg-[#11131A] p-4">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="
          flex
          items-center
          gap-2
          rounded-lg
          border
          border-white/10
          px-4
          py-2
          text-white
          disabled:cursor-not-allowed
          disabled:opacity-40
        "
      >
        <ChevronLeft size={18} />
        Previous
      </button>

      <div className="flex items-center gap-2">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index}
            onClick={() => onPageChange(index + 1)}
            className={`h-10 w-10 rounded-lg font-medium transition ${
              currentPage === index + 1
                ? "bg-violet-600 text-white"
                : "bg-[#181B22] text-zinc-400 hover:bg-violet-600 hover:text-white"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="
          flex
          items-center
          gap-2
          rounded-lg
          border
          border-white/10
          px-4
          py-2
          text-white
          disabled:cursor-not-allowed
          disabled:opacity-40
        "
      >
        Next
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default Pagination;
