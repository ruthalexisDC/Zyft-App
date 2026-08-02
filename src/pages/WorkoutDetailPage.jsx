import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Flame,
  Dumbbell,
  Heart,
  Share2,
  Play,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Bookmark,
  BookmarkCheck,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { API_ORIGIN } from "../config";
import { summarizeSets } from "../utils/exerciseDisplay";

const API_URL = API_ORIGIN;

// ─── Difficulty color map ──────────────────────────────────
const DIFFICULTY_COLORS = {
  Beginner: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Intermediate: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Advanced: "text-rose-400 bg-rose-400/10 border-rose-400/20",
};

function StatBadge({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-[#1a1a2e] border border-white/5 px-4 py-3 min-w-[80px]">
      {Icon && <Icon size={18} className="text-[#8b5cf6]" />}
      <span className="text-sm font-semibold text-white">{value}</span>
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

// ─── Exercise item with expandable set details ─────────────
function ExerciseItem({ exercise, index, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  const { count, repsLabel, weightLabel } = summarizeSets(exercise.sets);

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        exercise.completed
          ? "bg-[#8b5cf6]/5 border-[#8b5cf6]/30"
          : "bg-[#1a1a2e] border-white/5"
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        className="w-full flex items-center gap-4 px-4 py-4 text-left cursor-pointer"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(exercise.id);
          }}
          className="shrink-0"
        >
          {exercise.completed ? (
            <CheckCircle2 size={22} className="text-[#8b5cf6]" />
          ) : (
            <Circle size={22} className="text-zinc-600" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500 w-5">
              {index + 1}
            </span>
            <span
              className={`font-medium text-sm truncate ${
                exercise.completed ? "text-zinc-500 line-through" : "text-white"
              }`}
            >
              {exercise.name}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 ml-5">
            <span className="text-[11px] text-zinc-500">
              {count > 0
                ? `${count} ${count === 1 ? "set" : "sets"} · ${repsLabel}${weightLabel ? ` @ ${weightLabel}` : ""}`
                : "No sets yet"}
            </span>
            {exercise.muscleGroup && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                {exercise.muscleGroup}
              </span>
            )}
          </div>
        </div>

        {expanded ? (
          <ChevronUp size={16} className="text-zinc-500 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-zinc-500 shrink-0" />
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="ml-9 rounded-xl bg-zinc-950/50 border border-white/5 p-3">
            {Array.isArray(exercise.sets) && exercise.sets.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {exercise.sets.map((set, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs text-zinc-400"
                  >
                    <span className="text-zinc-500">Set {idx + 1}</span>
                    <span>
                      {set.reps} reps
                      {set.weight ? ` @ ${set.weight}${set.unit || "kg"}` : ""}
                      {set.rpe ? ` · RPE ${set.rpe}` : ""}
                      {set.isWarmup ? " · Warm-up" : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400">No set details available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main WorkoutDetailPage ────────────────────────────────
export default function WorkoutDetailPage() {
  const { workoutId } = useParams();
  const navigate = useNavigate();

  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareToast, setShowShareToast] = useState(false);

  // Fetch real workout data from backend with fallback
  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const token = localStorage.getItem("token");
        let res;

        // Try by workout ID first
        try {
          res = await axios.get(`${API_URL}/api/workouts/${workoutId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch {
          // Fallback: try by post ID
          res = await axios.get(
            `${API_URL}/api/workouts/by-post/${workoutId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
        }

        const data = res.data.workout || res.data;
        setWorkout(data);
        setExercises(
          data.exercises?.map((e, i) => ({
            ...e,
            id: e._id || e.id || i + 1,
            completed: false,
          })) || [],
        );
      } catch (err) {
        console.error("Failed to fetch workout:", err);
        setError("Failed to load workout");
      } finally {
        setLoading(false);
      }
    };

    if (workoutId) fetchWorkout();
  }, [workoutId]);

  const completedCount = exercises.filter((e) => e.completed).length;
  const progress =
    exercises.length > 0
      ? Math.round((completedCount / exercises.length) * 100)
      : 0;

  const toggleExercise = (id) => {
    setExercises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e)),
    );
  };

  const toggleFavorite = () => {
    setWorkout((prev) =>
      prev ? { ...prev, isFavorite: !prev.isFavorite } : prev,
    );
  };

  const toggleSaved = () => {
    setWorkout((prev) => (prev ? { ...prev, isSaved: !prev.isSaved } : prev));
  };

  const handleShare = () => {
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2000);
  };

  const handleStart = () => {
    console.log("Starting workout:", workout?.title);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#8b5cf6]" />
      </div>
    );
  }

  if (error || !workout) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-zinc-400">{error || "Workout not found"}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-[#8b5cf6] hover:text-[#a78bfa]"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-28">
      {/* ── Header Image / Hero ── */}
      <div className="relative h-64 bg-gradient-to-b from-[#1a1a2e] to-black">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-zinc-800/50 flex items-center justify-center hover:bg-black/60 transition-colors"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>

        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={toggleFavorite}
            className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-all ${
              workout.isFavorite
                ? "bg-rose-500/20 border-rose-500/40"
                : "bg-black/40 border-zinc-800/50 hover:bg-black/60"
            }`}
          >
            <Heart
              size={18}
              className={
                workout.isFavorite
                  ? "text-rose-400 fill-rose-400"
                  : "text-white"
              }
            />
          </button>
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-zinc-800/50 flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <Share2 size={18} className="text-white" />
          </button>
        </div>

        {workout.imageUrl ? (
          <img
            src={workout.imageUrl}
            alt={workout.title || "Workout"}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl select-none opacity-80">
              {workout.emoji || "💪"}
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* ── Content ── */}
      <div className="px-5 -mt-4 relative z-10">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="text-2xl font-bold text-white leading-tight">
            {workout.title}
          </h1>
          {workout.difficulty && (
            <span
              className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                DIFFICULTY_COLORS[workout.difficulty] ||
                DIFFICULTY_COLORS.Beginner
              }`}
            >
              {workout.difficulty}
            </span>
          )}
        </div>

        {(workout.description || workout.notes) && (
          <p className="text-sm text-zinc-400 leading-relaxed mb-5">
            {workout.description || workout.notes}
          </p>
        )}

        <div className="flex gap-3 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          <StatBadge
            icon={Clock}
            label="Duration"
            value={`${workout.duration || 0} min`}
          />
          <StatBadge
            icon={Flame}
            label="Calories"
            value={`${workout.calories || workout.caloriesBurned || 0}`}
          />
          <StatBadge
            icon={Dumbbell}
            label="Exercises"
            value={`${exercises.length || 0}`}
          />
        </div>

        {workout.equipment?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Equipment
            </h3>
            <div className="flex flex-wrap gap-2">
              {workout.equipment.map((item) => (
                <span
                  key={item}
                  className="text-xs px-3 py-1.5 rounded-full bg-[#1a1a2e] border border-white/5 text-zinc-300"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {exercises.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Progress
              </h3>
              <span className="text-xs text-[#8b5cf6] font-medium">
                {completedCount}/{exercises.length} completed
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#1a1a2e] border border-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Exercises
          </h3>
          <div className="flex flex-col gap-2.5">
            {exercises.length > 0 ? (
              exercises.map((exercise, index) => (
                <ExerciseItem
                  key={exercise.id}
                  exercise={exercise}
                  index={index}
                  onToggle={toggleExercise}
                />
              ))
            ) : (
              <p className="text-sm text-zinc-500">
                No exercises in this workout.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Action Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/5 px-5 py-4 z-50">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <button
            onClick={toggleSaved}
            className={`shrink-0 w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${
              workout.isSaved
                ? "bg-[#8b5cf6]/10 border-[#8b5cf6]/40"
                : "bg-[#1a1a2e] border-white/5 hover:border-white/10"
            }`}
          >
            {workout.isSaved ? (
              <BookmarkCheck size={20} className="text-[#8b5cf6]" />
            ) : (
              <Bookmark size={20} className="text-zinc-400" />
            )}
          </button>

          <button
            onClick={handleStart}
            className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#a78bfa] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#8b5cf6]/20 active:scale-[0.98] transition-all"
          >
            <Play size={16} fill="white" />
            Start Workout
          </button>
        </div>
      </div>

      {showShareToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-2.5 rounded-full bg-[#1a1a2e] border border-white/10 text-sm text-white shadow-xl flex items-center gap-2">
            <Share2 size={14} className="text-[#8b5cf6]" />
            Link copied to clipboard
          </div>
        </div>
      )}
    </div>
  );
}
