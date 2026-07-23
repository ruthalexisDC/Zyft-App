import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_ORIGIN } from "../config";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
//const API_URL = "http://localhost:5000";
const API_URL = API_ORIGIN;

const TEMPLATES = {
  PPL: ["Push", "Pull", "Legs", "Rest", "Push", "Pull", "Rest"],
  "Upper/Lower": ["Upper", "Lower", "Rest", "Upper", "Lower", "Rest", "Rest"],
  "Full Body": [
    "Full Body",
    "Rest",
    "Full Body",
    "Rest",
    "Full Body",
    "Rest",
    "Rest",
  ],
  "Bro Split": ["Chest", "Back", "Legs", "Shoulders", "Arms", "Rest", "Rest"],
  "Rest Week": ["Rest", "Rest", "Rest", "Rest", "Rest", "Rest", "Rest"],
  Custom: ["", "", "", "", "", "", ""],
};

const WorkoutSplitModal = ({ isOpen, onClose, userId, onSave }) => {
  const [split, setSplit] = useState(Array(7).fill("Rest"));
  const [selectedTemplate, setSelectedTemplate] = useState("Custom");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  // Load existing split on open
  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchSplit = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/api/users/${userId}/split`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.data.split) {
          setSplit(res.data.split);
          const match = Object.entries(TEMPLATES).find(
            ([_, t]) => JSON.stringify(t) === JSON.stringify(res.data.split),
          );
          setSelectedTemplate(match ? match[0] : "Custom");
        }
      } catch (err) {
        console.log("No existing split found");
      }
    };
    fetchSplit();
  }, [isOpen, userId]);

  const handleDayToggle = (index) => {
    setSplit((prev) => {
      const next = [...prev];
      next[index] = next[index] === "Rest" ? "" : "Rest";
      setSelectedTemplate("Custom");
      return next;
    });
  };

  const handleDayLabelChange = (index, value) => {
    setSplit((prev) => {
      const next = [...prev];
      next[index] = value;
      setSelectedTemplate("Custom");
      return next;
    });
  };

  const applyTemplate = (templateName) => {
    setSelectedTemplate(templateName);
    setSplit([...TEMPLATES[templateName]]);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_URL}/api/users/${userId}/split`,
        { split },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setSaved(true);
      onSave?.(res.data);
      setTimeout(() => {
        onClose();
        setSaved(false);
      }, 800);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save split");
    } finally {
      setLoading(false);
    }
  };

  const activeDays = split.filter((d) => d !== "Rest").length;
  const restDays = 7 - activeDays;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#1a1a2e] border border-purple-500/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Weekly Split</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {activeDays} active · {restDays} rest days
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl"
          >
            ×
          </button>
        </div>

        {/* Templates */}
        <div className="px-6 py-4">
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">
            Quick Templates
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(TEMPLATES).map((name) => (
              <button
                key={name}
                onClick={() => applyTemplate(name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedTemplate === name
                    ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Day Grid */}
        <div className="px-6 pb-2">
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">
            Customize Days
          </p>
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((day, i) => {
              const isRest = split[i] === "Rest";
              const isActive = !isRest && split[i].length > 0;

              return (
                <div key={day} className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => handleDayToggle(i)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                      isRest
                        ? "bg-white/5 text-gray-500 hover:bg-white/10"
                        : isActive
                          ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                          : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    }`}
                  >
                    {day[0]}
                  </button>

                  {!isRest && (
                    <input
                      type="text"
                      value={split[i]}
                      onChange={(e) => handleDayLabelChange(i, e.target.value)}
                      placeholder="..."
                      className="w-10 text-center text-xs bg-transparent border-b border-purple-500/30 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 pb-1"
                      maxLength={8}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="px-6 py-3">
          <div className="flex flex-wrap gap-1.5">
            {split.map((label, i) => (
              <span
                key={i}
                className={`text-xs px-2 py-1 rounded-md ${
                  label === "Rest"
                    ? "bg-white/5 text-gray-500"
                    : "bg-purple-500/15 text-purple-300 border border-purple-500/20"
                }`}
              >
                {DAYS[i]}: {label || "?"}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
          <div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            {saved && (
              <p className="text-xs text-green-400">✓ Saved successfully</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-purple-500 hover:bg-purple-400 text-white shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Split"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutSplitModal;
