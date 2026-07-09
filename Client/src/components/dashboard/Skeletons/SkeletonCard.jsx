function SkeletonCard() {
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
      <div className="w-10 h-10 rounded-xl bg-white/10 mb-5" />

      <div className="h-3 w-24 rounded bg-white/10 mb-3" />

      <div className="h-8 w-16 rounded bg-white/10 mb-4" />

      <div className="h-2 w-full rounded bg-white/10" />
    </div>
  );
}

export default SkeletonCard;
