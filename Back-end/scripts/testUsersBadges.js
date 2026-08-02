// scripts/testUsersBadges.js
// Temporary verification script — hits GET /api/users with a real JWT
// generated from the backend's own generateToken util, and prints the
// shaped users (including the new `badges` array) returned by the API.
//
// Usage: node scripts/testUsersBadges.js

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

const API_BASE = process.env.API_URL || 'http://localhost:5000/api';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Pick the first local user as the "current user" for the request.
  const currentUser = await User.findOne({ authProvider: 'local' });
  if (!currentUser) {
    console.error('No local user found to act as the requester');
    process.exit(1);
  }

  const token = generateToken(currentUser._id);

  const res = await fetch(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log('GET /api/users status:', res.status);

  const data = await res.json();

  if (!data.users) {
    console.log('Response:', JSON.stringify(data, null, 2));
    process.exit(0);
  }

  console.log(`Returned ${data.users.length} users. Sample shape:\n`);
  data.users.slice(0, 5).forEach((u) => {
    console.log({
      id: String(u.id).slice(-8),
      name: u.name,
      handle: u.handle,
      focus: u.focus,
      level: u.level,
      badges: u.badges || [],
    });
  });

  const withBadges = data.users.filter((u) => (u.badges || []).length > 0);
  console.log(`\nUsers with ≥1 badge: ${withBadges.length} / ${data.users.length}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
