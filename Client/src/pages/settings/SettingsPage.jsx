import { useEffect, useState } from "react";
import { BadgeCheck, BellRing, ChevronRight, CircleAlert, KeyRound, LoaderCircle, Mail, Send, ShieldCheck, Trash2, UserRound, WalletCards, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { changeUserPassword, deleteCurrentUser, getCurrentUser, resendVerificationEmail, updateUserSettings } from "../../api/auth.api";
import { useAuth } from "../../hooks/useAuth";

function SettingsPage() {
  const navigate = useNavigate();
  const { user: sessionUser, updateUser, logout } = useAuth();
  const [profile, setProfile] = useState(sessionUser || {});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [upiForm, setUpiForm] = useState({ upiId: "", upiPayeeName: "" });

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        const response = await getCurrentUser();
        setProfile(response.user);
        setUpiForm({ upiId: response.user?.upiId || "", upiPayeeName: response.user?.upiPayeeName || "" });
      } catch (error) {
        setMessage(error.response?.data?.message || "Unable to load settings.");
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const updatePreference = async (key, value) => {
    try {
      setSaving(key);
      const response = await updateUserSettings({ [key]: value });
      setProfile(response.user);
      updateUser(response.user);
      setMessage("Preference saved.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to save this preference.");
    } finally {
      setSaving("");
    }
  };

  const sendVerification = async () => {
    try {
      setSaving("verification");
      const response = await resendVerificationEmail();
      setMessage(response.message || "Verification email sent.");
    } catch (error) {
      setMessage(`Unable to send verification email. ${error.response?.data?.message || "Please try again."}`);
    } finally {
      setSaving("");
    }
  };

  const saveUpiDetails = async (event) => {
    event.preventDefault();
    try {
      setSaving("upi");
      const response = await updateUserSettings(upiForm);
      setProfile(response.user);
      updateUser(response.user);
      setMessage(upiForm.upiId ? "UPI payment details saved. Buyers will see a transaction-specific QR only when they start a payment." : "UPI payment details removed.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to save UPI payment details.");
    } finally {
      setSaving("");
    }
  };

  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "FitSwap Member";
  const initials = [profile.firstName, profile.lastName].filter(Boolean).map((name) => name[0]).join("").slice(0, 2).toUpperCase() || "FS";

  return <DashboardLayout>
    <main className="mx-auto w-full max-w-4xl pb-8">
      <section className="rounded-[28px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,.2),transparent_34%),#11121a] p-6 sm:p-8"><p className="text-sm font-semibold text-violet-300">Account centre</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Your space, your rules.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">Control your FitSwap account, security, and the updates you want to receive.</p></section>

      {message && <div className={`mt-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${/unable|incorrect|required|least|delete|enter a valid|shown to payers|upi id|payee name|both a upi/i.test(message) ? "border-red-500/20 bg-red-500/5 text-red-300" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"}`}><CircleAlert size={16} />{message}</div>}

      {loading ? <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-zinc-400"><LoaderCircle size={18} className="animate-spin" /> Loading settings…</div> : <div className="mt-6 space-y-6">
        <SettingsSection title="Account" description="Your public FitSwap identity.">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 font-bold text-white">{initials}</div><div><p className="font-semibold text-white">{displayName}</p><p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500"><Mail size={14} /> {profile.email}</p></div></div><button type="button" onClick={() => navigate("/profile")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"><UserRound size={16} /> Edit profile <ChevronRight size={15} /></button></div>
        </SettingsSection>

        <SettingsSection title="Email verification" description="A verified email keeps password recovery and important account updates secure.">
          <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-black/10 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${profile.emailVerifiedAt ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}><BadgeCheck size={19} /></div><div><p className="font-medium text-white">{profile.emailVerifiedAt ? "Email verified" : "Email verification needed"}</p><p className="mt-1 text-sm leading-5 text-zinc-500">{profile.emailVerifiedAt ? "Your email is confirmed and ready for account recovery." : `Verify ${profile.email || "your email"} to protect your account.`}</p></div></div>{!profile.emailVerifiedAt && <button type="button" disabled={saving === "verification"} onClick={sendVerification} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/20 disabled:opacity-60"><Send size={16} /> {saving === "verification" ? "Sending…" : "Send verification"}</button>}</div>
        </SettingsSection>

        <SettingsSection title="Notifications" description="Choose the updates that matter to you.">
          <ToggleRow icon={BellRing} title="Marketplace activity" description="Transfer requests, listing updates, and saved-listing activity." checked={Boolean(profile.marketplaceNotifications)} busy={saving === "marketplaceNotifications"} onChange={(checked) => updatePreference("marketplaceNotifications", checked)} />
          <ToggleRow icon={Mail} title="Email updates" description="Important account information and FitSwap updates by email." checked={Boolean(profile.emailNotifications)} busy={saving === "emailNotifications"} onChange={(checked) => updatePreference("emailNotifications", checked)} />
        </SettingsSection>

        <SettingsSection title="UPI payment details" description="Used only for FitSwap’s manual UPI workflow when you sell a listing or manage a gym.">
          <form onSubmit={saveUpiDetails} className="space-y-4">
            <div className="flex gap-3 rounded-2xl border border-amber-400/15 bg-amber-500/[0.06] p-4 text-sm leading-5 text-amber-100/80"><WalletCards size={18} className="mt-0.5 shrink-0 text-amber-300" /><p>FitSwap creates a transaction-specific QR from these details. Buyers still pay you directly, and you must check your own UPI or bank app before confirming payment. Do not add another person’s UPI ID.</p></div>
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-xs font-medium text-zinc-400">UPI ID<input value={upiForm.upiId} onChange={(event) => setUpiForm((current) => ({ ...current, upiId: event.target.value }))} placeholder="yourname@okaxis" className="mt-2 w-full rounded-xl border border-white/[0.1] bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/60" /></label><label className="block text-xs font-medium text-zinc-400">Payee name<input value={upiForm.upiPayeeName} onChange={(event) => setUpiForm((current) => ({ ...current, upiPayeeName: event.target.value }))} placeholder="Name shown in your UPI app" className="mt-2 w-full rounded-xl border border-white/[0.1] bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/60" /></label></div>
            <div className="flex flex-wrap gap-3"><button disabled={saving === "upi"} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60">{saving === "upi" ? "Saving…" : "Save UPI details"}</button>{(upiForm.upiId || upiForm.upiPayeeName) && <button type="button" disabled={saving === "upi"} onClick={() => setUpiForm({ upiId: "", upiPayeeName: "" })} className="rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.05]">Clear fields</button>}</div>
          </form>
        </SettingsSection>

        <SettingsSection title="Security" description="Keep your account protected.">
          <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-black/10 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-300"><ShieldCheck size={19} /></div><div><p className="font-medium text-white">Password & sign-in</p><p className="mt-1 text-sm leading-5 text-zinc-500">Use a unique password with at least 8 characters.</p></div></div><button type="button" onClick={() => setShowPassword(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"><KeyRound size={16} /> Change password</button></div>
        </SettingsSection>

        <section className="overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/[0.035]"><div className="border-b border-red-500/15 px-5 py-4 sm:px-6"><h2 className="font-semibold text-red-200">Danger zone</h2><p className="mt-1 text-sm text-red-200/60">These actions cannot be undone.</p></div><div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="font-medium text-white">Delete FitSwap account</p><p className="mt-1 max-w-xl text-sm leading-5 text-zinc-500">Removes your profile, memberships, listings, saved listings, and notifications. Gym owners must transfer or close their gyms first.</p></div><button type="button" onClick={() => setShowDelete(true)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"><Trash2 size={16} /> Delete account</button></div></section>
      </div>}
    </main>
    {showPassword && <PasswordModal onClose={() => setShowPassword(false)} onSuccess={(text) => { setShowPassword(false); setMessage(text); }} />}
    {showDelete && <DeleteModal onClose={() => setShowDelete(false)} onDeleted={() => { logout(); navigate("/login", { replace: true }); }} />}
  </DashboardLayout>;
}

function SettingsSection({ title, description, children }) { return <section className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6"><h2 className="font-semibold text-white">{title}</h2><p className="mt-1 text-sm text-zinc-500">{description}</p><div className="mt-5">{children}</div></section>; }
function ToggleRow({ icon: Icon, title, description, checked, busy, onChange }) { return <div className="flex items-center gap-3 border-b border-white/[0.07] py-4 first:pt-0 last:border-0 last:pb-0"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-300"><Icon size={18} /></div><div className="min-w-0 flex-1"><p className="font-medium text-white">{title}</p><p className="mt-1 text-sm leading-5 text-zinc-500">{description}</p></div><button type="button" role="switch" aria-checked={checked} disabled={busy} onClick={() => onChange(!checked)} className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-violet-600" : "bg-zinc-700"} disabled:opacity-60`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`} /></button></div>; }

function PasswordModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event) => { event.preventDefault(); if (form.newPassword !== form.confirmPassword) { setError("New passwords do not match"); return; } try { setSaving(true); await changeUserPassword(form); onSuccess("Password updated successfully."); } catch (requestError) { setError(requestError.response?.data?.message || "Unable to change password."); } finally { setSaving(false); } };
  return <Modal title="Change password" onClose={onClose}><form onSubmit={submit} className="space-y-4"><p className="text-sm leading-6 text-zinc-400">Enter your current password, then choose a new password with at least 8 characters.</p><PasswordField label="Current password" value={form.currentPassword} onChange={(value) => setForm({ ...form, currentPassword: value })} /><PasswordField label="New password" value={form.newPassword} onChange={(value) => setForm({ ...form, newPassword: value })} /><PasswordField label="Confirm new password" value={form.confirmPassword} onChange={(value) => setForm({ ...form, confirmPassword: value })} />{error && <p className="text-sm text-red-300">{error}</p>}<button disabled={saving} className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60">{saving ? "Updating…" : "Update password"}</button></form></Modal>;
}

function DeleteModal({ onClose, onDeleted }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event) => { event.preventDefault(); try { setDeleting(true); await deleteCurrentUser({ password, confirmation }); onDeleted(); } catch (requestError) { setError(requestError.response?.data?.message || "Unable to delete account."); } finally { setDeleting(false); } };
  return <Modal title="Delete your account" danger onClose={onClose}><form onSubmit={submit} className="space-y-4"><p className="text-sm leading-6 text-zinc-400">This permanently removes your FitSwap account and its associated member data. This cannot be undone.</p><PasswordField label="Current password" value={password} onChange={setPassword} /><label className="block text-xs font-medium text-zinc-400">Type <span className="font-bold text-red-300">DELETE</span> to confirm<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full rounded-xl border border-white/[0.1] bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-red-400/60" /></label>{error && <p className="text-sm text-red-300">{error}</p>}<button disabled={deleting} className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60">{deleting ? "Deleting account…" : "Permanently delete account"}</button></form></Modal>;
}

function Modal({ title, danger, onClose, children }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"><section className="w-full max-w-md rounded-3xl border border-white/[0.1] bg-[#15161f] p-6 shadow-2xl shadow-black/60"><div className="flex items-start justify-between"><div><p className={`text-sm font-medium ${danger ? "text-red-300" : "text-violet-300"}`}>Account security</p><h2 className="mt-1 text-xl font-bold text-white">{title}</h2></div><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-zinc-400 hover:bg-white/[0.06] hover:text-white"><X size={18} /></button></div><div className="mt-6">{children}</div></section></div>; }
function PasswordField({ label, value, onChange }) { return <label className="block text-xs font-medium text-zinc-400">{label}<input required type="password" value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-white/[0.1] bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/60" /></label>; }

export default SettingsPage;
