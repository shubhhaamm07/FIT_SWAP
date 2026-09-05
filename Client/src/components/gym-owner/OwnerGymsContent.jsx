import { useState } from "react";
import { Building2, Download, FileText, LoaderCircle, Pencil, Plus, Upload } from "lucide-react";
import { downloadGymVerification, submitGymVerification } from "../../api/gym.api";

const formatDate = (value) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
const tones = {
  APPROVED: "bg-emerald-500/10 text-emerald-300",
  REJECTED: "bg-red-500/10 text-red-300",
  PENDING: "bg-amber-500/10 text-amber-300",
  SUBMITTED: "bg-sky-500/10 text-sky-300",
  SUPERSEDED: "bg-zinc-500/10 text-zinc-400",
};

export default function OwnerGymsContent({ gyms, onEdit, onAdd, onReload }) {
  return <section className="space-y-5" aria-label="My gyms">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-zinc-400">{gyms.length} gym{gyms.length === 1 ? "" : "s"} · Each location has its own approval.</p>
      <button type="button" onClick={onAdd} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"><Plus size={17} /> Add gym</button>
    </div>
    {!gyms.length ? <div className="rounded-2xl border border-dashed border-white/10 bg-[#11121a] p-10 text-center">
      <Building2 className="mx-auto text-violet-300" size={32} />
      <h2 className="mt-4 text-lg font-semibold text-white">Add your first gym</h2>
      <p className="mt-2 text-sm text-zinc-400">Create its profile, then upload a PDF of gym photos for admin approval.</p>
    </div> : <div className="grid items-start gap-5 xl:grid-cols-2">{gyms.map((gym) =>
      <article key={gym.id} className="rounded-2xl border border-white/10 bg-[#11121a] p-5">
        <div className="flex items-start gap-3">
          <Building2 size={23} className="mt-1 shrink-0 text-violet-300" />
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold text-white">{gym.name}</h2><Status value={gym.status} /></div>
            <p className="mt-1 text-sm text-zinc-400">{[gym.address, gym.city, gym.state].filter(Boolean).join(", ")}</p>
            <p className="mt-3 text-sm text-zinc-400">{gym.description || "No description added yet."}</p>
          </div>
        </div>
        <div className="my-4 flex items-center justify-between gap-3 border-y border-white/10 py-3">
          <span className="text-xs text-zinc-400">{gym.plans?.length || 0} membership plans</span>
          <button type="button" onClick={() => onEdit(gym)} className="inline-flex items-center gap-2 rounded-lg border border-violet-400/25 px-3 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-500/10"><Pencil size={14} /> Edit profile</button>
        </div>
        <GymVerificationPanel gym={gym} onReload={onReload} />
      </article>
    )}</div>}
  </section>;
}

function Status({ value }) {
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${tones[value] || tones.PENDING}`}>{value === "SUBMITTED" ? "AWAITING REVIEW" : value}</span>;
}

function GymVerificationPanel({ gym, onReload }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [downloadId, setDownloadId] = useState("");
  const [error, setError] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const documents = gym.verificationDocuments || [];
  const latest = documents[0];

  const chooseFile = (event) => {
    const selected = event.target.files?.[0];
    setError("");
    if (!selected) { setFile(null); return; }
    if (!/\.pdf$/i.test(selected.name) || selected.size > 10 * 1024 * 1024 || selected.size === 0) {
      setFile(null);
      setError("Choose a PDF file between 1 byte and 10 MB.");
      event.target.value = "";
      return;
    }
    setFile(selected);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!file || busy) return;
    setBusy(true);
    setError("");
    try {
      await submitGymVerification(gym.id, file);
      setFile(null);
      await onReload();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to submit the PDF. Please try again.");
    } finally { setBusy(false); }
  };

  const download = async (document) => {
    setDownloadId(document.id);
    setError("");
    try { await downloadGymVerification(gym.id, document); }
    catch (requestError) { setError(requestError.response?.data?.message || "Unable to download the PDF."); }
    finally { setDownloadId(""); }
  };

  return <div className="space-y-4">
    <div><h3 className="flex items-center gap-2 font-semibold text-white"><FileText size={17} /> Gym photo verification</h3>
      <p className="mt-1 text-xs leading-5 text-zinc-400">Combine clear photos of the entrance, gym name board, equipment and workout areas into one PDF. Up to 10 MB and 25 pages.</p>
    </div>
    {latest ? <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="break-all text-sm font-medium text-zinc-200">{latest.fileName}</p><Status value={latest.status} /></div>
      <p className="mt-2 text-xs text-zinc-400">{latest.pageCount} pages · {(latest.byteSize / 1024 / 1024).toFixed(1)} MB · Submitted {formatDate(latest.createdAt)}</p>
      {latest.reviewNote && <p className="mt-3 text-sm text-zinc-300"><strong>Admin feedback:</strong> {latest.reviewNote}</p>}
      {latest.reviewedAt && <p className="mt-1 text-xs text-zinc-400">Reviewed {formatDate(latest.reviewedAt)}</p>}
      <button type="button" disabled={Boolean(downloadId)} onClick={() => void download(latest)} className="mt-3 inline-flex items-center gap-2 rounded-lg px-1 py-2 text-xs font-semibold text-sky-300 disabled:opacity-50"><Download size={14} /> {downloadId === latest.id ? "Downloading…" : "Download submitted PDF"}</button>
    </div> : <p className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-300">No PDF submitted yet. Upload your gym photos so an admin can review this gym.</p>}
    {gym.status === "PENDING" && latest?.status === "APPROVED" && <p className="text-sm text-amber-300">Your gym details changed after approval. Submit an updated photo PDF for a fresh review.</p>}
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm font-medium text-zinc-200">
        {latest ? "Submit an updated photo PDF" : "Select gym photo PDF"}
        <input type="file" accept=".pdf,application/pdf" onChange={chooseFile} disabled={busy} className="mt-2 block w-full rounded-lg border border-white/10 p-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600 file:px-3 file:py-2 file:text-white" />
      </label>
      {gym.status === "APPROVED" && <label className="flex items-start gap-2 text-xs leading-5 text-amber-300">
        <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} required className="mt-1" />
        Submitting a new PDF pauses this gym's listing and cancels future trials until admin approval.
      </label>}
      {latest?.status === "SUBMITTED" && <p className="text-xs text-zinc-400">A new upload replaces the document waiting for review. Earlier PDFs stay in your submission history.</p>}
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <button type="submit" disabled={!file || busy || (gym.status === "APPROVED" && !acknowledged)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50">
        {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}{busy ? "Submitting…" : "Send PDF for approval"}
      </button>
    </form>
    {documents.length > 1 && <details className="border-t border-white/10 pt-3">
      <summary className="cursor-pointer text-sm font-medium text-zinc-300">Earlier submissions ({documents.length - 1})</summary>
      <ul className="mt-3 space-y-3">{documents.slice(1).map((document) => <li key={document.id} className="rounded-lg bg-white/[0.03] p-3 text-xs text-zinc-400">
        <div className="flex items-center justify-between gap-2"><span>{formatDate(document.createdAt)}</span><Status value={document.status} /></div>
        {document.reviewNote && <p className="mt-2">{document.reviewNote}</p>}
        <button type="button" disabled={Boolean(downloadId)} onClick={() => void download(document)} className="mt-2 break-all py-2 text-left text-sky-300"><Download size={13} className="mr-1 inline" /> {document.fileName}</button>
      </li>)}</ul>
    </details>}
  </div>;
}
