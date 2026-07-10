import React from "react";
import { NavLink, Link } from "react-router-dom";
import { Home, Compass, Plus, Activity, User } from "lucide-react";

const notifications = [
  {
    id: 1,
    type: "respect",
    initials: "SC",
    name: "Sara Chen",
    action: "gave you respect",
    workout: "Push Day · Strength Focus",
    time: "2m",
    button: "View Workout",
    highlight: true,
    read: false,
  },
  {
    id: 2,
    type: "comment",
    initials: "MJ",
    name: "Marcus Johnson",
    action: "commented on your workout",
    workout: "Morning Run · New PR!",
    preview: "Incredible pace! Keep it up! 🔥",
    time: "11m",
    read: false,
  },
  {
    id: 3,
    type: "streak",
    emoji: "👌",
    title: "7-day streak! You're on fire",
    subtitle: "Keep the momentum going",
    time: "1h",
    read: false,
  },
  {
    id: 4,
    type: "follow",
    initials: "ER",
    name: "Emma Rodriguez",
    action: "Started following you",
    time: "2h",
    button: "Follow Back",
    read: false,
  },
  {
    id: 5,
    type: "welcome",
    emoji: "👋",
    title: "Welcome back!",
    subtitle: "Ready to pick-up where you left off?",
    time: "3h",
    read: true,
  },
  {
    id: 6,
    type: "respect",
    initials: "AK",
    name: "Alex Kim",
    action: "gave you respect",
    workout: "Leg Day · Heavy Squats",
    time: "5h",
    read: true,
  },
  {
    id: 7,
    type: "respect",
    initials: "AK",
    name: "Alex Kim",
    action: "gave you respect",
    workout: "Leg Day · Heavy Squats",
    time: "Yesterday",
    read: true,
  },
  {
    id: 8,
    type: "comment",
    initials: "JW",
    name: "Jake William",
    action: "commented on your workout",
    workout: "CrossFit WOD",
    preview: "What was your time on this?",
    time: "Yesterday",
    read: true,
  },
];

function NotificationCard({ item }) {
  const [expanded, setExpanded] = React.useState(false);
  const isSystem = item.type === "streak" || item.type === "welcome";

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={`relative overflow-hidden rounded-3xl border border-purple-500/20 bg-zinc-950/90 backdrop-blur-xl p-4 shadow-lg transition-all duration-300 cursor-pointer hover:border-purple-500/40 hover:shadow-purple-500/10 active:scale-[0.98] ${
        item.highlight ? "shadow-purple-500/20" : ""
      } ${!item.read ? "bg-zinc-900/95" : ""}`}
    >
      <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full bg-gradient-to-b from-purple-500 to-indigo-500 opacity-90" />

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {isSystem ? (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500/90 to-orange-500/90 flex items-center justify-center text-lg shadow-lg">
              {item.emoji}
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center font-semibold text-sm shadow-lg shadow-purple-500/20">
              {item.initials}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              {isSystem ? (
                <h3 className="font-semibold text-white leading-tight">
                  {item.title}
                </h3>
              ) : (
                <>
                  <h3 className="font-semibold text-white leading-tight">
                    {item.name}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-tight mt-0.5">
                    {item.action}
                  </p>
                </>
              )}
            </div>

            <span className="text-[11px] text-zinc-500 whitespace-nowrap">
              {item.time}
            </span>
          </div>

          {item.workout && (
            <p className="text-sm text-white/90 font-medium mt-2 truncate">
              {item.workout}
            </p>
          )}

          {item.subtitle && (
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
              {item.subtitle}
            </p>
          )}

          {item.preview && (
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              {item.preview}
            </p>
          )}

          {expanded && item.button && (
            <div className="overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
              <button
                onClick={(e) => e.stopPropagation()}
                className="mt-4 w-full h-11 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-500 text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
              >
                {item.button}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Notification() {
  const [notifs, setNotifs] = React.useState(notifications);

  const unreadCount = notifs.filter((n) => !n.read).length;
  const todayNotifications = notifs.slice(0, 4);
  const earlierNotifications = notifs.slice(4);

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      <div className="w-full max-w-sm border-x border-zinc-900 min-h-screen relative overflow-hidden">
        <div className="absolute top-[-120px] right-[-80px] w-72 h-72 bg-purple-600/20 blur-3xl rounded-full" />
        <div className="absolute bottom-[-160px] left-[-120px] w-80 h-80 bg-indigo-500/10 blur-3xl rounded-full" />

        <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-zinc-900 px-5 pt-6 pb-4">
          <div className="relative flex items-center justify-between">
            <h1 className="text-xl font-extrabold tracking-wide">ZYFT</h1>

            <div className="absolute left-1/2 -translate-x-1/2">
              <h2 className="text-sm font-semibold text-white tracking-wide">
                Notification
              </h2>
            </div>

            <Link
              to="/profile"
              className="w-9 h-9 rounded-full border border-zinc-700 flex items-center justify-center text-sm hover:border-purple-500 transition-all overflow-hidden"
            >
              <img
                src="https://i.pravatar.cc/100"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </Link>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 font-medium">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              {unreadCount} new
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium"
              >
                Mark all read
              </button>
            )}
          </div>
        </header>

        <main className="relative z-10 px-4 py-6 space-y-8 pb-32">
          <section>
            <h3 className="text-xs font-bold tracking-widest text-zinc-500 mb-4 px-1">
              TODAY
            </h3>
            <div className="space-y-4">
              {todayNotifications.map((item) => (
                <NotificationCard key={item.id} item={item} />
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold tracking-widest text-zinc-500 mb-4 px-1">
              EARLIER
            </h3>
            <div className="space-y-4">
              {earlierNotifications.map((item) => (
                <NotificationCard key={item.id} item={item} />
              ))}
            </div>
          </section>

          <p className="text-center text-xs text-zinc-600 pt-2">
            You're all caught up ✨
          </p>
        </main>

        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-black border-t border-zinc-900 px-6 py-3 z-30">
          <div className="flex items-end justify-between text-[11px] text-zinc-500">
            <NavLink
              to="/home"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 transition-all ${
                  isActive ? "text-white" : "hover:text-white"
                }`
              }
            >
              <Home size={22} strokeWidth={1.5} />
              <span className="text-[10px]">Home</span>
            </NavLink>

            <NavLink
              to="/discover"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 transition-all ${
                  isActive ? "text-purple-400" : "hover:text-white"
                }`
              }
            >
              <Compass size={22} strokeWidth={1.5} />
              <span className="text-[10px]">Discover</span>
            </NavLink>

            <NavLink
              to="/log"
              className="relative -top-5 flex items-center justify-center"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-300 text-white flex items-center justify-center shadow-[0_0_35px_rgba(168,85,247,0.65)] border border-purple-300/20">
                <Plus size={28} strokeWidth={2} />
              </div>
            </NavLink>

            <NavLink
              to="/activity"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 transition-all ${
                  isActive ? "text-purple-400" : "hover:text-white"
                }`
              }
            >
              <Activity size={22} strokeWidth={1.5} />
              <span className="text-[10px]">Activity</span>
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 transition-all ${
                  isActive ? "text-white" : "hover:text-white"
                }`
              }
            >
              <User size={22} strokeWidth={1.5} />
              <span className="text-[10px]">Profile</span>
            </NavLink>
          </div>
        </nav>
      </div>
    </div>
  );
}
