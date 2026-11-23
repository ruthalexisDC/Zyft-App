
// import mongoose from "mongoose";

// const reportSchema = new mongoose.Schema({
//   post: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Post",
//     required: false,
//     default: null,
//   },

//   reporter: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: false,
//     default: null,
//   },

//   reason: {
//     type: String,
//     required: true,
//     enum: [
//       "spam",
//       "harassment",
//       "inappropriate",
//       "falseInfo",
//       "other",
//     ],
//   },

//   status: {
//     type: String,
//     enum: ["pending", "reviewed", "resolved", "dismissed"],
//     default: "pending",
//   },

//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// reportSchema.index(
//   { post: 1, reporter: 1 },
//   {
//     unique: true,
//     partialFilterExpression: {
//       post: { $type: "objectId" },
//       reporter: { $type: "objectId" },
//     },
//   }
// );

// const Report = mongoose.model("Report", reportSchema);

// export default Report;

import mongoose from "mongoose";

const postSnapshotSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    authorName: {
      type: String,
      default: "",
    },

    authorHandle: {
      type: String,
      default: "",
    },

    content: {
      type: String,
      default: "",
    },

    tags: {
      type: [String],
      default: [],
    },

    visibility: {
      type: String,
      enum: ["public", "followers", "private"],
      default: null,
    },

    workout: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    default: null,
  },

  // Retained permanently to identify the originally reported post.
  originalPostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    default: null,
  },

  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  reason: {
    type: String,
    required: true,
    enum: [
      "spam",
      "harassment",
      "inappropriate",
      "falseInfo",
      "other",
    ],
  },

  status: {
    type: String,
    enum: ["pending", "reviewed", "resolved", "dismissed"],
    default: "pending",
  },

  postSnapshot: {
    type: postSnapshotSchema,
    default: undefined,
  },

  // Eligible for snapshot cleanup after 180 days.
  snapshotExpiresAt: {
    type: Date,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

reportSchema.index(
  { post: 1, reporter: 1 },
  {
    unique: true,
    partialFilterExpression: {
      post: { $type: "objectId" },
      reporter: { $type: "objectId" },
    },
  }
);

const Report = mongoose.model("Report", reportSchema);

export default Report;
