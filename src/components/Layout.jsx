// import { Outlet, NavLink, useLocation } from "react-router-dom";
// import { Home, Compass, Plus, PersonStanding, User } from "lucide-react";

// export default function Layout() {
//   const location = useLocation();

//   const hideNav = ["/", "/login", "/register"].includes(location.pathname);
//   if (hideNav) return <Outlet />; // No nav on auth pages

//   const navItems = [
//     { path: "/home", icon: Home, label: "Home" },
//     { path: "/discover", icon: Compass, label: "Discover" },
//     { path: "/log", icon: Plus, label: "Log", isCenter: true },
//     { path: "/activity", icon: PersonStanding, label: "Activity" },
//     { path: "/profile", icon: User, label: "Profile" },
//   ];

//   return (
//     <div className="min-h-screen bg-[#0a0a0a] text-white max-w-md mx-auto relative">
//       <main className="pb-24 px-4">
//         <Outlet />
//       </main>

//       {/* Bottom nav inline */}
//       <nav className="fixed bottom-0 left-0 right-0 z-50">
//         <div className="max-w-md mx-auto bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/5">
//           <div className="flex items-center justify-around h-16 px-2">
//             {navItems.map((item) => {
//               const isActive = location.pathname === item.path;
//               const Icon = item.icon;

//               if (item.isCenter) {
//                 return (
//                   <NavLink
//                     key={item.path}
//                     to={item.path}
//                     className="relative -mt-6"
//                   >
//                     <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] flex items-center justify-center shadow-lg shadow-purple-500/30 active:scale-90 transition-all">
//                       <Icon
//                         size={24}
//                         className="text-white"
//                         strokeWidth={2.5}
//                       />
//                     </div>
//                   </NavLink>
//                 );
//               }

//               return (
//                 <NavLink
//                   key={item.path}
//                   to={item.path}
//                   className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl active:scale-90 transition-all ${
//                     isActive
//                       ? "text-[#8b5cf6]"
//                       : "text-gray-500 hover:text-gray-300"
//                   }`}
//                 >
//                   <Icon size={22} />
//                   <span className="text-[10px] mt-0.5 font-medium">
//                     {item.label}
//                   </span>
//                 </NavLink>
//               );
//             })}
//           </div>
//           <div className="h-2" />
//         </div>
//       </nav>
//     </div>
//   );
// }

import { useState, useEffect, useCallback } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Home, Compass, Plus, PersonStanding, User } from "lucide-react";

const API_URL = "http://localhost:5000";

async function fetchUnreadCount() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return 0;
    const res = await fetch(`${API_URL}/api/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    // Handles { count: 4 } or { unreadCount: 4 } — adjust if your backend differs
    return data.count ?? data.unreadCount ?? 0;
  } catch {
    return 0;
  }
}

export default function Layout() {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    const count = await fetchUnreadCount();
    setUnreadCount(count);
  }, []);

  // Fetch on first render
  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  // Re-fetch whenever the user navigates (clears badge when they visit Activity)
  useEffect(() => {
    refreshUnread();
  }, [location.pathname, refreshUnread]);

  const hideNav = ["/", "/login", "/register"].includes(location.pathname);
  if (hideNav) return <Outlet />;

  const navItems = [
    { path: "/home", icon: Home, label: "Home" },
    { path: "/discover", icon: Compass, label: "Discover" },
    { path: "/log", icon: Plus, label: "Log", isCenter: true },
    {
      path: "/activity",
      icon: PersonStanding,
      label: "Activity",
      badge: unreadCount,
    },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white max-w-md mx-auto relative">
      <main className="pb-24 px-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-md mx-auto bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/5">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              if (item.isCenter) {
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className="relative -mt-6"
                  >
                    <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] flex items-center justify-center shadow-lg shadow-purple-500/30 active:scale-90 transition-all">
                      <Icon
                        size={24}
                        className="text-white"
                        strokeWidth={2.5}
                      />
                    </div>
                  </NavLink>
                );
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl active:scale-90 transition-all ${
                    isActive
                      ? "text-[#8b5cf6]"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {/* Icon wrapper — position:relative so the badge anchors to it */}
                  <div className="relative">
                    <Icon size={22} />
                    {item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-purple-500 text-white text-[9px] font-bold flex items-center justify-center leading-none shadow-sm shadow-black/40">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] mt-0.5 font-medium">
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </div>
          <div className="h-2" />
        </div>
      </nav>
    </div>
  );
}
