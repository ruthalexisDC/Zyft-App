// backend/models/Workout.js

import mongoose from "mongoose";


// ─────────────────────────────────────────
// SET
// ─────────────────────────────────────────

const setSchema = new mongoose.Schema(
  {
    reps: {
      type: Number,
      required: true,
      min: 0,
    },

    weight: {
      type: Number,
      default: 0,
      min: 0,
    },

    unit: {
      type: String,
      enum: ["kg", "lb"],
      default: "kg",
    },

    rpe: {
      type: Number,
      min: 1,
      max: 10,
    },

    isWarmup: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);


// ─────────────────────────────────────────
// EXERCISE
// ─────────────────────────────────────────

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    muscleGroup: {
      type: String,
      default: "",
      trim: true,
    },

    sets: {
      type: [setSchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);


// ─────────────────────────────────────────
// COMMENT
// ─────────────────────────────────────────

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);


// ─────────────────────────────────────────
// WORKOUT
// ─────────────────────────────────────────

const workoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    duration: {
      type: Number,
      min: 0,
      default: 0,
    },

    caloriesBurned: {
      type: Number,
      default: 0,
      min: 0,
    },

    exercises: {
      type: [exerciseSchema],
      default: [],
    },

    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },

    // ─────────────────────────────────────
    // PRIVACY
    // ─────────────────────────────────────

    visibility: {
      type: String,
      enum: [
        "private",
        "followers",
        "public",
      ],
      default: "private",
      index: true,
    },

    respects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    comments: {
      type: [commentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);


// ─────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────

workoutSchema.index({
  user: 1,
  createdAt: -1,
});

workoutSchema.index({
  visibility: 1,
  createdAt: -1,
});


export default mongoose.model(
  "Workout",
  workoutSchema
);