import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";

function StatCard({ end, suffix, title }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
  });

  return (
    <div
      ref={ref}
      className="
        bg-[#16161D]
        rounded-2xl
        p-6

        border
        border-zinc-800

        hover:border-violet-500
        hover:-translate-y-2

        transition-all
        duration-300
      "
    >
      <h2
        className="
          text-4xl
          font-bold
          text-violet-500
        "
      >
        {inView && <CountUp end={end} duration={2} />}
        {suffix}
      </h2>

      <p className="text-zinc-400 mt-2">{title}</p>
    </div>
  );
}

export default StatCard;
