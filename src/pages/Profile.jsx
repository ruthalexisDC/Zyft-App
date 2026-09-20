import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import WorkoutPostCard from "../components/WorkoutPostCard.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import api from "../api/axios";
import { getSavedPosts } from "../api/posts";
import {
  Dumbbell,
  TrendingUp,
  Grid,
  BarChart3,
  Settings,
  Zap,
  Loader2,
  Bookmark,
} from "lucide-react";
import FollowListModal from "../components/FollowListModal.jsx";

// ── Active status window ──
// A user is considered "online" if their last heartbeat was within this
// window (matches the backend presence heartbeat interval).
const ACTIVE_WINDOW_MS = 2 * 60 * 1000; // 2 min

// ─── Helper: Get current user from storage ───
const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) return JSON.parse(userStr);

    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return { _id: payload.userId || payload._id || payload.sub };
    }
  } catch {
    return null;
  }
  return null;
};

// ─── Helper: current-day streak from post history ───
const computeStreak = (posts) => {
  if (!posts || posts.length === 0) return 0;

  const dayMs = 24 * 60 * 60 * 1000;
  const activeDays = new Set(
    posts.map((p) => new Date(p.createdAt).toDateString()),
  );

  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (!activeDays.has(cursor.toDateString())) {
    cursor = new Date(cursor.getTime() - dayMs);
    if (!activeDays.has(cursor.toDateString())) return 0;
  }

  let streak = 0;
  while (activeDays.has(cursor.toDateString())) {
    streak += 1;
    cursor = new Date(cursor.getTime() - dayMs);
  }
  return streak;
};

// ─── Helper: personal-record count from post history ───
const computePRCount = (posts) => {
  if (!posts || posts.length === 0) return 0;

  const chronological = [...posts].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );

  const bestByExercise = {};
  let prCount = 0;

  chronological.forEach((post) => {
    const exercises = post.workout?.exercises || [];
    exercises.forEach((ex) => {
      const name = (ex.name || "").trim().toLowerCase();
      const weight = Number(ex.weight) || 0;
      if (!name || weight <= 0) return;

      const currentBest = bestByExercise[name] || 0;
      if (weight > currentBest) {
        bestByExercise[name] = weight;
        prCount += 1;
      }
    });
  });

  return prCount;
};

// ─── Helper: count of distinct weeks with workout activity ───
const computeWeeksActive = (posts) => {
  if (!posts || posts.length === 0) return 0;

  const activeWeeks = new Set(
    posts.map((p) => {
      const d = new Date(p.createdAt);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // anchor to Monday
      return d.getTime();
    }),
  );

  return activeWeeks.size;
};

// ─── Skeleton primitive ───
const Skel = ({ className = "" }) => (
  <div className={`bg-white/[0.06] rounded-lg animate-pulse ${className}`} />
);

// ─── Full-page skeleton that mirrors the real profile layout ───
const ProfileSkeleton = () => (
  <div className="min-h-screen bg-[#0a0a0a] text-white pt-4 pb-40 px-4 max-w-lg mx-auto">
    {/* Header */}
    <div className="flex items-center justify-between mb-6 relative">
      <h1 className="text-xl font-bold text-white/40">ZYFT</h1>
      <p className="absolute left-1/2 -translate-x-1/2 text-sm text-gray-500">
        Profile
      </p>
      <div className="w-10 h-10 shrink-0" />
    </div>

    {/* Hero card */}
    <div className="bg-[#13131f] rounded-3xl p-5 mb-6 border border-white/5">
      <div className="flex items-start justify-between mb-4">
        <Skel className="w-20 h-20 rounded-full" />
        <div className="flex items-center gap-2">
          <Skel className="w-9 h-9 rounded-xl" />
          <Skel className="w-24 h-9 rounded-xl" />
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <Skel className="h-4 w-32" />
        <Skel className="h-3 w-20" />
        <Skel className="h-3 w-full max-w-[280px]" />
        <Skel className="h-5 w-28 rounded-full mt-2" />
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <Skel className="h-4 w-8" />
            <Skel className="h-2.5 w-14" />
          </div>
        ))}
      </div>
    </div>

    {/* Consistency */}
    <div className="mb-6">
      <Skel className="h-4 w-40 mb-3" />
      <div className="grid grid-cols-2 gap-3 mb-3">
        {[0, 1].map((i) => (
          <Skel key={i} className="rounded-2xl h-28" />
        ))}
      </div>
      <Skel className="rounded-2xl h-14" />
    </div>

    {/* Journey */}
    <div className="mb-6">
      <Skel className="h-4 w-36 mb-3" />
      <Skel className="h-px w-full mb-4" />
      <Skel className="h-3 w-full mb-2" />
      <Skel className="h-3 w-3/4 mb-4" />
      <Skel className="h-10 w-48 rounded-xl" />
    </div>

    {/* Tab content */}
    <div className="space-y-3">
      <Skel className="h-40 rounded-2xl" />
      <Skel className="h-40 rounded-2xl" />
    </div>
  </div>
);

export default function Profile() {
  const { t } = useTranslation("profile");
  const [activeTab, setActiveTab] = useState("Post");
  const [toast, setToast] = useState(null);
  // Bug 4 fix: ref to track the toast auto-dismiss timer so it can be
  // cleared on unmount, preventing setState on an unmounted component.
  const toastTimerRef = useRef(null);
  const { user: authUser } = useAuth();
  const { getActiveStatus } = useSocket();
  const navigate = useNavigate();
  const { userId: paramUserId } = useParams();

  const currentUser = getCurrentUser();

  const currentUserId =
    currentUser?._id || currentUser?.id || authUser?._id || authUser?.id;

  const targetUserId = paramUserId || currentUserId;

  const isOwnProfile = !paramUserId || paramUserId === currentUserId;

  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [listModal, setListModal] = useState(null); // "followers" | "following" | null

  // Bug 4 fix: centralized toast helper that clears previous timer before
  // setting a new one, and is safe to call after navigation/unmount.
  const showToast = useCallback((message, type = "success") => {
    clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  }, []);

  // Bug 4 fix: clear any pending toast timer when the component unmounts.
  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  // Bug 5 fix: sync isFollowing from profileData as soon as it loads,
  // so the Follow button doesn't flicker to "Follow" while the separate
  // /follow-status call is in-flight (profileData already has this field).
  useEffect(() => {
    if (profileData?.isFollowing !== undefined) {
      setIsFollowing(profileData.isFollowing);
    }
  }, [profileData]);

  // ─── Fetch saved posts ───
  const fetchSavedPosts = useCallback(async () => {
    if (!isOwnProfile) return;

    try {
      const response = await getSavedPosts({
        page: 1,
        limit: 20,
      });

      const saved = response.data?.data || response.data?.posts || [];

      setSavedPosts(saved);
    } catch (err) {
      console.error("Failed to fetch saved posts:", err);
      setSavedPosts([]);
    }
  }, [isOwnProfile]);

  useEffect(() => {
    if (activeTab === "Saved" && isOwnProfile) {
      fetchSavedPosts();
    }
  }, [activeTab, isOwnProfile, fetchSavedPosts]);

  // ─── Check follow status when viewing another user's profile ───
  useEffect(() => {
    if (isOwnProfile || !targetUserId || !currentUserId) return;

    const checkFollowStatus = async () => {
      try {
        const { data } = await api.get(
          `/users/id/${targetUserId}/follow-status`,
        );
        setIsFollowing(data.isFollowing);
      } catch (err) {
        console.error("Failed to check follow status:", err);
      }
    };

    checkFollowStatus();
  }, [isOwnProfile, targetUserId, currentUserId]);

  // ─── Handle follow/unfollow ───
  const handleFollow = async () => {
    if (!currentUserId) {
      navigate("/login");
      return;
    }

    setFollowLoading(true);
    try {
      const { data } = await api.post(`/users/id/${targetUserId}/follow`, {});

      setIsFollowing(data.following);

      setProfileData((prev) => ({
        ...prev,
        followersCount: data.followersCount ?? prev?.followersCount,
      }));

      showToast(
        data.following
          ? t("toast.following", { name: displayUser.name })
          : t("toast.unfollowed", { name: displayUser.name }),
        "success",
      );
    } catch (err) {
      console.error("Follow failed:", err);
      showToast(t("toast.followFailed"), "error");
    } finally {
      setFollowLoading(false);
    }
  };

  // ─── Fetch real data ───
  useEffect(() => {
    if (!targetUserId) return;

    const fetchProfileData = async () => {
      try {
        setLoading(true);

        const userRes = await api.get(`/users/id/${targetUserId}`);
        setProfileData(userRes.data.user);

        const postsRes = await api.get(
          `/users/id/${targetUserId}/posts?page=1&limit=20`,
        );
        setPosts(postsRes.data.posts || []);
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError(err.response?.data?.message || t("errors.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId]);

  // Current timestamp captured once when the page mounts — used for
  // relative time windows below. Avoids calling the impure Date.now()
  // directly during render.
  const [now] = useState(() => Date.now());

  // ── Active status ──
  // Prefer the live socket presence timestamp; fall back to the value the
  // backend attached to the profile (last_active_at).
  const socketStatus = getActiveStatus(targetUserId);

  const lastActiveAt =
    socketStatus?.lastActiveAt ||
    profileData?.lastSeen ||
    profileData?.last_active_at ||
    null;

  // Active status is hidden if either the profile owner
  // or the current viewer disabled it.
  const showActiveStatus =
    profileData?.showActiveStatus !== false &&
    profileData?.show_active_status !== false &&
    authUser?.showActiveStatus !== false &&
    authUser?.show_active_status !== false;

  const isOnline =
    showActiveStatus &&
    (socketStatus?.online === true ||
      profileData?.isOnline === true ||
      (!!lastActiveAt &&
        Date.now() - new Date(lastActiveAt).getTime() < ACTIVE_WINDOW_MS));

  // ─── Computed weekly stats from real posts ───
  const weeklyStats = useMemo(() => {
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const weekPosts = posts.filter((p) => new Date(p.createdAt) > weekAgo);

    const totalVolume = weekPosts.reduce(
      (sum, p) =>
        sum +
        (p.workout?.exercises?.reduce(
          (eSum, ex) =>
            eSum + (ex.weight || 0) * (ex.reps || 0) * (ex.sets || 1),
          0,
        ) || 0),
      0,
    );

    const avgDuration = weekPosts.length
      ? Math.round(
          weekPosts.reduce((sum, p) => sum + (p.workout?.duration || 0), 0) /
            weekPosts.length,
        )
      : 0;

    const totalCalories = weekPosts.reduce(
      (sum, p) =>
        sum +
        (p.workout?.caloriesBurned ||
          Math.round((p.workout?.duration || 0) * 8)),
      0,
    );

    return {
      totalVolume,
      avgDuration,
      sessions: weekPosts.length,
      totalCalories,
    };
  }, [posts, now]);

  // ─── Monthly stats for Goal Progress ───
  const monthlyStats = useMemo(() => {
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const monthPosts = posts.filter((p) => new Date(p.createdAt) > monthAgo);

    const totalCalories = monthPosts.reduce(
      (sum, p) =>
        sum +
        (p.workout?.caloriesBurned ||
          Math.round((p.workout?.duration || 0) * 8)),
      0,
    );

    return {
      workoutsThisMonth: monthPosts.length,
      caloriesBurned: totalCalories,
    };
  }, [posts, now]);

  // ─── Streak, PRs & weeks active, derived from real post history ───
  // computeStreak uses new Date() internally — passing `now` had no effect
  // and caused unnecessary recomputes every 60s. Removed from call + deps.
  const computedStreak = useMemo(() => computeStreak(posts), [posts]);
  const computedPRs = useMemo(() => computePRCount(posts), [posts]);
  const computedWeeksActive = useMemo(() => computeWeeksActive(posts), [posts]);

  const handleRespect = async (postId) => {
    try {
      const res = await api.post(`/posts/${postId}/respect`, {});

      const updatePost = (post) =>
        post._id === postId
          ? {
              ...post,
              didRespect: res.data.respected,
              respectCount: res.data.respectCount,
            }
          : post;

      setPosts((prev) => prev.map(updatePost));
      setSavedPosts((prev) => prev.map(updatePost));
    } catch (err) {
      console.error("Respect failed:", err);
    }
  };

  const getTimeAgo = (date) => {
    const hours = Math.floor((Date.now() - new Date(date)) / 3600000);
    if (hours < 1) return t("time.justNow");
    if (hours < 24) return t("time.hoursAgo", { count: hours });
    if (hours < 48) return t("time.yesterday");
    return new Date(date).toLocaleDateString();
  };

  // ─── Resolve avatar URL ───
  const avatarUrl = useMemo(() => {
    if (isOwnProfile) {
      return (
        profileData?.avatar ||
        profileData?.photo ||
        authUser?.avatar ||
        authUser?.photo ||
        currentUser?.avatar ||
        currentUser?.photo ||
        null
      );
    }
    return profileData?.avatar || profileData?.photo || null;
  }, [isOwnProfile, profileData, authUser, currentUser]);

  // ─── Merge real data with fallback ───
  const displayUser = {
    _id: profileData?._id || targetUserId,
    name:
      profileData?.name ||
      (isOwnProfile ? authUser?.name : null) ||
      t("fallback.yourName"),
    handle: profileData?.handle
      ? `@${profileData.handle}`
      : isOwnProfile
        ? authUser?.username || "@yourname"
        : "",
    bio: profileData?.bio || t("fallback.bio"),
    focus: profileData?.focus || t("fallback.focus"),
    followers:
      profileData?.followersCount >= 1000
        ? `${(profileData.followersCount / 1000).toFixed(1)}k`
        : profileData?.followersCount?.toString() || "0",
    following:
      profileData?.followingCount >= 1000
        ? `${(profileData.followingCount / 1000).toFixed(1)}k`
        : profileData?.followingCount?.toString() || "0",
    workouts: posts.length.toString(),
    photo: avatarUrl,
  };

  // ─── REAL stats ───
  const stats = {
    workout: posts.length,
    streak: profileData?.streakCount ?? computedStreak,
    prs: profileData?.prsCount ?? computedPRs,
    weeksActive: computedWeeksActive,
  };

  // ── CHANGED: Consistency percentage for the mini progress ring.
  // Uses weeks active (target 12 weeks) as the primary metric, falling
  // back to the current streak (target 30 days) when there's activity
  // but no completed week yet. Capped at 100%.
  const consistencyPercent = useMemo(() => {
    if (stats.workout <= 0) return 0;
    if (stats.weeksActive > 0) {
      return Math.min(Math.round((stats.weeksActive / 12) * 100), 100);
    }
    return Math.min(Math.round((stats.streak / 30) * 100), 100);
  }, [stats.workout, stats.weeksActive, stats.streak]);

  const userInitial = displayUser.name.charAt(0).toUpperCase();
  console.log("Profile user:", displayUser);
  console.log("isOnline:", displayUser.isOnline);

  if (loading) return <ProfileSkeleton />;

  if (error)
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-red-400 flex items-center justify-center">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-4 pb-24 px-4 max-w-lg mx-auto relative">
      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div
            className={`bg-[#1a1a2e] border rounded-xl px-4 py-3 shadow-xl shadow-black/50 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${
              toast.type === "error"
                ? "border-red-500/30"
                : "border-green-500/30"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center ${
                toast.type === "error" ? "bg-red-500/20" : "bg-green-500/20"
              }`}
            >
              {toast.type === "error" ? (
                <span className="text-red-400 text-xs">✕</span>
              ) : (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-green-400"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className="text-sm text-gray-300 font-medium">
              {toast.message}
            </span>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 relative">
        <h1 className="text-xl font-bold text-white">ZYFT</h1>
        <div className="absolute left-1/2 -translate-x-1/2 text-center">
          <p className="text-sm text-gray-500 whitespace-nowrap">
            {isOwnProfile
              ? t("header.profile")
              : t("header.othersProfile", { name: displayUser.name })}
          </p>
        </div>
        <div className="w-10 h-10 shrink-0" />
      </div>

      {/* ── Profile Hero ── */}
      <div className="bg-[#13131f] rounded-3xl p-5 mb-6 border border-white/5 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between mb-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#a78bfa] flex items-center justify-center overflow-hidden ring-2 ring-purple-500/30">
              {displayUser.photo ? (
                <img
                  src={displayUser.photo}
                  alt={t("profilePhotoAlt")}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentElement.classList.add("fallback-active");
                  }}
                />
              ) : (
                <span className="text-3xl font-bold">{userInitial}</span>
              )}
            </div>
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-[3px] border-[#13131f]" />
            )}
          </div>

          <div className="flex items-center gap-2">
            {isOwnProfile ? (
              <>
                <Link
                  to="/account-setting"
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                >
                  <Settings className="w-4 h-4" />
                </Link>
                <Link
                  to="/edit-profile"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] text-xs font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  {t("editProfile")}
                </Link>
              </>
            ) : (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50 ${
                  isFollowing
                    ? "bg-white/10 border border-white/20 text-gray-300 hover:bg-white/15"
                    : "bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] text-white hover:opacity-90"
                }`}
              >
                {followLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isFollowing ? (
                  t("following")
                ) : (
                  t("follow")
                )}
              </button>
            )}
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-bold">{displayUser.name}</h2>
          <p className="text-xs text-gray-500 mb-2">{displayUser.handle}</p>
          <p className="text-xs text-gray-400 leading-relaxed mb-2">
            {displayUser.bio}
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
            <Dumbbell className="w-3 h-3 text-purple-400" />
            <span className="text-xs text-purple-300 font-medium">
              {displayUser.focus}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          {/* ── CHANGED: Consistency level as a mini progress ring ── */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-14 h-14 mb-1">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="3.5"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="url(#consistencyGradient)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={`${consistencyPercent}, 100`}
                  className="transition-all duration-700"
                />
                <defs>
                  <linearGradient
                    id="consistencyGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-bold text-[#a78bfa]">
                  {consistencyPercent}%
                </span>
              </div>
            </div>
            <div className="text-[10px] text-gray-500">
              {t("header.consistency")}
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <button
            type="button"
            onClick={() => setListModal("followers")}
            className="flex-1 text-center cursor-pointer group"
          >
            <div className="text-base font-bold group-hover:text-[#a78bfa] transition-colors">
              {t("header.community")}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5 group-hover:text-gray-400 transition-colors">
              {t("header.supporters")}
            </div>
          </button>
          <div className="w-px h-8 bg-white/10" />
          <button
            type="button"
            onClick={() => setListModal("following")}
            className="flex-1 text-center cursor-pointer group"
          >
            <div className="text-base font-bold group-hover:text-[#a78bfa] transition-colors">
              {t("header.connections")}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5 group-hover:text-gray-400 transition-colors">
              {t("header.connected")}
            </div>
          </button>
        </div>
      </div>

      {/* ── YOUR CONSISTENCY ── */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
          {t("consistency.title")}
        </h2>

        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Sessions Logged */}
          <div className="bg-[#13131f] rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center min-h-[100px]">
            <div className="text-3xl font-bold text-[#a78bfa]">
              {stats.workout}
            </div>
            <div className="text-[11px] text-gray-500 mt-1 text-center">
              {t("consistency.sessionsLogged")}
            </div>
          </div>

          {/* Weeks Active */}
          <div className="bg-[#13131f] rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center min-h-[100px]">
            <div className="text-3xl font-bold text-[#a78bfa]">
              {stats.weeksActive}
            </div>
            <div className="text-[11px] text-gray-500 mt-1 text-center">
              {t("consistency.weeksActive")}
            </div>
          </div>
        </div>

        {/* Quote card */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl px-4 py-3 text-center">
          <p className="text-xs text-gray-300 italic">
            &ldquo;{t("consistency.quote")}&rdquo;
          </p>
        </div>
      </div>

      {/* ── YOUR JOURNEY ── */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
          {t("journey.title")}
        </h2>

        <div className="w-full h-px bg-white/10 mb-4" />

        <p className="text-sm text-gray-400 leading-relaxed">
          {t("journey.description", { count: stats.workout })}
        </p>
      </div>

      {/* ── Tabs [Post] / [Progress] ── */}
      <div className="flex bg-[#13131f] rounded-2xl p-1 mb-4 border border-white/5">
        {[
          {
            key: "Post",
            label: t("tabs.post"),
            icon: <Grid size={16} />,
          },
          ...(isOwnProfile
            ? [
                {
                  key: "Saved",
                  label: t("Saved Posts"),
                  icon: <Bookmark size={16} />,
                },
              ]
            : []),
          {
            key: "Progress",
            label: t("tabs.progress"),
            icon: <BarChart3 size={16} />,
          },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === key
                ? "bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] text-white shadow-lg shadow-purple-500/20"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* ── Saved Tab ── */}
      {activeTab === "Saved" && isOwnProfile && (
        <div className="space-y-3">
          {savedPosts.length === 0 ? (
            <div className="bg-[#13131f] rounded-2xl p-8 border border-white/5 text-center">
              <Bookmark className="w-8 h-8 text-gray-600 mx-auto mb-3" />

              <p className="text-sm text-gray-500">
                {t("noSavedPosts", "No saved posts yet.")}
              </p>

              <p className="text-xs text-gray-600 mt-1">
                {t("savePostsHint", "Posts you save will appear here.")}
              </p>
            </div>
          ) : (
            savedPosts.map((post) => (
              <WorkoutPostCard
                key={post._id}
                post={post}
                onRespect={handleRespect}
                getTimeAgo={getTimeAgo}
                t={t}
              />
            ))
          )}
        </div>
      )}

      {/* ── Tab Content ── */}
      {activeTab === "Post" && (
        <div className="space-y-3">
          {posts.length === 0 ? (
            <p className="text-gray-500 text-center py-10">
              {isOwnProfile ? t("noWorkoutsPosted") : t("postedByOther")}
            </p>
          ) : (
            posts.map((post) => (
              <WorkoutPostCard
                key={post._id}
                post={post}
                onRespect={handleRespect}
                getTimeAgo={getTimeAgo}
                t={t}
              />
            ))
          )}
        </div>
      )}

      {/* ── Progress Tab ── */}
      {activeTab === "Progress" && (
        <div className="space-y-3">
          <div className="bg-[#13131f] rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={14} className="text-purple-400" />
              <h3 className="text-sm font-semibold">
                {t("weeklySummary.title")}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: t("weeklySummary.totalVolume"),
                  value: `${weeklyStats.totalVolume.toLocaleString()} kg`,
                  color: "text-purple-400",
                },
                {
                  label: t("weeklySummary.avgDuration"),
                  value: `${weeklyStats.avgDuration} min`,
                  color: "text-blue-400",
                },
                {
                  label: t("weeklySummary.caloriesBurned"),
                  value: weeklyStats.totalCalories.toLocaleString(),
                  color: "text-orange-400",
                },
                {
                  label: t("weeklySummary.sessions"),
                  value: weeklyStats.sessions.toString(),
                  color: "text-green-400",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 rounded-xl p-3 border border-white/5"
                >
                  <p className="text-[10px] text-gray-500 mb-1">{item.label}</p>
                  <p className={`text-sm font-bold ${item.color}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#13131f] rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold">
                {t("goalProgress.title")}
              </h3>
            </div>
            <div className="space-y-4">
              {[
                {
                  label: t("goalProgress.workoutsThisMonth"),
                  current: monthlyStats.workoutsThisMonth,
                  target: 20,
                  color: "bg-purple-500",
                },
                {
                  label: t("goalProgress.caloriesGoal"),
                  current: monthlyStats.caloriesBurned,
                  target: 20000,
                  color: "bg-orange-500",
                },
                {
                  label: t("goalProgress.streakGoal"),
                  current: stats.streak,
                  target: 30,
                  color: "bg-blue-500",
                },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-gray-500">
                      {item.current.toLocaleString()}/
                      {item.target.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-700`}
                      style={{
                        width: `${Math.min(
                          (item.current / item.target) * 100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Followers / Following modal ── */}
      <FollowListModal
        open={listModal !== null}
        type={listModal}
        userId={targetUserId}
        onClose={() => setListModal(null)}
      />
    </div>
  );
}
