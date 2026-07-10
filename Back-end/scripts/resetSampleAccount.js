// scripts/resetSampleAccount.js
//
// One-off cleanup: wipes sample/test data (posts, stats fields, split, saved/hidden posts)
// from a specific user WITHOUT deleting the account itself — useful when an old test
// account got merged into a real OAuth login via matching email.
//
// Usage:
//   node scripts/resetSampleAccount.js ruthalexiskeys
//   (or pass an email instead of a handle)
//
// Run this from your Back-end project root, where node_modules / .env live.

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath });

console.log('Resolved .env path:', envPath);
if (result.error) {
  console.log('dotenv.config() error:', result.error.message);
} else {
  console.log('dotenv.config() loaded keys:', Object.keys(result.parsed || {}));
}
console.log('MONGO_URI present after load?', !!process.env.MONGO_URI);

import User from '../models/User.js';
import Post from '../models/Post.js'; // adjust path/name if your Post model lives elsewhere

const identifier = process.argv[2];

if (!identifier) {
  console.error('Usage: node scripts/resetSampleAccount.js <handle-or-email>');
  process.exit(1);
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const query = identifier.includes('@')
    ? { email: identifier }
    : { handle: identifier };

  const user = await User.findOne(query);

  if (!user) {
    console.error(`No user found matching: ${identifier}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Found user: ${user.name} (${user.email}), _id: ${user._id}`);

  // ── Delete all posts authored by this user ──
  const deletedPosts = await Post.deleteMany({ user: user._id });
  console.log(`Deleted ${deletedPosts.deletedCount} post(s)`);

  // ── Reset stat/profile fields back to defaults, keep identity fields intact ──
  user.streakCount = 0;
  user.lastWorkout = undefined;
  user.workoutSplit = ['Rest', 'Rest', 'Rest', 'Rest', 'Rest', 'Rest', 'Rest'];
  user.savedPosts = [];
  user.hiddenPosts = [];
  user.followers = [];
  user.following = [];
  user.bio = '';
  user.onboardingComplete = false;

  await user.save();
  console.log('Reset user stat/profile fields to defaults');

  console.log('Done. Account preserved:', {
    _id: user._id,
    name: user.name,
    email: user.email,
    handle: user.handle,
    authProvider: user.authProvider,
    googleId: user.googleId,
  });

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});