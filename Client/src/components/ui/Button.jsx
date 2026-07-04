function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  type = "button",
  disabled = false,
  className = "",
}) {
  const baseStyles = `
    rounded-xl
    font-semibold

    flex
    items-center
    justify-center

    transition-all
    duration-300

    disabled:opacity-50
    disabled:cursor-not-allowed
  `;

  const variants = {
    primary: `
      bg-violet-600
      hover:bg-violet-700
      text-white
    `,

    secondary: `
      border
      border-zinc-700
      hover:border-violet-500
      hover:bg-zinc-900
      text-white
    `,

    danger: `
      bg-red-600
      hover:bg-red-700
      text-white
    `,

    success: `
      bg-green-600
      hover:bg-green-700
      text-white
    `,
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",

    md: "px-6 py-3 text-base",

    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

export default Button;
