// components/WorkoutCard.jsx
import { useState } from "react";
import {
  Dumbbell,
  Flame,
  Check,
  Plus,
  PersonStanding,
  Bike,
  Activity,
  Heart,
  ArrowUp,
  ArrowDown,
  Swords,
} from "lucide-react";

const SPLIT_CONFIG = {
  push: {
    label: "PUSH",
    icon: ArrowUp,
    color: "rose",
    muscles: "Chest, Shoulders, Triceps",
  },
  pull: {
    label: "PULL",
    icon: ArrowDown,
    color: "sky",
    muscles: "Back, Biceps, Rear Delts",
  },
  legs: {
    label: "LEGS",
    icon: PersonStanding,
    color: "amber",
    muscles: "Quads, Hamstrings, Calves",
  },
  fullbody: {
    label: "FULL BODY",
    icon: Activity,
    color: "emerald",
    muscles: "All major muscle groups",
  },
  chest: {
    label: "CHEST DAY",
    icon: Dumbbell,
    color: "orange",
    muscles: "Chest, Front Delts, Triceps",
  },
  back: {
    label: "BACK DAY",
    icon: ArrowDown,
    color: "violet",
    muscles: "Lats, Traps, Biceps",
  },
  shoulders: {
    label: "SHOULDERS",
    icon: PersonStanding,
    color: "cyan",
    muscles: "Delts, Traps, Upper Chest",
  },
  arms: {
    label: "ARM DAY",
    icon: Swords,
    color: "fuchsia",
    muscles: "Biceps, Triceps, Forearms",
  },
  cardio: {
    label: "CARDIO",
    icon: Heart,
    color: "teal",
    muscles: "Heart, Endurance, Fat Burn",
  },
};

const COLOR_STYLES = {
  rose: {
    text: "text-rose-400",
    bg: "bg-rose-500/20",
    border: "border-rose-500/20",
    glow: "bg-rose-500/10",
    flame: "text-rose-400 fill-rose-400",
  },
  sky: {
    text: "text-sky-400",
    bg: "bg-sky-500/20",
    border: "border-sky-500/20",
    glow: "bg-sky-500/10",
    flame: "text-sky-400 fill-sky-400",
  },
  amber: {
    text: "text-amber-400",
    bg: "bg-amber-500/20",
    border: "border-amber-500/20",
    glow: "bg-amber-500/10",
    flame: "text-amber-400 fill-amber-400",
  },
  emerald: {
    text: "text-emerald-400",
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/20",
    glow: "bg-emerald-500/10",
    flame: "text-emerald-400 fill-emerald-400",
  },
  orange: {
    text: "text-orange-400",
    bg: "bg-orange-500/20",
    border: "border-orange-500/20",
    glow: "bg-orange-500/10",
    flame: "text-orange-400 fill-orange-400",
  },
  violet: {
    text: "text-violet-400",
    bg: "bg-violet-500/20",
    border: "border-violet-500/20",
    glow: "bg-violet-500/10",
    flame: "text-violet-400 fill-violet-400",
  },
  cyan: {
    text: "text-cyan-400",
    bg: "bg-cyan-500/20",
    border: "border-cyan-500/20",
    glow: "bg-cyan-500/10",
    flame: "text-cyan-400 fill-cyan-400",
  },
  fuchsia: {
    text: "text-fuchsia-400",
    bg: "bg-fuchsia-500/20",
    border: "border-fuchsia-500/20",
    glow: "bg-fuchsia-500/10",
    flame: "text-fuchsia-400 fill-fuchsia-400",
  },
  teal: {
    text: "text-teal-400",
    bg: "bg-teal-500/20",
    border: "border-teal-500/20",
    glow: "bg-teal-500/10",
    flame: "text-teal-400 fill-teal-400",
  },
};

export default function WorkoutCard({ workout, onLogWorkout, streak = 0 }) {
  const [isLoading, setIsLoading] = useState(false);

  const splitType = workout.splitType?.toLowerCase() || "fullbody";
  const config = SPLIT_CONFIG[splitType] || SPLIT_CONFIG.fullbody;
  const styles = COLOR_STYLES[config.color] || COLOR_STYLES.emerald;
  const IconComponent = config.icon;

  const handleLog = async () => {
    if (workout.completed || isLoading) return;
    setIsLoading(true);
    try {
      await onLogWorkout(workout.id);
    } finally {
      setIsLoading(false);
    }
  };

  const formattedTime = workout.completedAt
    ? new Date(workout.completedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div
      className={`
      relative overflow-hidden rounded-2xl p-4 transition-all duration-500
      ${
        workout.completed
          ? `bg-gradient-to-br ${styles.glow.replace("/10", "/5")} ${styles.border} border`
          : "bg-[#13131f] border border-white/5 hover:border-white/10 active:scale-[0.99]"
      }
    `}
    >
      {/* Glow (completed only) */}
      {workout.completed && (
        <div
          className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl pointer-events-none animate-pulse opacity-60 ${styles.glow}`}
        />
      )}

      {/* Top Row */}
      <div className="flex items-start justify-between mb-2 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={`text-[10px] font-black tracking-[0.2em] uppercase ${
                workout.completed ? styles.text : "text-gray-500"
              }`}
            >
              {workout.completed ? "COMPLETED" : config.label}
            </span>
            {workout.completed && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">
                ✓
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-white truncate">
            {workout.name}
          </h3>
          <p className="text-[10px] text-gray-500 mt-0.5 truncate">
            {config.muscles}
          </p>
        </div>

        <div
          className={`
          w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ml-3 transition-all duration-500
          ${
            workout.completed
              ? `${styles.bg} ${styles.text} scale-110`
              : "bg-purple-500/10 text-purple-400"
          }
        `}
        >
          {workout.completed ? (
            <Check size={18} strokeWidth={3} />
          ) : (
            <IconComponent size={18} />
          )}
        </div>
      </div>

      {/* Status / Exercises */}
      <div className="relative z-10 mb-2">
        {workout.completed ? (
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${styles.text}`}>
              Logged at {formattedTime}
            </span>
            {workout.duration && (
              <span className="text-[10px] text-gray-500">
                • {workout.duration} min
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {workout.exercises?.slice(0, 4).map((ex, i) => (
              <span
                key={i}
                className="text-[10px] bg-white/5 text-gray-500 px-2 py-1 rounded-md"
              >
                {ex.name}
              </span>
            ))}
            {workout.exercises?.length > 4 && (
              <span className="text-[10px] text-gray-600 px-1 py-1">
                +{workout.exercises.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Row */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5 relative z-10">
        <div className="flex items-center gap-1.5">
          <Flame
            size={14}
            className={`transition-all duration-500 ${
              workout.completed ? styles.flame : "text-gray-600"
            }`}
          />
          <span
            className={`text-xs font-medium transition-colors duration-300 ${
              workout.completed ? styles.text : "text-gray-400"
            }`}
          >
            {streak} day streak
          </span>
        </div>

        {workout.completed ? (
          <span className="text-[11px] text-gray-500 flex items-center gap-1">
            <Check size={12} className={styles.text} /> Done for today
          </span>
        ) : (
          <button
            onClick={handleLog}
            disabled={isLoading}
            className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-300 transition-colors group"
          >
            {isLoading ? (
              "Saving..."
            ) : (
              <>
                tap
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-md transition-all group-hover:scale-110 ${styles.bg} ${styles.text}`}
                >
                  <Plus size={12} strokeWidth={3} />
                </span>
                to log
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
