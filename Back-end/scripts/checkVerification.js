// scripts/checkVerification.js
// Read-only lookup of a user's email-verification status.
// Usage: node scripts/checkVerification.js ruthalexiskeys
// (or pass an email instead of a handle)

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import User from '../models/User.js';

const search = process.argv[2] || '';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const users = await User.find({
    $or: [
      { handle: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
    ],
  }).select('name email handle isVerified authProvider lastWorkout streakCount focus level');

  console.log(`Found ${users.length} match(es):`);
  users.forEach((u) =>
    console.log({
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      handle: u.handle,
      authProvider: u.authProvider,
      isVerified: u.isVerified,
      lastWorkout: u.lastWorkout,
      streakCount: u.streakCount,
      focus: u.focus,
      level: u.level,
    })
  );

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Lookup failed:', err);
  process.exit(1);
});
