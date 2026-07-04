function WorkflowCard({ title, desc }) {
  return (
    <div
      className="
        bg-[#16161D]
        border
        border-zinc-800
        rounded-3xl
        p-6
        min-w-[180px]
        text-center

        hover:border-violet-500
        transition-all
      "
    >
      <h3 className="font-bold text-xl">{title}</h3>

      <p className="text-zinc-400 mt-2">{desc}</p>
    </div>
  );
}

export default WorkflowCard;
