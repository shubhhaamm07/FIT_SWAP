function AdminPageHeader({ eyebrow, title, description, icon: Icon }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-sky-400/20 bg-[radial-gradient(circle_at_85%_15%,rgba(14,165,233,.24),transparent_26%),radial-gradient(circle_at_68%_110%,rgba(168,85,247,.18),transparent_34%),#10121a] p-6 shadow-2xl shadow-sky-950/10 sm:p-8">
      <span className="pointer-events-none absolute -right-5 -top-7 h-32 w-32 rounded-full border border-sky-300/15" />
      <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300">
            FitSwap administration · {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            {description}
          </p>
        </div>
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-sky-400/15 bg-sky-500/12 text-sky-200">
          <Icon size={23} />
        </span>
      </div>
    </section>
  );
}

export default AdminPageHeader;
