import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Plus, X, Camera, Search } from "lucide-react";
import BottomNav from "../components/BottomNav.jsx";

const EXERCISE_OPTIONS = [
  "Bench Press",
  "Incline Bench Press",
  "Squat",
  "Deadlift",
  "Hyperextension",
  "Goodmorning",
  "Bent row",
  "Cable or abdominal Crunch",
  "Leg Raise",
  "Harmstring Curl",
  "Overhead Press",
  "Barbell Row",
  "Pull Up",
  "Chin Up",
  "Lat Pulldown",
  "Seated Row",
  "Bicep Curl",
  "Tricep Pushdown",
  "Lateral Raise",
  "Shoulder Press",
  "Leg Press",
  "Leg Extension",
  "Leg Curl",
  "Lunges",
  "Hip Thrust",
  "Calf Raise",
  "Plank",
  "Push Up",
  "Dip",
  "Face Pull",
  "Cable Fly",
  "Chest Fly",
  "Romanian Deadlift",
  "Front Squat",
  "Hack Squat",
  "Sumo Squats",
  "Bulgarian Split Squat",
  "Step Up",
  "Glute Bridge",
  "Russian Twist",
  "Mountain Climber",
  "Burpee",
  "Jumping Jack",
  "High Knees",
  "Box Jump",
  "Kettlebell Swing",
  "Hip adduction",
  "Hip abduction",
  "wide grip seated row",
  "Side plank",
  "Cable or dumbell front raise",
  "rear delt fly",
  "Arnold Press",
  "Dumbell Shrug",
];

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
  // Tracks which exercise row's search dropdown is currently open
  const [openSearchIndex, setOpenSearchIndex] = useState(null);

  const handleChange = (e) => {
    setWorkoutData({ ...workoutData, [e.target.name]: e.target.value });
  };

  const handleExerciseChange = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  // Picks a suggestion from the search dropdown
  const handleExercisePick = (index, value) => {
    handleExerciseChange(index, "name", value);
    setOpenSearchIndex(null);
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
            {exercises.map((ex, i) => {
              const filteredOptions = EXERCISE_OPTIONS.filter((opt) =>
                opt.toLowerCase().includes(ex.name.trim().toLowerCase()),
              );
              const isOpen = openSearchIndex === i;

              return (
                <div
                  key={i}
                  className="bg-[#13131f] rounded-xl p-3 border border-white/5 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <div className="flex items-center gap-2">
                        <Search size={14} className="text-gray-600 shrink-0" />
                        <input
                          type="text"
                          placeholder="Search exercises..."
                          value={ex.name}
                          onFocus={() => setOpenSearchIndex(i)}
                          onBlur={() =>
                            setTimeout(() => setOpenSearchIndex(null), 150)
                          }
                          onChange={(e) => {
                            handleExerciseChange(i, "name", e.target.value);
                            setOpenSearchIndex(i);
                          }}
                          className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none"
                        />
                      </div>

                      {isOpen && filteredOptions.length > 0 && (
                        <div className="absolute z-10 left-0 right-0 mt-2 max-h-48 overflow-y-auto rounded-xl bg-[#1a1a26] border border-white/10 shadow-lg">
                          {filteredOptions.map((opt) => (
                            <button
                              type="button"
                              key={opt}
                              // onMouseDown fires before the input's onBlur, so the click registers
                              onMouseDown={() => handleExercisePick(i, opt)}
                              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-purple-500/10 first:rounded-t-xl last:rounded-b-xl"
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}

                      {isOpen &&
                        filteredOptions.length === 0 &&
                        ex.name.trim() && (
                          <div className="absolute z-10 left-0 right-0 mt-2 rounded-xl bg-[#1a1a26] border border-white/10 shadow-lg px-3 py-2 text-xs text-gray-500">
                            No matches — using "{ex.name}" as custom name
                          </div>
                        )}
                    </div>
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
              );
            })}
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
