import { CheckCircle2 } from "lucide-react";

function RoleCard({ title, description, icon, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        auth-role-card
        relative

        rounded-3xl

        border

        p-4

        text-left

        transition-all
        duration-300

        ${
          selected
            ? `
              is-selected
            `
            : `
              border-white/[0.08]
              bg-white/[0.03]
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
            text-[#d9ff4b]
          "
        />
      )}

      <div
        className="
          h-11
          w-11

          rounded-2xl

          auth-role-icon

          flex
          items-center
          justify-center

          text-[#ffb18c]
        "
      >
        {icon}
      </div>

      <h3 className="mt-4 text-base font-bold text-white">{title}</h3>

      <p className="mt-2 text-xs leading-5 text-zinc-400">{description}</p>
    </button>
  );
}

export default RoleCard;
