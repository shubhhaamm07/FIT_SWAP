function StatCard({
  title,
  value,
  icon: Icon,
  color = "text-violet-400",
  subtitle,
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-white/10
        bg-[#12121A]
        p-5
        transition-all
        duration-300
        hover:border-violet-500/30
        hover:-translate-y-1
      "
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-500">{title}</p>

          <h2 className="mt-2 text-3xl font-bold">{value}</h2>

          {subtitle && <p className="mt-2 text-xs text-zinc-400">{subtitle}</p>}
        </div>

        <div
          className="
            w-10
            h-10
            rounded-xl
            bg-violet-500/10
            flex
            items-center
            justify-center
          "
        >
          <Icon size={20} className={color} />
        </div>
      </div>
    </div>
  );
}

export default StatCard;
