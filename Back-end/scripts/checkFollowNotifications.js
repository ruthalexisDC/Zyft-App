// scripts/checkFollowNotifications.js
// Read-only diagnostic — does not modify anything.
// Usage: node scripts/checkFollowNotifications.js james
//
// Prints:
//   1. Every User document whose handle/name/email matches the search term
//      (reveals duplicate test accounts sharing a similar handle/name).
//   2. The 10 most recent "follow" Notification documents, with the raw
//      recipient/sender ids AND their resolved handle, so you can compare
//      the notification's recipient against the _id of the account you're
//      actually logged in as.

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import User from '../models/User.js';
import Notification from '../models/Notification.js';

const search = process.argv[2] || 'james';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  // ── 1. Any account matching the search term ──
  const matches = await User.find({
    $or: [
      { handle: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ],
  }).select('name email handle followers following createdAt');

  console.log(`\n=== Users matching "${search}" (${matches.length}) ===`);
  matches.forEach((u) =>
    console.log({
      _id: u._id.toString(),
      name: u.name,
      handle: u.handle,
      email: u.email,
      followerCount: u.followers.length,
      followingCount: u.following.length,
      createdAt: u.createdAt,
    }),
  );

  if (matches.length > 1) {
    console.log(
      `\n⚠️  Found ${matches.length} accounts matching "${search}" — ` +
        `if you followed one _id but are logged into a different one, ` +
        `that mismatch is exactly why the notification isn't showing up.`,
    );
  }

  // ── 2. Most recent follow notifications, resolved to real handles ──
  const recentFollows = await Notification.find({ type: 'follow' })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('recipient', 'name handle')
    .populate('sender', 'name handle');

  console.log(`\n=== Last ${recentFollows.length} follow notifications ===`);
  recentFollows.forEach((n) =>
    console.log({
      notificationId: n._id.toString(),
      recipient: n.recipient
        ? `${n.recipient.handle} (${n.recipient._id})`
        : '⚠️ recipient user not found (deleted or bad id)',
      sender: n.sender
        ? `${n.sender.handle} (${n.sender._id})`
        : '⚠️ sender user not found',
      read: n.read,
      createdAt: n.createdAt,
    }),
  );

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Lookup failed:', err);
  process.exit(1);
});