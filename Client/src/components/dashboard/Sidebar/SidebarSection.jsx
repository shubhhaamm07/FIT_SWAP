import SidebarItem from "./SidebarItem";

function SidebarSection({ title, items }) {
  return (
    <div className="mb-6">
      <p
        className="
          text-[11px]
          uppercase
          tracking-widest
          text-zinc-600
          mb-3
          px-2
        "
      >
        {title}
      </p>

      <div className="space-y-1">
        {items.map((item) => (
          <SidebarItem key={item.label} {...item} />
        ))}
      </div>
    </div>
  );
}

export default SidebarSection;
