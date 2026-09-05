import { useState } from "react";
import { BadgeCheck, Building2, Check, Download, LoaderCircle, X } from "lucide-react";
import { downloadGymVerification } from "../../api/gym.api";

const formatDate = (value) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));

export default function GymVerificationQueue({ gyms, updating, onUpdate }) {
  if (!gyms.length) return <section className="rounded-2xl border border-white/10 bg-[#11121a] p-10 text-center">
    <BadgeCheck size={32} className="mx-auto text-emerald-300" />
    <h2 className="mt-4 text-lg font-semibold text-white">No gyms await approval</h2>
    <p className="mt-2 text-sm text-zinc-400">New gym applications and photo submissions will appear here.</p>
  </section>;
  return <div className="space-y-4">{gyms.map((gym) =>
    <Application key={gym.id + gym.updatedAt} gym={gym} busy={updating === gym.id} onUpdate={onUpdate} />
  )}</div>;
}

function Application({ gym, busy, onUpdate }) {
  const [note, setNote] = useState("");
  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const document = gym.verificationDocuments?.[0];
  const ready = document?.status === "SUBMITTED";

  const download = async () => {
    setDownloading(true);
    setError("");
    try { await downloadGymVerification(gym.id, document); setDownloaded(true); }
    catch (requestError) { setError(requestError.response?.data?.message || "Unable to download this PDF."); }
    finally { setDownloading(false); }
  };

  const decide = async (status) => {
    if (status === "REJECTED" && !note.trim()) {
      setError("Add a rejection reason so the owner knows what to change.");
      return;
    }
    setError("");
    await onUpdate(gym.id, status, {
      documentId: document?.id,
      expectedUpdatedAt: gym.updatedAt,
      reviewNote: note.trim(),
    });
  };

  return <article className="rounded-2xl border border-white/10 bg-[#11121a] p-5 sm:p-6">
    <div className="flex items-start gap-3">
      <Building2 size={23} className="mt-1 shrink-0 text-sky-300" />
      <div><h2 className="font-semibold text-white">{gym.name}</h2>
        <p className="mt-1 text-sm text-zinc-400">{[gym.address, gym.city, gym.state, gym.pincode].filter(Boolean).join(", ")}</p>
        <p className="mt-2 text-xs text-zinc-400">Owner: {[gym.owner?.firstName, gym.owner?.lastName].filter(Boolean).join(" ")} · {gym.owner?.email}</p>
        <p className="mt-1 text-xs text-zinc-400">Gym contact: {gym.phone}{gym.email ? ` · ${gym.email}` : ""}</p>
        {gym.description && <p className="mt-3 text-sm text-zinc-300">{gym.description}</p>}
      </div>
    </div>
    {ready ? <div className="mt-5 rounded-xl border border-sky-400/20 bg-sky-500/5 p-4">
      <p className="break-all text-sm font-semibold text-zinc-200">{document.fileName}</p>
      <p className="mt-1 text-xs text-zinc-400">{document.pageCount} pages · {(document.byteSize / 1024 / 1024).toFixed(1)} MB · Submitted {formatDate(document.createdAt)}</p>
      <button type="button" onClick={() => void download()} disabled={downloading || busy} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-sky-400/25 px-3 py-2 text-sm font-semibold text-sky-300 disabled:opacity-50">
        {downloading ? <LoaderCircle size={16} className="animate-spin" /> : <Download size={16} />}
        {downloading ? "Downloading…" : "Download PDF to review"}
      </button>
      <p className="mt-2 text-xs text-zinc-400">Open the downloaded PDF and check the gym photos before recording your decision.</p>
    </div> : <p className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-300">Waiting for the owner to submit a current gym-photo PDF. Approval is unavailable until it arrives.</p>}
    {ready && <div className="mt-4 space-y-3">
      <label className="block text-sm font-medium text-zinc-200">Review note <span className="font-normal text-zinc-400">(required when rejecting)</span>
        <textarea rows={3} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} disabled={busy} placeholder="For example: Add clear photos of the entrance and equipment." className="mt-2 w-full rounded-xl border border-white/10 bg-black/15 p-3 text-sm text-white" />
      </label>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={busy || !downloaded} onClick={() => void decide("APPROVED")} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"><Check size={16} /> {busy ? "Saving…" : "Approve gym"}</button>
        <button type="button" disabled={busy || !downloaded} onClick={() => void decide("REJECTED")} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-300 disabled:opacity-40"><X size={16} /> Reject gym</button>
      </div>
      {!downloaded && <p className="text-xs text-zinc-400">Download the submitted PDF to enable the review actions.</p>}
    </div>}
  </article>;
}
