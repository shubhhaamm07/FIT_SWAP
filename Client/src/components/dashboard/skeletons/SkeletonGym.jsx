function SkeletonGym() {
  return (
    <div
      className="
        rounded-2xl
        overflow-hidden
        border
        border-white/10
        bg-[#12121A]
        animate-pulse
      "
    >
      <div className="h-32 bg-white/10" />

      <div className="p-5">
        <div className="h-5 w-40 rounded bg-white/10" />

        <div className="h-3 w-full rounded bg-white/10 mt-3" />

        <div className="h-3 w-2/3 rounded bg-white/10 mt-2" />

        <div className="space-y-3 mt-5">
          <div className="h-3 rounded bg-white/10" />

          <div className="h-3 rounded bg-white/10" />
        </div>

        <div className="h-10 rounded-xl bg-white/10 mt-6" />
      </div>
    </div>
  );
}

export default SkeletonGym;
