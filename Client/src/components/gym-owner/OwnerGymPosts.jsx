import { useState } from "react";
import { ImagePlus, LoaderCircle, Megaphone, Pencil, Plus, Trash2, X } from "lucide-react";
import { deleteGymPost, getMyGymPosts, saveGymPost } from "../../api/gym.api";

const emptyDraft = () => ({
  kind: "UPDATE",
  title: "",
  body: "",
  offerPrice: "",
  winnerName: "",
  startsAt: "",
  endsAt: "",
  isPublished: true,
  removePoster: false,
});

const localDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const dateLabel = (value) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));

export default function OwnerGymPosts({ gym }) {
  const [open, setOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [poster, setPoster] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [winnerConsent, setWinnerConsent] = useState(false);

  const loadPosts = async () => {
    setLoading(true);
    try {
      setPosts(await getMyGymPosts(gym.id));
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load gym updates.");
    } finally {
      setLoading(false);
    }
  };

  const startNew = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setPoster(null);
    setWinnerConsent(false);
    setError("");
    setNotice("");
    setShowForm(true);
  };

  const startEdit = (post) => {
    setEditingId(post.id);
    setDraft({
      kind: post.kind,
      title: post.title,
      body: post.body || "",
      offerPrice: post.offerPrice || "",
      winnerName: post.winnerName || "",
      startsAt: localDateTime(post.startsAt),
      endsAt: localDateTime(post.endsAt),
      isPublished: post.isPublished,
      removePoster: false,
    });
    setPoster(null);
    setWinnerConsent(false);
    setError("");
    setNotice("");
    setShowForm(true);
  };

  const choosePoster = (event) => {
    const file = event.target.files?.[0] || null;
    if (file && (file.size === 0 || file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
      setError("Choose a JPEG, PNG, or WebP poster under 5 MB.");
      event.target.value = "";
      setPoster(null);
      return;
    }
    setError("");
    setPoster(file);
    if (file) setDraft((current) => ({ ...current, removePoster: false }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    if (draft.kind === "WINNER" && draft.isPublished && !winnerConsent) {
      setError("Confirm that the winner agreed to their name being displayed.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await saveGymPost(gym.id, {
        ...draft,
        winnerConsent,
        startsAt: draft.startsAt ? new Date(draft.startsAt).toISOString() : "",
        endsAt: draft.endsAt ? new Date(draft.endsAt).toISOString() : "",
      }, poster, editingId);
      setShowForm(false);
      setEditingId(null);
      setPoster(null);
      setNotice(editingId ? "Gym update saved." : "Gym update created.");
      await loadPosts();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save this update.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (post) => {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await deleteGymPost(gym.id, post.id);
      setNotice("Gym update deleted.");
      if (editingId === post.id) setShowForm(false);
      await loadPosts();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete this update.");
    } finally {
      setBusy(false);
    }
  };

  const field = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const editingPost = posts.find((post) => post.id === editingId);

  return <div className="mt-5 border-t border-white/10 pt-5">
    <button type="button" aria-expanded={open} onClick={() => { if (!open) void loadPosts(); setOpen(!open); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-violet-400/25 px-4 py-2 text-sm font-semibold text-violet-200 hover:bg-violet-500/10"><Megaphone size={17} /> {open ? "Hide gym updates" : "Manage posters & updates"}</button>
    {open && <div className="mt-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-white">Posters & updates</h3><p className="mt-1 text-xs leading-5 text-zinc-400">Share offers, events, news, or a winner announcement for this gym. Published posts appear only while this gym is approved.</p></div><button type="button" onClick={startNew} disabled={busy || posts.length >= 40} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50"><Plus size={14} /> New update</button></div>
      {gym.status !== "APPROVED" && <p className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-200">Your posts will become visible after this gym is approved.</p>}
      {notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      {loading ? <p className="flex items-center gap-2 text-sm text-zinc-400"><LoaderCircle size={16} className="animate-spin" /> Loading…</p> : posts.length ? <div className="space-y-2">{posts.map((post) => <div key={post.id} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        {post.posterUrl && <img src={post.posterUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />}
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{post.title}</p><p className="mt-1 text-xs text-zinc-400">{post.kind.toLowerCase()} · {post.isPublished ? "Published" : "Draft"}{post.endsAt ? ` · ends ${dateLabel(post.endsAt)}` : ""}</p></div>
        <button type="button" onClick={() => startEdit(post)} disabled={busy} aria-label={`Edit ${post.title}`} className="rounded-lg p-2 text-zinc-300 hover:bg-white/10 disabled:opacity-50"><Pencil size={15} /></button>
        <button type="button" onClick={() => void remove(post)} disabled={busy} aria-label={`Delete ${post.title}`} className="rounded-lg p-2 text-red-300 hover:bg-red-400/10 disabled:opacity-50"><Trash2 size={15} /></button>
      </div>)}</div> : !showForm && <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-zinc-400">No updates yet. Add a poster or announcement to bring this gym page to life.</p>}
      {showForm && <form onSubmit={submit} className="space-y-3 rounded-xl border border-violet-400/20 bg-violet-500/[0.04] p-4">
        <div className="flex items-center justify-between gap-3"><h4 className="font-semibold text-white">{editingId ? "Edit update" : "New update"}</h4><button type="button" onClick={() => setShowForm(false)} aria-label="Close update editor" className="p-1 text-zinc-400 hover:text-white"><X size={17} /></button></div>
        <label className="block text-xs font-medium text-zinc-300">Type<select value={draft.kind} onChange={(event) => field("kind", event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-[#171820] p-2.5 text-sm text-white"><option value="UPDATE">Gym news</option><option value="OFFER">Offer with price</option><option value="EVENT">Event</option><option value="WINNER">Winner announcement</option></select></label>
        <label className="block text-xs font-medium text-zinc-300">Title<input required minLength={3} maxLength={100} value={draft.title} onChange={(event) => field("title", event.target.value)} placeholder="E.g. October fitness challenge" className="mt-1 w-full rounded-lg border border-white/10 bg-[#171820] p-2.5 text-sm text-white" /></label>
        <label className="block text-xs font-medium text-zinc-300">Details {draft.kind === "OFFER" ? "(required, include terms)" : "(optional)"}<textarea required={draft.kind === "OFFER"} minLength={draft.kind === "OFFER" ? 10 : undefined} maxLength={1000} rows={3} value={draft.body} onChange={(event) => field("body", event.target.value)} placeholder="Explain the offer, event, or update clearly." className="mt-1 w-full rounded-lg border border-white/10 bg-[#171820] p-2.5 text-sm text-white" /></label>
        {draft.kind === "OFFER" && <label className="block text-xs font-medium text-zinc-300">Advertised price (₹)<input required type="number" min="0.01" max="99999999" step="0.01" value={draft.offerPrice} onChange={(event) => field("offerPrice", event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-[#171820] p-2.5 text-sm text-white" /><span className="mt-1 block font-normal text-zinc-500">This is an announcement, not the checkout price. Add terms in Details.</span></label>}
        {draft.kind === "WINNER" && <><label className="block text-xs font-medium text-zinc-300">Winner display name<input required maxLength={80} value={draft.winnerName} onChange={(event) => field("winnerName", event.target.value)} placeholder="Use only the name they agreed to share" className="mt-1 w-full rounded-lg border border-white/10 bg-[#171820] p-2.5 text-sm text-white" /></label><label className="flex items-start gap-2 text-xs leading-5 text-zinc-300"><input type="checkbox" checked={winnerConsent} onChange={(event) => setWinnerConsent(event.target.checked)} className="mt-1" /> The winner agreed to this name appearing publicly.</label></>}
        <div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs font-medium text-zinc-300">Show from (optional)<input type="datetime-local" value={draft.startsAt} onChange={(event) => field("startsAt", event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-[#171820] p-2.5 text-sm text-white" /></label><label className="block text-xs font-medium text-zinc-300">Show until {draft.kind === "OFFER" ? "(required)" : "(optional)"}<input type="datetime-local" required={draft.kind === "OFFER"} value={draft.endsAt} onChange={(event) => field("endsAt", event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-[#171820] p-2.5 text-sm text-white" /></label></div>
        <label className="block text-xs font-medium text-zinc-300"><span className="flex items-center gap-1.5"><ImagePlus size={15} /> Poster image (optional)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePoster} className="mt-2 block w-full rounded-lg border border-white/10 p-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600 file:px-3 file:py-2 file:text-white" /><span className="mt-1 block font-normal text-zinc-500">JPEG, PNG, or WebP; up to 5 MB. We resize it automatically.</span></label>
        {editingPost?.posterUrl && !poster && <div className="flex items-center gap-3"><img src={editingPost.posterUrl} alt="Current poster" className="h-16 w-24 rounded-lg object-cover" /><label className="flex items-center gap-2 text-xs text-zinc-300"><input type="checkbox" checked={draft.removePoster} onChange={(event) => field("removePoster", event.target.checked)} /> Remove current poster</label></div>}
        <label className="flex items-center gap-2 text-sm text-zinc-200"><input type="checkbox" checked={draft.isPublished} onChange={(event) => field("isPublished", event.target.checked)} /> Publish when the date window starts</label>
        <button type="submit" disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50">{busy && <LoaderCircle size={15} className="animate-spin" />}{editingId ? "Save changes" : "Create update"}</button>
      </form>}
    </div>}
  </div>;
}
