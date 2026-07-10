// // controllers/workoutController.js
// import Workout from '../models/Workout.js';
// import Post from '../models/Post.js';
// import User from '../models/User.js';
// import Notification from '../models/Notification.js';

// // ── CREATE WORKOUT + AUTO-CREATE POST ──
// export const createWorkout = async (req, res) => {
//   try {
//     const { title, notes, duration, exercises, category, caloriesBurned, isPublic } = req.body;
//     const userId = req.user._id;

//     // 1. Validate
//     if (!title || title.trim().length === 0) {
//       return res.status(400).json({ message: 'Workout title is required' });
//     }

//     // 2. Create workout
//     const workout = await Workout.create({
//       user: userId,
//       title: title.trim(),
//       notes: notes?.trim() || '',
//       duration: duration || 0,
//       exercises: exercises || [],
//       isPublic: isPublic !== false, // default true
//     });

//     // 3. Create post if public
//     if (workout.isPublic) {
//       const post = await Post.create({
//         user: userId,
//         content: notes?.trim() || `${title.trim()} - just crushed this workout! 💪`,
//         workout: {
//           title: workout.title,
//           category: category || 'Strength',
//           duration: workout.duration,
//           caloriesBurned: caloriesBurned || 0,
//           exercises: (exercises || []).map(e => ({
//             name: e.name,
//             sets: parseInt(e.sets) || 0,
//             reps: e.reps || 0,
//             weight: parseFloat(e.weight) || 0,
//           })),
//           imageUrl: req.body.imageUrl || '',
//         },
//         visibility: 'public',
//       });

//       // 4. Notify followers (optional)
//       const user = await User.findById(userId);
//       if (user?.followers?.length > 0) {
//         const notifications = user.followers.map(followerId => ({
//           recipient: followerId,
//           sender: userId,
//           type: 'respect', // or create 'new_post' type in your enum
//           workout: workout._id,
//         }));
        
//         // Batch insert notifications
//         await Notification.insertMany(notifications);
//       }

//       await post.populate('user', 'name handle avatar');
      
//       return res.status(201).json({
//         success: true,
//         workout,
//         post: {
//           _id: post._id,
//           content: post.content,
//           createdAt: post.createdAt,
//         },
//       });
//     }

//     res.status(201).json({
//       success: true,
//       workout,
//       message: 'Workout saved privately (no post created)',
//     });
//   } catch (error) {
//     console.error('Create workout error:', error);
//     res.status(500).json({ message: 'Failed to create workout', error: error.message });
//   }
// };

// // ── GET ALL WORKOUTS (for user) ──
// export const getWorkouts = async (req, res) => {
//   try {
//     const workouts = await Workout.find({ user: req.user._id })
//       .sort({ createdAt: -1 });
    
//     res.json({ success: true, workouts });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ── GET SINGLE WORKOUT ──
// export const getWorkout = async (req, res) => {
//   try {
//     const workout = await Workout.findOne({
//       _id: req.params.id,
//       user: req.user._id,
//     });
    
//     if (!workout) {
//       return res.status(404).json({ message: 'Workout not found' });
//     }
    
//     res.json({ success: true, workout });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ── DELETE WORKOUT ──
// export const deleteWorkout = async (req, res) => {
//   try {
//     const workout = await Workout.findOne({
//       _id: req.params.id,
//       user: req.user._id,
//     });

//     if (!workout) {
//       return res.status(404).json({ message: 'Workout not found' });
//     }

//     // Also delete associated post
//     await Post.deleteOne({ user: req.user._id, 'workout.title': workout.title });
//     await Workout.findByIdAndDelete(req.params.id);

//     res.json({ success: true, message: 'Workout and post deleted' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// backend/controllers/workoutController.js
import Workout from '../models/Workout.js';
import Post from '../models/Post.js';

export const createWorkout = async (req, res) => {
  try {
    // DEBUG: Log the raw request body
    console.log("🔍 FULL REQ.BODY:", JSON.stringify(req.body, null, 2));
    console.log("🔍 req.body.imageUrl:", req.body.imageUrl);
    console.log("🔍 typeof req.body.imageUrl:", typeof req.body.imageUrl);
    console.log("🔍 req.body keys:", Object.keys(req.body));

    // 1. Create the workout
    const workoutData = {
      user: req.user._id,
      title: req.body.title,
      notes: req.body.notes,
      duration: req.body.duration,
      exercises: req.body.exercises,
      imageUrl: req.body.imageUrl || '',
      isPublic: req.body.isPublic ?? true,
      caloriesBurned: req.body.caloriesBurned || 0,  // ← ADDED
    };

    console.log("🔍 Workout data before create:", JSON.stringify(workoutData, null, 2));

    const workout = await Workout.create(workoutData);

    console.log("🔍 Workout created:", JSON.stringify(workout.toObject(), null, 2));
    console.log("🔍 Saved imageUrl:", workout.imageUrl);

    // 2. Auto-create a social post
    const post = await Post.create({
      user: req.user._id,
      content: req.body.notes || `Just crushed ${req.body.title}! 💪`,
      visibility: req.body.isPublic !== false ? 'public' : 'private',
      workout: {
        title: req.body.title,
        category: req.body.category || 'Other',
        duration: req.body.duration,
        caloriesBurned: req.body.caloriesBurned || 0,
        exercises: req.body.exercises?.map(ex => ({
          name: ex.name,
          sets: Number(ex.sets) || 0,
          reps: Number(ex.reps) || 0,
          weight: Number(ex.weight) || 0,
        })) || [],
        imageUrl: req.body.imageUrl || '',
      },
      media: req.body.imageUrl ? [{ url: req.body.imageUrl, type: 'image' }] : [],
    });

    console.log("🔍 Post created with imageUrl:", post.workout?.imageUrl);

    res.status(201).json({
      success: true,
      workout,
      post,
    });
  } catch (error) {
    console.error('Create workout error:', error);
    res.status(500).json({ message: error.message });
  }
};