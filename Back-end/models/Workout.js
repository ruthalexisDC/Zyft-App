// // backend/models/Workout.js
// import mongoose from "mongoose";

// const exerciseSchema = new mongoose.Schema({
//   name:   { type: String, required: true },
//   sets:   { type: Number, default: 0 },
//   reps:   { type: Number, default: 0 },
//   weight: { type: Number, default: 0 }, // kg
// });

// const workoutSchema = new mongoose.Schema(
//   {
//     user:           { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     title:          { type: String, required: true },
//     category:       { type: String, default: "General" }, // e.g. Strength, Cardio, Yoga
//     duration:       { type: Number, default: 0 },  // minutes
//     caloriesBurned: { type: Number, default: 0 },
//     exercises:      [exerciseSchema],
//     notes:          { type: String, default: "" },
//     imageUrl:       { type: String, default: "" }, // Cloudinary workout photo
//   },
//   { timestamps: true } // createdAt used for "today's workouts" query
// );

// export default mongoose.model("Workout", workoutSchema);

// models/Workout.js
import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema({
  name:   { type: String, required: true },
  sets:   { type: String },          // e.g. "5×5"
  weight: { type: String },          // e.g. "95 kg"
  reps:   { type: Number },
});

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

