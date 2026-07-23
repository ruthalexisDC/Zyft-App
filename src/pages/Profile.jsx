// src/pages/Profile.jsx
import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import {
  Dumbbell,
  TrendingUp,
  Trophy,
  Grid,
  BarChart3,
  Flame,
  Award,
  Settings,
  Heart,
  ChevronRight,
  Zap,
  LogOut,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useSocket } from "../context/SocketContext.jsx";
import FollowListModal from "../components/FollowListModal.jsx";

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
// Counts consecutive calendar days (local time) with at least one workout
// post, walking backward from today. If nothing was logged today, today
// doesn't break the streak as long as yesterday has activity — the streak
// only resets to 0 once there's a gap of more than one day.
const computeStreak = (posts) => {
  if (!posts || posts.length === 0) return 0;

  const dayMs = 24 * 60 * 60 * 1000;
  const activeDays = new Set(
    posts.map((p) => new Date(p.createdAt).toDateString()),
  );

  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  // Anchor the streak to today if there's activity today, otherwise to
  // yesterday (a one-day grace period) — anything older means no streak.
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
// Walks posts oldest-to-newest and tracks the best weight ever logged per
// exercise name. Every time a logged set beats that exercise's previous
// best, it counts as a PR. Bodyweight/no-weight entries (weight <= 0) are
// skipped since there's no meaningful "record" to compare.
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

// ─── Skeleton primitive ───
const Skel = ({ className = "" }) => (
  <div className={`bg-white/[0.06] rounded-lg animate-pulse ${className}`} />
);

// ─── Full-page skeleton that mirrors the real profile layout ───
const ProfileSkeleton = () => (
  <div className="min-h-screen bg-[#0a0a0a] text-white pt-4 pb-28 px-4 max-w-lg mx-auto">
    {/* Header */}
    <div className="flex items-center justify-between mb-6 relative">
      <h1 className="text-xl font-bold text-white/40">ZYFT</h1>
      <div className="w-10 h-10 shrink-0" />
    </div>

    {/* Hero card */}
    <div className="bg-[#13131f] rounded-3xl p-5 mb-4 border border-white/5">
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

    {/* Stat cards */}
    <div className="grid grid-cols-3 gap-3 mb-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-[#13131f] border border-white/5 rounded-2xl p-3 flex flex-col items-center gap-2"
        >
          <Skel className="w-8 h-8 rounded-xl" />
          <Skel className="h-5 w-6" />
          <Skel className="h-2 w-12" />
        </div>
      ))}
    </div>

    {/* Achievements */}
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <Skel className="h-4 w-28" />
        <Skel className="h-3 w-14" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <Skel key={i} className="rounded-2xl aspect-square" />
        ))}
      </div>
    </div>

    {/* Tabs */}
    <Skel className="h-11 rounded-2xl mb-4" />

    {/* Post cards */}
    <div className="space-y-3">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="bg-[#13131f] rounded-2xl overflow-hidden border border-white/5"
        >
          <Skel className="w-full h-36 rounded-none" />
          <div className="flex gap-2 p-3">
            <Skel className="flex-1 h-12 rounded-xl" />
            <Skel className="flex-1 h-12 rounded-xl" />
            <Skel className="flex-1 h-12 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function Profile() {
  const [activeTab, setActiveTab] = useState("Post");
  const [toast, setToast] = useState(null);
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const { userId: paramUserId } = useParams();

  const currentUser = getCurrentUser();
  const currentUserId = currentUser?._id;

  const targetUserId = paramUserId || currentUserId;
  const isOwnProfile = !paramUserId || paramUserId === currentUserId;

  const [posts, setPosts] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [listModal, setListModal] = useState(null); // "followers" | "following" | null
  const { isUserOnline } = useSocket();

  // ─── Check follow status when viewing another user's profile ───
  useEffect(() => {
    if (isOwnProfile || !targetUserId || !currentUserId) return;

    const checkFollowStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
          `/api/users/id/${targetUserId}/follow-status`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
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
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `/api/users/id/${targetUserId}/follow`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setIsFollowing(data.following);

      // NOTE: the backend's /:handle profile route nests counts under
      // `stats: { followers, following }`, so the local optimistic update
      // has to match that same shape or the displayed count won't move.
      setProfileData((prev) => ({
        ...prev,
        stats: {
          ...prev?.stats,
          followers: data.followersCount ?? prev?.stats?.followers,
        },
      }));

      setToast({
        message: data.following
          ? `Following ${displayUser.name}`
          : `Unfollowed ${displayUser.name}`,
        type: "success",
      });
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      console.error("Follow failed:", err);
      setToast({ message: "Failed to follow user", type: "error" });
      setTimeout(() => setToast(null), 2000);
    } finally {
      setFollowLoading(false);
    }
  };

  // ─── Fetch real data ───
  useEffect(() => {
    if (!targetUserId) {
      setError("Please log in to view profiles");
      setLoading(false);
      return;
    }

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const userRes = await axios.get(`/api/users/id/${targetUserId}`, {
          headers,
        });
        setProfileData(userRes.data.user);

        const postsRes = await axios.get(
          `/api/users/id/${targetUserId}/posts?page=1&limit=20`,
          { headers },
        );
        setPosts(postsRes.data.posts || []);
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [targetUserId]);

  // ─── Computed weekly stats from real posts ───
  const weeklyStats = useMemo(() => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
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
  }, [posts]);

  // ─── Monthly stats for Goal Progress ───
  const monthlyStats = useMemo(() => {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
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
  }, [posts]);

  // ─── Streak & PRs, derived from real post history ───
  // The backend doesn't compute streakCount/prsCount yet, so these are
  // calculated client-side from the same posts data everything else here
  // already uses. If the backend later starts returning real values on
  // profileData, those take priority (see `stats` below) — this is just
  // the fallback so the numbers are real instead of always showing 0.
  const computedStreak = useMemo(() => computeStreak(posts), [posts]);
  const computedPRs = useMemo(() => computePRCount(posts), [posts]);

  const handleLogout = () => {
    logout();
    setToast({ message: "Signed out successfully", type: "success" });
    setTimeout(() => {
      setToast(null);
      navigate("/login");
    }, 1500);
  };

  const handleRespect = async (postId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.post(
        `/api/posts/${postId}/respect`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setPosts(
        posts.map((post) =>
          post._id === postId
            ? {
                ...post,
                didRespect: res.data.respected,
                respectCount: res.data.respectCount,
              }
            : post,
        ),
      );
    } catch (err) {
      console.error("Respect failed:", err);
    }
  };

  const getTimeAgo = (date) => {
    const hours = Math.floor((Date.now() - new Date(date)) / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return "Yesterday";
    return new Date(date).toLocaleDateString();
  };

  // ─── Resolve avatar URL ───
  // IMPORTANT: authUser / currentUser are always the LOGGED-IN user's own
  // data. They must only be used as a fallback when this page is showing
  // your own profile. Previously this fell back to your own avatar even
  // when viewing someone else's profile (e.g. James), so anyone without
  // an uploaded avatar appeared to be using YOUR photo instead of a
  // generic placeholder / initials.
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
  // Same rule as avatarUrl above: authUser fallbacks (your own name/handle)
  // must never leak into someone else's profile view.
  //
  // NOTE on followers/following: the backend's GET /api/users/:handle (and
  // /api/users/id/:id) route returns these nested under `stats`:
  //   { stats: { workouts, followers, following } }
  // NOT as flat `followersCount` / `followingCount` fields. Both counts
  // below now read from `profileData.stats.*` to match that shape — this
  // was the root cause of Followers/Following always showing 0.
  const displayUser = {
    _id: profileData?._id || targetUserId,
    name:
      profileData?.name ||
      (isOwnProfile ? authUser?.name : null) ||
      "Your Name",
    handle: profileData?.handle
      ? `@${profileData.handle}`
      : isOwnProfile
        ? authUser?.username || "@yourname"
        : "",
    bio: profileData?.bio || "Fitness enthusiast pushing limits everyday 💪",
    focus: profileData?.focus || "Strength & Running",
    followers:
      profileData?.stats?.followers >= 1000
        ? `${(profileData.stats.followers / 1000).toFixed(1)}k`
        : profileData?.stats?.followers?.toString() || "0",
    following:
      profileData?.stats?.following >= 1000
        ? `${(profileData.stats.following / 1000).toFixed(1)}k`
        : profileData?.stats?.following?.toString() || "0",
    workouts: posts.length.toString(),
    photo: avatarUrl,
  };

  // ─── REAL stats ───
  // streak/prs prefer an authoritative backend value when the API actually
  // provides one (checked with ?? so a real "0" from the backend is
  // respected), and otherwise fall back to the client-side calculation
  // above so the numbers reflect real post history instead of always 0.
  const stats = {
    workout: posts.length,
    streak: profileData?.streakCount ?? computedStreak,
    prs: profileData?.prsCount ?? computedPRs,
  };

  // ─── Dynamic achievements based on real data ───
  const achievements = useMemo(() => {
    const list = [];

    if (stats.streak >= 7) {
      list.push({
        id: "streak",
        icon: <Flame className="w-5 h-5" />,
        label: `${stats.streak}-Day Streak`,
        color: "text-orange-400",
        bg: "bg-orange-500/10 border-orange-500/20",
      });
    }

    if (stats.workout > 0) {
      list.push({
        id: "workouts",
        icon: <Dumbbell className="w-5 h-5" />,
        label: `${stats.workout} Workouts`,
        color: "text-green-400",
        bg: "bg-green-500/10 border-green-500/20",
      });
    }

    if (stats.prs > 0) {
      list.push({
        id: "prs",
        icon: <Trophy className="w-5 h-5" />,
        label: `${stats.prs} PRs`,
        color: "text-yellow-400",
        bg: "bg-yellow-500/10 border-yellow-500/20",
      });
    }

    // Fallback for brand new users
    if (list.length === 0) {
      list.push({
        id: "newcomer",
        icon: <Sparkles className="w-5 h-5" />,
        label: "Newcomer",
        color: "text-purple-400",
        bg: "bg-purple-500/10 border-purple-500/20",
      });
    }

    return list;
  }, [stats]);

  const userInitial = displayUser.name.charAt(0).toUpperCase();

  if (loading) return <ProfileSkeleton />;

  if (error)
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-red-400 flex items-center justify-center">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-4 pb-28 px-4 max-w-lg mx-auto relative">
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
            {isOwnProfile ? "Profile" : `${displayUser.name}'s Profile`}
          </p>
        </div>
        <div className="w-10 h-10 shrink-0" />
      </div>

      {/* ── Profile Hero ── */}
      <div className="bg-[#13131f] rounded-3xl p-5 mb-4 border border-white/5 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between mb-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#a78bfa] flex items-center justify-center overflow-hidden ring-2 ring-purple-500/30">
              {displayUser.photo ? (
                <img
                  src={displayUser.photo}
                  alt="Profile"
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
            {isUserOnline(displayUser._id) && (
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
                  Edit Profile
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
                  "Following"
                ) : (
                  "Follow"
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
          <button
            type="button"
            onClick={() => setListModal("followers")}
            className="flex-1 text-center cursor-pointer group"
          >
            <div className="text-sm font-bold group-hover:text-[#a78bfa] transition-colors">
              {displayUser.followers}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5 group-hover:text-gray-400 transition-colors">
              Followers
            </div>
          </button>
          <div className="w-px h-8 bg-white/10" />
          <button
            type="button"
            onClick={() => setListModal("following")}
            className="flex-1 text-center cursor-pointer group"
          >
            <div className="text-sm font-bold group-hover:text-[#a78bfa] transition-colors">
              {displayUser.following}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5 group-hover:text-gray-400 transition-colors">
              Following
            </div>
          </button>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex-1 text-center">
            <div className="text-sm font-bold">{stats.workout}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Workouts</div>
          </div>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#13131f] border border-purple-500/20 rounded-2xl p-3 flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center mb-1">
            <Dumbbell size={14} className="text-purple-400" />
          </div>
          <span className="text-xl font-bold">{stats.workout}</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">
            Workouts
          </span>
        </div>
        <div className="bg-[#13131f] border border-orange-500/20 rounded-2xl p-3 flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center mb-1">
            <Flame size={14} className="text-orange-400" />
          </div>
          <span className="text-xl font-bold">{stats.streak}</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">
            Streak
          </span>
        </div>
        <div className="bg-[#13131f] border border-yellow-500/20 rounded-2xl p-3 flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-1">
            <Award size={14} className="text-yellow-400" />
          </div>
          <span className="text-xl font-bold">{stats.prs}</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">
            PRs
          </span>
        </div>
      </div>

      {/* ── Achievements ── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <h2 className="text-sm font-bold">Achievements</h2>
          </div>
          <button className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
            See all <ChevronRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`${ach.bg} border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 aspect-square transition-all hover:scale-[1.02] active:scale-[0.98]`}
            >
              <div className={ach.color}>{ach.icon}</div>
              <span className="text-[10px] text-center font-medium text-gray-300 leading-tight">
                {ach.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex bg-[#13131f] rounded-2xl p-1 mb-4 border border-white/5">
        {[
          { key: "Post", icon: <Grid size={14} /> },
          { key: "Stats", icon: <BarChart3 size={14} /> },
        ].map(({ key, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium rounded-xl transition-all ${
              activeTab === key
                ? "bg-[#8b5cf6] text-white shadow-lg shadow-purple-500/20"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {icon}
            {key}
          </button>
        ))}
      </div>

      {/* ── REAL POSTS from MongoDB ── */}
      {activeTab === "Post" && (
        <div className="space-y-3">
          {posts.length === 0 ? (
            <p className="text-gray-500 text-center py-10">
              {isOwnProfile
                ? "No workouts posted yet"
                : "This user hasn't posted yet"}
            </p>
          ) : (
            posts.map((post) => {
              const workout = post.workout;
              const firstExercise = workout?.exercises?.[0];

              return (
                <div
                  key={post._id}
                  className="bg-[#13131f] rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="relative">
                    <img
                      src={
                        workout?.imageUrl ||
                        post.media?.[0]?.url ||
                        "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=200&fit=crop"
                      }
                      alt={workout?.title || "Workout"}
                      className="w-full h-36 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#13131f] via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                      <div>
                        <h3 className="text-sm font-bold drop-shadow">
                          {workout?.title || "Workout"}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {workout?.category} · {getTimeAgo(post.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRespect(post._id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all ${
                          post.didRespect
                            ? "bg-pink-500/20 text-pink-400"
                            : "bg-black/40 text-white hover:bg-black/60"
                        }`}
                      >
                        <Heart
                          size={12}
                          className={post.didRespect ? "fill-current" : ""}
                        />
                        <span className="text-xs font-semibold">
                          {post.respectCount || 0}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 p-3">
                    <div className="flex-1 py-2 rounded-xl text-center text-xs font-semibold bg-white/5 border border-white/5 text-gray-300">
                      <p className="text-[10px] text-gray-500 mb-0.5">Weight</p>
                      {firstExercise?.weight
                        ? `${firstExercise.weight}kg`
                        : "—"}
                    </div>
                    <div className="flex-1 py-2 rounded-xl text-center text-xs font-semibold bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 text-[#a78bfa]">
                      <p className="text-[10px] text-gray-500 mb-0.5">Reps</p>
                      {firstExercise?.reps || "—"}
                    </div>
                    <div className="flex-1 py-2 rounded-xl text-center text-xs font-semibold bg-white/5 border border-white/5 text-gray-300">
                      <p className="text-[10px] text-gray-500 mb-0.5">
                        Duration
                      </p>
                      {workout?.duration ? `${workout.duration}min` : "—"}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Stats Tab ── */}
      {activeTab === "Stats" && (
        <div className="space-y-3">
          <div className="bg-[#13131f] rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={14} className="text-purple-400" />
              <h3 className="text-sm font-semibold">Weekly Summary</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Total Volume",
                  value: `${weeklyStats.totalVolume.toLocaleString()} kg`,
                  color: "text-purple-400",
                },
                {
                  label: "Avg Duration",
                  value: `${weeklyStats.avgDuration} min`,
                  color: "text-blue-400",
                },
                {
                  label: "Calories Burned",
                  value: weeklyStats.totalCalories.toLocaleString(),
                  color: "text-orange-400",
                },
                {
                  label: "Sessions",
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
              <TrendingUp size={14} className="text-purple-400" />
              <h3 className="text-sm font-semibold">Goal Progress</h3>
            </div>
            <div className="space-y-4">
              {[
                {
                  label: "Workouts this month",
                  current: monthlyStats.workoutsThisMonth,
                  target: 20,
                  color: "bg-purple-500",
                },
                {
                  label: "Calories goal",
                  current: monthlyStats.caloriesBurned,
                  target: 20000,
                  color: "bg-orange-500",
                },
                {
                  label: "Streak goal",
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
                        width: `${Math.min((item.current / item.target) * 100, 100)}%`,
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
