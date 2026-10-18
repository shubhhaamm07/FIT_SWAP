import { useEffect, useState } from "react";
import { CalendarDays, Megaphone, Trophy, Tag, Sparkles } from "lucide-react";
import { getGymPosts } from "../../api/gym.api";
import { isRequestCancelled } from "../../hooks/useVisibilityPolling";
import formatPrice from "../marketplace/utils/formatPrice";

const kindDetails = {
  UPDATE: { label: "Gym update", icon: Megaphone, tone: "text-sky-300 bg-sky-400/10" },
  OFFER: { label: "Special offer", icon: Tag, tone: "text-emerald-300 bg-emerald-400/10" },
  EVENT: { label: "Event", icon: CalendarDays, tone: "text-violet-300 bg-violet-400/10" },
  WINNER: { label: "Winner announcement", icon: Trophy, tone: "text-amber-300 bg-amber-400/10" },
};

const dateLabel = (value) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));

export default function GymUpdatesFeed({ gymId, gymName }) {
  const [posts, setPosts] = useState([]);
  const [access, setAccess] = useState("checking");

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        setAccess("checking");
        const nextPosts = await getGymPosts(gymId, { signal: controller.signal });
        if (!controller.signal.aborted) {
          setPosts(nextPosts);
          setAccess("allowed");
        }
      } catch (requestError) {
        if (!controller.signal.aborted && !isRequestCancelled(requestError)) {
          setAccess("unavailable");
        }
      }
    };
    void load();
    return () => controller.abort();
  }, [gymId]);

  // Hide the entire section until the API confirms a current membership.
  if (access !== "allowed") return null;

  return <section className="mt-6" aria-labelledby="gym-updates-heading">
    <div className="mb-4 flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-300"><Sparkles size={19} /></span><div><h2 id="gym-updates-heading" className="text-xl font-bold text-white">From {gymName}</h2><p className="mt-1 text-sm text-zinc-400">Member-only posters, offers, events, and announcements from your gym.</p></div></div>
    {posts.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 bg-[#11121a] p-6 text-sm text-zinc-400">No current updates from this gym. Check back for offers and events.</div>
      : <div className="grid gap-4 md:grid-cols-2">{posts.map((post) => <GymUpdateCard key={post.id} post={post} />)}</div>}
  </section>;
}

function GymUpdateCard({ post }) {
  const details = kindDetails[post.kind] || kindDetails.UPDATE;
  const Icon = details.icon;
  return <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11121a]">
    {post.posterUrl && <img src={post.posterUrl} alt={`${post.title} poster`} loading="lazy" className="aspect-[16/9] w-full object-cover" />}
    <div className="p-5">
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${details.tone}`}><Icon size={13} /> {details.label}</span>
      <h3 className="mt-3 text-lg font-bold text-white">{post.title}</h3>
      {post.body && <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-zinc-400">{post.body}</p>}
      {post.kind === "WINNER" && post.winnerName && <p className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/5 p-3 text-sm font-semibold text-amber-200">Congratulations, {post.winnerName}!</p>}
      {post.kind === "OFFER" && post.offerPrice && <div className="mt-4 rounded-xl border border-emerald-300/15 bg-emerald-300/5 p-3"><p className="text-xs text-emerald-200/80">Advertised offer price</p><p className="mt-1 text-2xl font-bold text-emerald-200">{formatPrice(post.offerPrice)}</p><p className="mt-1 text-xs text-zinc-400">Check offer terms with the gym. Membership checkout prices are shown separately below.</p></div>}
      <p className="mt-4 text-xs text-zinc-500">Posted {dateLabel(post.createdAt)}{post.endsAt ? ` · Until ${dateLabel(post.endsAt)}` : ""}</p>
    </div>
  </article>;
}
