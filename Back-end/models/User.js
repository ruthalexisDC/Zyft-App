

// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name:              { type: String, required: true, trim: true },
    handle:            { type: String, required: true, unique: true, lowercase: true, trim: true },
    email:             { type: String, required: true, unique: true, lowercase: true },
    password: {
      type: String,
      required: function () {
        return this.authProvider === 'local' || !this.authProvider;
      },
      select: false,
    },
    avatar:            { type: String, default: "" },
    bio:               { type: String, default: "", maxlength: 200 },
    authProvider:      { type: String, enum: ['local', 'google', 'facebook'], default: 'local' },
    isVerified:        { type: Boolean, default: false },
    onboardingComplete:{ type: Boolean, default: false },
    
    // ── PASSWORD RESET ──
    resetPasswordToken:     { type: String },
    resetPasswordExpires:   { type: Date },


    // ── EMAIL VERIFICATION ──
  emailVerifyToken:   { type: String },
  emailVerifyExpires: { type: Date },

    // Social
    followers:         [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following:         [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Privacy
    isPrivate:         { type: Boolean, default: false },

    // Presence
    isOnline:          { type: Boolean, default: false },
    lastSeen:          { type: Date },

    // Notification preferences
    notificationPreferences: {
      respect: { type: Boolean, default: true },
      comment: { type: Boolean, default: true },
      follow:  { type: Boolean, default: true },
    },

    // Stats
    streakCount:       { type: Number, default: 0 },
    lastWorkout:       { type: Date },
    focus:             { type: String, default: "Strength" },
    level:             { type: String, default: "Beginner" },

    // Workout split
    workoutSplit: {
      type: [String],
      default: ['Rest', 'Rest', 'Rest', 'Rest', 'Rest', 'Rest', 'Rest'],
      validate: {
        validator: (arr) => arr.length === 7,
        message: 'Split must have exactly 7 days',
      }
    },

    // Interaction fields
    savedPosts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }],
    hiddenPosts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }],
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual: follower count
userSchema.virtual("followerCount").get(function () {
  return this.followers?.length || 0;
});

export default mongoose.model("User", userSchema);