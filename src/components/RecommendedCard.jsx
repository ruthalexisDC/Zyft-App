// import { useNavigate } from "react-router-dom";

// // Same palette as WorkoutDetailPage's difficulty badge, so a workout reads
// // the same way whether you're looking at the card or the detail page.
// const DIFFICULTY_STYLES = {
//   Beginner: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
//   Intermediate: "text-amber-400 bg-amber-400/10 border-amber-400/20",
//   Advanced: "text-rose-400 bg-rose-400/10 border-rose-400/20",
// };

// export default function RecommendedCard({ workout }) {
//   const navigate = useNavigate();

//   // Use slug if available, otherwise fall back to _id
//   // If it's a default workout with a known slug, use it
//   const workoutSlug = workout.slug || workout._id || workout.id;
//   const difficulty = workout.difficulty || "Beginner";

//   // const goToWorkout = () => navigate(`/workout/${workoutSlug}`);
//   const goToWorkout = () => {
//     console.log("Navigating to slug:", workoutSlug); // ← add this
//     navigate(`/workout/${workoutSlug}`);
//   };

//   return (
//     <div
//       role="button"
//       tabIndex={0}
//       onClick={goToWorkout}
//       onKeyDown={(e) => {
//         if (e.key === "Enter" || e.key === " ") {
//           e.preventDefault();
//           goToWorkout();
//         }
//       }}
//       className="min-w-[150px] max-w-[150px] rounded-2xl bg-[#13131a] border border-white/5 p-4 cursor-pointer
//                  active:scale-[0.97] transition-all duration-150 hover:border-white/10"
//     >
//       {/* Icon */}
//       <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center mb-3 text-lg">
//         {workout.icon || "💪"}
//       </div>

//       {/* Title */}
//       <h3 className="text-sm font-semibold text-white mb-3 leading-tight line-clamp-2">
//         {workout.title}
//       </h3>

//       {/* Difficulty badge — replaces the old hardcoded "New" tag, which
//           showed on every card regardless of whether the workout was
//           actually new */}
//       <span
//         className={`inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
//           DIFFICULTY_STYLES[difficulty] ||
//           "text-gray-400 bg-white/5 border-white/10"
//         }`}
//       >
//         {difficulty}
//       </span>
//     </div>
//   );
// }

import { useNavigate } from "react-router-dom";

const DIFFICULTY_STYLES = {
  Beginner: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Intermediate: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Advanced: "text-rose-400 bg-rose-400/10 border-rose-400/20",
};

export default function RecommendedCard({ workout }) {
  const navigate = useNavigate();

  const workoutId = workout._id || workout.id;
  const difficulty = workout.difficulty || "Beginner";

  const goToWorkout = () => {
    if (workoutId) {
      navigate(`/workout-plan/${workoutId}`);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goToWorkout}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToWorkout();
        }
      }}
      className="min-w-[150px] max-w-[150px] rounded-2xl bg-[#13131a] border border-white/5 p-4 cursor-pointer 
                 active:scale-[0.97] transition-all duration-150 hover:border-white/10"
    >
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center mb-3 text-lg">
        {workout.icon || "💪"}
      </div>

      <h3 className="text-sm font-semibold text-white mb-3 leading-tight line-clamp-2">
        {workout.title}
      </h3>

      <span
        className={`inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
          DIFFICULTY_STYLES[difficulty] ||
          "text-gray-400 bg-white/5 border-white/10"
        }`}
      >
        {difficulty}
      </span>
    </div>
  );
}
