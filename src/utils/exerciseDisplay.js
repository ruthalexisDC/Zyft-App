// src/utils/exerciseDisplay.js
//
// Turns a structured sets array (the new Workout/Post exercise shape)
// into short display strings for the feed card / workout detail page.
//
// sets: [{ reps, weight, unit }, ...]
export function summarizeSets(sets = []) {
  if (!Array.isArray(sets) || sets.length === 0) {
    return { count: 0, repsLabel: "", weightLabel: "" };
  }

  const count = sets.length;
  const sameReps = sets.every((s) => s.reps === sets[0].reps);
  const sameWeight = sets.every(
    (s) => s.weight === sets[0].weight && s.unit === sets[0].unit
  );

  const repsLabel = sameReps
    ? String(sets[0].reps)
    : `${Math.min(...sets.map((s) => s.reps))}-${Math.max(...sets.map((s) => s.reps))}`;

  const weightLabel = !sets[0].weight
    ? ""
    : sameWeight
      ? `${sets[0].weight}${sets[0].unit}`
      : `${Math.min(...sets.map((s) => s.weight))}-${Math.max(...sets.map((s) => s.weight))}${sets[0].unit}`;

  return { count, repsLabel, weightLabel };
}