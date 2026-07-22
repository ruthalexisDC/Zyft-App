// // backend/controllers/workoutController.js
// import Workout from '../models/Workout.js';
// import Post from '../models/Post.js';

// function expandExercise(ex) {
//   const setsCount = parseInt(ex.sets, 10) || 1;
//   const reps = Number(ex.reps) || 0;
//   const weight = parseFloat(ex.weight) || 0;
//   return {
//     name: ex.name,
//     sets: Array.from({ length: setsCount }, () => ({ reps, weight, unit: 'kg' })),
//   };
// }

// export const createWorkout = async (req, res) => {
//   try {
//     const exercises = (req.body.exercises || []).map(expandExercise);

//     // 1. Create the workout
//     const workoutData = {
//       user: req.user._id,
//       title: req.body.title,
//       notes: req.body.notes,
//       duration: req.body.duration,
//       exercises,
//       imageUrl: req.body.imageUrl || '',
//       isPublic: req.body.isPublic ?? true,
//       caloriesBurned: req.body.caloriesBurned || 0,
//     };

//     const workout = await Workout.create(workoutData);

//     // 2. Auto-create a social post — same exercises array, no separate mapping
//     const post = await Post.create({
//       user: req.user._id,
//       content: req.body.notes || `Just crushed ${req.body.title}! 💪`,
//       visibility: req.body.isPublic !== false ? 'public' : 'private',
//       workout: {
//         workoutId: workout._id,
//         title: req.body.title,
//         category: req.body.category || 'Other',
//         duration: req.body.duration,
//         caloriesBurned: req.body.caloriesBurned || 0,
//         exercises,
//         imageUrl: req.body.imageUrl || '',
//       },
//       media: req.body.imageUrl ? [{ url: req.body.imageUrl, type: 'image' }] : [],
//     });

//     res.status(201).json({
//       success: true,
//       workout,
//       post,
//     });
//   } catch (error) {
//     console.error('Create workout error:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

// backend/controllers/workoutController.js
import Workout from '../models/Workout.js';
import Post from '../models/Post.js';

function expandExercise(ex) {
  const setsCount = parseInt(ex.sets, 10) || 1;
  const reps = Number(ex.reps) || 0;
  const weight = parseFloat(ex.weight) || 0;
  return {
    name: ex.name,
    sets: Array.from({ length: setsCount }, () => ({ reps, weight, unit: 'kg' })),
  };
}

export const createWorkout = async (req, res) => {
  try {
    const exercises = (req.body.exercises || []).map(expandExercise);

    // 1. Create the workout
    const workoutData = {
      user: req.user._id,
      title: req.body.title,
      notes: req.body.notes,
      duration: req.body.duration,
      exercises,
      imageUrl: req.body.imageUrl || '',
      isPublic: req.body.isPublic ?? true,
      caloriesBurned: req.body.caloriesBurned || 0,
    };

    const workout = await Workout.create(workoutData);

    // 2. Auto-create a social post — same exercises array, linked back to the workout
    const post = await Post.create({
      user: req.user._id,
      content: req.body.notes || `Just crushed ${req.body.title}! 💪`,
      visibility: req.body.isPublic !== false ? 'public' : 'private',
      workout: {
        workoutId: workout._id,
        title: req.body.title,
        category: req.body.category || 'Other',
        duration: req.body.duration,
        caloriesBurned: req.body.caloriesBurned || 0,
        exercises,
        imageUrl: req.body.imageUrl || '',
      },
      media: req.body.imageUrl ? [{ url: req.body.imageUrl, type: 'image' }] : [],
    });

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