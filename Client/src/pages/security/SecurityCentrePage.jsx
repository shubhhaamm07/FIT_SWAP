import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, KeyRound, Laptop, LoaderCircle, LogOut, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getSecurityOverview, revokeOtherSecuritySessions, revokeSecuritySession } from "../../api/security.api";
import { useToast } from "../../hooks/useToast";

const displayDateTime = (value) => value ? new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Not available";
const methodLabel = (value) => value === "GOOGLE" ? "Google" : "Password";

function SecurityCentrePage() {
  const { showToast } = useToast();
  const [security, setSecurity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      setSecurity(await getSecurityOverview());
    } catch (error) {
      showToast(error.response?.data?.message || "Unable to load account-security data.", "error");
    } finally { if (!quiet) setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const signOutDevice = async (sessionId) => {
    try {
      setBusy(sessionId);
      await revokeSecuritySession(sessionId);
      showToast("Device signed out successfully.");
      await load(true);
    } catch (error) {
      showToast(error.response?.data?.message || "Unable to sign out this device.", "error");
    } finally { setBusy(""); }
  };

  const signOutOthers = async () => {
    try {
      setBusy("others");
      const result = await revokeOtherSecuritySessions();
      showToast(result.message || "Other devices signed out.");
      await load(true);
    } catch (error) {
      showToast(error.response?.data?.message || "Unable to sign out other devices.", "error");
    } finally { setBusy(""); }
  };

  if (loading) return <DashboardLayout><div className="flex min-h-80 items-center justify-center gap-2 text-sm text-zinc-400"><LoaderCircle size={18} className="animate-spin" /> Loading Security Centre…</div></DashboardLayout>;
  const alerts = (security?.loginHistory || []).filter((entry) => entry.status === "FAILURE" || entry.riskLevel === "NEW_DEVICE" || entry.riskLevel === "SUSPICIOUS");
  const otherDeviceCount = (security?.sessions || []).filter((session) => !session.isCurrent).length;

  return <DashboardLayout><main className="mx-auto max-w-5xl pb-10"><header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">Account protection</p><h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Security Centre</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">See where your account is signed in, review login activity, and immediately remove access from a device you do not recognise.</p></div><button type="button" onClick={() => load()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-zinc-100 transition hover:bg-white/[0.08]"><RefreshCw size={16} /> Refresh</button></header>

    <section className="mt-7 grid gap-4 md:grid-cols-3"><SummaryCard icon={Laptop} label="Active devices" value={security?.sessions?.length || 0} detail="Sessions active in the last 24 hours" tone="violet" /><SummaryCard icon={KeyRound} label="Password" value={security?.passwordChangedAt ? "Updated" : "Not changed"} detail={security?.passwordChangedAt ? displayDateTime(security.passwordChangedAt) : "Change it any time in Settings"} tone="emerald" /><SummaryCard icon={AlertTriangle} label="Security alerts" value={alerts.length} detail={alerts.length ? "Review unfamiliar activity below" : "No recent risk signals"} tone={alerts.length ? "amber" : "emerald"} /></section>

    {alerts.length > 0 && <section className="mt-6 rounded-2xl border border-amber-400/25 bg-amber-500/[0.07] p-5"><div className="flex gap-3"><AlertTriangle className="mt-0.5 shrink-0 text-amber-300" size={19} /><div><h2 className="font-bold text-amber-100">Review account activity</h2><p className="mt-1 text-sm leading-5 text-amber-100/75">New-device and unsuccessful sign-ins are shown below. If you do not recognise one, sign out other devices and change your password in Settings.</p></div></div></section>}

    <section className="mt-6 rounded-3xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-lg font-bold text-white">Active sessions</h2><p className="mt-1 text-sm text-zinc-500">A session expires after 24 hours, or when you sign it out.</p></div><button type="button" disabled={!otherDeviceCount || busy === "others"} onClick={signOutOthers} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/25 bg-red-500/[0.07] px-3.5 py-2.5 text-sm font-bold text-red-200 transition hover:bg-red-500/[0.14] disabled:cursor-not-allowed disabled:opacity-45">{busy === "others" ? <LoaderCircle size={15} className="animate-spin" /> : <LogOut size={15} />} Sign out other devices</button></div><div className="mt-5 space-y-3">{security?.sessions?.length ? security.sessions.map((session) => <SessionRow key={session.id} session={session} busy={busy === session.id} onRevoke={() => signOutDevice(session.id)} />) : <EmptyState text="No live sessions are recorded for this account." />}</div></section>

    <section className="mt-6 grid gap-6 lg:grid-cols-2"><article className="rounded-3xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6"><div className="flex items-center gap-2"><Clock3 size={18} className="text-violet-300" /><div><h2 className="font-bold text-white">Recent login history</h2><p className="mt-1 text-sm text-zinc-500">The latest successful and failed attempts.</p></div></div><div className="mt-5 space-y-3">{security?.loginHistory?.length ? security.loginHistory.map((entry) => <LoginRow key={entry.id} entry={entry} />) : <EmptyState text="Login history will appear after your next sign-in." />}</div></article><article className="rounded-3xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6"><div className="flex items-center gap-2"><KeyRound size={18} className="text-emerald-300" /><div><h2 className="font-bold text-white">Password-change history</h2><p className="mt-1 text-sm text-zinc-500">A compact record of password updates.</p></div></div><div className="mt-5 space-y-3">{security?.passwordChanges?.length ? security.passwordChanges.map((entry) => <div key={entry.id} className="rounded-2xl border border-white/[0.07] bg-black/15 p-3.5"><p className="font-semibold text-white">{entry.source === "PASSWORD_RESET" ? "Reset through recovery link" : "Changed from account settings"}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{displayDateTime(entry.changedAt)} · {entry.deviceName || "Unknown device"}</p></div>) : <EmptyState text="No password changes have been recorded yet." />}</div></article></section>
  </main></DashboardLayout>;
}

function SummaryCard({ icon: Icon, label, value, detail, tone }) { const tones = { violet: "bg-violet-500/10 text-violet-300", emerald: "bg-emerald-500/10 text-emerald-300", amber: "bg-amber-500/10 text-amber-300" }; return <article className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5"><span className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}><Icon size={19} /></span><p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">{label}</p><p className="mt-1 text-2xl font-black tracking-tight text-white">{value}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{detail}</p></article>; }
function SessionRow({ session, busy, onRevoke }) { const isMobile = /iPhone|Android|iPad/i.test(session.deviceName || ""); return <div className={`flex gap-3 rounded-2xl border p-4 ${session.isCurrent ? "border-violet-400/25 bg-violet-500/[0.06]" : "border-white/[0.07] bg-black/15"}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-zinc-300">{isMobile ? <Smartphone size={19} /> : <Laptop size={19} />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-white">{session.deviceName}</p>{session.isCurrent && <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-200">This device</span>}</div><p className="mt-1 text-xs leading-5 text-zinc-500">{methodLabel(session.authMethod)} · Last active {displayDateTime(session.lastSeenAt)}{session.ipAddress ? ` · ${session.ipAddress}` : ""}</p></div>{!session.isCurrent && <button type="button" disabled={busy} onClick={onRevoke} className="self-center rounded-xl px-3 py-2 text-xs font-bold text-red-200 transition hover:bg-red-500/10 disabled:opacity-50">{busy ? <LoaderCircle size={15} className="animate-spin" /> : "Sign out"}</button>}</div>; }
function LoginRow({ entry }) { const alert = entry.status === "FAILURE" || entry.riskLevel !== "NONE"; return <div className={`rounded-2xl border p-3.5 ${alert ? "border-amber-400/20 bg-amber-500/[0.05]" : "border-white/[0.07] bg-black/15"}`}><div className="flex gap-2"><span className={alert ? "text-amber-300" : "text-emerald-300"}>{alert ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}</span><div className="min-w-0"><p className="font-semibold text-white">{entry.detail || (entry.status === "SUCCESS" ? "Signed in" : "Unsuccessful sign-in")}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{entry.deviceName || "Unknown device"} · {methodLabel(entry.authMethod)} · {displayDateTime(entry.createdAt)}{entry.ipAddress ? ` · ${entry.ipAddress}` : ""}</p></div></div></div>; }
function EmptyState({ text }) { return <p className="rounded-2xl border border-dashed border-white/[0.12] bg-black/10 px-4 py-8 text-center text-sm leading-5 text-zinc-500">{text}</p>; }

export default SecurityCentrePage;
