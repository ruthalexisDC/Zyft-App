// src/pages/Activity.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import {
  ThumbsUp,
  MessageCircle,
  UserPlus,
  Zap,
  Bell,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { useSocket } from "../context/SocketContext.jsx";

const API_URL = "http://localhost:5000";

// ── Helpers ───────────────────────────────────────────────────────────────────

const getAvatarColor = (initials) => {
  const colors = {
    SC: "from-[#8b5cf6] to-[#a78bfa]",
    MJ: "from-blue-500 to-blue-400",
    EJ: "from-pink-500 to-pink-400",
    DK: "from-green-500 to-green-400",
    AL: "from-orange-500 to-orange-400",
  };
  return colors[initials] || "from-gray-500 to-gray-400";
};

const getTypeIcon = (type) => {
  if (type === "respect")
    return <ThumbsUp size={10} className="text-purple-400" />;
  if (type === "comment" || type === "mention")
    return <MessageCircle size={10} className="text-blue-400" />;
  if (type === "follow")
    return <UserPlus size={10} className="text-green-400" />;
  if (type === "streak") return <Zap size={10} className="text-yellow-400" />;
  return <Bell size={10} className="text-gray-400" />;
};

const getTypeBg = (type) => {
  if (type === "respect") return "bg-purple-500/20 border-purple-500/30";
  if (type === "comment" || type === "mention")
    return "bg-blue-500/20 border-blue-500/30";
  if (type === "follow") return "bg-green-500/20 border-green-500/30";
  if (type === "streak") return "bg-yellow-500/20 border-yellow-500/30";
  return "bg-gray-500/20 border-gray-500/30";
};

// ── Follow button ─────────────────────────────────────────────────────────────

const FollowButton = ({ userId, isFollowing: initialFollowing }) => {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const method = following ? "delete" : "post";
      await axios({
        method,
        url: `${API_URL}/api/users/${userId}/follow`,
        headers: { Authorization: `Bearer ${token}` },
      });
      setFollowing(!following);
    } catch (err) {
      console.error("Follow error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`flex-1 py-2 text-xs rounded-xl transition-all font-medium ${
        following
          ? "bg-white/5 text-gray-400 border border-white/10"
          : "bg-[#8b5cf6] text-white hover:bg-[#7c3aed]"
      }`}
    >
      {loading ? "..." : following ? "Following" : "Follow back"}
    </button>
  );
};

// ── Notification card ─────────────────────────────────────────────────────────

const NotificationCard = ({ notif, onDismiss, onMarkRead, navigate }) => {
  const isSystem = notif.type === "streak" || notif.type === "welcome";

  const goToWorkout = (openReply = false) => {
    onMarkRead(notif.id);
    if (notif.workoutId) {
      navigate(`/workout/${notif.workoutId}`, {
        state: {
          focusComment: notif.commentId ?? null,
          openReply,
        },
      });
    }
  };

  const goToProfile = () => {
    onMarkRead(notif.id);
    if (notif.user?.id) {
      navigate(`/profile/${notif.user.id}`);
    }
  };

  const handleReply = () => {
    onMarkRead(notif.id);
    if (notif.workoutId) {
      navigate(`/workout/${notif.workoutId}`, {
        state: { focusComment: notif.commentId, openReply: true },
      });
    }
  };

  return (
    <div
      role="article"
      aria-label={`${notif.read ? "" : "Unread: "}${
        isSystem ? notif.title : `${notif.user?.name} ${notif.content}`
      }`}
      className={`relative bg-[#13131f] rounded-2xl p-4 border transition-all ${
        !notif.read
          ? "border-white/10 shadow-[inset_3px_0_0_#8b5cf6]"
          : "border-white/5 opacity-70"
      }`}
    >
      {/* Dismiss */}
      <button
        aria-label="Dismiss"
        onClick={() => onDismiss(notif.id)}
        className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-600 hover:text-gray-400 transition-all"
      >
        <X size={10} />
      </button>

      <div className="flex gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          {isSystem ? (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-yellow-500/90 to-orange-500/90 flex items-center justify-center text-base">
              {notif.emoji}
            </div>
          ) : (
            <button
              onClick={goToProfile}
              className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${getAvatarColor(
                notif.user?.initials,
              )} flex items-center justify-center text-sm font-bold overflow-hidden hover:ring-2 hover:ring-white/20 transition-all`}
            >
              {notif.user?.avatar ? (
                <img
                  src={notif.user.avatar}
                  alt={notif.user.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                notif.user?.initials
              )}
            </button>
          )}
          {!isSystem && (
            <div
              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border flex items-center justify-center pointer-events-none ${getTypeBg(
                notif.type,
              )}`}
            >
              {getTypeIcon(notif.type)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0">
              {isSystem ? (
                <p className="text-sm font-semibold">{notif.title}</p>
              ) : (
                <p className="text-sm font-semibold truncate">
                  {notif.user?.name}
                  <span className="text-gray-500 font-normal text-xs ml-1">
                    {notif.user?.handle}
                  </span>
                </p>
              )}
            </div>
            <span className="text-[10px] text-gray-600 shrink-0 mt-0.5">
              {notif.time}
            </span>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            {isSystem ? (
              notif.subtitle
            ) : (
              <>
                {notif.content}{" "}
                {notif.target && (
                  <span className="text-purple-400 font-medium">
                    {notif.target}
                  </span>
                )}
              </>
            )}
          </p>

          {notif.comment && (
            <div className="mt-2.5 px-3 py-2 bg-white/5 rounded-xl border border-white/5">
              <p className="text-xs text-gray-400 italic">"{notif.comment}"</p>
            </div>
          )}

          {/* Comment / mention actions */}
          {(notif.type === "comment" || notif.type === "mention") && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleReply}
                className="flex-1 py-2 text-xs text-gray-400 bg-white/5 rounded-xl border border-white/5 hover:text-white hover:border-white/10 transition-all"
              >
                Reply
              </button>
              <button
                onClick={() => goToWorkout(false)}
                className="flex-1 py-2 text-xs text-white bg-[#8b5cf6] rounded-xl hover:bg-[#7c3aed] transition-all font-medium"
              >
                View post
              </button>
            </div>
          )}

          {/* Respect action */}
          {notif.type === "respect" && notif.workoutId && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => goToWorkout(false)}
                className="flex-1 py-2 text-xs text-gray-400 bg-white/5 rounded-xl border border-white/5 hover:text-white hover:border-white/10 transition-all"
              >
                View post
              </button>
            </div>
          )}

          {/* Follow actions */}
          {notif.type === "follow" && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={goToProfile}
                className="flex-1 py-2 text-xs text-gray-400 bg-white/5 rounded-xl border border-white/5 hover:text-white hover:border-white/10 transition-all"
              >
                View profile
              </button>
              <FollowButton userId={notif.user?.id} isFollowing={false} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-[#13131f] rounded-2xl p-4 border border-white/5 animate-pulse">
    <div className="flex gap-3">
      <div className="w-11 h-11 rounded-2xl bg-white/5 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-white/5 rounded-full w-2/5" />
        <div className="h-3 bg-white/5 rounded-full w-3/4" />
      </div>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

export default function Activity() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const { isUserOnline } = useSocket();

  const tabs = ["All", "Unread", "Respects", "Comments", "Followers"];

  // ─── Fetch the logged-in user's own profile ───
  // AuthContext's `user` may not carry an up-to-date avatar (e.g. right after
  // login, or if it only stores token claims). Fetch /me directly so the
  // header always shows *your* photo, never a fallback stranger's photo.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let cancelled = false;
    axios
      .get(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (!cancelled) setMyProfile(res.data.user);
      })
      .catch((err) => console.error("Failed to fetch own profile:", err));

    return () => {
      cancelled = true;
    };
  }, []);

  const myName = myProfile?.name || user?.name || "";
  const myAvatar = myProfile?.avatar || user?.avatar || null;
  const myInitial = myName ? myName.charAt(0).toUpperCase() : "U";

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const stats = {
    respects: notifications.filter((n) => n.type === "respect").length,
    comments: notifications.filter(
      (n) => n.type === "comment" || n.type === "mention",
    ).length,
    followers: notifications.filter((n) => n.type === "follow").length,
  };

  const markAllRead = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${API_URL}/api/notifications/read-all`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  }, []);

  const markRead = useCallback(async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${API_URL}/api/notifications/${id}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  }, []);

  const dismiss = useCallback(async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to dismiss:", err);
    }
  }, []);

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "All") return true;
    if (activeTab === "Unread") return !n.read;
    if (activeTab === "Respects") return n.type === "respect";
    if (activeTab === "Comments")
      return n.type === "comment" || n.type === "mention";
    if (activeTab === "Followers") return n.type === "follow";
    return true;
  });

  const newNotifs = filteredNotifications.filter((n) => !n.read);
  const earlierNotifs = filteredNotifications.filter((n) => n.read);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-4 pb-28 px-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative">
        <h1 className="text-xl font-bold text-white">ZYFT</h1>
        <div className="absolute left-1/2 -translate-x-1/2 text-center">
          <p className="text-sm text-gray-500 whitespace-nowrap">Activity</p>
        </div>
        <div className="relative">
          <Link
            to="/profile"
            className="w-10 h-10 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-purple-400 transition-all"
          >
            {myAvatar ? (
              <img
                src={myAvatar}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <span className="text-sm font-bold text-white">{myInitial}</span>
            )}
          </Link>
          {isUserOnline(myProfile?._id || user?._id) && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
          )}
        </div>
      </div>

      {/* Compact stats bar */}
      <div className="flex items-center bg-[#13131f] border border-white/[0.07] rounded-2xl mb-5 overflow-hidden">
        <div className="flex-1 flex items-center justify-center gap-2 py-2.5 border-r border-white/[0.06]">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span className="text-sm font-semibold">{stats.respects}</span>
          <span className="text-[11px] text-gray-500">Respects</span>
        </div>
        <div className="flex-1 flex items-center justify-center gap-2 py-2.5 border-r border-white/[0.06]">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span className="text-sm font-semibold">{stats.comments}</span>
          <span className="text-[11px] text-gray-500">Comments</span>
        </div>
        <div className="flex-1 flex items-center justify-center gap-2 py-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-sm font-semibold">{stats.followers}</span>
          <span className="text-[11px] text-gray-500">Followers</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab
                ? "bg-[#8b5cf6] text-white"
                : "bg-[#13131f] text-gray-400 border border-white/5 hover:text-white hover:border-white/10"
            }`}
          >
            {tab === "Unread" ? (
              <span className="flex items-center gap-1.5">
                {tab}
                {unreadCount > 0 && (
                  <span className="w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
            ) : (
              tab
            )}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="text-center py-8 text-red-400 text-sm">{error}</div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* New section */}
          {newNotifs.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    New
                  </span>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                    {unreadCount} new
                  </div>
                </div>
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-all font-medium"
                >
                  <Check size={12} />
                  Mark all read
                </button>
              </div>
              <div className="space-y-2.5">
                {newNotifs.map((notif) => (
                  <NotificationCard
                    key={notif.id}
                    notif={notif}
                    onDismiss={dismiss}
                    onMarkRead={markRead}
                    navigate={navigate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Earlier section */}
          {earlierNotifs.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Earlier
                </span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              <div className="space-y-2.5">
                {earlierNotifs.map((notif) => (
                  <NotificationCard
                    key={notif.id}
                    notif={notif}
                    onDismiss={dismiss}
                    onMarkRead={markRead}
                    navigate={navigate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {filteredNotifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                <Bell size={24} className="text-gray-600" />
              </div>
              <p className="text-sm text-gray-500">No notifications yet</p>
              <p className="text-xs text-gray-600">
                We'll let you know when something happens
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
