// src/pages/UserProfile.jsx
// Route: /user/:handle
//
// Displays a user's public profile with a follow/unfollow toggle.

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Zap } from "lucide-react";

// Stub data — replace with your API fetch keyed on handle
const STUB_USERS = {
  sarahfit: {
    name: "Sarah Chen",
    handle: "@sarahfit",
    initials: "SC",
    bio: "Powerlifter & coach. PRs: 130/80/160. Building strength one session at a time 🏋️",
    stats: { workouts: 214, followers: 1340, following: 89 },
    streak: 12,
    recentWorkouts: [
      { id: "w1", title: "Upper A - Strength", date: "Today", duration: "58m" },
      {
        id: "w2",
        title: "Lower B - Volume",
        date: "Yesterday",
        duration: "1h 10m",
      },
      { id: "w3", title: "Push Day", date: "3 days ago", duration: "52m" },
    ],
  },
  marcusfit: {
    name: "Marcus J.",
    handle: "@marcusfit",
    initials: "MJ",
    bio: "Chasing gains. Bodybuilder in prep season 🔥",
    stats: { workouts: 389, followers: 2100, following: 134 },
    streak: 21,
    recentWorkouts: [
      {
        id: "w4",
        title: "Chest & Shoulders",
        date: "Today",
        duration: "1h 5m",
      },
      {
        id: "w5",
        title: "Back & Biceps",
        date: "2 days ago",
        duration: "1h 15m",
      },
    ],
  },
  emmaj: {
    name: "Emma J.",
    handle: "@emmaj",
    initials: "EJ",
    bio: "Running, lifting, living. Half marathon PB: 1:48 🏃‍♀️",
    stats: { workouts: 167, followers: 540, following: 210 },
    streak: 5,
    recentWorkouts: [
      { id: "w6", title: "Long Run - 16km", date: "Today", duration: "1h 38m" },
      {
        id: "w7",
        title: "Full Body Strength",
        date: "Yesterday",
        duration: "45m",
      },
    ],
  },
  davidk: {
    name: "David K.",
    handle: "@davidk",
    initials: "DK",
    bio: "Squat everything. Leg day evangelist 🦵",
    stats: { workouts: 302, followers: 890, following: 76 },
    streak: 8,
    recentWorkouts: [
      {
        id: "w8",
        title: "Leg Day Destruction",
        date: "Today",
        duration: "1h 20m",
      },
    ],
  },
  alexlift: {
    name: "Alex L.",
    handle: "@alexlift",
    initials: "AL",
    bio: "Calisthenics + barbell hybrid athlete 💪",
    stats: { workouts: 445, followers: 3200, following: 55 },
    streak: 30,
    recentWorkouts: [
      {
        id: "w9",
        title: "Pull Day - Back & Biceps",
        date: "Today",
        duration: "55m",
      },
      {
        id: "w10",
        title: "Skill Work - Planche",
        date: "Yesterday",
        duration: "40m",
      },
    ],
  },
};

const avatarColors = {
  SC: "from-[#8b5cf6] to-[#a78bfa]",
  MJ: "from-blue-500 to-blue-400",
  EJ: "from-pink-500 to-pink-400",
  DK: "from-green-500 to-green-400",
  AL: "from-orange-500 to-orange-400",
};

export default function UserProfile() {
  const { handle } = useParams();
  const navigate = useNavigate();
  const user = STUB_USERS[handle];
  const [following, setFollowing] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">User not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="text-purple-400 text-sm"
        >
          Go back
        </button>
      </div>
    );
  }

  const followerCount = user.stats.followers + (following ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-4 pb-28 px-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-[#13131f] border border-white/5 flex items-center justify-center hover:border-white/10 transition-all"
        >
          <ArrowLeft size={16} className="text-gray-400" />
        </button>
        <h2 className="text-sm font-semibold">Profile</h2>
      </div>

      {/* Profile card */}
      <div className="bg-[#13131f] border border-white/[0.07] rounded-2xl p-5 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${
                avatarColors[user.initials] || "from-gray-500 to-gray-400"
              } flex items-center justify-center text-xl font-bold`}
            >
              {user.initials}
            </div>
            <div>
              <p className="text-base font-bold">{user.name}</p>
              <p className="text-xs text-gray-500">{user.handle}</p>
              <div className="flex items-center gap-1 mt-1">
                <Zap size={11} className="text-yellow-400" />
                <span className="text-[11px] text-yellow-400 font-medium">
                  {user.streak}-day streak
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setFollowing((f) => !f)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              following
                ? "bg-white/5 text-gray-400 border border-white/10"
                : "bg-[#8b5cf6] text-white hover:bg-[#7c3aed]"
            }`}
          >
            {following ? "Following" : "Follow"}
          </button>
        </div>

        {user.bio && (
          <p className="text-xs text-gray-400 leading-relaxed mb-4">
            {user.bio}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Workouts", value: user.stats.workouts },
            { label: "Followers", value: followerCount.toLocaleString() },
            { label: "Following", value: user.stats.following },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-white/[0.03] rounded-xl py-2.5 flex flex-col items-center gap-0.5"
            >
              <span className="text-sm font-bold">{value}</span>
              <span className="text-[10px] text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent workouts */}
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
        Recent workouts
      </p>
      <div className="space-y-2.5">
        {user.recentWorkouts.map((w) => (
          <div
            key={w.id}
            className="bg-[#13131f] border border-white/[0.07] rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-purple-500/20 active:scale-[0.99] transition-all"
          >
            <div>
              <p className="text-sm font-medium">{w.title}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{w.date}</p>
            </div>
            <span className="text-[11px] text-gray-600">{w.duration}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
