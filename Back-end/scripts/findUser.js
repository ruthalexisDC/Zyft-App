// scripts/findUser.js
// Quick read-only lookup — does not modify anything.
// Usage: node scripts/findUser.js ruthalexiskeys

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

  const matches = await User.find({
    $or: [
      { handle: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
    ],
  }).select('name email handle authProvider googleId createdAt');

  console.log(`Found ${matches.length} match(es):`);
  matches.forEach((u) =>
    console.log({
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      handle: u.handle,
      authProvider: u.authProvider,
      googleId: u.googleId || null,
      createdAt: u.createdAt,
    })
  );

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Lookup failed:', err);
  process.exit(1);
});