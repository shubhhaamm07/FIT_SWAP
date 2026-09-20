import { useEffect, useMemo, useState } from "react";
import { Copy, KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { getAdminMfaEnrollment, verifyAdminMfa } from "../../api/auth.api";
import AuthLayout from "../../layouts/AuthLayout";
import { useAuth } from "../../hooks/useAuth";
import AuthHeader from "./AuthHeader";

const challengeStorageKey = "fitswap_admin_mfa_challenge";

function AdminMfaPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const challengeToken = useMemo(
    () => location.state?.mfaChallengeToken || sessionStorage.getItem(challengeStorageKey),
    [location.state],
  );
  const [enrollment, setEnrollment] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState(null);
  const [signedInUser, setSignedInUser] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!challengeToken) {
      navigate("/login", { replace: true });
      return undefined;
    }

    let active = true;
    getAdminMfaEnrollment(challengeToken)
      .then((response) => {
        if (active) setEnrollment(response.data);
      })
      .catch((requestError) => {
        if (!active) return;
        sessionStorage.removeItem(challengeStorageKey);
        setError(requestError.response?.data?.message || "Your secure sign-in window expired. Please sign in again.");
      })
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [challengeToken, navigate]);

  const copyManualKey = async () => {
    if (!enrollment?.manualEntryKey) return;
    try {
      await navigator.clipboard.writeText(enrollment.manualEntryKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Copy is unavailable in this browser. Select the key and copy it manually.");
    }
  };

  const submitCode = async (event) => {
    event.preventDefault();
    if (submitting || !code.trim()) return;
    try {
      setSubmitting(true);
      setError("");
      const response = await verifyAdminMfa({ mfaChallengeToken: challengeToken, code: code.trim() });
      sessionStorage.removeItem(challengeStorageKey);
      setSignedInUser(response.user);
      if (response.recoveryCodes?.length) {
        setRecoveryCodes(response.recoveryCodes);
      } else {
        login(response.user);
        navigate("/admin/dashboard", { replace: true });
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We could not verify that code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const finishRecoveryCodes = () => {
    if (!signedInUser) return;
    setRecoveryCodes(null);
    login(signedInUser);
    navigate("/admin/dashboard", { replace: true });
  };

  if (recoveryCodes) {
    return (
      <AuthLayout>
        <div className="auth-editorial-card rounded-[28px] p-6 sm:p-8">
          <AuthHeader title="Save your recovery codes" subtitle="These are shown once. Store them in a password manager before continuing." />
          <section className="mt-7 rounded-2xl border border-amber-300/25 bg-amber-400/[0.08] p-4 text-sm leading-6 text-amber-100">
            Each code works once if you lose your authenticator device. Never share these codes with anyone.
          </section>
          <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/[0.08] bg-black/20 p-4 font-mono text-sm tracking-wide text-zinc-100 sm:grid-cols-3">
            {recoveryCodes.map((recoveryCode) => <code key={recoveryCode} className="rounded-lg bg-white/[0.06] px-2 py-2 text-center">{recoveryCode}</code>)}
          </div>
          <button type="button" onClick={finishRecoveryCodes} className="mt-5 w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500">
            I saved my recovery codes
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="auth-editorial-card rounded-[28px] p-6 sm:p-8">
        <AuthHeader title={enrollment?.setupRequired ? "Secure your admin account" : "Enter your security code"} subtitle={enrollment?.setupRequired ? "Use an authenticator app to scan the QR code, then enter its six-digit code." : "Open your authenticator app and enter the current code."} />
        {loading && <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-400"><LoaderCircle size={18} className="animate-spin" /> Preparing secure sign-in…</div>}
        {!loading && error && <p role="alert" className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200">{error}</p>}
        {!loading && enrollment?.setupRequired && (
          <div className="mt-5 space-y-4">
            <div className="mx-auto w-fit rounded-2xl bg-white p-3"><img src={enrollment.qrCodeDataUrl} width="192" height="192" alt="Authenticator app setup QR code" /></div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Can’t scan? Enter this key</p>
              <div className="mt-2 flex gap-2">
                <code className="min-w-0 flex-1 break-all text-sm text-violet-200">{enrollment.manualEntryKey}</code>
                <button type="button" aria-label="Copy authenticator key" onClick={copyManualKey} className="shrink-0 rounded-lg border border-white/10 p-2 text-zinc-300 hover:bg-white/5"><Copy size={16} /></button>
              </div>
              {copied && <p className="mt-2 text-xs text-emerald-300">Key copied.</p>}
            </div>
          </div>
        )}
        {!loading && enrollment && (
          <form onSubmit={submitCode} className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-zinc-200" htmlFor="mfa-code">
              {enrollment.setupRequired ? "Authenticator code" : "Authenticator or recovery code"}
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input id="mfa-code" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="one-time-code" autoFocus inputMode="text" placeholder="123456 or XXXX-XXXX" className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] py-3 pl-10 pr-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400" />
            </div>
            <button type="submit" disabled={submitting || !code.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? <LoaderCircle size={18} className="animate-spin" /> : <ShieldCheck size={18} />} {submitting ? "Verifying…" : "Verify and sign in"}
            </button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}

export default AdminMfaPage;
