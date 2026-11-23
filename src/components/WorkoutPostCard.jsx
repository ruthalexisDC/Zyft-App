import { Heart, Clock, Dumbbell, Flame } from "lucide-react";

const CATEGORY_ACCENT = {
  Strength: "bg-purple-400",
  Cardio: "bg-pink-400",
  HIIT: "bg-orange-400",
  Pilates: "bg-blue-400",
  Yoga: "bg-green-400",
  Other: "bg-gray-400",
};

export default function WorkoutPostCard({ post, onRespect, getTimeAgo, t }) {
  const workout = post.workout || {};

  const accent = CATEGORY_ACCENT[workout.category] || "bg-purple-400";

  // Only use actual media URLs. No mock photo fallback.
  const workoutImage =
    workout.imageUrl ||
    (typeof post.media?.[0] === "string"
      ? post.media[0]
      : post.media?.[0]?.url) ||
    null;

  // Build statistics only when data exists.
  const stats = [];

  if (workout.exercises?.length > 0) {
    stats.push({
      key: "exercises",
      icon: <Dumbbell size={13} />,
      value: workout.exercises.length,
      label: t("post.exercises"),
      color: "text-purple-300",
    });
  }

  if (workout.duration) {
    stats.push({
      key: "duration",
      icon: <Clock size={13} />,
      value: `${workout.duration}${t("post.durationUnit", {
        defaultValue: "min",
      })}`,
      label: t("post.duration"),
      color: "text-blue-300",
    });
  }

  if (workout.caloriesBurned) {
    stats.push({
      key: "calories",
      icon: <Flame size={13} />,
      value: workout.caloriesBurned,
      label: t("post.calories"),
      color: "text-orange-300",
    });
  }

  return (
    <div className="bg-[#13131f] rounded-3xl overflow-hidden border border-white/5 hover:border-white/10 transition-colors group">
      {/* Workout card */}
      <div
        className={`relative ${workoutImage ? "h-44 overflow-hidden" : "p-4"}`}
      >
        {/* Real uploaded image only */}
        {workoutImage && (
          <>
            <img
              src={workoutImage}
              alt={workout.title || t("workoutFallback")}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/40" />
          </>
        )}

        {/* Category */}
        {workout.category && (
          <div
            className={
              workoutImage
                ? "absolute top-3 left-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full pl-2 pr-2.5 py-1"
                : "inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-2.5 py-1 mb-3"
            }
          >
            <span className={`w-1.5 h-1.5 rounded-full ${accent}`} />
            <span className="text-[10px] font-semibold text-white uppercase tracking-wide">
              {workout.category}
            </span>
          </div>
        )}

        {/* Respect button */}
        <button
          type="button"
          onClick={() => onRespect(post._id)}
          className={`absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1.5 rounded-full border transition-all active:scale-95 ${
            post.didRespect
              ? "bg-pink-500/20 border-pink-500/30 text-pink-400"
              : workoutImage
                ? "bg-black/40 border-white/10 text-white hover:bg-black/60"
                : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
          }`}
        >
          <Heart size={12} className={post.didRespect ? "fill-current" : ""} />

          {post.respectCount > 0 && (
            <span className="text-xs font-semibold">{post.respectCount}</span>
          )}
        </button>

        {/* Title and date */}
        <div
          className={
            workoutImage ? "absolute bottom-3 left-4 right-4" : "mt-1 pr-12"
          }
        >
          <h3
            className={`text-sm font-bold truncate ${
              workoutImage ? "text-white drop-shadow-lg" : "text-gray-100"
            }`}
          >
            {workout.title || t("workoutFallback")}
          </h3>

          <p
            className={`text-xs mt-1 ${
              workoutImage ? "text-gray-300" : "text-gray-500"
            }`}
          >
            {getTimeAgo(post.createdAt)}
          </p>
        </div>
      </div>

      {/* Statistics */}
      {stats.length > 0 && (
        <div className="flex gap-2 p-3">
          {stats.map((stat) => (
            <div
              key={stat.key}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl bg-white/5 border border-white/5"
            >
              <div className={`flex items-center gap-1 ${stat.color}`}>
                {stat.icon}
                <span className="text-xs font-bold">{stat.value}</span>
              </div>

              <span className="text-[9px] text-gray-500 uppercase tracking-wide">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
