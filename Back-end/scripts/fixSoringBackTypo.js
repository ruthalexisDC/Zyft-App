// scripts/fixSoringBackTypo.js
// Data-fix script: replaces "Soring Back" (and case variants) with "Sore Back"
// in Workout titles and Post workout titles.
//
// Usage: node scripts/fixSoringBackTypo.js

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import Workout from '../models/Workout.js';
import Post from '../models/Post.js';

const TYPO_REGEX = /soring back/i;
const REPLACEMENT = 'Sore Back';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log('🔍 Searching for "Soring Back" typos…\n');

  // ── 1. Update Workout.title ──────────────────────────────────
  const workouts = await Workout.find({ title: TYPO_REGEX });
  console.log(
    `Found ${workouts.length} Workout document(s) with "Soring Back".`,
  );

  let workoutCount = 0;
  for (const w of workouts) {
    const oldTitle = w.title;
    const newTitle = oldTitle.replace(TYPO_REGEX, REPLACEMENT);
    w.title = newTitle;
    await w.save();
    workoutCount += 1;
    console.log(`  ✅ Workout ${w._id}: "${oldTitle}" → "${newTitle}"`);
  }

  // ── 2. Update Post.workout.title (embedded data) ─────────────
  const posts = await Post.find({
    'workout.title': TYPO_REGEX,
  });
  console.log(
    `\nFound ${posts.length} Post document(s) with "Soring Back" in workout.title.`,
  );

  let postCount = 0;
  for (const p of posts) {
    const oldTitle = p.workout?.title;
    if (!oldTitle) continue;
    const newTitle = oldTitle.replace(TYPO_REGEX, REPLACEMENT);
    p.workout.title = newTitle;
    await p.save();
    postCount += 1;
    console.log(`  ✅ Post ${p._id}: "${oldTitle}" → "${newTitle}"`);
  }

  console.log(
    `\n🎉 Done — updated ${workoutCount} workout(s) and ${postCount} post(s).`,
  );

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Typo-fix script failed:', err);
  process.exit(1);
});
