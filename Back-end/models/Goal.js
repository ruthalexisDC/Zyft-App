// backend/models/Goal.js
import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title:     { type: String, required: true },         // e.g. "Log 2 workouts"
    type:      { type: String, required: true,           // "workouts" | "calories" | "duration"
                 enum: ["workouts", "calories", "duration", "custom"] },
    target:    { type: Number, required: true },          // e.g. 2 (workouts), 500 (calories)
    current:   { type: Number, default: 0 },             // auto-updated by stats controller
    completed: { type: Boolean, default: false },
    date:      { type: Date, default: () => {            // which day this goal belongs to
                  const d = new Date();
                  d.setHours(0, 0, 0, 0);
                  return d;
                }},
  },
  { timestamps: true },
);

// Index for fast daily goal lookups
goalSchema.index({ user: 1, date: 1 });

export default mongoose.model("Goal", goalSchema);