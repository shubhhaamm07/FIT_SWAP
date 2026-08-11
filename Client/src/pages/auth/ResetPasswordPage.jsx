import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout";
import AuthHeader from "./AuthHeader";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { resetPasswordWithToken } from "../../api/auth.api";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(token ? "" : "This reset link is missing its secure token. Please request a new one.");

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is missing its secure token. Please request a new one.");
      return;
    }
    if (form.password.length < 8) {
      setError("Your new password must have at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await resetPasswordWithToken({ token, newPassword: form.password });
      setMessage(response.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to reset your password.");
    } finally {
      setSubmitting(false);
    }
  };

  if (message) {
    return <AuthLayout><div className="w-full max-w-[460px] rounded-[32px] border border-emerald-400/20 bg-black/35 p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-10"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-300"><CheckCircle2 size={32} /></div><h1 className="mt-6 text-3xl font-bold text-white">Password updated</h1><p className="mt-3 leading-6 text-zinc-400">{message}</p><Link to="/login" className="mt-8 inline-flex items-center justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500">Sign in to FitSwap</Link></div></AuthLayout>;
  }

  return <AuthLayout><div className="w-full max-w-[460px] rounded-[32px] border border-white/10 bg-black/35 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-10"><AuthHeader title="Choose a new password" subtitle="This reset link is valid for one hour." /><form onSubmit={submit} className="mt-8 space-y-5"><Input label="New password" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" icon={<Lock size={18} />} rightIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />} onRightIconClick={() => setShowPassword(!showPassword)} /><Input label="Confirm new password" name="confirmPassword" type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} placeholder="Repeat your new password" icon={<KeyRound size={18} />} error={error} /><Button type="submit" size="lg" disabled={submitting || !token} className="w-full">{submitting ? "Updating password…" : "Update password"}</Button><Link to="/login" className="flex items-center justify-center gap-2 pt-1 text-sm font-medium text-zinc-400 transition hover:text-violet-300"><ArrowLeft size={16} /> Back to login</Link></form></div></AuthLayout>;
}

export default ResetPasswordPage;
