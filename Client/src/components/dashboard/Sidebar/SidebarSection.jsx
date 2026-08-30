import SidebarItem from "./SidebarItem";

function SidebarSection({ title, items, onNavigate }) {
  return (
    <div className="mb-5">
      <p
        className="
          text-[11px]
          uppercase
          tracking-widest
          text-zinc-600
          mb-2
          px-3
        "
      >
        {title}
      </p>

      <div className="space-y-1">
        {items.map((item) => (
          <SidebarItem key={item.label} {...item} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}

export default SidebarSection;
