import AuthLayout from "../../layouts/AuthLayout";
import AuthHeader from "./AuthHeader";
import LoginForm from "./LoginForm";

function LoginPage() {
  return (
    <AuthLayout>
      <div className="auth-editorial-card rounded-[28px] p-6 sm:p-8">
        <AuthHeader />
        <div className="mt-8"><LoginForm /></div>
        <div className="my-7 flex items-center gap-3"><span className="h-px flex-1 bg-white/[0.08]" /><span className="text-[10px] font-bold uppercase tracking-[0.17em] text-zinc-600">or continue with</span><span className="h-px flex-1 bg-white/[0.08]" /></div>
        <button type="button" className="auth-google-button flex w-full items-center justify-center gap-3 rounded-2xl py-3.5 text-sm font-semibold"><span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] font-black text-[#4285f4]">G</span><span>Continue with Google</span></button>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
