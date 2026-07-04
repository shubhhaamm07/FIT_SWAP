import { Dumbbell } from "lucide-react";

function AuthHeader({
  title = "Welcome Back",
  subtitle = "Login to continue your fitness journey.",
}) {
  return (
    <div className="text-center">
      <div
        className="
          mx-auto
          w-16
          h-16

          rounded-2xl

          bg-violet-600

          flex
          items-center
          justify-center

          shadow-lg
          shadow-violet-500/40
        "
      >
        <Dumbbell size={28} color="white" />
      </div>

      <p className="mt-5 text-violet-400 font-semibold">FitSwap</p>

      <h1 className="mt-2 text-4xl font-bold">{title}</h1>

      <p className="mt-3 text-zinc-400">{subtitle}</p>
    </div>
  );
}

export default AuthHeader;
