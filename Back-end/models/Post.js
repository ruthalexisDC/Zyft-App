// import mongoose from 'mongoose';

// const postSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },

//     content: {
//       type: String,
//       required: [true, 'Post content is required'],
//       maxlength: [500, 'Post cannot exceed 500 characters'],
//     },

//     tags: [{ type: String }],

//     visibility: {
//       type: String,
//       enum: ['public', 'followers', 'private'],
//       default: 'public',
//     },

//     workout: {
//       workoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workout' }, 
//       title: String,
//       category: {
//         type: String,
//         enum: ['Strength', 'Cardio', 'HIIT', 'Pilates', 'Yoga', 'Other'],
//       },
//       duration: Number,
//       caloriesBurned: Number,
//       exercises: [
//         {
//           name: String,
//           sets: Number,
//           reps: Number,
//           weight: Number,
//         },
//       ],
//       imageUrl: { type: String, default: '' }, // Cloudinary workout photo
//     },

//     media: [
//       {
//         url: String,
//         type: {
//           type: String,
//           enum: ['image', 'video'],
//         },
//       },
//     ],

//     respects: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//       },
//     ],

//     reposts: [
//       {
//         user: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: 'User',
//         },
//         createdAt: {
//           type: Date,
//           default: Date.now,
//         },
//       },
//     ],

//     isRepost: {
//       type: Boolean,
//       default: false,
//     },
//     originalPost: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Post',
//       default: null,
//     },
//   },
//   {
//     timestamps: true,
//     toJSON: { virtuals: true },
//     toObject: { virtuals: true },
//   }
// );

// // Indexes
// postSchema.index({ createdAt: -1 });
// postSchema.index({ user: 1, createdAt: -1 });
// postSchema.index({ tags: 1 });

// // Virtuals
// postSchema.virtual('respectCount').get(function () {
//   return this.respects.length;
// });

// postSchema.virtual('commentCount', {
//   ref: 'Comment',
//   localField: '_id',
//   foreignField: 'post',
//   count: true,
// });

// postSchema.virtual('repostCount').get(function () {
//   return this.reposts.length;
// });

// // Instance Methods
// postSchema.methods.didUserRespect = function (userId) {
//   return this.respects.some(
//     (id) => id.toString() === userId.toString()
//   );
// };

// postSchema.methods.didUserRepost = function (userId) {
//   return this.reposts.some(
//     (repost) => repost.user.toString() === userId.toString()
//   );
// };

// const Post = mongoose.model('Post', postSchema);

// export default Post;

import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    content: {
      type: String,
      required: [true, 'Post content is required'],
      maxlength: [500, 'Post cannot exceed 500 characters'],
    },

    tags: [{ type: String }],

    visibility: {
      type: String,
      enum: ['public', 'followers', 'private'],
      default: 'public',
    },

    workout: {
      workoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workout' }, 
      title: String,
      category: {
        type: String,
        enum: ['Strength', 'Cardio', 'HIIT', 'Pilates', 'Yoga', 'Other'],
      },
      duration: Number,
      caloriesBurned: Number,
      exercises: [
        {
          name: String,
          muscleGroup: { type: String, default: "" },
          sets: [
            {
              reps: { type: Number, required: true, min: 0 },
              weight: { type: Number, default: 0, min: 0 },
              unit: { type: String, enum: ["kg", "lb"], default: "kg" },
              rpe: { type: Number, min: 1, max: 10 },
              isWarmup: { type: Boolean, default: false },
              _id: false,
            },
          ],
        },
      ],
      imageUrl: { type: String, default: '' }, // Cloudinary workout photo
    },

    media: [
      {
        url: String,
        type: {
          type: String,
          enum: ['image', 'video'],
        },
      },
    ],

     respects: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],  // ← THIS IS CRITICAL
  },

    reposts: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    isRepost: {
      type: Boolean,
      default: false,
    },
    originalPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
postSchema.index({ createdAt: -1 });
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ tags: 1 });

// Virtuals
postSchema.virtual('respectCount').get(function () {
  return this.respects.length;
});

postSchema.virtual('commentCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
  count: true,
});

postSchema.virtual('repostCount').get(function () {
  return this.reposts.length;
});

// Instance Methods
postSchema.methods.didUserRespect = function (userId) {
  return this.respects.some(
    (id) => id.toString() === userId.toString()
  );
};

postSchema.methods.didUserRepost = function (userId) {
  return this.reposts.some(
    (repost) => repost.user.toString() === userId.toString()
  );
};

const Post = mongoose.model('Post', postSchema);

export default Post;