function StatCardSkeleton() {
  return (
    <div
      className="
        rounded-2xl
        border
        border-white/10
        bg-[#12121A]
        p-5
        animate-pulse
      "
    >
      <div className="flex justify-between">
        <div className="flex-1">
          <div className="h-3 w-24 rounded bg-white/10" />

          <div className="h-8 w-16 rounded bg-white/10 mt-4" />

          <div className="h-3 w-28 rounded bg-white/10 mt-4" />
        </div>

        <div className="w-10 h-10 rounded-xl bg-white/10" />
      </div>
    </div>
  );
}

export default StatCardSkeleton;
