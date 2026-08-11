import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Send } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout";
import AuthHeader from "./AuthHeader";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { requestPasswordReset } from "../../api/auth.api";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Enter the email address linked to your FitSwap account.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await requestPasswordReset(email.trim());
      setMessage(response.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to request a password reset.");
    } finally {
      setSubmitting(false);
    }
  };

  return <AuthLayout><div className="w-full max-w-[460px] rounded-[32px] border border-white/10 bg-black/35 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-10"><AuthHeader title="Reset password" subtitle="We’ll send a secure, one-time reset link." /><form onSubmit={submit} className="mt-8 space-y-5"><Input label="Email address" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" icon={<Mail size={18} />} error={error} /><Button type="submit" size="lg" disabled={submitting} className="w-full">{submitting ? "Sending reset link…" : <><Send size={18} className="mr-2" /> Send reset link</>}</Button>{message && <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-200">{message}</div>}<Link to="/login" className="flex items-center justify-center gap-2 pt-1 text-sm font-medium text-zinc-400 transition hover:text-violet-300"><ArrowLeft size={16} /> Back to login</Link></form></div></AuthLayout>;
}

export default ForgotPasswordPage;
