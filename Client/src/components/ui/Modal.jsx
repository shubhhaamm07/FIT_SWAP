import { X } from "lucide-react";

function Modal({ isOpen, onClose, children, maxWidth = "max-w-lg" }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/70
        backdrop-blur-sm
        p-4
      "
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={`
          relative
          w-full
          ${maxWidth}
          rounded-3xl
          border
          border-white/10
          bg-[#111118]
          shadow-2xl
          animate-in
          fade-in
          zoom-in-95
          duration-200
        `}
      >
        <button
          onClick={onClose}
          className="
            absolute
            right-5
            top-5
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            bg-white/5
            text-zinc-400
            transition-colors
            hover:bg-white/10
            hover:text-white
          "
        >
          <X size={18} />
        </button>

        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
