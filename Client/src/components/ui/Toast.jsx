import { CheckCircle2, AlertCircle, X } from "lucide-react";

function Toast({ show, type = "success", message, onClose }) {
  if (!show) {
    return null;
  }

  const isSuccess = type === "success";

  return (
    <div
      className="
        fixed
        top-6
        right-6
        z-[9999]
        animate-in
        slide-in-from-right-10
        fade-in
      "
    >
      <div
        className={`
          flex
          items-start
          gap-4

          min-w-[340px]
          max-w-md

          rounded-2xl
          border

          p-5

          shadow-2xl

          ${
            isSuccess
              ? "border-green-500/20 bg-[#111A14]"
              : "border-red-500/20 bg-[#1A1111]"
          }
        `}
      >
        <div
          className={`
            mt-0.5

            ${isSuccess ? "text-green-400" : "text-red-400"}
          `}
        >
          {isSuccess ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
        </div>

        <div className="flex-1">
          <h3 className="font-semibold">
            {isSuccess ? "Success" : "Something went wrong"}
          </h3>

          <p className="mt-1 text-sm text-zinc-400">{message}</p>
        </div>

        <button
          onClick={onClose}
          className="
            rounded-lg
            p-1
            text-zinc-500
            transition-colors
            hover:bg-white/5
            hover:text-white
          "
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

export default Toast;
