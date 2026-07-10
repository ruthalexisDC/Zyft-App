// src/pages/NotificationSettings.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  ThumbsUp,
  MessageCircle,
  UserPlus,
  Loader2,
} from "lucide-react";

const TOGGLES = [
  {
    key: "respect",
    label: "Likes",
    description: "When someone gives respect to your workout",
    icon: <ThumbsUp size={16} className="text-purple-400" />,
  },
  {
    key: "comment",
    label: "Comments & mentions",
    description: "When someone comments on or mentions you in a post",
    icon: <MessageCircle size={16} className="text-blue-400" />,
  },
  {
    key: "follow",
    label: "New followers",
    description: "When someone starts following you",
    icon: <UserPlus size={16} className="text-green-400" />,
  },
];

function Switch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
        checked ? "bg-[#8b5cf6]" : "bg-white/10"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function NotificationSettings() {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState({
    respect: true,
    comment: true,
    follow: true,
  });
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get("/api/users/notification-preferences", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setPreferences(res.data.preferences))
      .catch((err) => {
        console.error("Failed to load notification preferences:", err);
        setError("Couldn't load your preferences.");
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (key) => {
    const next = !preferences[key];
    setPreferences((prev) => ({ ...prev, [key]: next })); // optimistic
    setSavingKey(key);

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.patch(
        "/api/users/notification-preferences",
        { [key]: next },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setPreferences(data.preferences);
    } catch (err) {
      console.error("Failed to update notification preference:", err);
      setPreferences((prev) => ({ ...prev, [key]: !next })); // revert
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-4 pb-28 px-4 max-w-lg mx-auto relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate("/account-setting")}
          className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-sm font-semibold">Notifications</h1>
        <div className="w-9 h-9 shrink-0" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
        </div>
      ) : error ? (
        <p className="text-center text-sm text-gray-500 py-16">{error}</p>
      ) : (
        <div className="bg-[#13131f] rounded-2xl border border-white/5 overflow-hidden">
          {TOGGLES.map((t, idx) => (
            <div
              key={t.key}
              className={`flex items-center gap-3 px-4 py-4 ${
                idx !== TOGGLES.length - 1 ? "border-b border-white/5" : ""
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                {t.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200">{t.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
              </div>
              <Switch
                checked={!!preferences[t.key]}
                onChange={() => toggle(t.key)}
                disabled={savingKey === t.key}
              />
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-600 mt-4 px-1">
        Turning a toggle off stops that type of notification from being created
        — it won't show up in your Activity feed either.
      </p>
    </div>
  );
}
