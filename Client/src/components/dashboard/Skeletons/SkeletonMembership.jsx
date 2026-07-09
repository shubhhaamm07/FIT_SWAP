function SkeletonMembership() {
  return (
    <div
      className="
        rounded-2xl
        border
        border-white/10
        bg-[#12121A]
        overflow-hidden
        animate-pulse
      "
    >
      <div className="h-2 bg-white/10" />

      <div className="p-5">
        <div className="h-5 w-40 rounded bg-white/10" />

        <div className="h-3 w-20 rounded bg-white/10 mt-3" />

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="h-10 rounded bg-white/10" />

          <div className="h-10 rounded bg-white/10" />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="h-10 rounded-xl bg-white/10" />

          <div className="h-10 rounded-xl bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export default SkeletonMembership;
