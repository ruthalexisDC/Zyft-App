// scripts/checkNotifPrefs.js
// Read-only. Usage: node scripts/checkNotifPrefs.js james

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import User from '../models/User.js';

const search = process.argv[2] || 'james';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const users = await User.find({
    handle: { $regex: search, $options: 'i' },
  }).select('name handle notificationPreferences followers');

  users.forEach((u) =>
    console.log({
      _id: u._id.toString(),
      handle: u.handle,
      notificationPreferences: u.notificationPreferences,
      followerIds: u.followers.map((f) => f.toString()),
    }),
  );

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});