// src/pages/Discover.jsx
import { useState, useEffect, useRef } from "react";
import {
  Search,
  SlidersHorizontal,
  Users,
  TrendingUp,
  Zap,
  Heart,
  Wind,
  Dumbbell,
  X,
  Check,
  Flame,
  Leaf,
  Loader2,
  UserCircle,
  Settings,
  LogOut,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import BottomNav from "../components/BottomNav.jsx";
import api from "../api/axios.js";
import { useSocket } from "../context/SocketContext.jsx";
import RecommendedCard from "../components/RecommendedCard";

// ── Category config ──
const CATEGORIES = [
  { name: "Strength", icon: <Dumbbell size={16} /> },
  { name: "Cardio", icon: <Heart size={16} /> },
  { name: "HIIT", icon: <Zap size={16} /> },
  { name: "Pilates", icon: <Wind size={16} /> },
  { name: "Yoga", icon: <Leaf size={16} /> },
  { name: "Other", icon: <Flame size={16} /> },
];

const CATEGORY_ICON = CATEGORIES.reduce((acc, c) => {
  acc[c.name] = c.icon;
  return acc;
}, {});

// ── Mock data fallback ──
const MOCK_TRENDING = [
  {
    _id: "t1",
    title: "5x5 Stronglifts",
    category: "Strength",
    level: "Intermediate",
    likes: "4.1k",
    likesNum: 4100,
    duration: 45,
  },
  {
    _id: "t2",
    title: "30-min HIIT Blast",
    category: "HIIT",
    level: "Advanced",
    likes: "3.8k",
    likesNum: 3800,
    duration: 30,
  },
  {
    _id: "t3",
    title: "Couch to 5K",
    category: "Cardio",
    level: "Beginner",
    likes: "2.9k",
    likesNum: 2900,
    duration: 25,
  },
  {
    _id: "t4",
    title: "Pilates Core Burn",
    category: "Pilates",
    level: "Beginner",
    likes: "2.1k",
    likesNum: 2100,
    duration: 20,
  },
  {
    _id: "t5",
    title: "Deadlift Mastery",
    category: "Strength",
    level: "Advanced",
    likes: "1.9k",
    likesNum: 1900,
    duration: 50,
  },
];

const MOCK_RECOMMENDATIONS = [
  {
    _id: "active-rest-day",
    slug: "active-rest-day",
    title: "Active Rest day",
    difficulty: "Beginner",
    icon: "🧘",
  },
  {
    _id: "glute-day",
    slug: "glute-day",
    title: "Glute day",
    difficulty: "Beginner",
    icon: "💪",
  },
  {
    _id: "full-body-strength",
    slug: "full-body-strength",
    title: "Full Body Strength",
    difficulty: "Intermediate",
    icon: "🏋️",
  },
  {
    _id: "upper-body-push-pull",
    slug: "upper-body-push-pull",
    title: "Upper Body Push/Pull",
    difficulty: "Intermediate",
    icon: "🔥",
  },
  {
    _id: "lower-body-power",
    slug: "lower-body-power",
    title: "Lower Body Power",
    difficulty: "Intermediate",
    icon: "🦵",
  },
  {
    _id: "cardio-core",
    slug: "cardio-core",
    title: "Cardio & Core",
    difficulty: "Intermediate",
    icon: "⚡",
  },
];

const MOCK_USERS = [
  {
    id: "u1",
    initials: "SC",
    name: "Sarah Chen",
    handle: "@sarahfit",
    level: "Intermediate",
    focus: "Strength",
    bio: "Very Supportive 🔥",
    workouts: 142,
    followers: "1.2k",
    followersNum: 1200,
    isFollowing: false,
  },
  {
    id: "u2",
    initials: "MK",
    name: "Mike Kim",
    handle: "@mikelifts",
    level: "Advanced",
    focus: "Cardio",
    bio: "Lifting since 2018 💪",
    workouts: 310,
    followers: "3.4k",
    followersNum: 3400,
    isFollowing: false,
  },
  {
    id: "u3",
    initials: "EJ",
    name: "Emma J.",
    handle: "@emmaj",
    level: "Beginner",
    focus: "Cardio",
    bio: "Running every day 🏃‍♀️",
    workouts: 54,
    followers: "890",
    followersNum: 890,
    isFollowing: false,
  },
  {
    id: "u4",
    initials: "DK",
    name: "David K.",
    handle: "@davidk",
    level: "Advanced",
    focus: "Strength",
    bio: "No days off 🏋️",
    workouts: 280,
    followers: "2.1k",
    followersNum: 2100,
    isFollowing: false,
  },
];

// Normalize whatever shape /posts/feed returns into what the recommendation
// card expects (_id, title, difficulty, icon).
const mapRecommendation = (item, idx) => ({
  _id: item._id || item.id || `rec-${idx}`,
  slug: item.slug || item._id || item.id || `rec-${idx}`,
  title:
    item.title ||
    item.workout?.title ||
    item.content?.slice(0, 40) ||
    "Workout",
  difficulty:
    item.difficulty || item.level || item.workout?.level || "Beginner",
  icon:
    item.icon ||
    CATEGORY_ICON[item.category || item.workout?.category || "Other"],
});

// How many Trending rows to show before the user taps "See all".
const TRENDING_PREVIEW_COUNT = 5;

// ─── Skeleton primitive ───
const Skel = ({ className = "" }) => (
  <div className={`bg-white/[0.06] rounded-lg animate-pulse ${className}`} />
);

// ─── Section skeletons ───
const TrendingSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: TRENDING_PREVIEW_COUNT }).map((_, i) => (
      <div
        key={i}
        className="bg-[#13131a] rounded-2xl border border-white/5 flex items-center gap-4 px-4 py-3.5"
      >
        <Skel className="w-6 h-6 shrink-0" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <Skel className="h-3.5 w-2/3" />
          <Skel className="h-2.5 w-1/3" />
        </div>
        <Skel className="h-3 w-8 shrink-0" />
      </div>
    ))}
  </div>
);

const RecsSkeleton = () => (
  <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="shrink-0 w-44 bg-[#13131a] rounded-2xl p-4 border border-white/5 flex flex-col gap-3"
      >
        <Skel className="w-10 h-10 rounded-xl" />
        <div className="space-y-1.5">
          <Skel className="h-3.5 w-4/5" />
          <Skel className="h-2.5 w-3/5" />
        </div>
        <Skel className="h-4 w-14 rounded-full" />
      </div>
    ))}
  </div>
);

const UsersSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className="bg-[#13131a] rounded-2xl p-4 border border-white/5"
      >
        <div className="flex items-center gap-3 mb-3">
          <Skel className="w-11 h-11 rounded-full shrink-0" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <Skel className="h-3.5 w-1/3" />
            <Skel className="h-2.5 w-1/4" />
          </div>
          <Skel className="h-7 w-20 rounded-full shrink-0" />
        </div>
        <div className="flex items-center gap-4 mb-2">
          <Skel className="h-6 w-10" />
          <Skel className="h-6 w-10" />
          <Skel className="h-4 w-20" />
        </div>
        <Skel className="h-3 w-2/3" />
      </div>
    ))}
  </div>
);

// Renders a user's real avatar image when a valid URL is available,
// falling back to an initials circle if there's no URL or it fails to load.
const UserAvatar = ({ user, failed, onError, size = "w-11 h-11" }) => {
  const avatarUrl = user.avatar;
  const hasAvatar =
    avatarUrl &&
    typeof avatarUrl === "string" &&
    avatarUrl.trim() !== "" &&
    avatarUrl !== "undefined" &&
    avatarUrl !== "null";

  if (hasAvatar && !failed) {
    return (
      <img
        src={avatarUrl}
        alt={user.name || "Profile"}
        className={`${size} rounded-full object-cover border border-white/10 shrink-0`}
        onError={onError}
      />
    );
  }

  return (
    <div
      className={`${size} rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold shrink-0 text-gray-300`}
    >
      {user.initials}
    </div>
  );
};

export default function Discover() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userInitial = user?.name?.charAt(0).toUpperCase() || "Y";

  const avatarUrl = user?.avatar;
  const hasAvatar =
    avatarUrl &&
    typeof avatarUrl === "string" &&
    avatarUrl.trim() !== "" &&
    avatarUrl !== "undefined" &&
    avatarUrl !== "null";

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [imgError, setImgError] = useState(false);
  const profileMenuRef = useRef(null);

  // Tracks which suggested users' avatar images have failed to load, keyed
  // by user id, so each card can fall back to its initials independently.
  const [failedAvatars, setFailedAvatars] = useState({});
  const markAvatarFailed = (key) =>
    setFailedAvatars((prev) => ({ ...prev, [key]: true }));

  useEffect(() => {
    if (!showProfileMenu) return;
    const handleClick = (e) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target)
      ) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [showProfileMenu]);

  // ── API Data States ──
  const [trendingWorkouts, setTrendingWorkouts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState({
    trending: true,
    recs: true,
    users: true,
  });
  const [error, setError] = useState(null);

  // ── UI States ──
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [followedUsers, setFollowedUsers] = useState({});
  const [followLoading, setFollowLoading] = useState({});
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    category: null,
    level: null,
    sort: "Popular",
  });
  const [pendingFilters, setPendingFilters] = useState({
    category: null,
    level: null,
    sort: "Popular",
  });
  const [quickLevel, setQuickLevel] = useState(null);
  const [quickDuration, setQuickDuration] = useState(null);
  const [showAllTrending, setShowAllTrending] = useState(false);

  // ── Search debounce ──
  const searchTimeoutRef = useRef(null);
  const searchRequestId = useRef(0);
  const { isUserOnline } = useSocket();

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    fetchDiscoverData();
  }, []);

  const hydrateFollowState = (users) => {
    const next = {};
    users.forEach((u) => {
      if (u.handle) next[u.handle] = !!u.isFollowing;
    });
    setFollowedUsers(next);
  };

  const fetchDiscoverData = async () => {
    try {
      setLoading({ trending: true, recs: true, users: true });
      setError(null);

      const [trendingRes, recsRes, usersRes] = await Promise.all([
        api.get("/workouts").catch(() => null),
        api.get("/posts/feed").catch(() => null),
        api.get("/users").catch(() => null),
      ]);

      const apiUsers = usersRes?.data?.users || [];
      const mergedUsers = apiUsers.map((u, idx) => ({
        id: u.id || u._id || `api-user-${idx}`,
        name: u.name || "User",
        handle: u.handle?.startsWith("@") ? u.handle : `@${u.handle || "user"}`,
        avatar: u.avatar || "",
        bio: u.bio || "Fitness enthusiast",
        workouts: u.workouts || Math.floor(Math.random() * 200) + 20,
        followers: u.followers || "0",
        followersNum: u.followersNum || u.followers || 0,
        isFollowing: !!u.isFollowing,
        initials:
          u.initials ||
          u.name
            ?.split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) ||
          "U",
        focus: u.focus || "Strength",
        level: u.level || "Intermediate",
      }));

      const usersData = mergedUsers.length > 0 ? mergedUsers : MOCK_USERS;

      const trendingData =
        trendingRes?.data?.workouts?.length > 0
          ? trendingRes.data.workouts
          : MOCK_TRENDING;

      const recsData =
        recsRes?.data?.posts?.length > 0
          ? recsRes.data.posts.map(mapRecommendation)
          : recsRes?.data?.workouts?.length > 0
            ? recsRes.data.workouts.map(mapRecommendation)
            : MOCK_RECOMMENDATIONS;

      setTrendingWorkouts(trendingData);
      setRecommendations(recsData);
      setSuggestedUsers(usersData);
      hydrateFollowState(usersData);
    } catch (err) {
      console.error("Discover fetch error:", err);
      setError("Couldn't load fresh data — showing cached recommendations.");
      setTrendingWorkouts(MOCK_TRENDING);
      setRecommendations(MOCK_RECOMMENDATIONS);
      setSuggestedUsers(MOCK_USERS);
      hydrateFollowState(MOCK_USERS);
    } finally {
      setLoading({ trending: false, recs: false, users: false });
    }
  };

  const handleSearchInputChange = (value) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      runSearch(value);
    }, 300);
  };

  const runSearch = async (query) => {
    if (!query.trim()) {
      fetchDiscoverData();
      return;
    }

    const requestId = ++searchRequestId.current;

    try {
      setLoading({ trending: true, recs: true, users: true });

      const [searchWorkouts, searchUsers] = await Promise.all([
        api.get("/workouts").catch(() => null),
        api.get("/users").catch(() => null),
      ]);

      if (requestId !== searchRequestId.current) return;

      const allWorkouts =
        searchWorkouts?.data?.workouts?.length > 0
          ? searchWorkouts.data.workouts
          : MOCK_TRENDING;
      const allUsers =
        searchUsers?.data?.users?.length > 0
          ? searchUsers.data.users
          : MOCK_USERS;

      const filteredWorkouts = allWorkouts.filter(
        (w) =>
          w.title?.toLowerCase().includes(query.toLowerCase()) ||
          w.category?.toLowerCase().includes(query.toLowerCase()),
      );
      const matchedUsers = allUsers.filter(
        (u) =>
          u.name?.toLowerCase().includes(query.toLowerCase()) ||
          u.handle?.toLowerCase().includes(query.toLowerCase()),
      );

      setTrendingWorkouts(filteredWorkouts);
      setRecommendations([]);
      setSuggestedUsers(matchedUsers);
      hydrateFollowState(matchedUsers);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      if (requestId === searchRequestId.current) {
        setLoading({ trending: false, recs: false, users: false });
      }
    }
  };

  const toggleFollow = async (handle) => {
    if (followLoading[handle]) return;
    const cleanHandle = handle.replace("@", "");
    const isFollowing = followedUsers[handle];

    setFollowLoading((prev) => ({ ...prev, [handle]: true }));
    try {
      setFollowedUsers((prev) => ({ ...prev, [handle]: !isFollowing }));
      const res = await api.post(`/users/${cleanHandle}/follow`);
      setFollowedUsers((prev) => ({ ...prev, [handle]: res.data.following }));
    } catch (err) {
      console.error("Follow error:", err);
      setFollowedUsers((prev) => ({ ...prev, [handle]: isFollowing }));
    } finally {
      setFollowLoading((prev) => ({ ...prev, [handle]: false }));
    }
  };

  // ── Filter Logic ──
  // Users store their category under `focus`, workouts under `category` —
  // check whichever the item has. Recommendation cards (workout templates)
  // don't carry either field at all, so rather than filtering them all out
  // whenever a category is picked, leave items with neither field alone.
  const matchesCategory = (item, categoryName) => {
    if (!categoryName) return true;
    if (item.category == null && item.focus == null) return true;
    return (item.category || item.focus) === categoryName;
  };

  // Workouts/users store difficulty under `level`, recommendation cards
  // under `difficulty` — check whichever is present. Same rule as above:
  // if an item has neither field, don't filter it out.
  const matchesLevel = (item, levelName) => {
    if (!levelName) return true;
    const itemLevel = item.level || item.difficulty;
    if (itemLevel == null) return true;
    return itemLevel === levelName;
  };

  // Only applies to items that actually carry a numeric `duration` (workouts).
  // Items without one (recommendations, users) simply aren't affected.
  const matchesDuration = (item, durationLabel) => {
    if (!durationLabel || typeof item.duration !== "number") return true;
    switch (durationLabel) {
      case "< 20 min":
        return item.duration < 20;
      case "< 30 min":
        return item.duration < 30;
      case "< 45 min":
        return item.duration < 45;
      case "45+ min":
        return item.duration >= 45;
      default:
        return true;
    }
  };

  const applyClientFilters = (items, sortKey = "likesNum") => {
    let filtered = items.filter(
      (item) =>
        matchesCategory(item, filters.category) &&
        matchesLevel(item, filters.level) &&
        matchesLevel(item, quickLevel) &&
        matchesDuration(item, quickDuration),
    );

    if (filters.sort === "Newest") {
      filtered = [...filtered].reverse();
    } else if (filters.sort === "Trending") {
      filtered = [...filtered].sort(
        (a, b) => (b[sortKey] || 0) - (a[sortKey] || 0),
      );
    }
    return filtered;
  };

  const filteredTrending = applyClientFilters(trendingWorkouts, "likesNum");
  // NOTE: recommendation cards don't carry a `membersNum`-style popularity
  // field, so choosing "Trending" as the sort here won't reorder this row —
  // it just falls through unchanged. Not broken, just a no-op until the API
  // returns a real popularity signal for workout templates.
  const filteredRecs = applyClientFilters(recommendations, "membersNum");
  const filteredUsers = applyClientFilters(suggestedUsers, "followersNum");

  const displayedTrending = showAllTrending
    ? filteredTrending
    : filteredTrending.slice(0, TRENDING_PREVIEW_COUNT);
  const hasMoreTrending = filteredTrending.length > TRENDING_PREVIEW_COUNT;

  const activeFilterCount = [
    filters.category,
    filters.level,
    filters.sort !== "Popular" ? filters.sort : null,
  ].filter(Boolean).length;

  const openFilter = () => {
    setPendingFilters({ ...filters });
    setShowFilter(true);
  };

  const applyFilters = () => {
    setFilters({ ...pendingFilters });
    setActiveCategory(pendingFilters.category || null);
    setShowFilter(false);
  };

  const resetFilters = () => {
    const reset = { category: null, level: null, sort: "Popular" };
    setPendingFilters(reset);
    setFilters(reset);
    setQuickLevel(null);
    setQuickDuration(null);
    setActiveCategory(null);
    setShowFilter(false);
  };

  const handleCategoryClick = (name) => {
    const isActive = activeCategory === name;
    setActiveCategory(isActive ? null : name);
    setFilters((f) => ({ ...f, category: isActive ? null : name }));
  };

  const chunk = (arr, size) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size),
    );

  const levels = ["Beginner", "Intermediate", "Advanced"];
  const sortOptions = ["Popular", "Newest", "Trending"];
  const quickLevels = ["Beginner", "Intermediate", "Advanced"];
  const quickDurations = ["< 20 min", "< 30 min", "< 45 min", "45+ min"];

  const FilterChip = ({ label, selected, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border transition-all active:scale-95 ${
        selected
          ? "bg-[#8b5cf6] border-[#8b5cf6] text-white"
          : "bg-[#1a1a22] border-white/10 text-gray-400 hover:text-white"
      }`}
    >
      {selected && <Check size={11} />}
      {label}
    </button>
  );

  const QuickChip = ({ label, selected, onClick }) => (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 whitespace-nowrap ${
        selected
          ? "bg-[#8b5cf6] border-[#8b5cf6] text-white"
          : "bg-[#13131a] border-white/5 text-gray-400 hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-4 pb-28 px-4 max-w-lg mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 relative">
        <p className="text-lg text-white uppercase tracking-widest font-extrabold">
          ZYFT
        </p>
        <div className="absolute left-1/2 -translate-x-1/2 text-center">
          <h1 className="text-lg text-gray-500 leading-tight">Discover</h1>
        </div>

        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="relative group focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-full"
            aria-label="Profile menu"
          >
            {hasAvatar && !imgError ? (
              <img
                src={avatarUrl}
                alt={user?.name || "Profile"}
                className="w-9 h-9 rounded-full object-cover border-2 border-white/10 group-hover:border-purple-400/60 transition-all"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#8b5cf6] flex items-center justify-center text-sm font-bold border-2 border-white/10 group-hover:border-purple-400/60 transition-all">
                {userInitial}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-11 bg-[#1a1a22] border border-white/10 rounded-xl shadow-xl shadow-black/50 py-1 min-w-[180px] z-50">
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-sm font-semibold text-white">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.handle ? `@${user.handle}` : "@user"}
                </p>
              </div>
              <Link
                to="/profile"
                onClick={() => setShowProfileMenu(false)}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5"
              >
                <UserCircle size={14} className="text-gray-500" />
                My Profile
              </Link>
              <Link
                to="/settings"
                onClick={() => setShowProfileMenu(false)}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5"
              >
                <Settings size={14} className="text-gray-500" />
                Settings
              </Link>
              <div className="my-1 border-t border-white/5" />
              <button
                onClick={() => {
                  logout();
                  setShowProfileMenu(false);
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2.5"
              >
                <LogOut size={14} />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400">
          {error}
        </div>
      )}

      {/* ── Search Bar ── */}
      <div className="relative mb-3">
        <div className="flex items-center bg-[#13131a] rounded-2xl border border-white/5 px-4 py-3 focus-within:border-white/20 transition-all">
          <Search className="w-4 h-4 text-gray-500 shrink-0" />
          <input
            type="text"
            placeholder="Search workouts, athletes..."
            value={searchQuery}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 ml-3 focus:outline-none"
          />
          <button
            onClick={openFilter}
            className={`relative w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              activeFilterCount > 0
                ? "bg-[#8b5cf6]"
                : "bg-white/5 border border-white/10"
            }`}
          >
            <SlidersHorizontal
              className={`w-4 h-4 ${activeFilterCount > 0 ? "text-white" : "text-gray-400"}`}
            />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white text-[#8b5cf6] rounded-full text-[9px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Quick Filter Chips ── */}
      <div className="mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <QuickChip
            label="All Levels"
            selected={!quickLevel}
            onClick={() => setQuickLevel(null)}
          />
          {quickLevels.map((l) => (
            <QuickChip
              key={`ql-${l}`}
              label={l}
              selected={quickLevel === l}
              onClick={() => setQuickLevel(quickLevel === l ? null : l)}
            />
          ))}
          <div className="w-px h-6 bg-white/5 shrink-0 self-center mx-1" />
          {quickDurations.map((d) => (
            <QuickChip
              key={`qd-${d}`}
              label={d}
              selected={quickDuration === d}
              onClick={() => setQuickDuration(quickDuration === d ? null : d)}
            />
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {filters.category && (
            <span className="flex items-center gap-1 text-[10px] px-2.5 py-1 bg-white/5 border border-white/10 text-gray-300 rounded-full">
              {filters.category}
              <button
                onClick={() => {
                  setFilters((f) => ({ ...f, category: null }));
                  setActiveCategory(null);
                }}
              >
                <X size={10} />
              </button>
            </span>
          )}
          {filters.level && (
            <span className="flex items-center gap-1 text-[10px] px-2.5 py-1 bg-white/5 border border-white/10 text-gray-300 rounded-full">
              {filters.level}
              <button
                onClick={() => setFilters((f) => ({ ...f, level: null }))}
              >
                <X size={10} />
              </button>
            </span>
          )}
          {filters.sort !== "Popular" && (
            <span className="flex items-center gap-1 text-[10px] px-2.5 py-1 bg-white/5 border border-white/10 text-gray-300 rounded-full">
              {filters.sort}
              <button
                onClick={() => setFilters((f) => ({ ...f, sort: "Popular" }))}
              >
                <X size={10} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* ── Categories ── */}
      <div className="mb-6">
        <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3">
          Categories
        </h2>
        {chunk(CATEGORIES, 2).map((row, rowIdx) => (
          <div
            key={`cat-row-${rowIdx}`}
            className="grid grid-cols-2 gap-3 mb-3 last:mb-0"
          >
            {row.map((cat) => {
              const isActive = activeCategory === cat.name;
              return (
                <button
                  key={`cat-${cat.name}`}
                  onClick={() => handleCategoryClick(cat.name)}
                  className={`rounded-2xl py-4 px-5 flex items-center gap-2.5 font-medium text-sm active:scale-95 transition-all border ${
                    isActive
                      ? "bg-[#8b5cf6]/10 border-[#8b5cf6]/40 text-white"
                      : "bg-[#13131a] border-white/5 text-gray-300 hover:border-white/10"
                  }`}
                >
                  <span
                    className={isActive ? "text-[#a78bfa]" : "text-gray-500"}
                  >
                    {cat.icon}
                  </span>
                  {cat.name}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Trending Workouts ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-gray-500" />
            <h2 className="text-xs text-gray-500 uppercase tracking-widest">
              Trending
            </h2>
          </div>
          {hasMoreTrending && (
            <button
              onClick={() => setShowAllTrending((prev) => !prev)}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              {showAllTrending ? "Show less" : "See all"}
            </button>
          )}
        </div>

        {loading.trending ? (
          <TrendingSkeleton />
        ) : filteredTrending.length === 0 ? (
          <p className="text-xs text-gray-600 py-4 text-center">
            No workouts match your filters
          </p>
        ) : (
          <div className="space-y-2">
            {displayedTrending.map((w, idx) => {
              const key = w._id || w.id || `trending-${idx}`;
              const goToWorkout = () =>
                navigate(`/workout-plan/${w._id || w.id}`);
              return (
                <div
                  key={key}
                  role="button"
                  tabIndex={0}
                  onClick={goToWorkout}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      goToWorkout();
                    }
                  }}
                  className="bg-[#13131a] rounded-2xl border border-white/5 flex items-center gap-4 px-4 py-3.5 hover:border-white/10 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span className="text-2xl font-bold text-white/10 w-6 shrink-0">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 shrink-0">
                    {CATEGORY_ICON[w.category] || CATEGORY_ICON.Other}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{w.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {w.category} · {w.level}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                    <Heart size={12} className="text-gray-500" />
                    <span>{w.likes}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Recommended for You (using RecommendedCard) ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs text-gray-500 uppercase tracking-widest">
            Recommended for you
          </h2>
          <button
            onClick={() => navigate("/discover")}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            See all
          </button>
        </div>

        {loading.recs ? (
          <RecsSkeleton />
        ) : filteredRecs.length === 0 ? (
          <p className="text-xs text-gray-600 py-4 text-center">
            No recommendations match your filters
          </p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
            {filteredRecs.map((rec, idx) => (
              <RecommendedCard key={rec._id || idx} workout={rec} />
            ))}
          </div>
        )}
      </div>

      {/* ── People You May Like ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-gray-500" />
            <h2 className="text-xs text-gray-500 uppercase tracking-widest">
              People you may like
            </h2>
          </div>
          <button className="text-xs text-gray-400 hover:text-white transition-colors">
            See all
          </button>
        </div>

        {loading.users ? (
          <UsersSkeleton />
        ) : filteredUsers.length === 0 ? (
          <p className="text-xs text-gray-600 py-4 text-center">
            No users match your filters
          </p>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((u, idx) => {
              const key = u.id || u._id || `user-${idx}`;
              return (
                <div
                  key={key}
                  className="bg-[#13131a] rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <UserAvatar
                      user={u}
                      failed={!!failedAvatars[key]}
                      onError={() => markAvatarFailed(key)}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold">{u.name}</h3>
                      <p className="text-xs text-gray-500">{u.handle}</p>
                    </div>
                    <button
                      onClick={() => toggleFollow(u.handle)}
                      disabled={followLoading[u.handle]}
                      className={`text-xs font-medium px-4 py-1.5 rounded-full active:scale-95 transition-all shrink-0 disabled:opacity-60 ${
                        followedUsers[u.handle]
                          ? "bg-white/5 border border-white/10 text-gray-400"
                          : "bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
                      }`}
                    >
                      {followLoading[u.handle] ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : followedUsers[u.handle] ? (
                        "Following"
                      ) : (
                        "Follow"
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="text-center">
                      <p className="text-sm font-bold">{u.workouts}</p>
                      <p className="text-[10px] text-gray-500">Workouts</p>
                    </div>
                    <div className="w-px h-6 bg-white/5" />
                    <div className="text-center">
                      <p className="text-sm font-bold">{u.followers}</p>
                      <p className="text-[10px] text-gray-500">Followers</p>
                    </div>
                    <div className="w-px h-6 bg-white/5" />
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-gray-300">
                        {u.focus}
                      </span>
                      <span className="text-gray-600">·</span>
                      <span className="text-xs text-gray-500">{u.level}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{u.bio}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Filter Modal ── */}
      {showFilter && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setShowFilter(false)}
          />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-[#13131a] border-t border-white/10 rounded-t-3xl z-50 p-6 pb-28 max-h-[80vh] overflow-y-auto">
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold">Filter & Sort</h2>
              <button
                onClick={() => setShowFilter(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
                Category
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <FilterChip
                    key={`filter-${cat.name}`}
                    label={cat.name}
                    selected={pendingFilters.category === cat.name}
                    onClick={() =>
                      setPendingFilters((f) => ({
                        ...f,
                        category: f.category === cat.name ? null : cat.name,
                      }))
                    }
                  />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
                Difficulty Level
              </p>
              <div className="flex flex-wrap gap-2">
                {levels.map((level) => (
                  <FilterChip
                    key={`filter-level-${level}`}
                    label={level}
                    selected={pendingFilters.level === level}
                    onClick={() =>
                      setPendingFilters((f) => ({
                        ...f,
                        level: f.level === level ? null : level,
                      }))
                    }
                  />
                ))}
              </div>
            </div>

            <div className="mb-8">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
                Sort By
              </p>
              <div className="flex flex-wrap gap-2">
                {sortOptions.map((sort) => (
                  <FilterChip
                    key={`filter-sort-${sort}`}
                    label={sort}
                    selected={pendingFilters.sort === sort}
                    onClick={() => setPendingFilters((f) => ({ ...f, sort }))}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={resetFilters}
                className="flex-1 py-3 rounded-2xl border border-white/10 text-sm text-gray-400 hover:text-white transition-all"
              >
                Reset
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 py-3 rounded-2xl bg-[#8b5cf6] text-sm font-semibold text-white hover:bg-[#7c3aed] active:scale-[0.98] transition-all"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
