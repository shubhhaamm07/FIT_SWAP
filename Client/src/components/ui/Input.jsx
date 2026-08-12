function Input({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  name,
  error,
  required = false,
  icon,
  rightIcon,
  onRightIconClick,
}) {
  return (
    <div className="auth-input-group space-y-2">
      {/* Label */}
      {label && (
        <label className="text-sm font-medium text-zinc-300">
          {label}

          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="auth-input-wrap relative group">
        {/* Left Icon */}

        {icon && (
          <div
            className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2

            text-zinc-500

            group-focus-within:text-[#ffb18c]

              transition-colors
            "
          >
            {icon}
          </div>
        )}

        {/* Input */}

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            w-full

            ${icon ? "pl-12" : "pl-4"}

            ${rightIcon ? "pr-12" : "pr-4"}

            py-3.5

            rounded-xl

            auth-input-field

            border

            ${error ? "border-red-500" : "border-white/[0.1]"}

            text-white

            placeholder:text-zinc-500

            outline-none

            transition-all
            duration-300

            focus:border-[#ff8c63]
            focus:ring-4
            focus:ring-[#ff8c63]/15
          `}
        />

        {/* Right Icon */}

        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="
              absolute
              right-4
              top-1/2
              -translate-y-1/2

              text-zinc-500
              hover:text-[#ffb18c]

              transition-colors
            "
          >
            {rightIcon}
          </button>
        )}
      </div>

      {/* Error */}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

export default Input;

// export default Input;X
