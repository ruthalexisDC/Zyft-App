// import { useState, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import axios from "axios";
// import {
//   ArrowLeft,
//   LogOut,
//   Trash2,
//   ChevronRight,
//   Shield,
//   Bell,
//   Moon,
//   Sun,
//   Globe,
//   Loader2,
//   HelpCircle,
//   FileText,
// } from "lucide-react";
// import { deleteAccount } from "../api/posts";

// export default function AccountSettings() {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();

//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
//   const [deleteLoading, setDeleteLoading] = useState(false);
//   const [toast, setToast] = useState(null);
//   const [isDark, setIsDark] = useState(
//     () => localStorage.getItem("zyft_theme") !== "light",
//   );
//   const [isPrivate, setIsPrivate] = useState(false);
//   const [privacyLoading, setPrivacyLoading] = useState(false);

//   // ─── Load current privacy setting ───
//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token) return;

//     axios
//       .get("/api/users/me", { headers: { Authorization: `Bearer ${token}` } })
//       .then((res) => setIsPrivate(!!res.data.user?.isPrivate))
//       .catch((err) => console.error("Failed to load privacy setting:", err));
//   }, []);

//   const showToast = (message, type = "success") => {
//     setToast({ message, type });
//     setTimeout(() => setToast(null), 2000);
//   };

//   const handleLogout = () => {
//     showToast("Logging out...", "info", 1000);
//     setTimeout(() => {
//       logout();
//       showToast("Signed out successfully", "success", 1500);
//       setTimeout(() => navigate("/login"), 1500);
//     }, 1000);
//   };

//   const handleDeleteAccount = async () => {
//     setDeleteLoading(true);
//     try {
//       await deleteAccount();
//       logout();
//       showToast("Account deleted");
//       setTimeout(() => navigate("/login"), 1500);
//     } catch (err) {
//       console.error("Failed to delete account:", err);
//       showToast("Failed to delete account", "error");
//       setShowDeleteConfirm(false);
//     } finally {
//       setDeleteLoading(false);
//     }
//   };

//   const toggleTheme = () => {
//     const newDark = !isDark;
//     setIsDark(newDark);
//     localStorage.setItem("zyft_theme", newDark ? "dark" : "light");
//     const root = document.documentElement;
//     if (newDark) {
//       root.classList.remove("light");
//       root.classList.add("dark");
//     } else {
//       root.classList.remove("dark");
//       root.classList.add("light");
//     }
//   };

//   // ─── Toggle private account ───
//   const togglePrivacy = async () => {
//     const next = !isPrivate;
//     setIsPrivate(next); // optimistic
//     setPrivacyLoading(true);
//     try {
//       const token = localStorage.getItem("token");
//       const { data } = await axios.patch(
//         "/api/users/privacy",
//         { isPrivate: next },
//         { headers: { Authorization: `Bearer ${token}` } },
//       );
//       setIsPrivate(data.isPrivate);
//       showToast(
//         data.isPrivate
//           ? "Your account is now private"
//           : "Your account is now public",
//         "success",
//       );
//     } catch (err) {
//       console.error("Failed to update privacy:", err);
//       setIsPrivate(!next); // revert on failure
//       showToast("Failed to update privacy setting", "error");
//     } finally {
//       setPrivacyLoading(false);
//     }
//   };

//   const settingsGroups = [
//     {
//       title: "Account",
//       items: [
//         {
//           icon: <Shield size={16} className="text-purple-400" />,
//           label: "Privacy",
//           value: privacyLoading ? "..." : isPrivate ? "Private" : "Public",
//           action: togglePrivacy,
//         },
//         {
//           icon: <Bell size={16} className="text-blue-400" />,
//           label: "Notifications",
//           action: () => navigate("/notification-settings"),
//         },
//         {
//           icon: isDark ? (
//             <Moon size={16} className="text-yellow-400" />
//           ) : (
//             <Sun size={16} className="text-yellow-400" />
//           ),
//           label: "Dark Mode",
//           value: isDark ? "On" : "Off",
//           action: toggleTheme,
//         },
//       ],
//     },
//     {
//       title: "Preferences",
//       items: [
//         {
//           icon: <Globe size={16} className="text-green-400" />,
//           label: "Language",
//           value: "English",
//           action: () => {},
//         },
//       ],
//     },
//   ];

//   return (
//     <div className="min-h-screen bg-[#0a0a0a] text-white pt-4 pb-28 px-4 max-w-lg mx-auto relative">
//       {/* ── Toast ── */}
//       {toast && (
//         <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
//           <div
//             className={`bg-[#1a1a2e] border rounded-xl px-4 py-3 shadow-xl shadow-black/50 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${
//               toast.type === "success"
//                 ? "border-green-500/30"
//                 : toast.type === "info"
//                   ? "border-blue-500/30"
//                   : "border-red-500/30"
//             }`}
//           >
//             <div
//               className={`w-5 h-5 rounded-full flex items-center justify-center ${
//                 toast.type === "success"
//                   ? "bg-green-500/20"
//                   : toast.type === "info"
//                     ? "bg-blue-500/20"
//                     : "bg-red-500/20"
//               }`}
//             >
//               {toast.type === "success" ? (
//                 <svg
//                   width="12"
//                   height="12"
//                   viewBox="0 0 24 24"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="3"
//                   className="text-green-400"
//                 >
//                   <polyline points="20 6 9 17 4 12" />
//                 </svg>
//               ) : toast.type === "info" ? (
//                 <Loader2 size={12} className="text-blue-400 animate-spin" />
//               ) : (
//                 <svg
//                   width="12"
//                   height="12"
//                   viewBox="0 0 24 24"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="3"
//                   className="text-red-400"
//                 >
//                   <line x1="18" y1="6" x2="6" y2="18" />
//                   <line x1="6" y1="6" x2="18" y2="18" />
//                 </svg>
//               )}
//             </div>
//             <span className="text-sm text-gray-300 font-medium">
//               {toast.message}
//             </span>
//           </div>
//         </div>
//       )}

//       {/* ── Header ── */}
//       <div className="flex items-center justify-between mb-8">
//         <button
//           onClick={() => navigate("/profile")}
//           className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all"
//         >
//           <ArrowLeft size={18} />
//         </button>
//         <h1 className="text-sm font-semibold">Settings</h1>
//         <div className="w-10 h-10 shrink-0" />
//       </div>

//       {/* ── User Card ── */}
//       <div className="bg-[#13131f] rounded-2xl p-4 mb-6 border border-white/5 flex items-center gap-3">
//         <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#a78bfa] flex items-center justify-center overflow-hidden shrink-0">
//           {user?.avatar || user?.photo ? (
//             <img
//               src={user.avatar || user.photo}
//               alt={user.name}
//               className="w-full h-full object-cover"
//             />
//           ) : (
//             <span className="text-lg font-bold">
//               {user?.name?.charAt(0)?.toUpperCase() || "?"}
//             </span>
//           )}
//         </div>
//         <div className="flex-1 min-w-0">
//           <h2 className="text-sm font-semibold truncate">
//             {user?.name || "User"}
//           </h2>
//           <p className="text-xs text-gray-500 truncate">
//             @{user?.handle || user?.username || "user"}
//           </p>
//         </div>
//         <Link
//           to="/edit-profile"
//           className="text-xs text-purple-400 hover:text-purple-300 font-medium"
//         >
//           Edit
//         </Link>
//       </div>

//       {/* ── Settings Groups ── */}
//       <div className="space-y-6">
//         {settingsGroups.map((group) => (
//           <div key={group.title}>
//             <h3 className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2 px-1">
//               {group.title}
//             </h3>
//             <div className="bg-[#13131f] rounded-2xl border border-white/5 overflow-hidden">
//               {group.items.map((item, idx) => (
//                 <button
//                   key={item.label}
//                   onClick={item.action}
//                   disabled={item.label === "Privacy" && privacyLoading}
//                   className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/5 transition-colors disabled:opacity-60 ${idx !== group.items.length - 1 ? "border-b border-white/5" : ""}`}
//                 >
//                   <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
//                     {item.icon}
//                   </div>
//                   <span className="text-sm text-gray-300 flex-1">
//                     {item.label}
//                   </span>
//                   {item.value && (
//                     <span className="text-xs text-gray-500">{item.value}</span>
//                   )}
//                   <ChevronRight size={14} className="text-gray-600" />
//                 </button>
//               ))}
//             </div>
//           </div>
//         ))}

//         {/* ── Danger Zone ── */}
//         <div>
//           <h3 className="text-xs text-red-400/60 font-medium uppercase tracking-wider mb-2 px-1">
//             Danger Zone
//           </h3>
//           <div className="bg-[#13131f] rounded-2xl border border-white/5 overflow-hidden">
//             <button
//               onClick={handleLogout}
//               className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/5 transition-colors border-b border-white/5"
//             >
//               <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
//                 <LogOut size={16} className="text-red-400" />
//               </div>
//               <span className="text-sm text-red-400">Sign Out</span>
//             </button>
//             <button
//               onClick={() => setShowDeleteConfirm(true)}
//               className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-red-500/5 transition-colors"
//             >
//               <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
//                 <Trash2 size={16} className="text-red-400" />
//               </div>
//               <span className="text-sm text-red-400">Delete Account</span>
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* ── Delete Account Confirmation Modal ── */}
//       {showDeleteConfirm && (
//         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
//           <div className="bg-[#1a1a2e] rounded-2xl p-5 w-full max-w-xs border border-red-500/20 shadow-xl">
//             <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
//               <Trash2 size={20} className="text-red-400" />
//             </div>
//             <h3 className="text-sm font-semibold text-center mb-1">
//               Delete Account?
//             </h3>
//             <p className="text-xs text-gray-500 text-center mb-5">
//               This will permanently delete your account, all your posts, and
//               data. This cannot be undone.
//             </p>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => setShowDeleteConfirm(false)}
//                 disabled={deleteLoading}
//                 className="flex-1 py-2.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleDeleteAccount}
//                 disabled={deleteLoading}
//                 className="flex-1 py-2.5 text-xs bg-red-600 hover:bg-red-500 disabled:bg-red-600/30 rounded-xl transition-colors flex items-center justify-center gap-1"
//               >
//                 {deleteLoading ? (
//                   <Loader2 size={12} className="animate-spin" />
//                 ) : (
//                   <Trash2 size={12} />
//                 )}
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ── App Version ── */}
//       <p className="text-center text-[10px] text-gray-700 mt-8">Zyft v1.0.0</p>
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import {
  ArrowLeft,
  LogOut,
  Trash2,
  ChevronRight,
  Shield,
  Bell,
  Moon,
  Sun,
  Globe,
  Loader2,
  HelpCircle,
  FileText,
} from "lucide-react";
import { deleteAccount } from "../api/posts";

export default function AccountSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("zyft_theme") !== "light",
  );
  const [isPrivate, setIsPrivate] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(false);

  // ─── Load current privacy setting ───
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios
      .get("/api/users/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setIsPrivate(!!res.data.user?.isPrivate))
      .catch((err) => console.error("Failed to load privacy setting:", err));
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const handleLogout = () => {
    showToast("Logging out...", "info", 1000);
    setTimeout(() => {
      logout();
      showToast("Signed out successfully", "success", 1500);
      setTimeout(() => navigate("/login"), 1500);
    }, 1000);
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await deleteAccount();
      logout();
      showToast("Account deleted");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      console.error("Failed to delete account:", err);
      showToast("Failed to delete account", "error");
      setShowDeleteConfirm(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem("zyft_theme", newDark ? "dark" : "light");
    const root = document.documentElement;
    if (newDark) {
      root.classList.remove("light");
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
  };

  // ─── Toggle private account ───
  const togglePrivacy = async () => {
    const next = !isPrivate;
    setIsPrivate(next); // optimistic
    setPrivacyLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.patch(
        "/api/users/privacy",
        { isPrivate: next },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setIsPrivate(data.isPrivate);
      showToast(
        data.isPrivate
          ? "Your account is now private"
          : "Your account is now public",
        "success",
      );
    } catch (err) {
      console.error("Failed to update privacy:", err);
      setIsPrivate(!next); // revert on failure
      showToast("Failed to update privacy setting", "error");
    } finally {
      setPrivacyLoading(false);
    }
  };

  const settingsGroups = [
    {
      title: "Account",
      items: [
        {
          icon: <Shield size={16} className="text-purple-400" />,
          label: "Privacy",
          value: privacyLoading ? "..." : isPrivate ? "Private" : "Public",
          action: togglePrivacy,
        },
        {
          icon: <Bell size={16} className="text-blue-400" />,
          label: "Notifications",
          action: () => navigate("/settings/notifications"),
        },
        {
          icon: isDark ? (
            <Moon size={16} className="text-yellow-400" />
          ) : (
            <Sun size={16} className="text-yellow-400" />
          ),
          label: "Dark Mode",
          value: isDark ? "On" : "Off",
          action: toggleTheme,
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: <Globe size={16} className="text-green-400" />,
          label: "Language",
          value: "English",
          action: () => {},
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-4 pb-28 px-4 max-w-lg mx-auto relative">
      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div
            className={`bg-[#1a1a2e] border rounded-xl px-4 py-3 shadow-xl shadow-black/50 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${
              toast.type === "success"
                ? "border-green-500/30"
                : toast.type === "info"
                  ? "border-blue-500/30"
                  : "border-red-500/30"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center ${
                toast.type === "success"
                  ? "bg-green-500/20"
                  : toast.type === "info"
                    ? "bg-blue-500/20"
                    : "bg-red-500/20"
              }`}
            >
              {toast.type === "success" ? (
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
              ) : toast.type === "info" ? (
                <Loader2 size={12} className="text-blue-400 animate-spin" />
              ) : (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-red-400"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
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
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate("/profile")}
          className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-sm font-semibold">Settings</h1>
        <div className="w-10 h-10 shrink-0" />
      </div>

      {/* ── User Card ── */}
      <div className="bg-[#13131f] rounded-2xl p-4 mb-6 border border-white/5 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#a78bfa] flex items-center justify-center overflow-hidden shrink-0">
          {user?.avatar || user?.photo ? (
            <img
              src={user.avatar || user.photo}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-lg font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "?"}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold truncate">
            {user?.name || "User"}
          </h2>
          <p className="text-xs text-gray-500 truncate">
            @{user?.handle || user?.username || "user"}
          </p>
        </div>
        <Link
          to="/edit-profile"
          className="text-xs text-purple-400 hover:text-purple-300 font-medium"
        >
          Edit
        </Link>
      </div>

      {/* ── Settings Groups ── */}
      <div className="space-y-6">
        {settingsGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2 px-1">
              {group.title}
            </h3>
            <div className="bg-[#13131f] rounded-2xl border border-white/5 overflow-hidden">
              {group.items.map((item, idx) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  disabled={item.label === "Privacy" && privacyLoading}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/5 transition-colors disabled:opacity-60 ${idx !== group.items.length - 1 ? "border-b border-white/5" : ""}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-sm text-gray-300 flex-1">
                    {item.label}
                  </span>
                  {item.value && (
                    <span className="text-xs text-gray-500">{item.value}</span>
                  )}
                  <ChevronRight size={14} className="text-gray-600" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* ── Danger Zone ── */}
        <div>
          <h3 className="text-xs text-red-400/60 font-medium uppercase tracking-wider mb-2 px-1">
            Danger Zone
          </h3>
          <div className="bg-[#13131f] rounded-2xl border border-white/5 overflow-hidden">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/5 transition-colors border-b border-white/5"
            >
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                <LogOut size={16} className="text-red-400" />
              </div>
              <span className="text-sm text-red-400">Sign Out</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-red-500/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                <Trash2 size={16} className="text-red-400" />
              </div>
              <span className="text-sm text-red-400">Delete Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Delete Account Confirmation Modal ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#1a1a2e] rounded-2xl p-5 w-full max-w-xs border border-red-500/20 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={20} className="text-red-400" />
            </div>
            <h3 className="text-sm font-semibold text-center mb-1">
              Delete Account?
            </h3>
            <p className="text-xs text-gray-500 text-center mb-5">
              This will permanently delete your account, all your posts, and
              data. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                className="flex-1 py-2.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 py-2.5 text-xs bg-red-600 hover:bg-red-500 disabled:bg-red-600/30 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                {deleteLoading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Trash2 size={12} />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── App Version ── */}
      <p className="text-center text-[10px] text-gray-700 mt-8">Zyft v1.0.0</p>
    </div>
  );
}
