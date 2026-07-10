// import { useState, useRef, useEffect } from "react";
// import {
//   Camera,
//   Dumbbell,
//   Timer,
//   Plus,
//   Home,
//   Compass,
//   Activity as ActivityIcon,
//   User,
//   X,
//   Check,
// } from "lucide-react";
// import { Link, useLocation, useNavigate } from "react-router-dom";

// export default function LogWorkout() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const fileInputRef = useRef(null);

//   const [workoutType, setWorkoutType] = useState("Strength");
//   const [photo, setPhoto] = useState(null);
//   const [saved, setSaved] = useState(false);

//   const [formData, setFormData] = useState({
//     title: "",
//     weight: "100",
//     reps: "8",
//     duration: "45",
//     notes: "",
//   });

//   const workoutTypes = [
//     {
//       id: "Strength",
//       icon: <Dumbbell className="w-5 h-5" />,
//       label: "Strength",
//     },
//     { id: "Cardio", icon: <Timer className="w-5 h-5" />, label: "Cardio" },
//     { id: "Other", icon: <Plus className="w-5 h-5" />, label: "Other" },
//   ];

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handlePhotoClick = () => {
//     fileInputRef.current?.click();
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       const url = URL.createObjectURL(file);
//       setPhoto(url);
//     }
//   };

//   const handleRemovePhoto = () => {
//     if (photo && photo.startsWith("blob:")) URL.revokeObjectURL(photo);
//     setPhoto(null);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   useEffect(() => {
//     return () => {
//       if (photo && photo.startsWith("blob:")) URL.revokeObjectURL(photo);
//     };
//   }, [photo]);

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     if (!formData.weight || !formData.reps || !formData.duration) {
//       return;
//     }

//     const workout = {
//       id: Date.now(),
//       title: formData.title || `${workoutType} Workout`,
//       subtitle: `${workoutType} · Today`,
//       type: workoutType,
//       likes: 0,
//       photo: photo,
//       stats: [
//         { label: "Weight", value: `${formData.weight}kg` },
//         { label: "Reps", value: formData.reps },
//         { label: "Duration", value: `${formData.duration}min` },
//       ],
//       notes: formData.notes,
//       createdAt: new Date().toISOString(),
//     };

//     const existing = JSON.parse(localStorage.getItem("zyft_workouts") || "[]");
//     const updated = [workout, ...existing];
//     localStorage.setItem("zyft_workouts", JSON.stringify(updated));

//     setFormData({
//       title: "",
//       weight: "100",
//       reps: "8",
//       duration: "45",
//       notes: "",
//     });
//     setPhoto(null);
//     if (fileInputRef.current) fileInputRef.current.value = "";

//     setSaved(true);
//     setTimeout(() => {
//       setSaved(false);
//       navigate("/home");
//     }, 1500);
//   };

//   const isActive = (path) => location.pathname === path;

//   return (
//     <div className="min-h-screen bg-[#0a0a0a] text-white pt-4 pb-32 px-4 sm:px-6 max-w-lg mx-auto">
//       {/* Header */}
//       <div className="flex items-center justify-between mb-6 relative">
//         <h1 className="text-xl font-bold text-white">ZYFT</h1>
//         <div className="absolute left-1/2 -translate-x-1/2">
//           <p className="text-sm text-gray-500">Log Workout</p>
//         </div>
//         <Link
//           to="/profile"
//           className="w-10 h-10 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] flex items-center justify-center overflow-hidden"
//         >
//           <span className="text-xs font-bold">Y</span>
//         </Link>
//       </div>

//       {/* Success Toast */}
//       {saved && (
//         <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500/90 text-white px-6 py-3 rounded-full text-sm font-medium flex items-center gap-2 z-50 animate-bounce">
//           <Check className="w-4 h-4" />
//           Workout posted!
//         </div>
//       )}

//       <form onSubmit={handleSubmit} className="space-y-6">
//         {/* Photo Upload */}
//         <div className="bg-[#13131f] rounded-2xl p-5 border border-white/5">
//           <h2 className="text-sm font-semibold mb-4">Add Photo (Optional)</h2>

//           {photo ? (
//             <div className="relative rounded-2xl overflow-hidden border border-white/5">
//               <img
//                 src={photo}
//                 alt="Workout"
//                 className="w-full h-48 object-cover"
//               />
//               <button
//                 type="button"
//                 onClick={handleRemovePhoto}
//                 className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-all"
//               >
//                 <X className="w-4 h-4 text-white" />
//               </button>
//             </div>
//           ) : (
//             <div
//               onClick={handlePhotoClick}
//               className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-[#8b5cf6]/30 transition-all cursor-pointer"
//             >
//               <div className="w-12 h-12 rounded-full bg-[#1a1a2e] flex items-center justify-center">
//                 <Camera className="w-5 h-5 text-[#8b5cf6]" />
//               </div>
//               <div className="text-center">
//                 <p className="text-sm font-medium text-white">Upload Photo</p>
//                 <p className="text-xs text-gray-500 mt-0.5">
//                   Show your progress
//                 </p>
//               </div>
//             </div>
//           )}

//           <input
//             ref={fileInputRef}
//             type="file"
//             accept="image/*"
//             onChange={handleFileChange}
//             className="hidden"
//           />
//         </div>

//         {/* Workout Type */}
//         <div className="bg-[#13131f] rounded-2xl p-5 border border-white/5">
//           <h2 className="text-sm font-semibold mb-4">Workout Type</h2>
//           <div className="grid grid-cols-3 gap-3">
//             {workoutTypes.map((type) => (
//               <button
//                 key={type.id}
//                 type="button"
//                 onClick={() => setWorkoutType(type.id)}
//                 className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all ${
//                   workoutType === type.id
//                     ? "bg-[#8b5cf6]/20 border-[#8b5cf6]/40 text-white"
//                     : "bg-[#1a1a2e] border-white/5 text-gray-400"
//                 }`}
//               >
//                 {type.icon}
//                 <span className="text-xs font-medium">{type.label}</span>
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Workout Details */}
//         <div className="bg-[#13131f] rounded-2xl p-5 border border-white/5">
//           <h2 className="text-sm font-semibold mb-4">Workout Details</h2>
//           <div className="space-y-4">
//             <div>
//               <label className="text-xs text-gray-500 mb-1.5 block">
//                 Workout Title
//               </label>
//               <input
//                 type="text"
//                 name="title"
//                 value={formData.title}
//                 onChange={handleChange}
//                 placeholder="e.g., Push Day - Bench Focus"
//                 className="w-full px-4 py-3 bg-[#1a1a2e] rounded-xl border border-white/5 text-white placeholder-gray-600 text-sm focus:border-[#8b5cf6] focus:outline-none"
//               />
//             </div>

//             <div className="grid grid-cols-3 gap-3">
//               <div>
//                 <label className="text-xs text-gray-500 mb-1.5 block">
//                   Weight
//                 </label>
//                 <div className="relative">
//                   <input
//                     type="number"
//                     name="weight"
//                     min="0"
//                     value={formData.weight}
//                     onChange={handleChange}
//                     className="w-full px-3 py-3 bg-[#1a1a2e] rounded-xl border border-white/5 text-white text-sm text-center focus:border-[#8b5cf6] focus:outline-none"
//                   />
//                   <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">
//                     kg
//                   </span>
//                 </div>
//               </div>
//               <div>
//                 <label className="text-xs text-gray-500 mb-1.5 block">
//                   Reps
//                 </label>
//                 <input
//                   type="number"
//                   name="reps"
//                   min="0"
//                   value={formData.reps}
//                   onChange={handleChange}
//                   className="w-full px-3 py-3 bg-[#1a1a2e] rounded-xl border border-white/5 text-white text-sm text-center focus:border-[#8b5cf6] focus:outline-none"
//                 />
//               </div>
//               <div>
//                 <label className="text-xs text-gray-500 mb-1.5 block">
//                   Duration
//                 </label>
//                 <div className="relative">
//                   <input
//                     type="number"
//                     name="duration"
//                     min="0"
//                     value={formData.duration}
//                     onChange={handleChange}
//                     className="w-full px-3 py-3 bg-[#1a1a2e] rounded-xl border border-white/5 text-white text-sm text-center focus:border-[#8b5cf6] focus:outline-none"
//                   />
//                   <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">
//                     Min
//                   </span>
//                 </div>
//               </div>
//             </div>

//             <div>
//               <label className="text-xs text-gray-500 mb-1.5 block">
//                 Notes (Optional)
//               </label>
//               <textarea
//                 name="notes"
//                 value={formData.notes}
//                 onChange={handleChange}
//                 placeholder="How did it feel? Any PRs?"
//                 rows={3}
//                 className="w-full px-4 py-3 bg-[#1a1a2e] rounded-xl border border-white/5 text-white placeholder-gray-600 text-sm focus:border-[#8b5cf6] focus:outline-none resize-none"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Submit Button */}
//         <button
//           type="submit"
//           className="w-full py-3.5 bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] rounded-full font-medium text-white text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:from-[#7c3aed] hover:to-[#8b5cf6] hover:-translate-y-0.5 active:scale-[0.96] active:shadow-purple-500/60 active:brightness-110 transition-all duration-150"
//         >
//           Post Workout
//         </button>
//       </form>

//       {/* Bottom Nav — FIXED max-w to match page */}
//       <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-black border-t border-zinc-900 px-6 py-3 z-30">
//         <div className="flex items-end justify-between text-gray-500">
//           <Link
//             to="/home"
//             className={`flex flex-col items-center gap-1 text-xs ${isActive("/home") ? "text-white" : "hover:text-white"}`}
//           >
//             <Home size={20} strokeWidth={1.5} />
//             <span className="text-[10px]">Home</span>
//           </Link>

//           <Link
//             to="/discover"
//             className={`flex flex-col items-center gap-1 text-xs ${isActive("/discover") ? "text-purple-400" : "hover:text-white"}`}
//           >
//             <Compass size={20} strokeWidth={1.5} />
//             <span className="text-[10px]">Discover</span>
//           </Link>

//           <Link
//             to="/log"
//             className={`relative -top-5 flex items-center justify-center ${isActive("/log") ? "scale-110" : ""}`}
//           >
//             <div
//               className={`w-14 h-14 rounded-full flex items-center justify-center ${isActive("/log") ? "bg-gradient-to-br from-purple-500 to-purple-300 text-white shadow-[0_0_35px_rgba(168,85,247,0.65)]" : "bg-gradient-to-br from-gray-700 to-gray-600 text-gray-300"}`}
//             >
//               <Plus size={28} />
//             </div>
//           </Link>

//           <Link
//             to="/activity"
//             className={`flex flex-col items-center gap-1 text-xs ${isActive("/activity") ? "text-purple-400" : "hover:text-white"}`}
//           >
//             <ActivityIcon size={20} strokeWidth={1.5} />
//             <span className="text-[10px]">Activity</span>
//           </Link>

//           <Link
//             to="/profile"
//             className={`flex flex-col items-center gap-1 text-xs ${isActive("/profile") ? "text-white" : "hover:text-white"}`}
//           >
//             <User size={20} strokeWidth={1.5} />
//             <span className="text-[10px]">Profile</span>
//           </Link>
//         </div>
//       </nav>
//     </div>
//   );
// }

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Plus, X, Camera } from "lucide-react";
import BottomNav from "../components/BottomNav.jsx";

export default function LogWorkout() {
  const navigate = useNavigate();
  const [workoutData, setWorkoutData] = useState({
    title: "",
    category: "Strength",
    duration: "",
    caloriesBurned: "",
    notes: "",
    imageUrl: "",
  });
  const [exercises, setExercises] = useState([
    { name: "", sets: "", reps: "", weight: "" },
  ]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setWorkoutData({ ...workoutData, [e.target.name]: e.target.value });
  };

  const handleExerciseChange = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  const addExercise = () => {
    setExercises([...exercises, { name: "", sets: "", reps: "", weight: "" }]);
  };

  const removeExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    console.log("🔍 File selected:", selected);
    console.log("🔍 File name:", selected?.name);
    console.log("🔍 File type:", selected?.type);
    console.log("🔍 File size:", selected?.size);
    setFile(selected || null);
  };

  //uploads to Cloudinary and returns the secure URL or empty string on failure
  const uploadImage = async () => {
    if (!file) {
      console.log("🔍 No file selected");
      return "";
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Zyft-App");

    try {
      console.log("🔍 Uploading to Cloudinary...");
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dchye2j8e/image/upload",
        { method: "POST", body: formData },
      );

      console.log("🔍 Response status:", res.status, res.statusText);

      const text = await res.text(); // Get raw text first
      console.log("🔍 Raw response:", text);

      const data = JSON.parse(text);
      console.log("🔍 Parsed data:", data);

      if (!res.ok || data.error || !data.secure_url) {
        console.error("🔍 Upload failed:", data.error || "No secure_url");
        throw new Error(data.error?.message || "Image upload failed");
      }

      console.log("🔍 Success! URL:", data.secure_url);
      setUploading(false);
      return data.secure_url;
    } catch (err) {
      console.error("🔍 Upload error:", err);
      setUploading(false);
      return "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🔍 Form submitted");
    console.log("🔍 File before upload:", file);
    setLoading(true);

    const imageUrl = await uploadImage();
    console.log("🔍 Image URL result:", imageUrl);

    const payload = {
      ...workoutData,
      exercises: exercises.filter((ex) => ex.name.trim()),
      imageUrl,
    };

    console.log("🔍 Payload:", payload);
    console.log("🔍 Payload imageUrl:", payload.imageUrl);

    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("🔍 Workout save status:", res.status);

      if (res.ok) {
        navigate("/home");
      } else {
        const err = await res.json();
        console.error("🔍 Workout save error:", err);
        alert(err.message || "Failed to log workout");
      }
    } catch (err) {
      console.error("🔍 Network error:", err);
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-28 px-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="pt-6 pb-4">
        <h1 className="text-xl font-bold">Log Workout</h1>
        <p className="text-xs text-gray-500 mt-1">Track your progress</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            Workout Title
          </label>
          <input
            type="text"
            name="title"
            value={workoutData.title}
            onChange={handleChange}
            placeholder="e.g. Morning Chest Day"
            className="w-full p-3 rounded-xl bg-[#13131f] border border-white/5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Category</label>
          <select
            name="category"
            value={workoutData.category}
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-[#13131f] border border-white/5 text-sm text-white focus:outline-none focus:border-purple-500/50"
          >
            <option value="Strength">Strength</option>
            <option value="Cardio">Cardio</option>
            <option value="HIIT">HIIT</option>
            <option value="Pilates">Pilates</option>
            <option value="Yoga">Yoga</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Duration & Calories */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">
              Duration (min)
            </label>
            <input
              type="number"
              name="duration"
              value={workoutData.duration}
              onChange={handleChange}
              placeholder="45"
              className="w-full p-3 rounded-xl bg-[#13131f] border border-white/5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">
              Calories
            </label>
            <input
              type="number"
              name="caloriesBurned"
              value={workoutData.caloriesBurned}
              onChange={handleChange}
              placeholder="300"
              className="w-full p-3 rounded-xl bg-[#13131f] border border-white/5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>

        {/* Exercises */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-400">Exercises</label>
            <button
              type="button"
              onClick={addExercise}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <Plus size={14} />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {exercises.map((ex, i) => (
              <div
                key={i}
                className="bg-[#13131f] rounded-xl p-3 border border-white/5 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Exercise name"
                    value={ex.name}
                    onChange={(e) =>
                      handleExerciseChange(i, "name", e.target.value)
                    }
                    className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none"
                  />
                  {exercises.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExercise(i)}
                      className="text-gray-600 hover:text-red-400"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    placeholder="Sets"
                    value={ex.sets}
                    onChange={(e) =>
                      handleExerciseChange(i, "sets", e.target.value)
                    }
                    className="bg-[#0a0a0a] rounded-lg p-2 text-xs text-white placeholder-gray-600 focus:outline-none text-center"
                  />
                  <input
                    type="number"
                    placeholder="Reps"
                    value={ex.reps}
                    onChange={(e) =>
                      handleExerciseChange(i, "reps", e.target.value)
                    }
                    className="bg-[#0a0a0a] rounded-lg p-2 text-xs text-white placeholder-gray-600 focus:outline-none text-center"
                  />
                  <input
                    type="number"
                    placeholder="kg"
                    value={ex.weight}
                    onChange={(e) =>
                      handleExerciseChange(i, "weight", e.target.value)
                    }
                    className="bg-[#0a0a0a] rounded-lg p-2 text-xs text-white placeholder-gray-600 focus:outline-none text-center"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Notes</label>
          <textarea
            name="notes"
            value={workoutData.notes}
            onChange={handleChange}
            rows="3"
            placeholder="How did it feel?"
            className="w-full p-3 rounded-xl bg-[#13131f] border border-white/5 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-purple-500/50"
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            Workout Photo
          </label>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="workout-photo"
            />
            <label
              htmlFor="workout-photo"
              className="flex items-center gap-3 p-3 rounded-xl bg-[#13131f] border border-white/5 cursor-pointer hover:border-purple-500/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Camera size={18} className="text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">
                  {file ? file.name : "Choose a photo"}
                </p>
                <p className="text-[10px] text-gray-500">
                  {file ? "Tap to change" : "Optional - share your workout"}
                </p>
              </div>
            </label>
          </div>
          {file && (
            <img
              src={URL.createObjectURL(file)}
              alt="Preview"
              className="w-full h-48 object-cover rounded-xl mt-2"
            />
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full py-3.5 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] rounded-xl font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Uploading...
            </>
          ) : loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Dumbbell size={18} />
              Log Workout
            </>
          )}
        </button>
      </form>
    </div>
  );
}
