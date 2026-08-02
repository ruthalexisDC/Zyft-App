// src/utils/categoryInference.js
//
// When an API workout arrives without a `category` field (workouts stored
// through some older flows only carry title/exercises), the Discover page
// used to build a broken i18n key like `discover:categoryLabels.undefined`.
//
// This helper inspects the workout's title, exercise names, and muscle
// groups, scores keyword matches against the six categories, and returns
// the best match ("Other" when nothing recognizable appears).

export const CATEGORY_OPTIONS = [
  "Strength",
  "Cardio",
  "HIIT",
  "Pilates",
  "Yoga",
  "Other",
];

// [keyword, weight]
const CATEGORY_KEYWORDS = {
  Strength: [
    ["bench", 3],
    ["press", 2],
    ["squat", 3],
    ["deadlift", 3],
    ["hyperextension", 2],
    ["goodmorning", 2],
    ["row", 2],
    ["pull up", 3],
    ["pullup", 3],
    ["chin up", 3],
    ["pulldown", 2],
    ["curl", 2],
    ["pushdown", 2],
    ["raise", 2],
    ["shoulder press", 3],
    ["leg press", 3],
    ["leg extension", 2],
    ["leg curl", 2],
    ["lunge", 2],
    ["hip thrust", 3],
    ["calf", 2],
    ["plank", 2],
    ["push up", 3],
    ["pushup", 3],
    ["dip", 2],
    ["face pull", 2],
    ["fly", 2],
    ["romanian", 3],
    ["hack squat", 3],
    ["sumo", 2],
    ["bulgarian", 2],
    ["step up", 2],
    ["glute bridge", 3],
    ["crunch", 2],
    ["leg raise", 2],
    ["twist", 2],
    ["kettlebell swing", 3],
    ["adduction", 2],
    ["abduction", 2],
    ["shrug", 2],
    ["arnold", 2],
    ["dumbbell", 2],
    ["dumbell", 2],
    ["barbell", 2],
    ["bicep", 2],
    ["tricep", 2],
    ["lat", 2],
    ["chest", 2],
    ["back", 2],
    ["shoulders", 2],
    ["glute", 2],
    ["glutes", 2],
    ["quad", 2],
    ["quads", 2],
    ["hamstring", 2],
    ["hamstrings", 2],
    ["legs", 2],
    ["abs", 2],
    ["core", 1],
    ["strength", 3],
    ["lifting", 3],
    ["powerlifting", 3],
    ["bodybuilding", 3],
    ["hypertrophy", 3],
    ["stronglifts", 3],
  ],
  Cardio: [
    ["run", 3],
    ["running", 3],
    ["treadmill", 4],
    ["cardio", 3],
    ["cycle", 3],
    ["cycling", 3],
    ["bike", 2],
    ["rowing", 3],
    ["rower", 3],
    ["jump rope", 4],
    ["jumping rope", 4],
    ["skip rope", 4],
    ["stair climber", 3],
    ["elliptical", 4],
    ["swim", 3],
    ["swimming", 3],
    ["walk", 2],
    ["walking", 2],
    ["endurance", 3],
    ["aerobic", 3],
    ["5k", 4],
    ["10k", 4],
    ["marathon", 4],
    ["jog", 3],
    ["jogging", 3],
    ["stepper", 3],
  ],
  HIIT: [
    ["hiit", 4],
    ["interval", 4],
    ["tabata", 4],
    ["burpee", 4],
    ["burpees", 4],
    ["mountain climber", 3],
    ["mountain climbers", 3],
    ["jumping jack", 3],
    ["jumping jacks", 3],
    ["high knee", 3],
    ["high knees", 3],
    ["box jump", 3],
    ["box jumps", 3],
    ["sprint", 4],
    ["sprints", 4],
    ["metcon", 4],
    ["circuit", 2],
    ["bootcamp", 3],
    ["crossfit", 3],
    ["amrap", 4],
    ["emom", 4],
    ["plyo", 3],
    ["plyometric", 3],
    ["blast", 2],
  ],
  Pilates: [
    ["pilates", 4],
    ["reformer", 4],
    ["mat pilates", 4],
    ["core burn", 3],
    ["teaser", 3],
    ["the hundred", 4],
    ["hundred", 2],
    ["roll up", 3],
    ["mermaid", 3],
    ["elephant", 2],
    ["side kick", 2],
    ["pilates ring", 3],
    ["saw", 2],
  ],
  Yoga: [
    ["yoga", 4],
    ["vinyasa", 4],
    ["hatha", 3],
    ["ashtanga", 3],
    ["power yoga", 3],
    ["yin", 3],
    ["restorative", 3],
    ["flow", 2],
    ["downward", 3],
    ["downward dog", 4],
    ["warrior", 3],
    ["sun salutation", 4],
    ["savasana", 4],
    ["asana", 3],
    ["pranayama", 4],
    ["chaturanga", 3],
    ["namaste", 3],
    ["cobra", 2],
    ["pigeon", 2],
    ["child's pose", 4],
    ["tree pose", 4],
    ["beginner yoga", 4],
  ],
  Other: [
    ["stretching", 3],
    ["stretch", 2],
    ["mobility", 3],
    ["foam", 3],
    ["foam rolling", 4],
    ["roll out", 2],
    ["warm up", 3],
    ["warm-up", 3],
    ["warmup", 3],
    ["cooldown", 3],
    ["cool down", 3],
    ["cool-down", 3],
    ["recovery", 3],
    ["active recovery", 4],
    ["meditation", 3],
    ["breathwork", 4],
    ["breathing", 2],
    ["balance", 2],
    ["posture", 2],
    ["core stability", 3],
    ["activation", 2],
    ["prehab", 3],
    ["rehab", 3],
    ["deload", 4],
    ["rest day", 4],
  ],
};

// Normalize text for keyword matching: lowercase, strip accents/punctuation.
const tidy = (value) =>
  (value || "")
    .toString()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9+\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Infer a workout's fitness category from its title, exercise names,
 * and muscle groups. Falls back to "Other" when nothing matches.
 *
 * @param {{ title?: string, name?: string, exercises?: Array }} workout
 * @returns {string} One of CATEGORY_OPTIONS
 */
export function inferCategory(workout = {}) {
  const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];

  const exerciseNames = exercises
    .map((ex) => ex?.name || "")
    .filter(Boolean);
  const muscleGroups = exercises
    .map((ex) => ex?.muscleGroup || "")
    .filter(Boolean);

  const title = tidy(workout.title || workout.name || "");
  const names = exerciseNames.map(tidy).filter(Boolean);
  const groups = muscleGroups.map(tidy).filter(Boolean);

  if (!title && names.length === 0 && groups.length === 0) return "Other";

  const scores = {};

  const apply = (text, multiplier) => {
    for (const category of CATEGORY_OPTIONS) {
      for (const [keyword, weight] of CATEGORY_KEYWORDS[category]) {
        if (text.includes(keyword)) {
          scores[category] =
            (scores[category] || 0) + weight * multiplier;
        }
      }
    }
  };

  // Title carries the strongest signal; exercise names next;
  // muscle groups are corroborating evidence.
  if (title) apply(title, 2);
  names.forEach((name) => apply(name, 1));
  groups.forEach((group) => apply(group, 0.5));

  let best = "Other";
  let bestScore = 0;

  for (const category of CATEGORY_OPTIONS) {
    const score = scores[category] || 0;
    if (score > bestScore) {
      bestScore = score;
      best = category;
    }
  }

  return best;
}

export default inferCategory;
