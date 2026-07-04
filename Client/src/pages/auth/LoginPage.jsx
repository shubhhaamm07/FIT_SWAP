import AuthLayout from "../../layouts/AuthLayout";
import AuthHeader from "./AuthHeader";
import LoginForm from "./LoginForm";

function LoginPage() {
  return (
    <AuthLayout>
      <div
        className="
          w-full
          max-w-[460px]

          rounded-[32px]

          border
          border-white/10

          bg-black/35
          backdrop-blur-2xl

          p-10

          shadow-[0_20px_60px_rgba(0,0,0,0.45)]

          transition-all
          duration-500
        "
      >
        <AuthHeader />

        <div className="mt-10">
          <LoginForm />
        </div>

        {/* Divider */}

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-zinc-700"></div>

          <span className="text-sm text-zinc-500 uppercase tracking-widest">
            OR
          </span>

          <div className="h-px flex-1 bg-zinc-700"></div>
        </div>

        {/* Google Button */}

        <button
          className="
            flex
            items-center
            justify-center
            gap-3

            w-full

            py-4

            rounded-xl

            border
            border-zinc-700

            hover:border-violet-500
            hover:bg-white/5

            transition-all
            duration-300
          "
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-5 h-5"
          />

          <span className="font-medium">Continue with Google</span>
        </button>

        {/* Register */}

        {/* <p className="mt-8 text-center text-zinc-400">
          Don't have an account?
          <button
            className="
              ml-2

              font-semibold

              text-violet-400

              hover:text-violet-300

              transition
            "
          >
            Register
          </button>
        </p> */}
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
