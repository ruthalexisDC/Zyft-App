// src/components/FollowListModal.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Loader2 } from "lucide-react";
import axios from "axios";

/**
 * Modal listing a user's followers or following.
 * Matches Profile.jsx's dark theme (#0a0a0a / #13131f / purple accents).
 *
 * Requires the backend routes in routes/users.js:
 *   GET /api/users/id/:id/followers
 *   GET /api/users/id/:id/following
 */
export default function FollowListModal({ open, type, userId, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !userId || !type) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("token");

    axios
      .get(`/api/users/id/${userId}/${type}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => {
        if (!cancelled) setUsers(res.data.users || []);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load this list. Try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, type, userId]);

  if (!open) return null;

  const title = type === "followers" ? "Followers" : "Following";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:w-[400px] max-h-[75vh] sm:max-h-[560px] bg-[#13131f] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              <span className="text-xs text-gray-500">Loading…</span>
            </div>
          )}

          {!loading && error && (
            <p className="text-center text-sm text-gray-500 py-14">{error}</p>
          )}

          {!loading && !error && users.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-14">
              {type === "followers"
                ? "No followers yet"
                : "Not following anyone yet"}
            </p>
          )}

          {!loading &&
            !error &&
            users.map((u) => (
              <Link
                key={u.id}
                to={`/profile/${u.id}`}
                onClick={onClose}
                className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#a78bfa] flex items-center justify-center text-white font-semibold text-sm shrink-0 overflow-hidden ring-1 ring-white/10">
                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (u.name?.[0] || "U").toUpperCase()
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {u.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{u.handle}</p>
                </div>

                {u.isFollowing && (
                  <span className="text-[10px] font-medium text-[#a78bfa] bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full shrink-0">
                    Following
                  </span>
                )}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
