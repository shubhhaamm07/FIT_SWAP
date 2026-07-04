import { CheckCircle2 } from "lucide-react";

function RoleCard({ title, description, icon, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative

        rounded-3xl

        border

        p-6

        text-left

        transition-all
        duration-300

        ${
          selected
            ? `
              border-violet-500
              bg-violet-600/10
              shadow-xl
              shadow-violet-600/20
              scale-[1.03]
            `
            : `
              border-zinc-700
              bg-[#16161D]
              hover:border-violet-500
              hover:-translate-y-1
            `
        }
      `}
    >
      {selected && (
        <CheckCircle2
          size={22}
          className="
            absolute
            top-4
            right-4
            text-violet-500
          "
        />
      )}

      <div
        className="
          h-14
          w-14

          rounded-2xl

          bg-violet-600/15

          flex
          items-center
          justify-center

          text-violet-400
        "
      >
        {icon}
      </div>

      <h3 className="mt-6 text-xl font-semibold">{title}</h3>

      <p className="mt-3 text-zinc-400 text-sm leading-6">{description}</p>
    </button>
  );
}

export default RoleCard;
