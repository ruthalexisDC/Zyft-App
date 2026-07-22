// // models/Workout.js
// import mongoose from "mongoose";

// const setSchema = new mongoose.Schema({
//   reps: { type: Number, required: true, min: 1 },
//   weight: { type: Number, default: 0, min: 0 },
//   unit: { type: String, enum: ["kg", "lb"], default: "kg" },
//   rpe: { type: Number, min: 1, max: 10 },  // Rate of Perceived Exertion (RPE)
//   isWarmup: { type: Boolean, default: false },

// }, {_id: false });  // Prevents Mongoose from creating an _id for each set

// const exerciseSchema = new mongoose.Schema({
//   name:   { type: String, required: true },
//   muscleGroup: { type: String, default: '' },          // phase 2, exercise library
//   sets:        { type: [setSchema], default: [] },
// });

// const commentSchema = new mongoose.Schema(
//   {
//     user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     text:    { type: String, required: true, maxlength: 500 },
//     likes:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//   },
//   { timestamps: true }
// );

// const workoutSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   title: { type: String, required: true },
//   notes: { type: String, default: "" },
//   duration: { type: Number },
//   caloriesBurned: { type: Number, default: 0 },  
//   exercises: [exerciseSchema],
//   imageUrl: { type: String, default: "" },  // ← MUST have this
//   isPublic: { type: Boolean, default: true },
//   respects: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//   comments: [commentSchema],
// }, { timestamps: true });

// export default mongoose.model("Workout", workoutSchema);

// models/Workout.js
import mongoose from "mongoose";

const setSchema = new mongoose.Schema(
  {
    reps:     { type: Number, required: true, min: 0 },
    weight:   { type: Number, default: 0, min: 0 },
    unit:     { type: String, enum: ["kg", "lb"], default: "kg" },
    rpe:      { type: Number, min: 1, max: 10 },
    isWarmup: { type: Boolean, default: false },
  },
  { _id: false }
);

const exerciseSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    muscleGroup: { type: String, default: "" },
    sets:        { type: [setSchema], default: [] },
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text:    { type: String, required: true, maxlength: 500 },
    likes:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const workoutSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  notes: { type: String, default: "" },
  duration: { type: Number },
  caloriesBurned: { type: Number, default: 0 },  
  exercises: [exerciseSchema],
  imageUrl: { type: String, default: "" },  // ← MUST have this
  isPublic: { type: Boolean, default: true },
  respects: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [commentSchema],
}, { timestamps: true });

export default mongoose.model("Workout", workoutSchema);