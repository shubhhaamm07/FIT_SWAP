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
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <label className="text-sm font-medium text-zinc-300">
          {label}

          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative group">
        {/* Left Icon */}

        {icon && (
          <div
            className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2

              text-zinc-500

              group-focus-within:text-violet-400

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

            bg-[#16161D]

            border

            ${error ? "border-red-500" : "border-zinc-700"}

            text-white

            placeholder:text-zinc-500

            outline-none

            transition-all
            duration-300

            focus:border-violet-500
            focus:ring-4
            focus:ring-violet-500/20
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
              hover:text-violet-400

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
