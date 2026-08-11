import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BadgeCheck, CircleAlert, LoaderCircle, MailCheck } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout";
import { verifyEmailAddress } from "../../api/auth.api";

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [state, setState] = useState(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "Confirming your email address…" : "This verification link is missing its secure token. Please sign in and request a new link.");
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;

    const verify = async () => {
      try {
        const response = await verifyEmailAddress(token);
        setState("success");
        setMessage(response.message || "Your email address is verified.");
      } catch (requestError) {
        setState("error");
        setMessage(requestError.response?.data?.message || "We could not verify this link.");
      }
    };

    verify();
  }, [token]);

  const success = state === "success";
  const loading = state === "loading";
  const Icon = loading ? LoaderCircle : success ? BadgeCheck : CircleAlert;

  return <AuthLayout><div className="w-full max-w-[460px] rounded-[32px] border border-white/10 bg-black/35 p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-10"><div className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ${loading ? "bg-violet-500/15 text-violet-300" : success ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}><Icon size={32} className={loading ? "animate-spin" : ""} /></div><p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-violet-300">FitSwap account</p><h1 className="mt-2 text-3xl font-bold text-white">{loading ? "Verifying email" : success ? "Email verified" : "Verification unavailable"}</h1><p className="mt-4 leading-6 text-zinc-400">{message}</p>{!loading && <Link to={success ? "/login" : "/settings"} className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500">{success ? <><MailCheck size={17} /> Sign in to FitSwap</> : "Open account settings"}</Link>}</div></AuthLayout>;
}

export default VerifyEmailPage;
