// src/components/BottomNav.jsx
import { Link, useLocation } from "react-router-dom";
import { Home, Dumbbell, Activity, User } from "lucide-react";

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/workouts", icon: Dumbbell, label: "Workouts" },
    { to: "/activity", icon: Activity, label: "Activity" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#13131f] border-t border-white/5 px-6 py-3 max-w-lg mx-auto z-50">
      <div className="flex justify-around items-center">
        {navItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center gap-1 ${
              path === to ? "text-purple-400" : "text-gray-500"
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px]">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
