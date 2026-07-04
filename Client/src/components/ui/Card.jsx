function Card({ children, className = "" }) {
  return (
    <div
      className={`
        bg-[#16161D]
        rounded-3xl

        border
        border-zinc-800

        hover:border-violet-500

        transition-all
        duration-300

        ${className}
      `}
    >
      {children}
    </div>
  );
}

export default Card;
