// src/pages/Discover.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  SlidersHorizontal,
  Users,
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
import { useTranslation } from "react-i18next";
import BottomNav from "../components/BottomNav.jsx";
import api from "../api/axios.js";
import RecommendedCard from "../components/RecommendedCard";
import { inferCategory } from "../utils/categoryInference.js";

// ── Category config ──
const CATEGORIES = [
  { name: "Strength", icon: <Dumbbell size={16} /> },
  { name: "Cardio", icon: <Heart size={16} /> },
  { name: "HIIT", icon: <Zap size={16} /> },
  { name: "Pilates", icon: <Wind size={16} /> },
  { name: "Yoga", icon: <Leaf size={16} /> },
  { name: "Other", icon: <Flame size={16} /> },
];

const mapRecommendation = (workout) => ({
  ...workout,
  _id: workout._id || workout.id,
  title: workout.title || workout.name || "Untitled workout",
  difficulty: workout.difficulty || workout.level || "Beginner",
  createdAt: workout.createdAt,
});
const CATEGORY_ICON = CATEGORIES.reduce((acc, c) => {
  acc[c.name] = c.icon;
  return acc;
}, {});

const FOR_YOU_PREVIEW_COUNT = 5;
// ─── Skeletons ───
const Skel = ({ className = "" }) => (
  <div className={`bg-white/[0.06] rounded-lg animate-pulse ${className}`} />
);

const ForYouSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: FOR_YOU_PREVIEW_COUNT }).map((_, i) => (
      <div
        key={i}
        className="bg-[#13131a] rounded-2xl border border-white/5 flex items-center gap-4 px-4 py-3.5"
      >
        <Skel className="w-8 h-8 rounded-lg shrink-0" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <Skel className="h-3.5 w-2/3" />
          <Skel className="h-2.5 w-1/3" />
        </div>
        <Skel className="h-3 w-16 shrink-0 rounded-full" />
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
        <Skel className="h-3 w-2/3" />
      </div>
    ))}
  </div>
);

const UserAvatar = ({
  user,
  failed,
  onError,
  size = "w-11 h-11",
  altFallback,
}) => {
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
        alt={user.name || altFallback}
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

const BADGE_STYLES = {
  "🌱 Beginner Friendly":
    "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  "🔥 Active This Week":
    "bg-orange-500/10 text-orange-300 border-orange-500/20",
  "💬 Supportive": "bg-purple-500/10 text-purple-300 border-purple-500/20",
};

const UserBadges = ({ badges }) => {
  if (!badges || badges.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {badges.map((badge) => (
        <span
          key={badge}
          className={`text-[10px] px-2 py-0.5 rounded-full border ${
            BADGE_STYLES[badge] || "bg-white/5 text-gray-400 border-white/5"
          }`}
        >
          {badge}
        </span>
      ))}
    </div>
  );
};

// ── Module-level chip components (moved outside Discover to prevent
// re-mounting on every render) ──
function FilterChip({ label, selected, onClick }) {
  return (
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
}

function QuickChip({ label, selected, onClick }) {
  return (
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
}

export default function Discover() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(["discover", "common"]);

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

  const [failedAvatars, setFailedAvatars] = useState({});
  const markAvatarFailed = (key) =>
    setFailedAvatars((prev) => ({ ...prev, [key]: true }));

  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const showToast = useCallback((message, type = "success") => {
    clearTimeout(toastTimerRef.current);
    setToast({ message, type });

    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 2000);
  }, []);

  useEffect(() => {
    return () => clearTimeout(toastTimerRef.current);
  }, []);

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
  const [forYouWorkouts, setForYouWorkouts] = useState([]);
  const [newThisWeek, setNewThisWeek] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState({
    forYou: true,
    newThisWeek: true,
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
    sort: "Relevant",
  });
  const [pendingFilters, setPendingFilters] = useState({
    category: null,
    level: null,
    sort: "Relevant",
  });
  const [quickLevel, setQuickLevel] = useState(null);
  const [quickDuration, setQuickDuration] = useState(null);
  const [showAllForYou, setShowAllForYou] = useState(false);

  const searchTimeoutRef = useRef(null);
  const searchRequestId = useRef(0);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const hydrateFollowState = useCallback((users) => {
    const next = {};
    users.forEach((u) => {
      if (u.handle) next[u.handle] = !!u.isFollowing;
    });
    setFollowedUsers(next);
  }, []);

  const fetchDiscoverData = useCallback(async () => {
    try {
      setLoading({ forYou: true, newThisWeek: true, users: true });
      setError(null);

      const [workoutsRes, usersRes] = await Promise.all([
        api.get("/workouts").catch(() => null),
        api.get("/users").catch(() => null),
      ]);

      const apiUsers =
        usersRes?.data?.data?.users ?? usersRes?.data?.users ?? [];
      const mergedUsers = apiUsers.map((u, idx) => ({
        id: u.id || u._id || `api-user-${idx}`,
        name: u.name || "User",
        handle: u.handle?.startsWith("@") ? u.handle : `@${u.handle || "user"}`,
        avatar: u.avatar || "",
        bio: u.bio || "Fitness enthusiast",
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
        badges:
          u.badges || (u.level === "Beginner" ? ["🌱 Beginner Friendly"] : []),
      }));

      const usersData = mergedUsers;

      const apiWorkouts =
        workoutsRes?.data?.data?.workouts ?? workoutsRes?.data?.workouts ?? [];

      const forYouData = Array.isArray(apiWorkouts) ? apiWorkouts : [];

      const newThisWeekData = forYouData
        .filter((workout) => {
          if (!workout.createdAt) return false;

          const createdAt = new Date(workout.createdAt).getTime();

          return (
            Number.isFinite(createdAt) &&
            createdAt >= Date.now() - 7 * 24 * 60 * 60 * 1000
          );
        })
        .map(mapRecommendation)
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        );

      setForYouWorkouts(forYouData);
      setNewThisWeek(newThisWeekData);
      setSuggestedUsers(usersData);
      hydrateFollowState(usersData);
    } catch (err) {
      console.error("Discover fetch error:", err);
      setError(t("discover:loadError"));
      //setForYouWorkouts(MOCK_FOR_YOU);
      //setNewThisWeek(MOCK_NEW_THIS_WEEK);
      setSuggestedUsers([]);
      hydrateFollowState([]);
    } finally {
      setLoading({ forYou: false, newThisWeek: false, users: false });
    }
  }, [t, hydrateFollowState]);

  useEffect(() => {
    fetchDiscoverData();
  }, [fetchDiscoverData]);

  const runSearch = useCallback(
    async (query) => {
      if (!query.trim()) {
        fetchDiscoverData();
        return;
      }

      const requestId = ++searchRequestId.current;

      try {
        setLoading({ forYou: true, newThisWeek: true, users: true });

        const [searchWorkouts, searchUsers] = await Promise.all([
          api.get("/workouts").catch(() => null),
          api.get("/users").catch(() => null),
        ]);

        if (requestId !== searchRequestId.current) return;

        const allWorkouts =
          searchWorkouts?.data?.data?.workouts ??
          searchWorkouts?.data?.workouts ??
          [];
        const allUsers =
          searchUsers?.data?.data?.users ?? searchUsers?.data?.users ?? [];

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

        setForYouWorkouts(filteredWorkouts);
        setNewThisWeek([]);
        setSuggestedUsers(matchedUsers);
        hydrateFollowState(matchedUsers);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        if (requestId === searchRequestId.current) {
          setLoading({ forYou: false, newThisWeek: false, users: false });
        }
      }
    },
    [fetchDiscoverData, hydrateFollowState],
  );

  const handleSearchInputChange = (value) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      runSearch(value);
    }, 300);
  };

  const toggleFollow = async (handle) => {
    if (followLoading[handle]) return;

    const cleanHandle = handle.replace("@", "");
    const isFollowing = followedUsers[handle];

    setFollowLoading((prev) => ({
      ...prev,
      [handle]: true,
    }));

    try {
      // Optimistic follow state update
      setFollowedUsers((prev) => ({
        ...prev,
        [handle]: !isFollowing,
      }));

      const res = await api.post(`/users/${cleanHandle}/follow`);

      const following = res.data?.data?.following ?? res.data?.following;

      if (typeof following !== "boolean") {
        throw new Error("Invalid follow response");
      }

      // Synchronize state with backend
      setFollowedUsers((prev) => ({
        ...prev,
        [handle]: following,
      }));

      // Display the same notification style as Profile

      showToast(
        following ? `Following ${cleanHandle}` : `Unfollowed ${cleanHandle}`,
        "success",
      );
    } catch (err) {
      console.error("Follow error:", err);

      setFollowedUsers((prev) => ({
        ...prev,
        [handle]: isFollowing,
      }));

      showToast("Failed to update follow status", "error");
    } finally {
      setFollowLoading((prev) => ({
        ...prev,
        [handle]: false,
      }));
    }
  };

  const matchesCategory = (item, categoryName) => {
    if (!categoryName) return true;
    if (item.category == null && item.focus == null) return true;
    return (item.category || item.focus) === categoryName;
  };

  const matchesLevel = (item, levelName) => {
    if (!levelName) return true;
    const itemLevel = item.level || item.difficulty;
    if (itemLevel == null) return true;
    return itemLevel === levelName;
  };

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

  const applyClientFilters = (items) => {
    let filtered = items.filter(
      (item) =>
        matchesCategory(item, filters.category) &&
        matchesLevel(item, filters.level) &&
        matchesLevel(item, quickLevel) &&
        matchesDuration(item, quickDuration),
    );

    if (filters.sort === "Recent") {
      filtered = [...filtered].reverse();
    }
    return filtered;
  };

  const filteredForYou = applyClientFilters(forYouWorkouts);
  const filteredNewThisWeek = applyClientFilters(newThisWeek);
  const filteredUsers = applyClientFilters(suggestedUsers);

  const displayedForYou = showAllForYou
    ? filteredForYou
    : filteredForYou.slice(0, FOR_YOU_PREVIEW_COUNT);
  const hasMoreForYou = filteredForYou.length > FOR_YOU_PREVIEW_COUNT;

  const activeFilterCount = [
    filters.category,
    filters.level,
    filters.sort !== "Relevant" ? filters.sort : null,
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
    const reset = { category: null, level: null, sort: "Relevant" };
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
  const sortOptions = ["Relevant", "Recent"];
  const quickLevels = ["Beginner", "Intermediate", "Advanced"];
  const quickDurations = ["< 20 min", "< 30 min", "< 45 min", "45+ min"];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-4 pb-28 px-4 max-w-lg mx-auto">
      {/* Toast notification */}
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
        <p className="text-lg text-white uppercase tracking-widest font-extrabold">
          {t("common:appName")}
        </p>
        <div className="absolute left-1/2 -translate-x-1/2 text-center">
          <h1 className="text-lg text-gray-500 leading-tight">
            {t("discover:header")}
          </h1>
        </div>

        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="relative group focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-full"
            aria-label={t("discover:profileMenu.ariaLabel")}
          >
            {hasAvatar && !imgError ? (
              <img
                src={avatarUrl}
                alt={user?.name || t("discover:profileMenu.profileAlt")}
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
                  {user?.name || t("common:userFallback")}
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
                {t("discover:profileMenu.myProfile")}
              </Link>
              <Link
                to="/settings"
                onClick={() => setShowProfileMenu(false)}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5"
              >
                <Settings size={14} className="text-gray-500" />
                {t("discover:profileMenu.settings")}
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
                {t("discover:profileMenu.logOut")}
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
            placeholder={t("discover:searchPlaceholder")}
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
            label={t("discover:quickFilters.allLevels")}
            selected={!quickLevel}
            onClick={() => setQuickLevel(null)}
          />
          {quickLevels.map((l) => (
            <QuickChip
              key={`ql-${l}`}
              label={t(`discover:levelLabels.${l}`)}
              selected={quickLevel === l}
              onClick={() => setQuickLevel(quickLevel === l ? null : l)}
            />
          ))}
          <div className="w-px h-6 bg-white/5 shrink-0 self-center mx-1" />
          {quickDurations.map((d) => (
            <QuickChip
              key={`qd-${d}`}
              label={t(`discover:durationLabels.${d}`)}
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
              {t(`discover:categoryLabels.${filters.category}`)}
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
              {t(`discover:levelLabels.${filters.level}`)}
              <button
                onClick={() => setFilters((f) => ({ ...f, level: null }))}
              >
                <X size={10} />
              </button>
            </span>
          )}
          {filters.sort !== "Relevant" && (
            <span className="flex items-center gap-1 text-[10px] px-2.5 py-1 bg-white/5 border border-white/10 text-gray-300 rounded-full">
              {t(`discover:sortLabels.${filters.sort}`)}
              <button
                onClick={() => setFilters((f) => ({ ...f, sort: "Relevant" }))}
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
          {t("discover:categoriesTitle")}
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
                  {t(`discover:categoryLabels.${cat.name}`)}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Made for You (formerly Trending) ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs text-gray-500 uppercase tracking-widest">
            {t("discover:forYou.title", { defaultValue: "Made for You" })}
          </h2>
          {hasMoreForYou && (
            <button
              onClick={() => setShowAllForYou((prev) => !prev)}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              {showAllForYou
                ? t("discover:forYou.showLess", { defaultValue: "Show less" })
                : t("discover:forYou.seeAll", { defaultValue: "See all" })}
            </button>
          )}
        </div>

        {loading.forYou ? (
          <ForYouSkeleton />
        ) : filteredForYou.length === 0 ? (
          <p className="text-xs text-gray-600 py-4 text-center">
            {t("discover:forYou.noResults", {
              defaultValue: "No workouts match your filters",
            })}
          </p>
        ) : (
          <div className="space-y-2">
            {displayedForYou.map((w) => {
              const key = w._id || w.id || `foryou-${w.title}`;
              const goToWorkout = () =>
                navigate(`/workout-plan/${w._id || w.id}`);

              const resolvedCategory = w.category || inferCategory(w);
              const tag =
                w.tag ||
                (w.level === "Beginner" ? "Beginner Friendly" : w.level);

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
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 shrink-0">
                    {CATEGORY_ICON[resolvedCategory] || CATEGORY_ICON.Other}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{w.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t(`discover:categoryLabels.${resolvedCategory}`, {
                        defaultValue: resolvedCategory,
                      })}{" "}
                      · {w.duration ? `${w.duration} min` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] px-2.5 py-1 rounded-full bg-white/5 text-gray-400 border border-white/5">
                    {tag}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── New This Week (horizontal scroll) ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs text-gray-500 uppercase tracking-widest">
            {t("discover:newThisWeek.title")}
          </h2>
          <button
            onClick={() => navigate("/discover")}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            {t("discover:newThisWeek.seeAll")}
          </button>
        </div>

        {loading.newThisWeek ? (
          <RecsSkeleton />
        ) : filteredNewThisWeek.length === 0 ? (
          <p className="text-xs text-gray-600 py-4 text-center">
            {t("discover:newThisWeek.noResults")}
          </p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
            {filteredNewThisWeek.map((rec, idx) => (
              <RecommendedCard key={rec._id || idx} workout={rec} />
            ))}
          </div>
        )}
      </div>

      {/* ── People Like You (formerly People You May Like) ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-gray-500" />
            <h2 className="text-xs text-gray-500 uppercase tracking-widest">
              {t("discover:people.title", { defaultValue: "People Like You" })}
            </h2>
          </div>
          <button className="text-xs text-gray-400 hover:text-white transition-colors">
            {t("discover:people.seeAll")}
          </button>
        </div>

        {loading.users ? (
          <UsersSkeleton />
        ) : filteredUsers.length === 0 ? (
          <p className="text-xs text-gray-600 py-4 text-center">
            {t("discover:people.noResults")}
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
                      altFallback={t("discover:profileMenu.profileAlt")}
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
                        t("discover:people.following")
                      ) : (
                        t("discover:people.follow")
                      )}
                    </button>
                  </div>

                  <UserBadges badges={u.badges} />

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/5">
                      {t(`discover:categoryLabels.${u.focus}`, {
                        defaultValue: u.focus,
                      })}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/5">
                      {t(`discover:levelLabels.${u.level}`, {
                        defaultValue: u.level,
                      })}
                    </span>
                    <span className="text-[10px] text-gray-500 ml-auto">
                      {u.bio}
                    </span>
                  </div>
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
              <h2 className="text-base font-bold">
                {t("discover:filterModal.title")}
              </h2>
              <button
                onClick={() => setShowFilter(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
                {t("discover:filterModal.category")}
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <FilterChip
                    key={`filter-${cat.name}`}
                    label={t(`discover:categoryLabels.${cat.name}`)}
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
                {t("discover:filterModal.difficultyLevel")}
              </p>
              <div className="flex flex-wrap gap-2">
                {levels.map((level) => (
                  <FilterChip
                    key={`filter-level-${level}`}
                    label={t(`discover:levelLabels.${level}`)}
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
                {t("discover:filterModal.sortBy")}
              </p>
              <div className="flex flex-wrap gap-2">
                {sortOptions.map((sort) => (
                  <FilterChip
                    key={`filter-sort-${sort}`}
                    label={t(`discover:sortLabels.${sort}`, {
                      defaultValue: sort,
                    })}
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
                {t("discover:filterModal.reset")}
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 py-3 rounded-2xl bg-[#8b5cf6] text-sm font-semibold text-white hover:bg-[#7c3aed] active:scale-[0.98] transition-all"
              >
                {t("discover:filterModal.applyFilters")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
