import { useEffect, useMemo, useState } from "react";
import { BellRing, CirclePlus, Heart, List, MessageCircle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { getMyListings } from "../../api/marketplace.api";
import { getNotifications } from "../../api/notification.api";

function MarketplaceSidebar() {
  const [listings, setListings] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSidebar = async () => {
      try {
        const [myListings, notifications] = await Promise.all([getMyListings(), getNotifications()]);
        setListings(myListings);
        setActivities(notifications.slice(0, 4));
      } catch {
        setListings([]);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    void loadSidebar();
  }, []);

  const statusCounts = useMemo(() => ({
    ACTIVE: listings.filter(({ status }) => status === "ACTIVE").length,
    RESERVED: listings.filter(({ status }) => status === "RESERVED").length,
    SOLD: listings.filter(({ status }) => status === "SOLD").length,
    EXPIRED: listings.filter(({ status }) => status === "EXPIRED").length,
  }), [listings]);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-white/[0.08] bg-[#101118] p-4">
        <h2 className="text-sm font-semibold text-white">Quick Actions</h2>
        <div className="mt-3 divide-y divide-white/[0.07]">
          <Action icon={CirclePlus} title="Create Listing" text="List your membership" to="/marketplace/sell" />
          <Action icon={List} title="My Listings" text="Manage your listings" to="/marketplace/my-listings" />
          <Action icon={Heart} title="Saved Listings" text="View saved memberships" to="/marketplace/wishlist" />
        </div>
      </section>

      <section className="rounded-xl border border-white/[0.08] bg-[#101118] p-4">
        <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-white">Seller Dashboard</h2><Link to="/marketplace/my-listings" className="text-xs text-violet-400">View all</Link></div>
        <div className="mt-4 rounded-lg bg-gradient-to-r from-violet-600/25 to-[#211142] p-3.5">
          <p className="text-xs text-zinc-400">Total Listings</p><div className="mt-1 flex items-end justify-between"><span className="text-3xl font-semibold">{loading ? "—" : listings.length}</span><Sparkles size={28} className="text-violet-400" /></div>
        </div>
        <div className="mt-4 space-y-3 text-xs">
          <Status label="Active" count={statusCounts.ACTIVE} color="bg-emerald-400" /><Status label="Reserved" count={statusCounts.RESERVED} color="bg-blue-400" /><Status label="Sold" count={statusCounts.SOLD} color="bg-violet-500" /><Status label="Expired" count={statusCounts.EXPIRED} color="bg-orange-400" />
        </div>
      </section>

      <section className="rounded-xl border border-white/[0.08] bg-[#101118] p-4">
        <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-white">Recent Activity</h2><Link to="/notifications" className="text-xs text-violet-400">View all</Link></div>
        <div className="mt-3 space-y-3.5">
          {loading ? <p className="text-xs text-zinc-500">Loading activity…</p> : activities.length ? activities.map((activity) => <Activity key={activity.id} activity={activity} />) : <p className="text-xs text-zinc-500">No recent activity yet.</p>}
        </div>
      </section>
    </div>
  );
}

function Action({ icon: Icon, title, text, to }) { return <Link to={to} className="flex items-center gap-3 py-3 first:pt-1 last:pb-0"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/15 text-violet-400"><Icon size={16} /></span><span><span className="block text-xs font-medium text-white">{title}</span><span className="block text-[10px] text-zinc-500">{text}</span></span></Link>; }
function Status({ label, count, color }) { return <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-zinc-400"><i className={`h-1.5 w-1.5 rounded-full ${color}`} />{label}</span><span className="text-white">{count}</span></div>; }
function Activity({ activity }) { const Icon = activity.isRead ? MessageCircle : BellRing; return <div className="flex gap-2.5"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-300"><Icon size={13} /></span><div className="min-w-0 flex-1"><p className="text-xs font-medium leading-4 text-zinc-200">{activity.title}</p><p className="mt-0.5 text-[10px] leading-4 text-zinc-400">{activity.message}</p><p className="mt-0.5 text-[10px] text-zinc-500">{formatTimeAgo(activity.createdAt)}</p></div></div>; }
function formatTimeAgo(date) { const minutes = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 60_000)); return minutes < 60 ? `${minutes || 1}m ago` : minutes < 1_440 ? `${Math.floor(minutes / 60)}h ago` : `${Math.floor(minutes / 1_440)}d ago`; }

export default MarketplaceSidebar;
