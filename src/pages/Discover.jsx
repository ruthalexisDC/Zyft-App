// // src/pages/Discover.jsx
// import { useState, useEffect, useRef } from "react";
// import {
//   Search,
//   SlidersHorizontal,
//   Users,
//   TrendingUp,
//   Zap,
//   Heart,
//   Wind,
//   Dumbbell,
//   X,
//   Check,
//   Flame,
//   Leaf,
//   Loader2,
//   UserCircle,
//   Settings,
//   LogOut,
// } from "lucide-react";
// import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext.jsx";
// import BottomNav from "../components/BottomNav.jsx";
// import api from "../api/axios.js";

// // ── Category color config ──
// const CATEGORY_COLORS = {
//   Strength: {
//     border: "border-l-purple-500",
//     dot: "bg-purple-500",
//     text: "text-purple-400",
//     badge: "bg-purple-500/10 border-purple-500/20 text-purple-300",
//     tile: "from-purple-500/20 to-purple-600/10 border-purple-500/20 text-purple-400",
//     icon: <Dumbbell size={16} />,
//   },
//   Cardio: {
//     border: "border-l-pink-500",
//     dot: "bg-pink-500",
//     text: "text-pink-400",
//     badge: "bg-pink-500/10 border-pink-500/20 text-pink-300",
//     tile: "from-pink-500/20 to-pink-600/10 border-pink-500/20 text-pink-400",
//     icon: <Heart size={16} />,
//   },
//   HIIT: {
//     border: "border-l-yellow-500",
//     dot: "bg-yellow-500",
//     text: "text-yellow-400",
//     badge: "bg-yellow-500/10 border-yellow-500/20 text-yellow-300",
//     tile: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/20 text-yellow-400",
//     icon: <Zap size={16} />,
//   },
//   Pilates: {
//     border: "border-l-blue-500",
//     dot: "bg-blue-500",
//     text: "text-blue-400",
//     badge: "bg-blue-500/10 border-blue-500/20 text-blue-300",
//     tile: "from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400",
//     icon: <Wind size={16} />,
//   },
//   Yoga: {
//     border: "border-l-green-500",
//     dot: "bg-green-500",
//     text: "text-green-400",
//     badge: "bg-green-500/10 border-green-500/20 text-green-300",
//     tile: "from-green-500/20 to-green-600/10 border-green-500/20 text-green-400",
//     icon: <Leaf size={16} />,
//   },
//   Other: {
//     border: "border-l-orange-500",
//     dot: "bg-orange-500",
//     text: "text-orange-400",
//     badge: "bg-orange-500/10 border-orange-500/20 text-orange-300",
//     tile: "from-orange-500/20 to-orange-600/10 border-orange-500/20 text-orange-400",
//     icon: <Flame size={16} />,
//   },
// };

// // ── Mock data fallback ──
// const MOCK_TRENDING = [
//   {
//     id: "t1",
//     title: "5x5 Stronglifts",
//     category: "Strength",
//     level: "Intermediate",
//     likes: "4.1k",
//     likesNum: 4100,
//   },
//   {
//     id: "t2",
//     title: "30-min HIIT Blast",
//     category: "HIIT",
//     level: "Advanced",
//     likes: "3.8k",
//     likesNum: 3800,
//   },
//   {
//     id: "t3",
//     title: "Couch to 5K",
//     category: "Cardio",
//     level: "Beginner",
//     likes: "2.9k",
//     likesNum: 2900,
//   },
//   {
//     id: "t4",
//     title: "Pilates Core Burn",
//     category: "Pilates",
//     level: "Beginner",
//     likes: "2.1k",
//     likesNum: 2100,
//   },
//   {
//     id: "t5",
//     title: "Deadlift Mastery",
//     category: "Strength",
//     level: "Advanced",
//     likes: "1.9k",
//     likesNum: 1900,
//   },
// ];

// const MOCK_RECOMMENDATIONS = [
//   {
//     id: "r1",
//     title: "Build Strength",
//     members: "2.4k",
//     tag: "Popular",
//     tagColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
//     category: "Strength",
//     level: "Intermediate",
//   },
//   {
//     id: "r2",
//     title: "Lose Weight",
//     members: "2.2k",
//     tag: "Trending",
//     tagColor: "text-green-400 bg-green-500/10 border-green-500/20",
//     category: "Cardio",
//     level: "Beginner",
//   },
//   {
//     id: "r3",
//     title: "Quick Workout",
//     members: "2.2k",
//     tag: "New",
//     tagColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
//     category: "HIIT",
//     level: "Beginner",
//   },
//   {
//     id: "r4",
//     title: "Power Lifting",
//     members: "1.8k",
//     tag: "Popular",
//     tagColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
//     category: "Strength",
//     level: "Advanced",
//   },
//   {
//     id: "r5",
//     title: "Morning Flow",
//     members: "1.5k",
//     tag: "Trending",
//     tagColor: "text-green-400 bg-green-500/10 border-green-500/20",
//     category: "Yoga",
//     level: "Beginner",
//   },
//   {
//     id: "r6",
//     title: "Core & Calm",
//     members: "1.1k",
//     tag: "New",
//     tagColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
//     category: "Pilates",
//     level: "Beginner",
//   },
// ];

// const MOCK_USERS = [
//   {
//     id: "u1",
//     initials: "SC",
//     name: "Sarah Chen",
//     handle: "@sarahfit",
//     level: "Intermediate",
//     focus: "Strength",
//     bio: "Very Supportive 🔥",
//     color: "from-[#8b5cf6] to-[#a78bfa]",
//     workouts: 142,
//     followers: "1.2k",
//     followersNum: 1200,
//   },
//   {
//     id: "u2",
//     initials: "MK",
//     name: "Mike Kim",
//     handle: "@mikelifts",
//     level: "Advanced",
//     focus: "Cardio",
//     bio: "Lifting since 2018 💪",
//     color: "from-blue-500 to-blue-400",
//     workouts: 310,
//     followers: "3.4k",
//     followersNum: 3400,
//   },
//   {
//     id: "u3",
//     initials: "EJ",
//     name: "Emma J.",
//     handle: "@emmaj",
//     level: "Beginner",
//     focus: "Cardio",
//     bio: "Running every day 🏃‍♀️",
//     color: "from-pink-500 to-pink-400",
//     workouts: 54,
//     followers: "890",
//     followersNum: 890,
//   },
//   {
//     id: "u4",
//     initials: "DK",
//     name: "David K.",
//     handle: "@davidk",
//     level: "Advanced",
//     focus: "Strength",
//     bio: "No days off 🏋️",
//     color: "from-green-500 to-green-400",
//     workouts: 280,
//     followers: "2.1k",
//     followersNum: 2100,
//   },
// ];

// export default function Discover() {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();

//   // DEBUG: Log user object to see what we have
//   console.log("🔍 USER OBJECT:", user);
//   console.log("🔍 USER AVATAR:", user?.avatar);

//   const userInitial = user?.name?.charAt(0).toUpperCase() || "Y";

//   // More robust avatar check - handles empty strings, null, undefined
//   const avatarUrl = user?.avatar;
//   const hasAvatar =
//     avatarUrl &&
//     typeof avatarUrl === "string" &&
//     avatarUrl.trim() !== "" &&
//     avatarUrl !== "undefined" &&
//     avatarUrl !== "null";

//   // DEBUG
//   console.log("🔍 HAS AVATAR:", hasAvatar, "URL:", avatarUrl);

//   // Profile dropdown state
//   const [showProfileMenu, setShowProfileMenu] = useState(false);
//   const [imgError, setImgError] = useState(false);
//   const profileMenuRef = useRef(null);

//   // Close profile menu on click outside
//   useEffect(() => {
//     if (!showProfileMenu) return;
//     const handleClick = (e) => {
//       if (
//         profileMenuRef.current &&
//         !profileMenuRef.current.contains(e.target)
//       ) {
//         setShowProfileMenu(false);
//       }
//     };
//     document.addEventListener("click", handleClick);
//     return () => document.removeEventListener("click", handleClick);
//   }, [showProfileMenu]);

//   // ── API Data States ──
//   const [trendingWorkouts, setTrendingWorkouts] = useState([]);
//   const [recommendations, setRecommendations] = useState([]);
//   const [suggestedUsers, setSuggestedUsers] = useState([]);
//   const [loading, setLoading] = useState({
//     trending: true,
//     recs: true,
//     users: true,
//   });
//   const [error, setError] = useState(null);

//   // ── UI States ──
//   const [searchQuery, setSearchQuery] = useState("");
//   const [activeCategory, setActiveCategory] = useState(null);
//   const [followedUsers, setFollowedUsers] = useState({});
//   const [showFilter, setShowFilter] = useState(false);
//   const [filters, setFilters] = useState({
//     category: null,
//     level: null,
//     sort: "Popular",
//   });
//   const [pendingFilters, setPendingFilters] = useState({
//     category: null,
//     level: null,
//     sort: "Popular",
//   });
//   const [quickLevel, setQuickLevel] = useState(null);
//   const [quickDuration, setQuickDuration] = useState(null);

//   // ── Fetch Data on Mount ──
//   useEffect(() => {
//     fetchDiscoverData();
//   }, []);

//   const fetchDiscoverData = async () => {
//     try {
//       setLoading({ trending: true, recs: true, users: true });
//       setError(null);

//       const [trendingRes, recsRes, usersRes] = await Promise.all([
//         api.get("/workouts").catch(() => null),
//         api.get("/posts/feed").catch(() => null),
//         api.get("/users").catch(() => null),
//       ]);

//       // Process users data - merge API data with defaults
//       const apiUsers = usersRes?.data?.users || [];
//       const mergedUsers = apiUsers.map((u, idx) => ({
//         id: u.id || u._id || `api-user-${idx}`,
//         name: u.name || "User",
//         handle: u.handle?.startsWith("@") ? u.handle : `@${u.handle || "user"}`,
//         avatar: u.avatar || "",
//         bio: u.bio || "Fitness enthusiast",
//         workouts: u.workouts || Math.floor(Math.random() * 200) + 20,
//         followers: u.followers || "0",
//         followersNum: u.followersNum || u.followers || 0,
//         initials:
//           u.initials ||
//           u.name
//             ?.split(" ")
//             .map((w) => w[0])
//             .join("")
//             .toUpperCase()
//             .slice(0, 2) ||
//           "U",
//         color:
//           u.color ||
//           [
//             "from-[#8b5cf6] to-[#a78bfa]",
//             "from-blue-500 to-blue-400",
//             "from-pink-500 to-pink-400",
//             "from-green-500 to-green-400",
//           ][idx % 4],
//         focus: u.focus || "Strength",
//         level: u.level || "Intermediate",
//       }));

//       const usersData = mergedUsers.length > 0 ? mergedUsers : MOCK_USERS;

//       const trendingData =
//         trendingRes?.data?.workouts?.length > 0
//           ? trendingRes.data.workouts
//           : MOCK_TRENDING;
//       const recsData =
//         recsRes?.data?.posts?.length > 0
//           ? recsRes.data.posts
//           : recsRes?.data?.workouts?.length > 0
//             ? recsRes.data.workouts
//             : MOCK_RECOMMENDATIONS;

//       setTrendingWorkouts(trendingData);
//       setRecommendations(recsData);
//       setSuggestedUsers(usersData);
//     } catch (err) {
//       console.error("Discover fetch error:", err);
//       setTrendingWorkouts(MOCK_TRENDING);
//       setRecommendations(MOCK_RECOMMENDATIONS);
//       setSuggestedUsers(MOCK_USERS);
//     } finally {
//       setLoading({ trending: false, recs: false, users: false });
//     }
//   };

//   // ── Search Handler ──
//   const handleSearch = async (query) => {
//     setSearchQuery(query);
//     if (!query.trim()) {
//       fetchDiscoverData();
//       return;
//     }
//     try {
//       setLoading({ trending: true, recs: true, users: false });
//       const [searchWorkouts, searchUsers] = await Promise.all([
//         api.get("/workouts").catch(() => null),
//         api.get("/users").catch(() => null),
//       ]);

//       const allWorkouts =
//         searchWorkouts?.data?.workouts?.length > 0
//           ? searchWorkouts.data.workouts
//           : MOCK_TRENDING;
//       const allUsers =
//         searchUsers?.data?.users?.length > 0
//           ? searchUsers.data.users
//           : MOCK_USERS;

//       const filteredWorkouts = allWorkouts.filter(
//         (w) =>
//           w.title?.toLowerCase().includes(query.toLowerCase()) ||
//           w.category?.toLowerCase().includes(query.toLowerCase()),
//       );
//       const filteredUsers = allUsers.filter(
//         (u) =>
//           u.name?.toLowerCase().includes(query.toLowerCase()) ||
//           u.handle?.toLowerCase().includes(query.toLowerCase()),
//       );

//       setTrendingWorkouts(filteredWorkouts);
//       setRecommendations([]);
//       setSuggestedUsers(filteredUsers);
//     } catch (err) {
//       console.error("Search error:", err);
//     } finally {
//       setLoading({ trending: false, recs: false, users: false });
//     }
//   };

//   // ── Follow/Unfollow Handler ──
//   const toggleFollow = async (handle) => {
//     const cleanHandle = handle.replace("@", "");
//     const isFollowing = followedUsers[handle];

//     try {
//       // Optimistic update
//       setFollowedUsers((prev) => ({ ...prev, [handle]: !isFollowing }));

//       // Always call /follow — backend toggles
//       const res = await api.post(`/users/${cleanHandle}/follow`);

//       // Sync with server response
//       setFollowedUsers((prev) => ({ ...prev, [handle]: res.data.following }));
//     } catch (err) {
//       console.error("Follow error:", err);
//       // Revert on error
//       setFollowedUsers((prev) => ({ ...prev, [handle]: isFollowing }));
//     }
//   };

//   // ── Filter Logic ──
//   const applyClientFilters = (items, key = "likesNum") => {
//     let filtered = [...items];

//     if (filters.category) {
//       filtered = filtered.filter((item) => item.category === filters.category);
//     }
//     if (filters.level) {
//       filtered = filtered.filter((item) => item.level === filters.level);
//     }
//     if (quickLevel) {
//       filtered = filtered.filter((item) => item.level === quickLevel);
//     }
//     if (filters.sort === "Newest") {
//       filtered.reverse();
//     } else if (filters.sort === "Trending") {
//       filtered.sort((a, b) => (b[key] || 0) - (a[key] || 0));
//     }
//     return filtered;
//   };

//   const filteredTrending = applyClientFilters(trendingWorkouts, "likesNum");
//   const filteredRecs = applyClientFilters(recommendations, "membersNum");
//   const filteredUsers = applyClientFilters(suggestedUsers, "followersNum");

//   const activeFilterCount = [
//     filters.category,
//     filters.level,
//     filters.sort !== "Popular" ? filters.sort : null,
//   ].filter(Boolean).length;

//   // ── UI Helpers ──
//   const openFilter = () => {
//     setPendingFilters({ ...filters });
//     setShowFilter(true);
//   };

//   const applyFilters = () => {
//     setFilters({ ...pendingFilters });
//     setShowFilter(false);
//   };

//   const resetFilters = () => {
//     const reset = { category: null, level: null, sort: "Popular" };
//     setPendingFilters(reset);
//     setFilters(reset);
//     setQuickLevel(null);
//     setQuickDuration(null);
//     setShowFilter(false);
//   };

//   const categories = Object.entries(CATEGORY_COLORS).map(([name, cfg], i) => ({
//     id: i + 1,
//     name,
//     icon: cfg.icon,
//     color: cfg.tile,
//   }));

//   const levels = ["Beginner", "Intermediate", "Advanced"];
//   const sortOptions = ["Popular", "Newest", "Trending"];
//   const quickLevels = ["Beginner", "Intermediate", "Advanced"];
//   const quickDurations = ["< 20 min", "< 30 min", "< 45 min", "45+ min"];

//   // ── Components ──
//   const FilterChip = ({ label, selected, onClick }) => (
//     <button
//       onClick={onClick}
//       className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border transition-all active:scale-95 ${
//         selected
//           ? "bg-[#8b5cf6] border-[#8b5cf6] text-white"
//           : "bg-[#1a1a2e] border-white/10 text-gray-400 hover:text-white"
//       }`}
//     >
//       {selected && <Check size={11} />}
//       {label}
//     </button>
//   );

//   const QuickChip = ({ label, selected, onClick }) => (
//     <button
//       onClick={onClick}
//       className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 whitespace-nowrap ${
//         selected
//           ? "bg-[#8b5cf6] border-[#8b5cf6] text-white"
//           : "bg-[#13131f] border-white/5 text-gray-400 hover:text-white"
//       }`}
//     >
//       {label}
//     </button>
//   );

//   const LoadingSpinner = () => (
//     <div className="flex items-center justify-center py-8">
//       <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-[#0a0a0a] text-white pt-4 pb-28 px-4 max-w-lg mx-auto">
//       {/* ── Header with Functional Profile Photo ── */}
//       <div className="flex items-center justify-between mb-6 relative">
//         <p className="text-lg text-white uppercase tracking-widest font-extrabold">
//           ZYFT
//         </p>
//         <div className="absolute left-1/2 -translate-x-1/2 text-center">
//           <h1 className="text-lg text-gray-500 leading-tight">Discover</h1>
//         </div>

//         {/* Profile Photo - Functional with Dropdown */}
//         <div className="relative" ref={profileMenuRef}>
//           <button
//             onClick={() => setShowProfileMenu(!showProfileMenu)}
//             className="relative group focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-full"
//             aria-label="Profile menu"
//           >
//             {/* Show avatar image if available and no error */}
//             {hasAvatar && !imgError ? (
//               <img
//                 src={avatarUrl}
//                 alt={user?.name || "Profile"}
//                 className="w-9 h-9 rounded-full object-cover border-2 border-purple-500/30 group-hover:border-purple-400 transition-all"
//                 onError={(e) => {
//                   console.error("❌ Image failed to load:", avatarUrl);
//                   setImgError(true);
//                 }}
//                 onLoad={() => console.log("✅ Image loaded:", avatarUrl)}
//               />
//             ) : null}

//             {/* Fallback gradient avatar - show if no avatar or image error */}
//             {(!hasAvatar || imgError) && (
//               <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#a78bfa] flex items-center justify-center text-sm font-bold border-2 border-purple-500/30 group-hover:border-purple-400 transition-all">
//                 {userInitial}
//               </div>
//             )}

//             {/* Online indicator */}
//             <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
//           </button>

//           {/* Profile Dropdown Menu */}
//           {showProfileMenu && (
//             <div className="absolute right-0 top-11 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-xl shadow-black/50 py-1 min-w-[180px] z-50">
//               <div className="px-4 py-3 border-b border-white/5">
//                 <p className="text-sm font-semibold text-white">
//                   {user?.name || "User"}
//                 </p>
//                 <p className="text-xs text-gray-500">
//                   {user?.handle ? `@${user.handle}` : "@user"}
//                 </p>
//                 {/* Debug info */}
//                 <p className="text-[10px] text-gray-600 mt-1">
//                   Avatar: {hasAvatar ? "✅" : "❌"} {imgError ? "(Error)" : ""}
//                 </p>
//               </div>

//               <Link
//                 to="/profile"
//                 onClick={() => setShowProfileMenu(false)}
//                 className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5"
//               >
//                 <UserCircle size={14} className="text-purple-400" />
//                 My Profile
//               </Link>

//               <Link
//                 to="/settings"
//                 onClick={() => setShowProfileMenu(false)}
//                 className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5"
//               >
//                 <Settings size={14} className="text-gray-500" />
//                 Settings
//               </Link>

//               <div className="my-1 border-t border-white/5" />

//               <button
//                 onClick={() => {
//                   logout();
//                   setShowProfileMenu(false);
//                 }}
//                 className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2.5"
//               >
//                 <LogOut size={14} />
//                 Log Out
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* ── Search Bar ── */}
//       <div className="relative mb-3">
//         <div className="flex items-center bg-[#13131f] rounded-2xl border border-white/5 px-4 py-3 focus-within:border-purple-500/30 transition-all">
//           <Search className="w-4 h-4 text-gray-500 shrink-0" />
//           <input
//             type="text"
//             placeholder="Search workouts, athletes..."
//             value={searchQuery}
//             onChange={(e) => handleSearch(e.target.value)}
//             className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 ml-3 focus:outline-none"
//           />
//           <button
//             onClick={openFilter}
//             className={`relative w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
//               activeFilterCount > 0
//                 ? "bg-[#8b5cf6] border border-[#8b5cf6]"
//                 : "bg-purple-500/10 border border-purple-500/20"
//             }`}
//           >
//             <SlidersHorizontal
//               className={`w-4 h-4 ${activeFilterCount > 0 ? "text-white" : "text-purple-400"}`}
//             />
//             {activeFilterCount > 0 && (
//               <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-bold text-white">
//                 {activeFilterCount}
//               </span>
//             )}
//           </button>
//         </div>
//       </div>

//       {/* ── Quick Filter Chips ── */}
//       <div className="mb-4">
//         <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
//           <QuickChip
//             label="All Levels"
//             selected={!quickLevel}
//             onClick={() => setQuickLevel(null)}
//           />
//           {quickLevels.map((l) => (
//             <QuickChip
//               key={`ql-${l}`}
//               label={l}
//               selected={quickLevel === l}
//               onClick={() => setQuickLevel(quickLevel === l ? null : l)}
//             />
//           ))}
//           <div className="w-px h-6 bg-white/5 shrink-0 self-center mx-1" />
//           {quickDurations.map((d) => (
//             <QuickChip
//               key={`qd-${d}`}
//               label={d}
//               selected={quickDuration === d}
//               onClick={() => setQuickDuration(quickDuration === d ? null : d)}
//             />
//           ))}
//         </div>
//       </div>

//       {/* Active filter pills */}
//       {activeFilterCount > 0 && (
//         <div className="flex items-center gap-2 mb-4 flex-wrap">
//           {filters.category && (
//             <span className="flex items-center gap-1 text-[10px] px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-full">
//               {filters.category}
//               <button
//                 onClick={() => setFilters((f) => ({ ...f, category: null }))}
//               >
//                 <X size={10} />
//               </button>
//             </span>
//           )}
//           {filters.level && (
//             <span className="flex items-center gap-1 text-[10px] px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-full">
//               {filters.level}
//               <button
//                 onClick={() => setFilters((f) => ({ ...f, level: null }))}
//               >
//                 <X size={10} />
//               </button>
//             </span>
//           )}
//           {filters.sort !== "Popular" && (
//             <span className="flex items-center gap-1 text-[10px] px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-300 rounded-full">
//               {filters.sort}
//               <button
//                 onClick={() => setFilters((f) => ({ ...f, sort: "Popular" }))}
//               >
//                 <X size={10} />
//               </button>
//             </span>
//           )}
//         </div>
//       )}

//       {/* ── Categories ── */}
//       <div className="mb-6">
//         <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3">
//           Categories
//         </h2>
//         <div className="grid grid-cols-2 gap-3 mb-3">
//           {categories.slice(0, 4).map((cat) => (
//             <button
//               key={`cat-top-${cat.id}`}
//               onClick={() =>
//                 setActiveCategory(activeCategory === cat.id ? null : cat.id)
//               }
//               className={`bg-gradient-to-br ${cat.color} border rounded-2xl py-4 px-5 flex items-center gap-2.5 font-medium text-sm active:scale-95 transition-all ${
//                 activeCategory === cat.id ? "ring-1 ring-white/20" : ""
//               }`}
//             >
//               {cat.icon}
//               {cat.name}
//             </button>
//           ))}
//         </div>
//         <div className="grid grid-cols-2 gap-3">
//           {categories.slice(4).map((cat) => (
//             <button
//               key={`cat-bottom-${cat.id}`}
//               onClick={() =>
//                 setActiveCategory(activeCategory === cat.id ? null : cat.id)
//               }
//               className={`bg-gradient-to-br ${cat.color} border rounded-2xl py-4 px-5 flex items-center gap-2.5 font-medium text-sm active:scale-95 transition-all ${
//                 activeCategory === cat.id ? "ring-1 ring-white/20" : ""
//               }`}
//             >
//               {cat.icon}
//               {cat.name}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* ── Trending Workouts ── */}
//       <div className="mb-6">
//         <div className="flex items-center justify-between mb-3">
//           <div className="flex items-center gap-2">
//             <TrendingUp size={14} className="text-purple-400" />
//             <h2 className="text-xs text-gray-500 uppercase tracking-widest">
//               Trending
//             </h2>
//           </div>
//           <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
//             See all
//           </button>
//         </div>

//         {loading.trending ? (
//           <LoadingSpinner />
//         ) : filteredTrending.length === 0 ? (
//           <p className="text-xs text-gray-600 py-4 text-center">
//             No workouts match your filters
//           </p>
//         ) : (
//           <div className="space-y-2">
//             {filteredTrending.map((w, idx) => {
//               const cfg = CATEGORY_COLORS[w.category] || CATEGORY_COLORS.Other;
//               const key = w.id || w._id || `trending-${idx}`;
//               return (
//                 <div
//                   key={key}
//                   className={`bg-[#13131f] rounded-2xl border border-white/5 border-l-4 ${cfg.border} flex items-center gap-4 px-4 py-3.5 hover:border-r-purple-500/20 active:scale-[0.98] transition-all cursor-pointer`}
//                 >
//                   <span className="text-2xl font-bold text-white/10 w-6 shrink-0">
//                     {String(idx + 1).padStart(2, "0")}
//                   </span>
//                   <div className="flex-1 min-w-0">
//                     <p className="text-sm font-semibold truncate">{w.title}</p>
//                     <div className="flex items-center gap-1.5 mt-0.5">
//                       <span
//                         className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`}
//                       />
//                       <p className="text-xs text-gray-500">
//                         {w.category} · {w.level}
//                       </p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
//                     <Heart size={12} className="text-pink-400" />
//                     <span>{w.likes}</span>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>

//       {/* ── Recommended ── */}
//       <div className="mb-6">
//         <div className="flex items-center justify-between mb-3">
//           <h2 className="text-xs text-gray-500 uppercase tracking-widest">
//             Recommended for you
//           </h2>
//           <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
//             See all
//           </button>
//         </div>

//         {loading.recs ? (
//           <LoadingSpinner />
//         ) : filteredRecs.length === 0 ? (
//           <p className="text-xs text-gray-600 py-4 text-center">
//             No recommendations match your filters
//           </p>
//         ) : (
//           <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
//             {filteredRecs.map((rec, idx) => {
//               const cfg =
//                 CATEGORY_COLORS[rec.category] || CATEGORY_COLORS.Other;
//               const key = rec.id || rec._id || `rec-${idx}`;
//               return (
//                 <div
//                   key={key}
//                   className="shrink-0 w-44 bg-[#13131f] rounded-2xl p-4 border border-white/5 hover:border-purple-500/20 active:scale-[0.97] transition-all cursor-pointer flex flex-col gap-3"
//                 >
//                   <div
//                     className={`w-10 h-10 rounded-xl border flex items-center justify-center ${cfg.badge}`}
//                   >
//                     {cfg.icon}
//                   </div>
//                   <div className="flex-1">
//                     <p className="text-sm font-semibold leading-tight">
//                       {rec.title}
//                     </p>
//                     <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
//                       <Users size={10} />
//                       <span>{rec.members}</span>
//                       <span>·</span>
//                       <span>{rec.level}</span>
//                     </div>
//                   </div>
//                   <span
//                     className={`self-start text-[10px] font-medium px-2 py-0.5 rounded-full border ${rec.tagColor}`}
//                   >
//                     {rec.tag}
//                   </span>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>

//       {/* ── People You May Like ── */}
//       <div>
//         <div className="flex items-center justify-between mb-3">
//           <div className="flex items-center gap-2">
//             <Users size={14} className="text-purple-400" />
//             <h2 className="text-xs text-gray-500 uppercase tracking-widest">
//               People you may like
//             </h2>
//           </div>
//           <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
//             See all
//           </button>
//         </div>

//         {loading.users ? (
//           <LoadingSpinner />
//         ) : filteredUsers.length === 0 ? (
//           <p className="text-xs text-gray-600 py-4 text-center">
//             No users match your filters
//           </p>
//         ) : (
//           <div className="space-y-3">
//             {filteredUsers.map((u, idx) => {
//               const key = u.id || u._id || `user-${idx}`;
//               return (
//                 <div
//                   key={key}
//                   className="bg-[#13131f] rounded-2xl p-4 border border-white/5 hover:border-purple-500/10 transition-all"
//                 >
//                   <div className="flex items-center gap-3 mb-3">
//                     <div
//                       className={`w-11 h-11 rounded-full bg-gradient-to-br ${u.color} flex items-center justify-center text-sm font-bold shrink-0`}
//                     >
//                       {u.initials}
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <h3 className="text-sm font-semibold">{u.name}</h3>
//                       <p className="text-xs text-gray-500">{u.handle}</p>
//                     </div>
//                     <button
//                       onClick={() => toggleFollow(u.handle)}
//                       className={`text-xs font-medium px-4 py-1.5 rounded-full active:scale-95 transition-all shrink-0 ${
//                         followedUsers[u.handle]
//                           ? "bg-white/5 border border-white/10 text-gray-400"
//                           : "bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
//                       }`}
//                     >
//                       {followedUsers[u.handle] ? "Following" : "Follow"}
//                     </button>
//                   </div>
//                   <div className="flex items-center gap-4 mb-2">
//                     <div className="text-center">
//                       <p className="text-sm font-bold">{u.workouts}</p>
//                       <p className="text-[10px] text-gray-500">Workouts</p>
//                     </div>
//                     <div className="w-px h-6 bg-white/5" />
//                     <div className="text-center">
//                       <p className="text-sm font-bold">{u.followers}</p>
//                       <p className="text-[10px] text-gray-500">Followers</p>
//                     </div>
//                     <div className="w-px h-6 bg-white/5" />
//                     <div className="flex items-center gap-1">
//                       <span
//                         className={`text-xs font-medium ${(CATEGORY_COLORS[u.focus] || CATEGORY_COLORS.Other).text}`}
//                       >
//                         {u.focus}
//                       </span>
//                       <span className="text-gray-600">·</span>
//                       <span className="text-xs text-gray-500">{u.level}</span>
//                     </div>
//                   </div>
//                   <p className="text-xs text-gray-500">{u.bio}</p>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>

//       {/* ── Filter Modal ── */}
//       {showFilter && (
//         <>
//           <div
//             className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
//             onClick={() => setShowFilter(false)}
//           />
//           <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-[#13131f] border-t border-white/10 rounded-t-3xl z-50 p-6 pb-28 max-h-[80vh] overflow-y-auto">
//             <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6" />
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-base font-bold">Filter & Sort</h2>
//               <button
//                 onClick={() => setShowFilter(false)}
//                 className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all"
//               >
//                 <X size={16} />
//               </button>
//             </div>

//             <div className="mb-6">
//               <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
//                 Category
//               </p>
//               <div className="flex flex-wrap gap-2">
//                 {Object.keys(CATEGORY_COLORS).map((cat) => (
//                   <FilterChip
//                     key={`filter-${cat}`}
//                     label={cat}
//                     selected={pendingFilters.category === cat}
//                     onClick={() =>
//                       setPendingFilters((f) => ({
//                         ...f,
//                         category: f.category === cat ? null : cat,
//                       }))
//                     }
//                   />
//                 ))}
//               </div>
//             </div>

//             <div className="mb-6">
//               <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
//                 Difficulty Level
//               </p>
//               <div className="flex flex-wrap gap-2">
//                 {levels.map((level) => (
//                   <FilterChip
//                     key={`filter-level-${level}`}
//                     label={level}
//                     selected={pendingFilters.level === level}
//                     onClick={() =>
//                       setPendingFilters((f) => ({
//                         ...f,
//                         level: f.level === level ? null : level,
//                       }))
//                     }
//                   />
//                 ))}
//               </div>
//             </div>

//             <div className="mb-8">
//               <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
//                 Sort By
//               </p>
//               <div className="flex flex-wrap gap-2">
//                 {sortOptions.map((sort) => (
//                   <FilterChip
//                     key={`filter-sort-${sort}`}
//                     label={sort}
//                     selected={pendingFilters.sort === sort}
//                     onClick={() => setPendingFilters((f) => ({ ...f, sort }))}
//                   />
//                 ))}
//               </div>
//             </div>

//             <div className="flex gap-3">
//               <button
//                 onClick={resetFilters}
//                 className="flex-1 py-3 rounded-2xl border border-white/10 text-sm text-gray-400 hover:text-white transition-all"
//               >
//                 Reset
//               </button>
//               <button
//                 onClick={applyFilters}
//                 className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all"
//               >
//                 Apply Filters
//               </button>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

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

// ── Category color config ──
const CATEGORY_COLORS = {
  Strength: {
    border: "border-l-purple-500",
    dot: "bg-purple-500",
    text: "text-purple-400",
    badge: "bg-purple-500/10 border-purple-500/20 text-purple-300",
    tile: "from-purple-500/20 to-purple-600/10 border-purple-500/20 text-purple-400",
    icon: <Dumbbell size={16} />,
  },
  Cardio: {
    border: "border-l-pink-500",
    dot: "bg-pink-500",
    text: "text-pink-400",
    badge: "bg-pink-500/10 border-pink-500/20 text-pink-300",
    tile: "from-pink-500/20 to-pink-600/10 border-pink-500/20 text-pink-400",
    icon: <Heart size={16} />,
  },
  HIIT: {
    border: "border-l-yellow-500",
    dot: "bg-yellow-500",
    text: "text-yellow-400",
    badge: "bg-yellow-500/10 border-yellow-500/20 text-yellow-300",
    tile: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/20 text-yellow-400",
    icon: <Zap size={16} />,
  },
  Pilates: {
    border: "border-l-blue-500",
    dot: "bg-blue-500",
    text: "text-blue-400",
    badge: "bg-blue-500/10 border-blue-500/20 text-blue-300",
    tile: "from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400",
    icon: <Wind size={16} />,
  },
  Yoga: {
    border: "border-l-green-500",
    dot: "bg-green-500",
    text: "text-green-400",
    badge: "bg-green-500/10 border-green-500/20 text-green-300",
    tile: "from-green-500/20 to-green-600/10 border-green-500/20 text-green-400",
    icon: <Leaf size={16} />,
  },
  Other: {
    border: "border-l-orange-500",
    dot: "bg-orange-500",
    text: "text-orange-400",
    badge: "bg-orange-500/10 border-orange-500/20 text-orange-300",
    tile: "from-orange-500/20 to-orange-600/10 border-orange-500/20 text-orange-400",
    icon: <Flame size={16} />,
  },
};

// ── Mock data fallback ──
// NOTE: added `duration` (minutes) so the duration quick-chips have something
// to actually filter on while testing without a live backend.
const MOCK_TRENDING = [
  {
    id: "t1",
    title: "5x5 Stronglifts",
    category: "Strength",
    level: "Intermediate",
    likes: "4.1k",
    likesNum: 4100,
    duration: 45,
  },
  {
    id: "t2",
    title: "30-min HIIT Blast",
    category: "HIIT",
    level: "Advanced",
    likes: "3.8k",
    likesNum: 3800,
    duration: 30,
  },
  {
    id: "t3",
    title: "Couch to 5K",
    category: "Cardio",
    level: "Beginner",
    likes: "2.9k",
    likesNum: 2900,
    duration: 25,
  },
  {
    id: "t4",
    title: "Pilates Core Burn",
    category: "Pilates",
    level: "Beginner",
    likes: "2.1k",
    likesNum: 2100,
    duration: 20,
  },
  {
    id: "t5",
    title: "Deadlift Mastery",
    category: "Strength",
    level: "Advanced",
    likes: "1.9k",
    likesNum: 1900,
    duration: 50,
  },
];

// NOTE: added `membersNum` — the "Trending" sort option reads this field,
// but it was previously only ever set on user mocks, never here, so sorting
// recommendations by "Trending" was a silent no-op.
const MOCK_RECOMMENDATIONS = [
  {
    id: "r1",
    title: "Build Strength",
    members: "2.4k",
    membersNum: 2400,
    tag: "Popular",
    tagColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    category: "Strength",
    level: "Intermediate",
  },
  {
    id: "r2",
    title: "Lose Weight",
    members: "2.2k",
    membersNum: 2200,
    tag: "Trending",
    tagColor: "text-green-400 bg-green-500/10 border-green-500/20",
    category: "Cardio",
    level: "Beginner",
  },
  {
    id: "r3",
    title: "Quick Workout",
    members: "2.2k",
    membersNum: 2200,
    tag: "New",
    tagColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    category: "HIIT",
    level: "Beginner",
  },
  {
    id: "r4",
    title: "Power Lifting",
    members: "1.8k",
    membersNum: 1800,
    tag: "Popular",
    tagColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    category: "Strength",
    level: "Advanced",
  },
  {
    id: "r5",
    title: "Morning Flow",
    members: "1.5k",
    membersNum: 1500,
    tag: "Trending",
    tagColor: "text-green-400 bg-green-500/10 border-green-500/20",
    category: "Yoga",
    level: "Beginner",
  },
  {
    id: "r6",
    title: "Core & Calm",
    members: "1.1k",
    membersNum: 1100,
    tag: "New",
    tagColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    category: "Pilates",
    level: "Beginner",
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
    color: "from-[#8b5cf6] to-[#a78bfa]",
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
    color: "from-blue-500 to-blue-400",
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
    color: "from-pink-500 to-pink-400",
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
    color: "from-green-500 to-green-400",
    workouts: 280,
    followers: "2.1k",
    followersNum: 2100,
    isFollowing: false,
  },
];

// Normalize whatever shape /posts/feed returns into what the recommendation
// card expects (title, category, level, members, membersNum, tag, tagColor).
// This is a best-effort mapping based on common field names — once the real
// API response shape for /posts/feed is confirmed, adjust the lookups below
// so real posts don't fall back to "Workout" / "Other" / "New" for everything.
const mapRecommendation = (item, idx) => ({
  id: item.id || item._id || `rec-${idx}`,
  title:
    item.title ||
    item.workout?.title ||
    item.content?.slice(0, 40) ||
    "Workout",
  category: item.category || item.workout?.category || "Other",
  level: item.level || item.workout?.level || "Beginner",
  members: item.members || item.followers || "0",
  membersNum: item.membersNum || item.followersNum || 0,
  tag: item.tag || "New",
  tagColor: item.tagColor || "text-blue-400 bg-blue-500/10 border-blue-500/20",
});

// How many Trending rows to show before the user taps "See all".
const TRENDING_PREVIEW_COUNT = 5;

export default function Discover() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userInitial = user?.name?.charAt(0).toUpperCase() || "Y";

  // Robust avatar check - handles empty strings, null, undefined
  const avatarUrl = user?.avatar;
  const hasAvatar =
    avatarUrl &&
    typeof avatarUrl === "string" &&
    avatarUrl.trim() !== "" &&
    avatarUrl !== "undefined" &&
    avatarUrl !== "null";

  // Profile dropdown state
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [imgError, setImgError] = useState(false);
  const profileMenuRef = useRef(null);

  // Close profile menu on click outside
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
  // followedUsers is hydrated from the server's `isFollowing` flag on fetch
  // (see fetchDiscoverData / runSearch) — it is NOT just local-only state,
  // otherwise it resets to "Follow" on every refresh even when already following.
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

  // Whether the Trending section is expanded past the 5-item preview.
  const [showAllTrending, setShowAllTrending] = useState(false);

  // ── Search debounce / stale-response guards ──
  const searchTimeoutRef = useRef(null);
  const searchRequestId = useRef(0);
  //Use socket context to check if a user is online
  const { isUserOnline } = useSocket();

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // ── Fetch Data on Mount ──
  useEffect(() => {
    fetchDiscoverData();
  }, []);

  // Build a { "@handle": true/false } map from a list of users that carry
  // an `isFollowing` field from the backend, and merge it into followedUsers.
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

      // Process users data - merge API data with defaults
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
        // ── FIX: carry the server's follow status through ──
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
        color:
          u.color ||
          [
            "from-[#8b5cf6] to-[#a78bfa]",
            "from-blue-500 to-blue-400",
            "from-pink-500 to-pink-400",
            "from-green-500 to-green-400",
          ][idx % 4],
        focus: u.focus || "Strength",
        level: u.level || "Intermediate",
      }));

      const usersData = mergedUsers.length > 0 ? mergedUsers : MOCK_USERS;

      const trendingData =
        trendingRes?.data?.workouts?.length > 0
          ? trendingRes.data.workouts
          : MOCK_TRENDING;

      // ── FIX: map real posts/workouts into the shape the recommendation
      // card expects, instead of rendering raw API objects (which were
      // missing tag/tagColor/membersNum and showing as blank/undefined). ──
      const recsData =
        recsRes?.data?.posts?.length > 0
          ? recsRes.data.posts.map(mapRecommendation)
          : recsRes?.data?.workouts?.length > 0
            ? recsRes.data.workouts.map(mapRecommendation)
            : MOCK_RECOMMENDATIONS;

      setTrendingWorkouts(trendingData);
      setRecommendations(recsData);
      setSuggestedUsers(usersData);

      // ── FIX: hydrate the Follow/Following button state from the server ──
      hydrateFollowState(usersData);
    } catch (err) {
      console.error("Discover fetch error:", err);
      // ── FIX: error state was declared but never actually set ──
      setError("Couldn't load fresh data — showing cached recommendations.");
      setTrendingWorkouts(MOCK_TRENDING);
      setRecommendations(MOCK_RECOMMENDATIONS);
      setSuggestedUsers(MOCK_USERS);
      hydrateFollowState(MOCK_USERS);
    } finally {
      setLoading({ trending: false, recs: false, users: false });
    }
  };

  // ── Search input: update text immediately, debounce the actual fetch ──
  const handleSearchInputChange = (value) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      runSearch(value);
    }, 300);
  };

  // ── Search Handler (debounced + stale-response safe) ──
  const runSearch = async (query) => {
    if (!query.trim()) {
      fetchDiscoverData();
      return;
    }

    // Tags this call with an id so that if a newer search starts before this
    // one resolves, the older (stale) response gets discarded instead of
    // overwriting the screen with out-of-date results.
    const requestId = ++searchRequestId.current;

    try {
      // ── FIX: was previously `users: false`, leaving the users section
      // looking "done loading" with stale data while a new search was
      // actually still in flight. ──
      setLoading({ trending: true, recs: true, users: true });

      const [searchWorkouts, searchUsers] = await Promise.all([
        api.get("/workouts").catch(() => null),
        api.get("/users").catch(() => null),
      ]);

      if (requestId !== searchRequestId.current) return; // a newer search won

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

      // ── FIX: keep follow state in sync with search results too ──
      hydrateFollowState(matchedUsers);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      if (requestId === searchRequestId.current) {
        setLoading({ trending: false, recs: false, users: false });
      }
    }
  };

  // ── Follow/Unfollow Handler (now guards against double-tap) ──
  const toggleFollow = async (handle) => {
    if (followLoading[handle]) return; // request already in flight
    const cleanHandle = handle.replace("@", "");
    const isFollowing = followedUsers[handle];

    setFollowLoading((prev) => ({ ...prev, [handle]: true }));
    try {
      // Optimistic update
      setFollowedUsers((prev) => ({ ...prev, [handle]: !isFollowing }));

      // Always call /follow — backend toggles
      const res = await api.post(`/users/${cleanHandle}/follow`);

      // Sync with server response
      setFollowedUsers((prev) => ({ ...prev, [handle]: res.data.following }));
    } catch (err) {
      console.error("Follow error:", err);
      // Revert on error
      setFollowedUsers((prev) => ({ ...prev, [handle]: isFollowing }));
    } finally {
      setFollowLoading((prev) => ({ ...prev, [handle]: false }));
    }
  };

  // ── Filter Logic ──
  // Users store their category under `focus`, workouts/recs under `category`
  // — this checks whichever one the item actually has.
  const matchesCategory = (item, categoryName) => {
    if (!categoryName) return true;
    return (item.category || item.focus) === categoryName;
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
        (!filters.level || item.level === filters.level) &&
        (!quickLevel || item.level === quickLevel) &&
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
  const filteredRecs = applyClientFilters(recommendations, "membersNum");
  const filteredUsers = applyClientFilters(suggestedUsers, "followersNum");

  // Only show the first 5 trending items until "See all" is tapped.
  const displayedTrending = showAllTrending
    ? filteredTrending
    : filteredTrending.slice(0, TRENDING_PREVIEW_COUNT);
  const hasMoreTrending = filteredTrending.length > TRENDING_PREVIEW_COUNT;

  const activeFilterCount = [
    filters.category,
    filters.level,
    filters.sort !== "Popular" ? filters.sort : null,
  ].filter(Boolean).length;

  // ── UI Helpers ──
  const openFilter = () => {
    setPendingFilters({ ...filters });
    setShowFilter(true);
  };

  const applyFilters = () => {
    setFilters({ ...pendingFilters });
    // Keep the category-tile highlight in sync with whatever was chosen
    // in the filter modal, so the two entry points don't disagree.
    const matchedCat = categories.find(
      (c) => c.name === pendingFilters.category,
    );
    setActiveCategory(matchedCat ? matchedCat.id : null);
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

  // Clicking a category tile now actually drives the category filter,
  // instead of just toggling a highlight ring with no effect.
  const handleCategoryClick = (cat) => {
    const isActive = activeCategory === cat.id;
    setActiveCategory(isActive ? null : cat.id);
    setFilters((f) => ({ ...f, category: isActive ? null : cat.name }));
  };

  const categories = Object.entries(CATEGORY_COLORS).map(([name, cfg], i) => ({
    id: i + 1,
    name,
    icon: cfg.icon,
    color: cfg.tile,
  }));

  // Chunk into rows of 2 instead of hardcoding slice(0,4)/slice(4), so the
  // grid still balances correctly if a category is ever added or removed.
  const chunk = (arr, size) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size),
    );

  const levels = ["Beginner", "Intermediate", "Advanced"];
  const sortOptions = ["Popular", "Newest", "Trending"];
  const quickLevels = ["Beginner", "Intermediate", "Advanced"];
  const quickDurations = ["< 20 min", "< 30 min", "< 45 min", "45+ min"];

  // ── Components ──
  const FilterChip = ({ label, selected, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border transition-all active:scale-95 ${
        selected
          ? "bg-[#8b5cf6] border-[#8b5cf6] text-white"
          : "bg-[#1a1a2e] border-white/10 text-gray-400 hover:text-white"
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
          : "bg-[#13131f] border-white/5 text-gray-400 hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-4 pb-28 px-4 max-w-lg mx-auto">
      {/* ── Header with Functional Profile Photo ── */}
      <div className="flex items-center justify-between mb-6 relative">
        <p className="text-lg text-white uppercase tracking-widest font-extrabold">
          ZYFT
        </p>
        <div className="absolute left-1/2 -translate-x-1/2 text-center">
          <h1 className="text-lg text-gray-500 leading-tight">Discover</h1>
        </div>

        {/* Profile Photo - Functional with Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="relative group focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-full"
            aria-label="Profile menu"
          >
            {/* Show avatar image if available and no error */}
            {hasAvatar && !imgError ? (
              <img
                src={avatarUrl}
                alt={user?.name || "Profile"}
                className="w-9 h-9 rounded-full object-cover border-2 border-purple-500/30 group-hover:border-purple-400 transition-all"
                onError={() => setImgError(true)}
              />
            ) : (
              // ── FIX: this previously referenced an undefined `u` variable
              // (leftover from the "People you may like" map below) and
              // crashed the whole page for any user without an avatar set.
              // Falls back to the current user's initial instead. ──
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#a78bfa] flex items-center justify-center text-sm font-bold border-2 border-purple-500/30 group-hover:border-purple-400 transition-all">
                {userInitial}
              </div>
            )}

            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 top-11 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-xl shadow-black/50 py-1 min-w-[180px] z-50">
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
                <UserCircle size={14} className="text-purple-400" />
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

      {/* ── Error banner ── */}
      {error && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* ── Search Bar ── */}
      <div className="relative mb-3">
        <div className="flex items-center bg-[#13131f] rounded-2xl border border-white/5 px-4 py-3 focus-within:border-purple-500/30 transition-all">
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
                ? "bg-[#8b5cf6] border border-[#8b5cf6]"
                : "bg-purple-500/10 border border-purple-500/20"
            }`}
          >
            <SlidersHorizontal
              className={`w-4 h-4 ${activeFilterCount > 0 ? "text-white" : "text-purple-400"}`}
            />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-bold text-white">
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

      {/* Active filter pills */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {filters.category && (
            <span className="flex items-center gap-1 text-[10px] px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-full">
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
            <span className="flex items-center gap-1 text-[10px] px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-full">
              {filters.level}
              <button
                onClick={() => setFilters((f) => ({ ...f, level: null }))}
              >
                <X size={10} />
              </button>
            </span>
          )}
          {filters.sort !== "Popular" && (
            <span className="flex items-center gap-1 text-[10px] px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-300 rounded-full">
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
        {chunk(categories, 2).map((row, rowIdx) => (
          <div
            key={`cat-row-${rowIdx}`}
            className="grid grid-cols-2 gap-3 mb-3 last:mb-0"
          >
            {row.map((cat) => (
              <button
                key={`cat-${cat.id}`}
                onClick={() => handleCategoryClick(cat)}
                className={`bg-gradient-to-br ${cat.color} border rounded-2xl py-4 px-5 flex items-center gap-2.5 font-medium text-sm active:scale-95 transition-all ${
                  activeCategory === cat.id ? "ring-1 ring-white/20" : ""
                }`}
              >
                {cat.icon}
                {cat.name}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* ── Trending Workouts ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-purple-400" />
            <h2 className="text-xs text-gray-500 uppercase tracking-widest">
              Trending
            </h2>
          </div>
          {hasMoreTrending && (
            <button
              onClick={() => setShowAllTrending((prev) => !prev)}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              {showAllTrending ? "Show less" : "See all"}
            </button>
          )}
        </div>

        {loading.trending ? (
          <LoadingSpinner />
        ) : filteredTrending.length === 0 ? (
          <p className="text-xs text-gray-600 py-4 text-center">
            No workouts match your filters
          </p>
        ) : (
          <div className="space-y-2">
            {displayedTrending.map((w, idx) => {
              const cfg = CATEGORY_COLORS[w.category] || CATEGORY_COLORS.Other;
              const key = w.id || w._id || `trending-${idx}`;
              return (
                <div
                  key={key}
                  className={`bg-[#13131f] rounded-2xl border border-white/5 border-l-4 ${cfg.border} flex items-center gap-4 px-4 py-3.5 hover:border-r-purple-500/20 active:scale-[0.98] transition-all cursor-pointer`}
                >
                  <span className="text-2xl font-bold text-white/10 w-6 shrink-0">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{w.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`}
                      />
                      <p className="text-xs text-gray-500">
                        {w.category} · {w.level}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                    <Heart size={12} className="text-pink-400" />
                    <span>{w.likes}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Recommended ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs text-gray-500 uppercase tracking-widest">
            Recommended for you
          </h2>
          <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
            See all
          </button>
        </div>

        {loading.recs ? (
          <LoadingSpinner />
        ) : filteredRecs.length === 0 ? (
          <p className="text-xs text-gray-600 py-4 text-center">
            No recommendations match your filters
          </p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
            {filteredRecs.map((rec, idx) => {
              const cfg =
                CATEGORY_COLORS[rec.category] || CATEGORY_COLORS.Other;
              const key = rec.id || rec._id || `rec-${idx}`;
              return (
                <div
                  key={key}
                  className="shrink-0 w-44 bg-[#13131f] rounded-2xl p-4 border border-white/5 hover:border-purple-500/20 active:scale-[0.97] transition-all cursor-pointer flex flex-col gap-3"
                >
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center ${cfg.badge}`}
                  >
                    {cfg.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold leading-tight">
                      {rec.title}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Users size={10} />
                      <span>{rec.members}</span>
                      <span>·</span>
                      <span>{rec.level}</span>
                    </div>
                  </div>
                  <span
                    className={`self-start text-[10px] font-medium px-2 py-0.5 rounded-full border ${rec.tagColor}`}
                  >
                    {rec.tag}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── People You May Like ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-purple-400" />
            <h2 className="text-xs text-gray-500 uppercase tracking-widest">
              People you may like
            </h2>
          </div>
          <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
            See all
          </button>
        </div>

        {loading.users ? (
          <LoadingSpinner />
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
                  className="bg-[#13131f] rounded-2xl p-4 border border-white/5 hover:border-purple-500/10 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-11 h-11 rounded-full bg-gradient-to-br ${u.color} flex items-center justify-center text-sm font-bold shrink-0`}
                    >
                      {u.initials}
                    </div>
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
                      <span
                        className={`text-xs font-medium ${(CATEGORY_COLORS[u.focus] || CATEGORY_COLORS.Other).text}`}
                      >
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
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-[#13131f] border-t border-white/10 rounded-t-3xl z-50 p-6 pb-28 max-h-[80vh] overflow-y-auto">
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
                {Object.keys(CATEGORY_COLORS).map((cat) => (
                  <FilterChip
                    key={`filter-${cat}`}
                    label={cat}
                    selected={pendingFilters.category === cat}
                    onClick={() =>
                      setPendingFilters((f) => ({
                        ...f,
                        category: f.category === cat ? null : cat,
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
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all"
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
