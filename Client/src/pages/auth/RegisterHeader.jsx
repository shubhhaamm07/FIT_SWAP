function RegisterHeader() {
  return (
    <div className="text-center mb-8">
      {/* Logo */}
      <div
        className="
          h-16
          w-16
          mx-auto

          rounded-2xl

          bg-violet-600

          flex
          items-center
          justify-center

          shadow-lg
          shadow-violet-600/30
        "
      >
        <span className="text-3xl">🏋️</span>
      </div>

      <h2
        className="
          text-5xl
          font-bold
          mt-6
        "
      >
        Create Account
      </h2>

      <p
        className="
          text-zinc-400
          mt-3
          text-lg
        "
      >
        Join India's largest gym membership marketplace.
      </p>
    </div>
  );
}

export default RegisterHeader;
