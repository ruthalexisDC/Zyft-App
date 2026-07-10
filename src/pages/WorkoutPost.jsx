// src/pages/WorkoutPost.jsx
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { getPost, updatePost, deletePost, respectPost } from "../api/posts";
import FeedPostCard from "../components/FeedPostCard";

export default function WorkoutPost() {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Passed by Activity.jsx when navigating here from a notification —
  // which comment to scroll to, and whether to land with the reply box
  // already focused (e.g. tapping "Reply" on a comment notification).
  const focusCommentId = location.state?.focusComment ?? null;
  const autoOpenReply = location.state?.openReply ?? false;

  const fetchPost = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const { data } = await getPost(workoutId);
      const fetched = data?.post ?? data;
      if (!fetched || !fetched._id) {
        setNotFound(true);
      } else {
        setPost(fetched);
      }
    } catch (err) {
      console.error("Failed to load workout post:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [workoutId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // Mirrors Home.jsx's handleUpdatePost, but updates the single post in
  // local state instead of a list.
  const handleUpdate = async (postId, updates) => {
    try {
      const { data } = await updatePost(postId, updates);
      setPost(data);
      return data;
    } catch (err) {
      console.error("Failed to update post:", err);
      throw err;
    }
  };

  // After deleting, there's nothing left to show on this page — go back
  // to wherever the user came from.
  const handleDelete = async (postId) => {
    if (!confirm("Delete this post? This can't be undone.")) return;
    try {
      await deletePost(postId);
      navigate(-1);
    } catch {
      alert("Failed to delete post");
    }
  };

  const handleRespect = async (postId, currentRespected, currentCount) => {
    setPost((prev) =>
      prev
        ? {
            ...prev,
            didRespect: !currentRespected,
            respectCount: currentRespected
              ? currentCount - 1
              : currentCount + 1,
          }
        : prev,
    );
    try {
      await respectPost(postId, !currentRespected);
    } catch {
      // Revert on failure
      setPost((prev) =>
        prev
          ? {
              ...prev,
              didRespect: currentRespected,
              respectCount: currentCount,
            }
          : prev,
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-4 pb-28 px-4 max-w-lg mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-[#13131f] border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-sm font-semibold text-gray-300">Workout</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-purple-400" />
        </div>
      ) : notFound || !post ? (
        <div className="flex flex-col items-center justify-center gap-3 py-28 text-center">
          <p className="text-sm text-gray-400">Workout not found.</p>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            Go back
          </button>
        </div>
      ) : (
        <FeedPostCard
          post={post}
          currentUserId={user?._id}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onRespect={handleRespect}
          autoOpenComments={Boolean(focusCommentId) || autoOpenReply}
          focusCommentId={focusCommentId}
          autoFocusReply={autoOpenReply}
        />
      )}
    </div>
  );
}
