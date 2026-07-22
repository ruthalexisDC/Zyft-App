// Back-end/migrate.js
//
// One-time migration: converts the old flat exercise shape
//   { name, sets: "5×5" (string), weight: "95 kg" (string), reps: 10 (number) }
// into the new per-set array shape
//   { name, sets: [{ reps, weight, unit }, ...] }
//
// Run manually: node Back-end/migrate.js
// Safe to run more than once — already-migrated exercises (sets is already
// an array) are left untouched.
//
// IMPORTANT: back up your database (or run against a staging copy) before
// running this against production data. There's no automatic rollback.

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '.env') });

import Workout from './models/Workout.js';
import Post from './models/Post.js';

function parseSetsCount(setsStr) {
  const match = String(setsStr ?? '').match(/^\d+/); // "5×5" -> 5, "3" -> 3
  return match ? parseInt(match[0], 10) : 1;
}

function parseWeight(weightStr) {
  const match = String(weightStr ?? '').match(/([\d.]+)\s*(kg|lbs?)?/i);
  if (!match) return { value: 0, unit: 'kg' };
  const unit = /lb/i.test(match[2] || '') ? 'lb' : 'kg';
  return { value: parseFloat(match[1]) || 0, unit };
}

function migrateExercises(exercises) {
  return (exercises || []).map((ex) => {
    if (Array.isArray(ex.sets)) return ex; // already migrated, leave as-is

    const count = parseSetsCount(ex.sets);
    const { value, unit } = parseWeight(ex.weight);
    const reps = Number(ex.reps) || 0;

    return {
      name: ex.name,
      muscleGroup: ex.muscleGroup || '',
      sets: Array.from({ length: count }, () => ({ reps, weight: value, unit })),
    };
  });
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const workouts = await Workout.find({});
  let workoutsChanged = 0;
  for (const w of workouts) {
    const migrated = migrateExercises(w.exercises);
    // Skip the save if nothing actually changed (already-migrated docs)
    if (JSON.stringify(migrated) !== JSON.stringify(w.exercises.toObject?.() ?? w.exercises)) {
      w.exercises = migrated;
      await w.save();
      workoutsChanged++;
    }
  }
  console.log(`Workouts: ${workoutsChanged} migrated, ${workouts.length - workoutsChanged} already up to date`);

  const posts = await Post.find({ 'workout.exercises.0': { $exists: true } });
  let postsChanged = 0;
  for (const p of posts) {
    const migrated = migrateExercises(p.workout.exercises);
    if (JSON.stringify(migrated) !== JSON.stringify(p.workout.exercises.toObject?.() ?? p.workout.exercises)) {
      p.workout.exercises = migrated;
      await p.save();
      postsChanged++;
    }
  }
  console.log(`Posts: ${postsChanged} migrated, ${posts.length - postsChanged} already up to date`);

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});