function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-4xl font-black text-white">{title}</h1>

        {subtitle && <p className="mt-2 text-zinc-400">{subtitle}</p>}
      </div>

      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}

export default PageHeader;
