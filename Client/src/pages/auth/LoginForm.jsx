import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { loginUser, loginWithGoogle, requestVerificationEmail } from "../../api/auth.api";

const googleSignInEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationNeeded, setVerificationNeeded] = useState(false);
  const [notice, setNotice] = useState("");

  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrors((current) => ({ ...current, [e.target.name]: "", form: "" }));
    setNotice("");
    setVerificationNeeded(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const completeSignIn = (response) => {
    login(response.user);
    navigate(response.user.role === "ADMIN" ? "/admin/dashboard" : response.user.role === "GYM_OWNER" ? "/owner/dashboard" : "/dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting || !validateForm()) return;

    try {
      setSubmitting(true);
      const response = await loginUser(formData);

      completeSignIn(response);
    } catch (error) {
      const message = error.response?.data?.message || "Invalid email or password.";
      setErrors((current) => ({ ...current, form: message }));
      setVerificationNeeded(error.response?.data?.code === "EMAIL_NOT_VERIFIED");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential || googleSubmitting) {
      setErrors((current) => ({ ...current, form: "Google did not return a sign-in credential. Please try again." }));
      return;
    }

    try {
      setGoogleSubmitting(true);
      setErrors((current) => ({ ...current, form: "" }));
      setNotice("");
      const response = await loginWithGoogle(credentialResponse.credential);
      completeSignIn(response);
    } catch (error) {
      setErrors((current) => ({
        ...current,
        form: error.response?.data?.message || "Google sign-in could not be completed. Please try again."
      }));
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email.trim()) {
      setErrors((current) => ({ ...current, email: "Enter your email address first." }));
      return;
    }

    try {
      setResendingVerification(true);
      setErrors((current) => ({ ...current, form: "" }));
      const response = await requestVerificationEmail(formData.email.trim());
      setNotice(response.message);
    } catch (error) {
      setErrors((current) => ({
        ...current,
        form: error.response?.data?.message || "Unable to send a verification email right now.",
      }));
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form space-y-5">
      <Input
        label="Email Address"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Enter your email"
        icon={<Mail size={18} />}
        error={errors.email}
      />

      <Input
        label="Password"
        name="password"
        type={showPassword ? "text" : "password"}
        value={formData.password}
        onChange={handleChange}
        placeholder="Enter your password"
        icon={<Lock size={18} />}
        rightIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        onRightIconClick={() => setShowPassword(!showPassword)}
        error={errors.password}
      />

      <div className="flex justify-end">
        <Link
          to="/forgot-password"
          className="auth-text-link text-sm transition-colors"
        >
          Forgot Password?
        </Link>
      </div>

      {errors.form && (
        <p role="alert" className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200">
          {errors.form}
        </p>
      )}
      {notice && (
        <p className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-200">
          {notice}
        </p>
      )}

      {verificationNeeded && (
        <button
          type="button"
          onClick={handleResendVerification}
          disabled={resendingVerification}
          className="w-full rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {resendingVerification ? "Sending verification email…" : "Resend verification email"}
        </button>
      )}

      <Button type="submit" size="lg" disabled={submitting} className="auth-submit-button w-full">
        {submitting ? "Signing you in…" : "Login to FitSwap"}
      </Button>

      {googleSignInEnabled && (
        <>
          <div className="my-7 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/[0.08]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.17em] text-zinc-600">or continue with</span>
            <span className="h-px flex-1 bg-white/[0.08]" />
          </div>
          <div className={`auth-google-button flex min-h-11 w-full justify-center rounded-2xl py-0.5 ${googleSubmitting ? "pointer-events-none opacity-60" : ""}`}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setErrors((current) => ({ ...current, form: "Google sign-in was cancelled or could not start. Please try again." }))}
              theme="filled_black"
              shape="pill"
              text="continue_with"
              size="large"
              width="420"
            />
          </div>
        </>
      )}

      <p className="text-center text-sm text-zinc-500">
        Don't have an account?
        <Link
          to="/register"
          className="auth-text-link ml-2 transition-colors"
        >
          Register
        </Link>
      </p>
    </form>
  );
}

export default LoginForm;
