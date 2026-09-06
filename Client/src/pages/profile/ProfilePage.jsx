import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  CircleAlert,
  CircleUserRound,
  Edit3,
  Heart,
  ImagePlus,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  Store,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getCurrentUser,
  getProfileImage,
  updateCurrentUser,
  uploadProfileImage,
} from "../../api/auth.api";
import { getMyMemberships } from "../../api/membership.api";
import { getMyListings } from "../../api/marketplace.api";
import { useAuth } from "../../hooks/useAuth";
import formatPrice from "../../components/marketplace/utils/formatPrice";

const fallbackImage =
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900";

function ProfilePage() {
  const navigate = useNavigate();
  const { user: sessionUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [listings, setListings] = useState([]);
  const [activeTab, setActiveTab] = useState("memberships");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [profileImages, setProfileImages] = useState({ avatar: "", cover: "" });
  const [imageVersion, setImageVersion] = useState(0);
  const [message, setMessage] = useState("");
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const [profileResponse, membershipResponse, listingData] =
        await Promise.all([
          getCurrentUser(),
          getMyMemberships(),
          getMyListings(),
        ]);
      setProfile(profileResponse.user);
      setMemberships(membershipResponse.data || []);
      setListings(listingData || []);
      setMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to load your profile.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfile();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadProfile]);

  useEffect(() => {
    let active = true;
    const objectUrls = [];

    const loadImage = async (type, hasImage) => {
      if (!hasImage) return;
      try {
        const image = await getProfileImage(type);
        const objectUrl = URL.createObjectURL(image);
        objectUrls.push(objectUrl);
        if (active) {
          setProfileImages((images) => ({ ...images, [type]: objectUrl }));
        }
      } catch {
        if (active) {
          setProfileImages((images) => ({ ...images, [type]: "" }));
        }
      }
    };

    void Promise.all([
      loadImage("avatar", profile?.hasAvatar),
      loadImage("cover", profile?.hasCover),
    ]);

    return () => {
      active = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [profile?.hasAvatar, profile?.hasCover, imageVersion]);

  const currentProfile = profile || sessionUser || {};
  const displayName =
    [currentProfile.firstName, currentProfile.lastName]
      .filter(Boolean)
      .join(" ") || "FitSwap Member";
  const handle = currentProfile.username || (currentProfile.email || "member@fitswap")
    .split("@")[0]
    .replace(/[^a-zA-Z0-9_]/g, "_");
  const initials =
    [currentProfile.firstName, currentProfile.lastName]
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "FS";
  const activeMemberships = useMemo(
    () =>
      memberships.filter((membership) => membership.status === "ACTIVE").length,
    [memberships],
  );
  const savedListings = currentProfile._count?.savedListings || 0;
  const profileSetup = useMemo(() => {
    const steps = [
      { label: "Profile photo", complete: Boolean(profileImages.avatar) },
      { label: "Your city", complete: Boolean(currentProfile.city) },
      { label: "Short bio", complete: Boolean(currentProfile.bio) },
      { label: "Phone number", complete: Boolean(currentProfile.phone) },
    ];
    const completed = steps.filter((step) => step.complete).length;

    return {
      steps,
      completed,
      percent: Math.round((completed / steps.length) * 100),
    };
  }, [
    currentProfile.bio,
    currentProfile.city,
    currentProfile.phone,
    profileImages.avatar,
  ]);

  const saveProfile = async (form) => {
    try {
      setSaving(true);
      const response = await updateCurrentUser(form);
      setProfile(response.user);
      updateUser(response.user);
      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to update your profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (type, file) => {
    if (!file) return;

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setMessage("Choose a JPG, PNG, or WEBP image smaller than 5 MB.");
      return;
    }

    try {
      setUploading(type);
      const response = await uploadProfileImage(type, file);
      const nextProfile = { ...currentProfile, ...response.data };
      setProfile(nextProfile);
      updateUser(nextProfile);
      setImageVersion((version) => version + 1);
      setMessage(response.message || "Profile image updated successfully.");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to upload this image.",
      );
    } finally {
      setUploading("");
    }
  };

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-5xl pb-8">
        {message && (
          <div
            className={`mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${message.includes("Unable") || message.includes("required") || message.includes("valid") || message.includes("exists") ? "border-red-500/20 bg-red-500/5 text-red-300" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"}`}
          >
            <CircleAlert size={16} />
            {message}
          </div>
        )}

        <section className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#11121a] shadow-[0_24px_70px_rgba(0,0,0,.18)]">
          <div
            className="relative h-28 overflow-hidden bg-[radial-gradient(circle_at_15%_20%,rgba(192,132,252,.8),transparent_28%),radial-gradient(circle_at_82%_30%,rgba(59,130,246,.7),transparent_25%),linear-gradient(115deg,#20103e,#13152b_52%,#0b2038)] bg-cover bg-center sm:h-36"
            style={
              profileImages.cover
                ? {
                    backgroundImage: `linear-gradient(90deg, rgba(11,8,25,.48), rgba(8,11,20,.24)), url(${profileImages.cover})`,
                  }
                : undefined
            }
          >
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.2)_1px,transparent_1px)] [background-size:28px_28px]" />
            <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,.16),transparent_34%,transparent_68%,rgba(255,255,255,.08))]" />
            <div className="absolute left-5 top-5 z-10 flex items-center gap-2 text-xs font-medium text-white/75 sm:left-7">
              <Sparkles size={14} className="text-violet-200" />
              Your FitSwap account
            </div>
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploading === "cover"}
              className="absolute right-4 top-4 z-10 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-black/25 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-black/45 disabled:opacity-60 sm:right-6"
            >
              <ImagePlus size={15} /> {uploading === "cover" ? "Uploading…" : "Update cover"}
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                void uploadImage("cover", event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </div>

          <div className="relative px-5 pb-6 sm:px-7 sm:pb-7">
            <div className="-mt-10 flex flex-col gap-5 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 items-end gap-4">
                <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-[#11121a] bg-gradient-to-br from-violet-500 via-fuchsia-500 to-sky-500 text-2xl font-black text-white shadow-xl shadow-black/30 sm:h-24 sm:w-24">
                  {profileImages.avatar ? (
                    <img
                      src={profileImages.avatar}
                      alt={`${displayName}'s profile`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploading === "avatar"}
                    aria-label="Change profile photo"
                    className="absolute bottom-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-lg border border-white/20 bg-[#171127]/90 text-white shadow-lg backdrop-blur transition hover:bg-violet-600 disabled:opacity-60"
                  >
                    {uploading === "avatar" ? (
                      <LoaderCircle size={14} className="animate-spin" />
                    ) : (
                      <Camera size={14} />
                    )}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      void uploadImage("avatar", event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </div>
                <div className="min-w-0 pb-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-violet-300">
                    {roleLabel(currentProfile.role)}
                  </p>
                  <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {displayName}
                  </h1>
                  <p className="mt-1 truncate text-sm text-zinc-400">@{handle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-violet-400/40 hover:bg-violet-500/10 sm:w-auto"
              >
                <Edit3 size={15} /> Edit profile
              </button>
            </div>

            <div className="mt-6 grid gap-5 border-t border-white/[0.08] pt-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(235px,.75fr)]">
              <div>
                <p className="max-w-2xl text-sm leading-6 text-zinc-300">
                  {currentProfile.bio || "Make your profile yours. Add a few details so your marketplace activity feels personal and trustworthy."}
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <ProfileDetail icon={Mail} label="Email" value={currentProfile.email || "Email not available"} />
                  <ProfileDetail icon={MapPin} label="Based in" value={currentProfile.city || "Add your city"} muted={!currentProfile.city} />
                  <ProfileDetail icon={Phone} label="Phone" value={currentProfile.phone || "Add a phone number"} muted={!currentProfile.phone} />
                  <ProfileDetail icon={CalendarDays} label="Member since" value={formatMonth(currentProfile.createdAt)} />
                </div>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-black/15 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Profile visibility</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Controls what buyers can see when you list a membership.
                    </p>
                  </div>
                  <ShieldCheck size={19} className="shrink-0 text-violet-300" />
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#15161f] px-3 py-2.5">
                  <span className="text-xs text-zinc-400">Marketplace profile</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${currentProfile.isProfilePublic ? "text-emerald-300" : "text-zinc-400"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${currentProfile.isProfilePublic ? "bg-emerald-400" : "bg-zinc-500"}`} />
                    {currentProfile.isProfilePublic ? "Visible to buyers" : "Private"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(290px,.8fr)]">
          <div className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">Marketplace activity</p>
                <h2 className="mt-1 text-lg font-bold text-white">Your FitSwap snapshot</h2>
              </div>
              <CircleUserRound size={20} className="text-violet-300" />
            </div>
            <div className="mt-5 grid grid-cols-3 divide-x divide-white/[0.08] rounded-2xl border border-white/[0.07] bg-black/10 py-4">
              <ProfileStat value={loading ? "—" : activeMemberships} label="Active passes" />
              <ProfileStat value={loading ? "—" : listings.length} label="Listings" />
              <ProfileStat value={loading ? "—" : savedListings} label="Saved" />
            </div>
            <p className="mt-4 text-xs leading-5 text-zinc-500">
              Your memberships and listings are collected below, so you always know where your account stands.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-violet-400/[0.16] bg-[linear-gradient(135deg,rgba(91,33,182,.18),rgba(17,18,26,1)_58%)] p-5 sm:p-6">
            <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-violet-500/15 blur-3xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-300">Account setup</p>
                <h2 className="mt-1 text-lg font-bold text-white">{profileSetup.percent}% complete</h2>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-violet-300/15 bg-violet-500/10 text-sm font-bold text-violet-200">{profileSetup.completed}/4</span>
            </div>
            <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-white/[0.08]">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all" style={{ width: `${profileSetup.percent}%` }} />
            </div>
            <div className="relative mt-4 grid grid-cols-2 gap-x-3 gap-y-2">
              {profileSetup.steps.map((step) => (
                <span key={step.label} className={`flex items-center gap-1.5 text-xs ${step.complete ? "text-zinc-300" : "text-zinc-500"}`}>
                  <span className={`grid h-4 w-4 place-items-center rounded-full ${step.complete ? "bg-emerald-500/15 text-emerald-300" : "bg-white/[0.06] text-zinc-600"}`}>
                    {step.complete && <Check size={10} strokeWidth={3} />}
                  </span>
                  {step.label}
                </span>
              ))}
            </div>
            {profileSetup.percent < 100 && (
              <button type="button" onClick={() => setEditing(true)} className="relative mt-5 text-xs font-semibold text-violet-300 transition hover:text-violet-200">
                Complete your profile <ChevronRight className="inline" size={14} />
              </button>
            )}
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11121a]">
          <div className="flex items-center justify-between border-b border-white/[0.08] px-4 sm:px-6">
            <div className="flex">
            <ProfileTab
              active={activeTab === "memberships"}
              onClick={() => setActiveTab("memberships")}
              label="Memberships"
              count={memberships.length}
            />
            <ProfileTab
              active={activeTab === "listings"}
              onClick={() => setActiveTab("listings")}
              label="Listings"
              count={listings.length}
            />
            </div>
            <p className="hidden text-xs text-zinc-500 sm:block">Your account activity</p>
          </div>
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-zinc-400">
                <LoaderCircle size={18} className="animate-spin" /> Loading your
                activity…
              </div>
            ) : activeTab === "memberships" ? (
              <MembershipGrid
                memberships={memberships}
                onOpen={(id) => navigate(`/memberships/${id}`)}
              />
            ) : (
              <ListingGrid
                listings={listings}
                onOpen={(id) => navigate(`/marketplace/${id}`)}
              />
            )}
          </div>
        </section>
      </main>
      {editing && (
        <EditProfileModal
          profile={currentProfile}
          saving={saving}
          onClose={() => setEditing(false)}
          onSave={saveProfile}
        />
      )}
    </DashboardLayout>
  );
}

function ProfileStat({ value, label }) {
  return (
    <div className="px-2 text-center">
      <p className="text-xl font-bold text-white sm:text-2xl">{value}</p>
      <p className="mt-1 text-[11px] font-medium text-zinc-500 sm:text-xs">
        {label}
      </p>
    </div>
  );
}

function ProfileDetail({ icon: Icon, label, value, muted = false }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-white/[0.06] bg-black/[0.12] px-3 py-2.5">
      <Icon size={14} className="shrink-0 text-violet-300" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
          {label}
        </p>
        <p className={`mt-0.5 truncate text-xs ${muted ? "text-zinc-500" : "text-zinc-300"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function ProfileTab({ active, onClick, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-4 py-4 text-sm font-semibold transition ${active ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
    >
      {label} <span className="ml-1 text-xs text-zinc-500">{count}</span>
      {active && (
        <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-violet-500" />
      )}
    </button>
  );
}

function MembershipGrid({ memberships, onOpen }) {
  if (!memberships.length)
    return (
      <EmptyState
        icon={Heart}
        title="Your membership story starts here"
        description="When you buy a gym plan, it will appear on your profile."
        action="Explore gyms"
      />
    );
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {memberships.map((membership) => {
        const gym = membership.plan?.gym || {};
        const image = gym.images?.[0]?.imageUrl || fallbackImage;
        return (
          <button
            type="button"
            key={membership.id}
            onClick={() => onOpen(membership.id)}
            className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-black/15 text-left transition hover:-translate-y-0.5 hover:border-violet-400/35"
          >
            <div className="relative h-32 overflow-hidden">
              <img
                src={image}
                alt=""
                className="h-full w-full object-cover opacity-70 transition duration-300 group-hover:scale-105 group-hover:opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#11121a] via-transparent" />
              <span
                className={`absolute right-3 top-3 rounded-full px-2 py-1 text-[10px] font-bold ${membership.status === "ACTIVE" ? "bg-emerald-500/90 text-white" : "bg-zinc-800/90 text-zinc-200"}`}
              >
                {membership.status}
              </span>
            </div>
            <div className="p-4">
              <p className="truncate font-semibold text-white">
                {gym.name || "FitSwap gym"}
              </p>
              <p className="mt-1 truncate text-sm text-zinc-400">
                {membership.plan?.name || "Membership plan"}
              </p>
              <p className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                Valid until {formatDate(membership.endDate)}{" "}
                <ChevronRight size={15} className="text-violet-300" />
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ListingGrid({ listings, onOpen }) {
  if (!listings.length)
    return (
      <EmptyState
        icon={Store}
        title="No listings yet"
        description="List an unused membership to turn it into value for another member."
        action="Create a listing"
      />
    );
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <button
          type="button"
          key={listing.id}
          onClick={() => onOpen(listing.id)}
          className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-black/15 text-left transition hover:-translate-y-0.5 hover:border-violet-400/35"
        >
          <div className="relative h-32 overflow-hidden">
            <img
              src={listing.image || fallbackImage}
              alt=""
              className="h-full w-full object-cover opacity-70 transition duration-300 group-hover:scale-105 group-hover:opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#11121a] via-transparent" />
            <span className="absolute right-3 top-3 rounded-full bg-violet-600/90 px-2 py-1 text-[10px] font-bold text-white">
              {listing.status}
            </span>
          </div>
          <div className="p-4">
            <p className="truncate font-semibold text-white">{listing.gym}</p>
            <p className="mt-1 truncate text-sm text-zinc-400">
              {listing.membership}
            </p>
            <p className="mt-3 flex items-center justify-between text-sm font-bold text-white">
              {formatPrice(listing.price)}{" "}
              <ChevronRight size={15} className="text-violet-300" />
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-black/10 px-6 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-300">
        <Icon size={21} />
      </div>
      <h3 className="mt-4 font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
        {description}
      </p>
      <p className="mt-4 text-xs font-semibold text-violet-300">{action}</p>
    </div>
  );
}

function EditProfileModal({ profile, saving, onClose, onSave }) {
  const [form, setForm] = useState({
    firstName: profile.firstName || "",
    lastName: profile.lastName || "",
    phone: profile.phone || "",
    username: profile.username || "",
    bio: profile.bio || "",
    city: profile.city || "",
    isProfilePublic: profile.isProfilePublic !== false,
  });
  const submit = (event) => {
    event.preventDefault();
    onSave(form);
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl border border-white/[0.1] bg-[#15161f] p-6 shadow-2xl shadow-black/60"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-violet-300">Profile</p>
            <h2 className="mt-1 text-xl font-bold text-white">
              Edit your profile
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl text-zinc-400 hover:bg-white/[0.06] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field
            label="First name"
            value={form.firstName}
            onChange={(value) => setForm({ ...form, firstName: value })}
          />
          <Field
            label="Last name"
            value={form.lastName}
            onChange={(value) => setForm({ ...form, lastName: value })}
          />
        </div>
        <div className="mt-4">
          <Field
            label="Phone number"
            value={form.phone}
            onChange={(value) => setForm({ ...form, phone: value })}
            placeholder="Add a phone number"
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Username" value={form.username} onChange={(value) => setForm({ ...form, username: value.toLowerCase() })} placeholder="your_handle" /><Field label="City" value={form.city} onChange={(value) => setForm({ ...form, city: value })} placeholder="e.g. Bangalore" /></div>
        <label className="mt-4 block text-xs font-medium text-zinc-400">Bio<textarea maxLength="280" rows="4" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} placeholder="Tell the FitSwap community about yourself" className="mt-2 w-full resize-y rounded-xl border border-white/[0.1] bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/60" /></label>
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.07] bg-black/15 p-3"><input checked={form.isProfilePublic} onChange={(event) => setForm({ ...form, isProfilePublic: event.target.checked })} type="checkbox" className="mt-0.5 accent-violet-500" /><span><span className="block text-sm font-medium text-zinc-200">Public seller profile</span><span className="mt-1 block text-xs leading-5 text-zinc-500">Allow marketplace buyers to see your profile identity when you list a membership.</span></span></label>
        <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/15 px-3 py-3">
          <p className="text-xs text-zinc-500">Email address</p>
          <p className="mt-1 text-sm text-zinc-300">{profile.email}</p>
        </div>
        <button
          disabled={saving}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60"
        >
          <Save size={16} /> {saving ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <label className="block text-xs font-medium text-zinc-400">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/[0.1] bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/60"
      />
    </label>
  );
}
function formatMonth(value) {
  return value
    ? new Intl.DateTimeFormat("en-IN", {
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "recently";
}
function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "—";
}
function roleLabel(role) {
  return role === "ADMIN"
    ? "Administrator"
    : role === "GYM_OWNER"
      ? "Gym owner"
      : "FitSwap member";
}

export default ProfilePage;
