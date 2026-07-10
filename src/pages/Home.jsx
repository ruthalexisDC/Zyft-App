// import { useState, useEffect, useMemo, useCallback } from "react";
// import { Link } from "react-router-dom";
// import { useAuth } from "../context/AuthContext.jsx";
// import {
//   Loader2,
//   RefreshCw,
//   Target,
//   Dumbbell,
//   Zap,
//   Flame,
//   CalendarDays,
// } from "lucide-react";
// import { getPosts, updatePost, deletePost, respectPost } from "../api/posts";
// import { getUserStats, updateUserGoal } from "../api/stats";
// import axios from "axios";
// import WorkoutSplitModal from "../components/WorkoutSplitModal";
// import FeedPostCard from "../components/FeedPostCard";

// const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// const API_URL = "http://localhost:5000";

// export default function Home() {
//   const { user, authReady, resetKey } = useAuth();
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [stats, setStats] = useState(null);
//   const [statsLoading, setStatsLoading] = useState(true);
//   const [showGoalModal, setShowGoalModal] = useState(false);
//   const [newGoalInput, setNewGoalInput] = useState("");

//   const [showSplitModal, setShowSplitModal] = useState(false);
//   const [userSplit, setUserSplit] = useState(Array(7).fill("Rest"));
//   const [splitLoading, setSplitLoading] = useState(false);

//   const refreshStats = useCallback(async () => {
//     if (!user?._id) return;
//     setStatsLoading(true);
//     try {
//       const { data } = await getUserStats();
//       setStats(data);
//     } catch (err) {
//       console.error("Failed to refresh stats:", err);
//     } finally {
//       setStatsLoading(false);
//     }
//   }, [user?._id]);

//   const fetchUserSplit = useCallback(async () => {
//     if (!user?._id) return;
//     setSplitLoading(true);
//     try {
//       const token = localStorage.getItem("token");
//       const { data } = await axios.get(
//         `${API_URL}/api/users/${user._id}/split`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         },
//       );
//       if (data.split) setUserSplit(data.split);
//     } catch (err) {
//       console.log("No split found, using default");
//     } finally {
//       setSplitLoading(false);
//     }
//   }, [user?._id]);

//   useEffect(() => {
//     if (!authReady) return;
//     setStats(null);
//     setPosts([]);
//     setError(null);
//     setLoading(true);
//     setStatsLoading(true);
//     setUserSplit(Array(7).fill("Rest"));
//   }, [authReady, resetKey]);

//   useEffect(() => {
//     if (!authReady) return;
//     let cancelled = false;

//     async function loadData() {
//       try {
//         const [postsRes, statsRes] = await Promise.all([
//           getPosts({ type: "community", limit: 50 }),
//           getUserStats(),
//         ]);
//         if (cancelled) return;
//         setPosts(postsRes.data.posts ?? []);
//         setStats(statsRes.data);
//       } catch (err) {
//         if (cancelled) return;
//         console.error(err.response?.data?.message || err.message);
//         setError(err.response?.data?.message || "Failed to load data");
//       } finally {
//         if (!cancelled) {
//           setLoading(false);
//           setStatsLoading(false);
//         }
//       }
//     }

//     loadData();
//     return () => {
//       cancelled = true;
//     };
//   }, [authReady, resetKey]);

//   useEffect(() => {
//     if (stats) {
//       console.log("Raw stats:", stats);
//       console.log("Consistency:", stats.consistency);
//       console.log("Workouts:", stats.workouts);
//       console.log("Goals completed:", stats.goalsCompleted);
//       console.log("Total goals:", stats.totalGoals);
//     }
//   }, [stats]);

//   useEffect(() => {
//     if (!authReady || !user?._id) return;
//     fetchUserSplit();
//   }, [authReady, user?._id, fetchUserSplit]);

//   useEffect(() => {
//     if (!authReady || !user?._id) return;
//     const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
//     const interval = setInterval(() => {
//       console.log("⏰ 24hr tick — refreshing stats");
//       refreshStats();
//     }, TWENTY_FOUR_HOURS);
//     return () => clearInterval(interval);
//   }, [authReady, user?._id, refreshStats]);

//   useEffect(() => {
//     if (!stats) return;
//     const allGoalsAchieved =
//       stats.totalGoals > 0 && stats.goalsCompleted >= stats.totalGoals;
//     if (!allGoalsAchieved) return;

//     const now = new Date();
//     const midnight = new Date(
//       now.getFullYear(),
//       now.getMonth(),
//       now.getDate() + 1,
//       0,
//       0,
//       0,
//       0,
//     );
//     const msUntilMidnight = midnight.getTime() - now.getTime();

//     console.log(
//       `🎯 All goals achieved! Stats reset scheduled in ${Math.round(msUntilMidnight / 1000 / 60)} min`,
//     );

//     const timer = setTimeout(() => {
//       console.log("🌅 Midnight — resetting stats for new day");
//       setStats(null);
//       refreshStats();
//     }, msUntilMidnight);

//     return () => clearTimeout(timer);
//   }, [stats?.goalsCompleted, stats?.totalGoals, refreshStats]);

//   const handleUpdatePost = async (postId, updates) => {
//     try {
//       const { data } = await updatePost(postId, updates);
//       setPosts((prev) => prev.map((p) => (p._id === postId ? data : p)));
//       return data;
//     } catch (err) {
//       console.error("Failed to update post:", err);
//       throw err;
//     }
//   };

//   const handleDeletePost = async (postId) => {
//     if (!confirm("Delete this post? This can't be undone.")) return;
//     try {
//       await deletePost(postId);
//       setPosts((prev) => prev.filter((p) => p._id !== postId));
//     } catch {
//       alert("Failed to delete post");
//     }
//   };

//   const handleRespect = async (postId, currentRespected, currentCount) => {
//     setPosts((prev) =>
//       prev.map((p) =>
//         p._id === postId
//           ? {
//               ...p,
//               didRespect: !currentRespected,
//               respectCount: currentRespected
//                 ? currentCount - 1
//                 : currentCount + 1,
//             }
//           : p,
//       ),
//     );
//     try {
//       await respectPost(postId, !currentRespected);
//     } catch {
//       setPosts((prev) =>
//         prev.map((p) =>
//           p._id === postId
//             ? { ...p, didRespect: currentRespected, respectCount: currentCount }
//             : p,
//         ),
//       );
//     }
//   };

//   const handleSetGoal = async () => {
//     const val = parseInt(newGoalInput);
//     if (!val || val < 1) return;
//     try {
//       await updateUserGoal(val);
//       refreshStats();
//       setShowGoalModal(false);
//       setNewGoalInput("");
//     } catch (err) {
//       console.error("Failed to set goal:", err);
//     }
//   };

//   const userInitial = user?.name?.charAt(0).toUpperCase() || "Y";

//   const greeting = () => {
//     const hour = new Date().getHours();
//     if (hour < 12) return "Good morning";
//     if (hour < 17) return "Good afternoon";
//     return "Good evening";
//   };

//   const todayStats = useMemo(
//     () =>
//       stats ?? {
//         goalsCompleted: 0,
//         totalGoals: 0,
//         workouts: 0,
//         consistency: 0,
//         calories: 0,
//       },
//     [stats],
//   );

//   const goalProgress = useMemo(() => {
//     if (!todayStats.totalGoals) return 0;
//     return Math.min(
//       (todayStats.goalsCompleted / todayStats.totalGoals) * 100,
//       100,
//     );
//   }, [todayStats.goalsCompleted, todayStats.totalGoals]);

//   const todayIndex = useMemo(() => {
//     const day = new Date().getDay();
//     return day === 0 ? 6 : day - 1;
//   }, []);

//   const todayLabel = userSplit[todayIndex];

//   if (!authReady) {
//     return (
//       <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
//         <Loader2 size={28} className="animate-spin text-purple-400" />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-[#0a0a0a] text-white pt-4 pb-28 px-4 max-w-lg mx-auto">
//       {/* ── Header ── */}
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <p className="text-xs text-gray-500 font-extrabold uppercase tracking-widest mb-0.5">
//             Zyft
//           </p>
//           <h1 className="text-lg text-gray-300 leading-tight">
//             {greeting()}, {user?.name?.split(" ")[0] || "Athlete"} 👋
//           </h1>
//         </div>
//         <Link
//           to="/profile"
//           className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#a78bfa] flex items-center justify-center text-sm font-bold hover:ring-2 hover:ring-purple-400 transition-all"
//         >
//           {userInitial}
//         </Link>
//       </div>

//       {/* ── Today's Energy Card ── */}
//       <div className="bg-[#13131f] rounded-2xl p-4 mb-4 border border-white/5 relative overflow-hidden">
//         <div className="absolute -top-6 -right-6 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

//         <div className="flex items-center justify-between mb-1">
//           <h2 className="text-sm font-semibold text-gray-300">
//             Today's Energy
//           </h2>
//           <div className="flex items-center gap-2">
//             <button
//               onClick={refreshStats}
//               disabled={statsLoading}
//               className="text-gray-600 hover:text-gray-400 transition-colors disabled:opacity-30"
//               title="Refresh stats"
//             >
//               <RefreshCw
//                 size={12}
//                 className={statsLoading ? "animate-spin" : ""}
//               />
//             </button>

//             <button
//               onClick={() => !todayStats.totalGoals && setShowGoalModal(true)}
//               className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all ${
//                 todayStats.totalGoals
//                   ? "text-gray-400 bg-[#2a2a3e] border border-white/5"
//                   : "text-gray-500 bg-white/5 hover:bg-white/10 hover:text-gray-300 border border-white/5"
//               }`}
//               title={
//                 todayStats.totalGoals
//                   ? "Goal progress"
//                   : "Tap to set daily goal"
//               }
//             >
//               <Target
//                 size={12}
//                 className={
//                   todayStats.totalGoals ? "text-gray-500" : "text-gray-600"
//                 }
//               />
//               {todayStats.goalsCompleted}/{todayStats.totalGoals || "—"} goals
//             </button>
//           </div>
//         </div>

//         <div className="w-full h-1.5 bg-white/10 rounded-full mb-4 overflow-hidden">
//           <div
//             className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] rounded-full transition-all duration-700"
//             style={{ width: `${goalProgress}%` }}
//           />
//         </div>

//         {statsLoading ? (
//           <div className="flex justify-center py-6">
//             <Loader2 size={20} className="animate-spin text-purple-400" />
//           </div>
//         ) : (
//           <div className="grid grid-cols-3 gap-3">
//             <Link
//               to="/workouts"
//               className="bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 rounded-xl p-3 flex flex-col items-center gap-1 hover:bg-[#8b5cf6]/20 transition-colors"
//             >
//               <div className="w-7 h-7 rounded-full bg-[#8b5cf6]/20 flex items-center justify-center">
//                 <Target size={14} className="text-purple-400" />
//               </div>
//               <span className="text-lg font-bold">{todayStats.workouts}</span>
//               <span className="text-[10px] text-gray-500">This Week</span>
//             </Link>

//             <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex flex-col items-center gap-1">
//               <div className="w-7 h-7 rounded-full bg-yellow-500/20 flex items-center justify-center">
//                 <Zap size={14} className="text-yellow-400" />
//               </div>
//               <span className="text-lg font-bold">{todayStats.calories}</span>
//               <span className="text-[10px] text-gray-500">Total Calories</span>
//             </div>

//             <button
//               onClick={() => setShowSplitModal(true)}
//               className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex flex-col items-center gap-1 hover:bg-blue-500/20 transition-colors relative group"
//             >
//               <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center">
//                 <Flame size={14} className="text-blue-400" />
//               </div>
//               <span className="text-lg font-bold">
//                 {todayStats.consistency ?? 0}%
//               </span>
//               <span className="text-[10px] text-gray-500">
//                 Split Compliance
//               </span>
//               <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
//                 <CalendarDays size={10} className="text-blue-400" />
//               </div>
//             </button>
//           </div>
//         )}

//         {!splitLoading && (
//           <div className="mt-3 pt-3 border-t border-white/5">
//             <div className="flex items-center justify-between mb-1.5">
//               <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
//                 This Week's Split
//               </span>
//               <button
//                 onClick={() => setShowSplitModal(true)}
//                 className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
//               >
//                 Edit
//               </button>
//             </div>
//             <div className="flex gap-1">
//               {DAYS.map((day, i) => {
//                 const isToday = i === todayIndex;
//                 const isRest = userSplit[i] === "Rest";
//                 return (
//                   <div
//                     key={day}
//                     className={`flex-1 rounded-lg py-1.5 px-0.5 text-center transition-all ${
//                       isToday
//                         ? "bg-blue-500/20 border border-blue-500/30"
//                         : isRest
//                           ? "bg-white/5"
//                           : "bg-purple-500/15 border border-purple-500/20"
//                     }`}
//                   >
//                     <p
//                       className={`text-[9px] font-bold ${isToday ? "text-blue-400" : "text-gray-500"}`}
//                     >
//                       {day[0]}
//                     </p>
//                     <p
//                       className={`text-[8px] truncate ${isRest ? "text-gray-600" : isToday ? "text-blue-300" : "text-purple-300"}`}
//                     >
//                       {userSplit[i] === "Rest" ? "—" : userSplit[i]}
//                     </p>
//                   </div>
//                 );
//               })}
//             </div>
//             <p className="text-[10px] text-gray-500 mt-1.5 text-center">
//               Today:{" "}
//               <span
//                 className={
//                   todayLabel === "Rest"
//                     ? "text-gray-500"
//                     : "text-blue-400 font-semibold"
//                 }
//               >
//                 {todayLabel}
//               </span>
//             </p>
//           </div>
//         )}
//       </div>

//       {/* ── Quick Actions ── */}
//       <div className="grid grid-cols-2 gap-3 mb-6">
//         <Link
//           to="/log"
//           className="bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] rounded-2xl p-4 flex items-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all"
//         >
//           <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
//             <Dumbbell size={18} className="text-white" />
//           </div>
//           <div>
//             <p className="text-xs text-purple-200">Ready?</p>
//             <p className="text-sm font-semibold">Log Workout</p>
//           </div>
//         </Link>

//         <Link
//           to="/activity"
//           className="bg-[#13131f] border border-white/5 rounded-2xl p-4 flex items-center gap-3 hover:border-white/10 active:scale-[0.98] transition-all"
//         >
//           <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
//             <Target size={18} className="text-purple-400" />
//           </div>
//           <div>
//             <p className="text-xs text-gray-500">Check</p>
//             <p className="text-sm font-semibold">My Goals</p>
//           </div>
//         </Link>
//       </div>

//       {/* ── Feed Header ── */}
//       <div className="flex items-center justify-between mb-4">
//         <h2 className="text-sm font-semibold">Community Feed</h2>
//         <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
//           See all
//         </button>
//       </div>

//       {/* ── Feed Posts ── */}
//       {loading ? (
//         <div className="flex justify-center py-10">
//           <Loader2 size={24} className="animate-spin text-purple-400" />
//         </div>
//       ) : error ? (
//         <div className="text-center py-10 text-red-400 text-sm">{error}</div>
//       ) : posts.length === 0 ? (
//         <div className="text-center py-10 text-gray-500 text-sm">
//           No posts yet. Be the first to share a workout!
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {posts.map((post) => (
//             <FeedPostCard
//               key={post._id}
//               post={post}
//               currentUserId={user?._id}
//               onUpdate={handleUpdatePost}
//               onDelete={handleDeletePost}
//               onRespect={handleRespect}
//             />
//           ))}
//         </div>
//       )}

//       {!loading && posts.length > 0 && (
//         <button className="w-full py-5 text-xs text-gray-600 hover:text-gray-400 transition-all flex items-center justify-center gap-2 mt-2">
//           Load more posts
//         </button>
//       )}

//       {/* ── Goal Setting Modal ── */}
//       {showGoalModal && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
//           <div className="bg-[#1a1a2e] rounded-2xl p-5 w-full max-w-xs border border-white/10 shadow-xl">
//             <h3 className="text-sm font-semibold mb-1">Set Daily Goal</h3>
//             <p className="text-xs text-gray-500 mb-4">
//               How many workouts today?
//             </p>
//             <input
//               type="number"
//               min="1"
//               max="10"
//               value={newGoalInput}
//               onChange={(e) => setNewGoalInput(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && handleSetGoal()}
//               placeholder="e.g. 3"
//               autoFocus
//               className="w-full bg-[#0a0a0a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-white/10 placeholder-gray-600 mb-4"
//             />
//             <div className="flex gap-2">
//               <button
//                 onClick={() => {
//                   setShowGoalModal(false);
//                   setNewGoalInput("");
//                 }}
//                 className="flex-1 py-2.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSetGoal}
//                 disabled={!newGoalInput || parseInt(newGoalInput) < 1}
//                 className="flex-1 py-2.5 text-xs bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/30 rounded-xl transition-colors"
//               >
//                 Set Goal
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <WorkoutSplitModal
//         isOpen={showSplitModal}
//         onClose={() => setShowSplitModal(false)}
//         userId={user?._id}
//         onSave={(data) => {
//           setUserSplit(data.split);
//           console.log("Split saved:", data.split);
//         }}
//       />
//     </div>
//   );
// }

import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  Loader2,
  RefreshCw,
  Target,
  Dumbbell,
  Zap,
  Flame,
  CalendarDays,
} from "lucide-react";
import { getPosts, updatePost, deletePost, respectPost } from "../api/posts";
import { getUserStats, updateUserGoal } from "../api/stats";
import axios from "axios";
import WorkoutSplitModal from "../components/WorkoutSplitModal";
import FeedPostCard from "../components/FeedPostCard";
import { useSocket } from "../context/SocketContext.jsx";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const API_URL = "http://localhost:5000";

export default function Home() {
  const { user, authReady, resetKey } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoalInput, setNewGoalInput] = useState("");

  const [showSplitModal, setShowSplitModal] = useState(false);
  const [userSplit, setUserSplit] = useState(Array(7).fill("Rest"));
  const [splitLoading, setSplitLoading] = useState(false);
  const { isUserOnline } = useSocket();

  // ── Feed tab state: "community" (global/public) or "following" ──
  const [feedType, setFeedType] = useState("community");

  // ── NEW: Fetch full user profile to get avatar ──
  const [fullUser, setFullUser] = useState(null);

  useEffect(() => {
    if (!authReady || !user?._id) return;

    const fetchFullUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
          `${API_URL}/api/users/id/${user._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setFullUser(data.user);
      } catch (err) {
        console.error("Failed to fetch full user:", err);
      }
    };

    fetchFullUser();
  }, [authReady, user?._id, resetKey]);

  // Use full user data if available, fallback to auth context user
  const currentUser = fullUser || user;

  const refreshStats = useCallback(async () => {
    if (!user?._id) return;
    setStatsLoading(true);
    try {
      const { data } = await getUserStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to refresh stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, [user?._id]);

  const fetchUserSplit = useCallback(async () => {
    if (!user?._id) return;
    setSplitLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `${API_URL}/api/users/${user._id}/split`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (data.split) setUserSplit(data.split);
    } catch (err) {
      console.log("No split found, using default");
    } finally {
      setSplitLoading(false);
    }
  }, [user?._id]);

  // Fetch posts for whichever feed tab is active
  const fetchPosts = useCallback(async (type, signalCancelled) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getPosts({ type, limit: 50 });
      if (signalCancelled?.()) return;
      setPosts(data.posts ?? []);
    } catch (err) {
      if (signalCancelled?.()) return;
      console.error(err.response?.data?.message || err.message);
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      if (!signalCancelled?.()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authReady) return;
    setStats(null);
    setPosts([]);
    setError(null);
    setLoading(true);
    setStatsLoading(true);
    setUserSplit(Array(7).fill("Rest"));
  }, [authReady, resetKey]);

  // Stats load once per auth/reset cycle — not tied to feed tab
  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;

    async function loadStats() {
      try {
        const { data } = await getUserStats();
        if (cancelled) return;
        setStats(data);
      } catch (err) {
        if (cancelled) return;
        console.error(err.response?.data?.message || err.message);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, [authReady, resetKey]);

  // Posts reload whenever auth/reset cycles OR the feed tab changes
  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    fetchPosts(feedType, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [authReady, resetKey, feedType, fetchPosts]);

  useEffect(() => {
    if (stats) {
      console.log("Raw stats:", stats);
      console.log("Consistency:", stats.consistency);
      console.log("Workouts:", stats.workouts);
      console.log("Goals completed:", stats.goalsCompleted);
      console.log("Total goals:", stats.totalGoals);
    }
  }, [stats]);

  useEffect(() => {
    if (!authReady || !user?._id) return;
    fetchUserSplit();
  }, [authReady, user?._id, fetchUserSplit]);

  useEffect(() => {
    if (!authReady || !user?._id) return;
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const interval = setInterval(() => {
      console.log("⏰ 24hr tick — refreshing stats");
      refreshStats();
    }, TWENTY_FOUR_HOURS);
    return () => clearInterval(interval);
  }, [authReady, user?._id, refreshStats]);

  useEffect(() => {
    if (!stats) return;
    const allGoalsAchieved =
      stats.totalGoals > 0 && stats.goalsCompleted >= stats.totalGoals;
    if (!allGoalsAchieved) return;

    const now = new Date();
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      0,
    );
    const msUntilMidnight = midnight.getTime() - now.getTime();

    console.log(
      `🎯 All goals achieved! Stats reset scheduled in ${Math.round(msUntilMidnight / 1000 / 60)} min`,
    );

    const timer = setTimeout(() => {
      console.log("🌅 Midnight — resetting stats for new day");
      setStats(null);
      refreshStats();
    }, msUntilMidnight);

    return () => clearTimeout(timer);
  }, [stats?.goalsCompleted, stats?.totalGoals, refreshStats]);

  const handleUpdatePost = async (postId, updates) => {
    try {
      const { data } = await updatePost(postId, updates);
      setPosts((prev) => prev.map((p) => (p._id === postId ? data : p)));
      return data;
    } catch (err) {
      console.error("Failed to update post:", err);
      throw err;
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm("Delete this post? This can't be undone.")) return;
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch {
      alert("Failed to delete post");
    }
  };

  const handleRespect = async (postId, currentRespected, currentCount) => {
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? {
              ...p,
              didRespect: !currentRespected,
              respectCount: currentRespected
                ? currentCount - 1
                : currentCount + 1,
            }
          : p,
      ),
    );
    try {
      await respectPost(postId, !currentRespected);
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, didRespect: currentRespected, respectCount: currentCount }
            : p,
        ),
      );
    }
  };

  const handleSetGoal = async () => {
    const val = parseInt(newGoalInput);
    if (!val || val < 1) return;
    try {
      await updateUserGoal(val);
      refreshStats();
      setShowGoalModal(false);
      setNewGoalInput("");
    } catch (err) {
      console.error("Failed to set goal:", err);
    }
  };

  const userInitial = currentUser?.name?.charAt(0).toUpperCase() || "Y";

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const todayStats = useMemo(
    () =>
      stats ?? {
        goalsCompleted: 0,
        totalGoals: 0,
        workouts: 0,
        consistency: 0,
        calories: 0,
      },
    [stats],
  );

  const goalProgress = useMemo(() => {
    if (!todayStats.totalGoals) return 0;
    return Math.min(
      (todayStats.goalsCompleted / todayStats.totalGoals) * 100,
      100,
    );
  }, [todayStats.goalsCompleted, todayStats.totalGoals]);

  const todayIndex = useMemo(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  }, []);

  const todayLabel = userSplit[todayIndex];

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-4 pb-28 px-4 max-w-lg mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-gray-500 font-extrabold uppercase tracking-widest mb-0.5">
            Zyft
          </p>
          <h1 className="text-lg text-gray-300 leading-tight">
            {greeting()}, {currentUser?.name?.split(" ")[0] || "Athlete"} 👋
          </h1>
        </div>
        <div className="relative">
          <Link
            to="/profile"
            className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#a78bfa] flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-purple-400 transition-all"
          >
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold">{userInitial}</span>
            )}
          </Link>
          {isUserOnline(currentUser?._id) && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
          )}
        </div>
      </div>

      {/* ── Today's Energy Card ── */}
      <div className="bg-[#13131f] rounded-2xl p-4 mb-4 border border-white/5 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-gray-300">
            Today's Energy
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshStats}
              disabled={statsLoading}
              className="text-gray-600 hover:text-gray-400 transition-colors disabled:opacity-30"
              title="Refresh stats"
            >
              <RefreshCw
                size={12}
                className={statsLoading ? "animate-spin" : ""}
              />
            </button>

            <button
              onClick={() => !todayStats.totalGoals && setShowGoalModal(true)}
              className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                todayStats.totalGoals
                  ? "text-gray-400 bg-[#2a2a3e] border border-white/5"
                  : "text-gray-500 bg-white/5 hover:bg-white/10 hover:text-gray-300 border border-white/5"
              }`}
              title={
                todayStats.totalGoals
                  ? "Goal progress"
                  : "Tap to set daily goal"
              }
            >
              <Target
                size={12}
                className={
                  todayStats.totalGoals ? "text-gray-500" : "text-gray-600"
                }
              />
              {todayStats.goalsCompleted}/{todayStats.totalGoals || "—"} goals
            </button>
          </div>
        </div>

        <div className="w-full h-1.5 bg-white/10 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] rounded-full transition-all duration-700"
            style={{ width: `${goalProgress}%` }}
          />
        </div>

        {statsLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={20} className="animate-spin text-purple-400" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <Link
              to="/workouts"
              className="bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 rounded-xl p-3 flex flex-col items-center gap-1 hover:bg-[#8b5cf6]/20 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#8b5cf6]/20 flex items-center justify-center">
                <Target size={14} className="text-purple-400" />
              </div>
              <span className="text-lg font-bold">{todayStats.workouts}</span>
              <span className="text-[10px] text-gray-500">This Week</span>
            </Link>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex flex-col items-center gap-1">
              <div className="w-7 h-7 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Zap size={14} className="text-yellow-400" />
              </div>
              <span className="text-lg font-bold">{todayStats.calories}</span>
              <span className="text-[10px] text-gray-500">Total Calories</span>
            </div>

            <button
              onClick={() => setShowSplitModal(true)}
              className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex flex-col items-center gap-1 hover:bg-blue-500/20 transition-colors relative group"
            >
              <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Flame size={14} className="text-blue-400" />
              </div>
              <span className="text-lg font-bold">
                {todayStats.consistency ?? 0}%
              </span>
              <span className="text-[10px] text-gray-500">
                Split Compliance
              </span>
              <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <CalendarDays size={10} className="text-blue-400" />
              </div>
            </button>
          </div>
        )}

        {!splitLoading && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                This Week's Split
              </span>
              <button
                onClick={() => setShowSplitModal(true)}
                className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
              >
                Edit
              </button>
            </div>
            <div className="flex gap-1">
              {DAYS.map((day, i) => {
                const isToday = i === todayIndex;
                const isRest = userSplit[i] === "Rest";
                return (
                  <div
                    key={day}
                    className={`flex-1 rounded-lg py-1.5 px-0.5 text-center transition-all ${
                      isToday
                        ? "bg-blue-500/20 border border-blue-500/30"
                        : isRest
                          ? "bg-white/5"
                          : "bg-purple-500/15 border border-purple-500/20"
                    }`}
                  >
                    <p
                      className={`text-[9px] font-bold ${isToday ? "text-blue-400" : "text-gray-500"}`}
                    >
                      {day[0]}
                    </p>
                    <p
                      className={`text-[8px] truncate ${isRest ? "text-gray-600" : isToday ? "text-blue-300" : "text-purple-300"}`}
                    >
                      {userSplit[i] === "Rest" ? "—" : userSplit[i]}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5 text-center">
              Today:{" "}
              <span
                className={
                  todayLabel === "Rest"
                    ? "text-gray-500"
                    : "text-blue-400 font-semibold"
                }
              >
                {todayLabel}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link
          to="/log"
          className="bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] rounded-2xl p-4 flex items-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Dumbbell size={18} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-purple-200">Ready?</p>
            <p className="text-sm font-semibold text-white">Log Workout</p>
          </div>
        </Link>

        <Link
          to="/activity"
          className="bg-[#13131f] border border-white/5 rounded-2xl p-4 flex items-center gap-3 hover:border-white/10 active:scale-[0.98] transition-all"
        >
          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
            <Target size={18} className="text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Check</p>
            <p className="text-sm font-semibold text-white">My Goals</p>
          </div>
        </Link>
      </div>

      {/* ── Feed Header with Following/Community tabs ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 bg-[#13131f] border border-white/5 rounded-xl p-1">
          <button
            onClick={() => setFeedType("following")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
              feedType === "following"
                ? "bg-purple-600 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Following
          </button>
          <button
            onClick={() => setFeedType("community")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
              feedType === "community"
                ? "bg-purple-600 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Community
          </button>
        </div>
        <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
          See all
        </button>
      </div>

      {/* ── Feed Posts ── */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="animate-spin text-purple-400" />
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-400 text-sm">{error}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-10 text-gray-500 text-sm">
          {feedType === "following" ? (
            <>
              <p className="mb-3">You're not following anyone yet.</p>
              <button
                onClick={() => setFeedType("community")}
                className="text-purple-400 hover:text-purple-300 text-xs font-semibold"
              >
                Discover people in the Community feed →
              </button>
            </>
          ) : (
            "No posts yet. Be the first to share a workout!"
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <FeedPostCard
              key={post._id}
              post={post}
              currentUserId={user?._id}
              onUpdate={handleUpdatePost}
              onDelete={handleDeletePost}
              onRespect={handleRespect}
            />
          ))}
        </div>
      )}

      {!loading && posts.length > 0 && (
        <button className="w-full py-5 text-xs text-gray-600 hover:text-gray-400 transition-all flex items-center justify-center gap-2 mt-2">
          Load more posts
        </button>
      )}

      {/* ── Goal Setting Modal ── */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#1a1a2e] rounded-2xl p-5 w-full max-w-xs border border-white/10 shadow-xl">
            <h3 className="text-sm font-semibold mb-1">Set Daily Goal</h3>
            <p className="text-xs text-gray-500 mb-4">
              How many workouts today?
            </p>
            <input
              type="number"
              min="1"
              max="10"
              value={newGoalInput}
              onChange={(e) => setNewGoalInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSetGoal()}
              placeholder="e.g. 3"
              autoFocus
              className="w-full bg-[#0a0a0a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-white/10 placeholder-gray-600 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowGoalModal(false);
                  setNewGoalInput("");
                }}
                className="flex-1 py-2.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSetGoal}
                disabled={!newGoalInput || parseInt(newGoalInput) < 1}
                className="flex-1 py-2.5 text-xs bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/30 rounded-xl transition-colors"
              >
                Set Goal
              </button>
            </div>
          </div>
        </div>
      )}

      <WorkoutSplitModal
        isOpen={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        userId={user?._id}
        onSave={(data) => {
          setUserSplit(data.split);
          console.log("Split saved:", data.split);
        }}
      />
    </div>
  );
}
