// import { useState, useEffect, useRef, useCallback } from "react";
// import { Link } from "react-router-dom";
// import {
//   MoreHorizontal,
//   ThumbsUp,
//   ChevronDown,
//   ChevronUp,
//   Dumbbell,
//   MessageCircle,
//   Pencil,
//   Check,
//   Trash2,
//   Send,
//   Loader2,
//   Bookmark,
//   EyeOff,
//   Share2,
//   Flag,
//   X,
//   AlertTriangle,
//   SmilePlus,
// } from "lucide-react";

// import {
//   updatePost,
//   deletePost,
//   respectPost,
//   getComments,
//   addComment,
//   deleteComment,
//   updateComment,
//   reactToComment,
//   followUserById,
// } from "../api/posts";

// import {
//   savePost,
//   unsavePost,
//   hidePost,
//   unhidePost,
//   reportPost,
//   trackShare,
// } from "../api/interactions";

// import { useSocket } from "../context/SocketContext.jsx";

// // Must match REACTION_EMOJIS in the backend Comment model — keep in sync.
// const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮"];

// // ─── Toast ────────────────────────────────────────────────────
// function Toast({ message, type, onClose }) {
//   useEffect(() => {
//     const timer = setTimeout(onClose, 3000);
//     return () => clearTimeout(timer);
//   }, [onClose]);

//   return (
//     <div
//       className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl text-xs font-medium shadow-lg shadow-black/50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
//         type === "success"
//           ? "bg-green-500/90 text-white"
//           : type === "error"
//             ? "bg-red-500/90 text-white"
//             : "bg-[#1a1a2e] text-gray-300 border border-white/10"
//       }`}
//     >
//       {type === "success" && <Check size={14} />}
//       {type === "error" && <AlertTriangle size={14} />}
//       {message}
//     </div>
//   );
// }

// // ─── Report Modal ─────────────────────────────────────────────
// function ReportModal({ isOpen, onClose, onSubmit, postTitle }) {
//   const [reason, setReason] = useState("");
//   const [submitting, setSubmitting] = useState(false);
//   const reasons = [
//     "Spam or misleading",
//     "Harassment or bullying",
//     "Inappropriate content",
//     "False information",
//     "Other",
//   ];

//   const handleSubmit = async () => {
//     if (!reason) return;
//     setSubmitting(true);
//     try {
//       await onSubmit(reason);
//       onClose();
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] px-4">
//       <div className="bg-[#1a1a2e] rounded-2xl p-5 w-full max-w-xs border border-white/10 shadow-xl">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-sm font-semibold text-white">Report Post</h3>
//           <button
//             onClick={onClose}
//             className="text-gray-500 hover:text-white transition-colors"
//           >
//             <X size={16} />
//           </button>
//         </div>
//         <p className="text-xs text-gray-500 mb-3 line-clamp-1">
//           "{postTitle || "Untitled post"}"
//         </p>
//         <div className="space-y-1.5 mb-4">
//           {reasons.map((r) => (
//             <button
//               key={r}
//               onClick={() => setReason(r)}
//               className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all ${
//                 reason === r
//                   ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
//                   : "text-gray-400 hover:bg-white/5 hover:text-gray-300"
//               }`}
//             >
//               {r}
//             </button>
//           ))}
//         </div>
//         <div className="flex gap-2">
//           <button
//             onClick={onClose}
//             className="flex-1 py-2.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleSubmit}
//             disabled={!reason || submitting}
//             className="flex-1 py-2.5 text-xs bg-red-500/80 hover:bg-red-500 disabled:bg-red-500/30 text-white rounded-xl transition-colors flex items-center justify-center gap-1.5"
//           >
//             {submitting ? (
//               <Loader2 size={12} className="animate-spin" />
//             ) : (
//               <Flag size={12} />
//             )}
//             Submit Report
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Image Preview Modal ──────────────────────────────────────
// function ImagePreviewModal({ src, alt, onClose }) {
//   useEffect(() => {
//     const handleKey = (e) => {
//       if (e.key === "Escape") onClose();
//     };
//     document.addEventListener("keydown", handleKey);
//     return () => document.removeEventListener("keydown", handleKey);
//   }, [onClose]);

//   if (!src) return null;

//   return (
//     <div
//       className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[80] px-4 py-8"
//       onClick={onClose}
//     >
//       <button
//         onClick={onClose}
//         className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
//         title="Close"
//       >
//         <X size={18} />
//       </button>
//       <img
//         src={src}
//         alt={alt}
//         className="max-w-full max-h-full object-contain rounded-lg"
//         onClick={(e) => e.stopPropagation()}
//       />
//     </div>
//   );
// }

// // ─── Avatar Component ─────────────────────────────────────────
// function UserAvatar({ user, size = 10 }) {
//   const { isUserOnline } = useSocket();

//   const sizeClasses = {
//     7: "w-7 h-7 text-[10px]",
//     10: "w-10 h-10 text-sm",
//   };
//   const dotSize = size === 7 ? "w-2 h-2" : "w-2.5 h-2.5";

//   const photo = user?.photo || user?.avatar;
//   const initial = user?.name?.charAt(0)?.toUpperCase() || "?";
//   const online = isUserOnline(user?._id);

//   return (
//     <div className="relative shrink-0">
//       <div
//         className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#a78bfa] flex items-center justify-center font-bold overflow-hidden`}
//       >
//         {photo ? (
//           <img
//             src={photo}
//             alt={user?.name || "User"}
//             className="w-full h-full object-cover"
//             onError={(e) => {
//               e.target.style.display = "none";
//             }}
//           />
//         ) : (
//           <span>{initial}</span>
//         )}
//       </div>
//       {online && (
//         <div
//           className={`absolute -bottom-0.5 -right-0.5 ${dotSize} bg-green-500 rounded-full border-2 border-[#13131f]`}
//         />
//       )}
//     </div>
//   );
// }

// // ─── Main FeedPostCard ────────────────────────────────────────
// export default function FeedPostCard({
//   post,
//   currentUserId,
//   onUpdate,
//   onDelete,
//   onRespect,
//   autoOpenComments = false,
//   focusCommentId = null,
//   autoFocusReply = false,
// }) {
//   const [showStats, setShowStats] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [editText, setEditText] = useState(post.content || "");
//   const [isSaving, setIsSaving] = useState(false);
//   const [showMenu, setShowMenu] = useState(false);
//   const [saved, setSaved] = useState(post.isSaved || false);
//   const [savingFavorite, setSavingFavorite] = useState(false);
//   const [hidden, setHidden] = useState(post.isHidden || false);
//   const [hiding, setHiding] = useState(false);
//   const [showComments, setShowComments] = useState(autoOpenComments);
//   const [comments, setComments] = useState([]);
//   const [commentText, setCommentText] = useState("");
//   const [commentsLoading, setCommentsLoading] = useState(false);
//   const [postingComment, setPostingComment] = useState(false);
//   const [showReportModal, setShowReportModal] = useState(false);
//   const [toast, setToast] = useState(null);
//   const [editingCommentId, setEditingCommentId] = useState(null);
//   const [editCommentText, setEditCommentText] = useState("");
//   const [savingCommentId, setSavingCommentId] = useState(null);
//   const [previewOpen, setPreviewOpen] = useState(false);

//   // ── Follow state ──
//   const [following, setFollowing] = useState(post.user?.isFollowing ?? false);
//   const [followLoading, setFollowLoading] = useState(false);

//   // ── Reaction picker state ──
//   const [openPickerId, setOpenPickerId] = useState(null);
//   const [reactingCommentId, setReactingCommentId] = useState(null);

//   const menuRef = useRef(null);
//   const commentInputRef = useRef(null);
//   const commentRefs = useRef({});
//   const autoFocusDone = useRef(false);

//   const user = post.user || {};
//   const workout = post.workout || {};
//   const isOwner = currentUserId && user._id === currentUserId;

//   const timeAgo = post.createdAt
//     ? new Date(post.createdAt).toLocaleDateString("en-US", {
//         month: "short",
//         day: "numeric",
//       })
//     : "Recently";

//   const userHandle =
//     user.handle ||
//     user.username ||
//     user.name?.toLowerCase().replace(/\s+/g, "") ||
//     "user";

//   const showToast = useCallback((message, type = "info") => {
//     setToast({ message, type });
//   }, []);

//   // Menu click-outside
//   useEffect(() => {
//     if (!showMenu) return;
//     const close = (e) => {
//       if (menuRef.current && !menuRef.current.contains(e.target))
//         setShowMenu(false);
//     };
//     document.addEventListener("click", close);
//     return () => document.removeEventListener("click", close);
//   }, [showMenu]);

//   // Close reaction picker on outside click
//   useEffect(() => {
//     if (!openPickerId) return;
//     const close = () => setOpenPickerId(null);
//     document.addEventListener("click", close);
//     return () => document.removeEventListener("click", close);
//   }, [openPickerId]);

//   // Load comments
//   useEffect(() => {
//     if (!showComments) return;
//     let cancelled = false;
//     async function load() {
//       setCommentsLoading(true);
//       try {
//         const { data } = await getComments(post._id);
//         if (!cancelled) setComments(data.comments || []);
//       } catch (err) {
//         console.error("Failed to load comments:", err);
//       } finally {
//         if (!cancelled) setCommentsLoading(false);
//       }
//     }
//     load();
//     return () => {
//       cancelled = true;
//     };
//   }, [showComments, post._id]);

//   // Auto-scroll to focused comment / focus reply input
//   useEffect(() => {
//     if (!showComments || commentsLoading || autoFocusDone.current) return;
//     autoFocusDone.current = true;

//     if (focusCommentId && commentRefs.current[focusCommentId]) {
//       commentRefs.current[focusCommentId].scrollIntoView({
//         behavior: "smooth",
//         block: "center",
//       });
//     }
//     if (autoFocusReply) {
//       commentInputRef.current?.focus();
//     }
//   }, [showComments, commentsLoading, focusCommentId, autoFocusReply]);

//   // ── FOLLOW / UNFOLLOW ──
//   const handleToggleFollow = async (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (followLoading) return;
//     setFollowLoading(true);
//     const next = !following;
//     setFollowing(next);
//     try {
//       await followUserById(user._id);
//     } catch (err) {
//       setFollowing(!next);
//       showToast("Failed to update follow status", "error");
//       console.error("Follow error:", err);
//     } finally {
//       setFollowLoading(false);
//     }
//   };

//   // ── SAVE TO FAVORITES ──
//   const handleToggleSave = async () => {
//     if (savingFavorite) return;
//     setSavingFavorite(true);
//     const newState = !saved;
//     setSaved(newState);
//     setShowMenu(false);
//     try {
//       if (newState) {
//         await savePost(post._id);
//         showToast("Saved to favorites", "success");
//       } else {
//         await unsavePost(post._id);
//         showToast("Removed from favorites", "info");
//       }
//     } catch (err) {
//       setSaved(!newState);
//       showToast("Failed to update favorites", "error");
//       console.error("Save error:", err);
//     } finally {
//       setSavingFavorite(false);
//     }
//   };

//   // ── NOT INTERESTED ──
//   const handleToggleInterest = async () => {
//     if (hiding) return;
//     setHiding(true);
//     const newHidden = !hidden;
//     setHidden(newHidden);
//     setShowMenu(false);
//     try {
//       if (newHidden) {
//         await hidePost(post._id);
//         showToast("Post hidden from feed", "info");
//       } else {
//         await unhidePost(post._id);
//         showToast("Post will show in feed", "info");
//       }
//     } catch (err) {
//       setHidden(!newHidden);
//       showToast("Failed to update preferences", "error");
//       console.error("Hide error:", err);
//     } finally {
//       setHiding(false);
//     }
//   };

//   // ── SHARE ──
//   const handleShare = async () => {
//     const shareData = {
//       title: `${user.name}'s workout on Zyft`,
//       text: post.content || `${workout.title} - ${workout.category}`,
//       url: `${window.location.origin}/post/${post._id}`,
//     };
//     try {
//       if (navigator.share) {
//         await navigator.share(shareData);
//         trackShare(post._id, "native").catch(() => {});
//         showToast("Shared successfully", "success");
//       } else {
//         await navigator.clipboard.writeText(shareData.url);
//         trackShare(post._id, "clipboard").catch(() => {});
//         showToast("Link copied to clipboard!", "success");
//       }
//     } catch (err) {
//       if (err.name !== "AbortError") {
//         console.error("Share failed:", err);
//         showToast("Share cancelled", "info");
//       }
//     }
//     setShowMenu(false);
//   };

//   // ── REPORT ──
//   const handleReport = async (reason) => {
//     try {
//       await reportPost(post._id, reason);
//       showToast("Report submitted. Thanks for keeping Zyft safe.", "success");
//     } catch (err) {
//       showToast("Failed to submit report", "error");
//       console.error("Report error:", err);
//     }
//   };

//   // ── POST EDITING ──
//   const handleSaveEdit = async () => {
//     const trimmed = editText.trim();
//     if (!trimmed || trimmed === post.content) {
//       setIsEditing(false);
//       setEditText(post.content || "");
//       return;
//     }
//     setIsSaving(true);
//     try {
//       await onUpdate(post._id, { content: trimmed });
//       setIsEditing(false);
//     } catch {
//       setEditText(post.content || "");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleCancelEdit = () => {
//     setEditText(post.content || "");
//     setIsEditing(false);
//   };

//   // ── COMMENTS ──
//   const handleAddComment = async () => {
//     const trimmed = commentText.trim();
//     if (!trimmed) return;
//     setPostingComment(true);
//     try {
//       const { data } = await addComment(post._id, { content: trimmed });
//       setComments((prev) => [data.comment, ...prev]);
//       setCommentText("");
//     } catch {
//       showToast("Failed to post comment", "error");
//     } finally {
//       setPostingComment(false);
//     }
//   };

//   const handleDeleteComment = async (commentId) => {
//     if (!confirm("Delete this comment?")) return;
//     try {
//       await deleteComment(post._id, commentId);
//       setComments((prev) => prev.filter((c) => c._id !== commentId));
//     } catch {
//       showToast("Failed to delete comment", "error");
//     }
//   };

//   const handleStartEditComment = (comment) => {
//     setEditingCommentId(comment._id);
//     setEditCommentText(comment.content);
//   };

//   const handleSaveEditComment = async (commentId) => {
//     const trimmed = editCommentText.trim();
//     if (!trimmed) {
//       setEditingCommentId(null);
//       return;
//     }
//     setSavingCommentId(commentId);
//     try {
//       const { data } = await updateComment(post._id, commentId, {
//         content: trimmed,
//       });
//       setComments((prev) =>
//         prev.map((c) => (c._id === commentId ? data.comment : c)),
//       );
//       setEditingCommentId(null);
//     } catch {
//       showToast("Failed to update comment", "error");
//     } finally {
//       setSavingCommentId(null);
//     }
//   };

//   const handleCancelEditComment = () => {
//     setEditingCommentId(null);
//     setEditCommentText("");
//   };

//   // ── REACTIONS ──
//   const handleReactToComment = async (commentId, emoji) => {
//     if (reactingCommentId) return;
//     setReactingCommentId(commentId);
//     try {
//       const { data } = await reactToComment(post._id, commentId, emoji);
//       setComments((prev) =>
//         prev.map((c) =>
//           c._id === commentId
//             ? {
//                 ...c,
//                 reactionSummary: data.reactionSummary,
//                 myReaction: data.myReaction,
//               }
//             : c,
//         ),
//       );
//     } catch (err) {
//       showToast("Failed to react", "error");
//       console.error("React error:", err);
//     } finally {
//       setReactingCommentId(null);
//       setOpenPickerId(null);
//     }
//   };

//   // Hide posts with no valid user (deleted accounts etc.)
//   if (!user._id) return null;

//   // Hidden state
//   if (hidden) {
//     return (
//       <div className="bg-[#13131f] rounded-2xl p-4 border border-white/5 flex items-center justify-between">
//         <div className="flex items-center gap-3">
//           <EyeOff size={16} className="text-gray-500" />
//           <span className="text-xs text-gray-500">Post hidden</span>
//         </div>
//         <button
//           onClick={handleToggleInterest}
//           disabled={hiding}
//           className="text-xs text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
//         >
//           {hiding ? "Updating..." : "Undo"}
//         </button>
//       </div>
//     );
//   }

//   return (
//     <>
//       <div className="bg-[#13131f] rounded-2xl overflow-hidden border border-white/5">
//         {/* ── User header ── */}
//         <div className="p-4 flex items-center justify-between">
//           <Link
//             to={`/profile/${user._id}`}
//             className="flex items-center gap-3 flex-1 min-w-0"
//           >
//             <UserAvatar user={user} size={10} />
//             <div className="min-w-0">
//               <h3 className="text-sm font-semibold truncate">
//                 {user.name || "Anonymous"}
//               </h3>
//               <p className="text-xs text-gray-500 truncate">
//                 @{userHandle} · {timeAgo}
//                 {post.updatedAt && post.updatedAt !== post.createdAt && (
//                   <span className="text-gray-600 ml-1">· Edited</span>
//                 )}
//               </p>
//             </div>
//           </Link>

//           <div className="flex items-center gap-2 shrink-0">
//             {/* ── Follow button (hidden on your own posts) ── */}
//             {!isOwner && (
//               <button
//                 onClick={handleToggleFollow}
//                 disabled={followLoading}
//                 className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all disabled:opacity-50 ${
//                   following
//                     ? "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
//                     : "bg-purple-600 text-white hover:bg-purple-500"
//                 }`}
//               >
//                 {followLoading ? (
//                   <Loader2 size={12} className="animate-spin" />
//                 ) : following ? (
//                   "Following"
//                 ) : (
//                   "Follow"
//                 )}
//               </button>
//             )}

//             {/* ── 3-dot menu ── */}
//             <div className="relative" ref={menuRef}>
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   setShowMenu(!showMenu);
//                 }}
//                 className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-all"
//               >
//                 <MoreHorizontal size={18} />
//               </button>

//               {showMenu && (
//                 <div className="absolute right-0 top-9 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-xl shadow-black/50 py-1 min-w-[200px] z-50">
//                   {/* Visit profile */}
//                   <Link
//                     to={`/profile/${user._id}`}
//                     onClick={() => setShowMenu(false)}
//                     className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5"
//                   >
//                     <div className="w-4 h-4 rounded-full border-2 border-purple-400 flex items-center justify-center">
//                       <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
//                     </div>
//                     Visit profile
//                   </Link>

//                   <div className="my-1 border-t border-white/5" />

//                   {/* Save to Favorites */}
//                   <button
//                     onClick={handleToggleSave}
//                     disabled={savingFavorite}
//                     className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5 disabled:opacity-50"
//                   >
//                     <Bookmark
//                       size={14}
//                       className={
//                         saved
//                           ? "text-purple-400 fill-purple-400"
//                           : "text-gray-500"
//                       }
//                     />
//                     <span className={saved ? "text-purple-300" : ""}>
//                       {saved ? "Saved to favorites" : "Save to favorites"}
//                     </span>
//                     {savingFavorite && (
//                       <Loader2 size={12} className="animate-spin ml-auto" />
//                     )}
//                   </button>

//                   {/* Not Interested */}
//                   <button
//                     onClick={handleToggleInterest}
//                     disabled={hiding}
//                     className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5 disabled:opacity-50"
//                   >
//                     <EyeOff size={14} className="text-gray-500" />
//                     Not interested
//                     {hiding && (
//                       <Loader2 size={12} className="animate-spin ml-auto" />
//                     )}
//                   </button>

//                   {/* Share */}
//                   <button
//                     onClick={handleShare}
//                     className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5"
//                   >
//                     <Share2 size={14} className="text-gray-500" />
//                     Share
//                   </button>

//                   <div className="my-1 border-t border-white/5" />

//                   {/* Edit (owner only) */}
//                   {isOwner && (
//                     <button
//                       onClick={() => {
//                         setShowMenu(false);
//                         setIsEditing(true);
//                       }}
//                       className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5"
//                     >
//                       <Pencil size={14} className="text-purple-400" />
//                       Edit post
//                     </button>
//                   )}

//                   {/* Report */}
//                   <button
//                     onClick={() => {
//                       setShowMenu(false);
//                       setShowReportModal(true);
//                     }}
//                     className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2.5"
//                   >
//                     <Flag size={14} />
//                     Report
//                   </button>

//                   {/* Delete (owner only) */}
//                   {isOwner && (
//                     <button
//                       onClick={() => {
//                         setShowMenu(false);
//                         onDelete(post._id);
//                       }}
//                       className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2.5"
//                     >
//                       <Trash2 size={14} />
//                       Delete
//                     </button>
//                   )}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* ── Post content (edit mode) ── */}
//         {isEditing ? (
//           <div className="px-4 pb-3 space-y-3">
//             <textarea
//               value={editText}
//               onChange={(e) => setEditText(e.target.value)}
//               onKeyDown={(e) => {
//                 if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
//                   handleSaveEdit();
//                 if (e.key === "Escape") handleCancelEdit();
//               }}
//               className="w-full bg-[#0a0a0a] rounded-xl p-3 text-sm text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-white/5 placeholder-gray-600"
//               rows={3}
//               maxLength={500}
//               placeholder="What's on your mind?"
//               autoFocus
//             />
//             <div className="flex items-center justify-between">
//               <span className="text-[10px] text-gray-600">
//                 {editText.length}/500 · Cmd+Enter to save
//               </span>
//               <div className="flex items-center gap-2">
//                 <button
//                   onClick={handleCancelEdit}
//                   disabled={isSaving}
//                   className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50 rounded-lg hover:bg-white/5"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSaveEdit}
//                   disabled={isSaving || !editText.trim()}
//                   className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 rounded-lg transition-colors flex items-center gap-1"
//                 >
//                   {isSaving ? (
//                     <Loader2 size={12} className="animate-spin" />
//                   ) : (
//                     <Check size={14} />
//                   )}{" "}
//                   Save
//                 </button>
//               </div>
//             </div>
//           </div>
//         ) : (
//           post.content && (
//             <div className="px-4 pb-3">
//               <p className="text-sm text-gray-300">{post.content}</p>
//             </div>
//           )
//         )}

//         {/* ── Workout info ── */}
//         {workout.title && (
//           <div className="px-4 pb-3">
//             <div className="flex items-center gap-2 mb-0.5">
//               <Dumbbell size={13} className="text-purple-400 shrink-0" />
//               <h4 className="text-xs font-bold tracking-wide">
//                 {workout.title}
//               </h4>
//             </div>
//             <p className="text-[11px] text-gray-500 ml-5">
//               {workout.category || ""}
//             </p>
//           </div>
//         )}

//         {/* ── Workout stats ── */}
//         {workout.title && (
//           <div className="px-4 py-3 flex gap-2">
//             {workout.duration != null && (
//               <div className="flex-1 py-2 rounded-xl text-center text-xs font-semibold bg-white/5 border border-white/5 text-gray-300">
//                 <p className="text-[10px] text-gray-500 mb-0.5">Duration</p>
//                 {workout.duration} min
//               </div>
//             )}
//             {workout.caloriesBurned != null && (
//               <div className="flex-1 py-2 rounded-xl text-center text-xs font-semibold bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 text-[#a78bfa]">
//                 <p className="text-[10px] text-gray-500 mb-0.5">Calories</p>
//                 {workout.caloriesBurned}
//               </div>
//             )}
//             {workout.exercises?.length > 0 && (
//               <div className="flex-1 py-2 rounded-xl text-center text-xs font-semibold bg-white/5 border border-white/5 text-gray-300">
//                 <p className="text-[10px] text-gray-500 mb-0.5">Exercises</p>
//                 {workout.exercises.length}
//               </div>
//             )}
//           </div>
//         )}

//         {/* ── Workout image ── */}
//         {workout.imageUrl && (
//           <div className="px-4 pb-3">
//             <img
//               src={workout.imageUrl}
//               alt={workout.title || "Workout"}
//               className="w-full h-56 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
//               loading="lazy"
//               onClick={() => setPreviewOpen(true)}
//             />
//           </div>
//         )}

//         {/* ── Detailed stats toggle ── */}
//         {workout.exercises?.length > 0 && (
//           <div className="px-4 pb-2">
//             <button
//               onClick={() => setShowStats(!showStats)}
//               className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-all"
//             >
//               {showStats ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
//               {showStats ? "Hide" : "View"} detailed stats
//             </button>
//             {showStats && (
//               <div className="mt-2 p-3 bg-[#1a1a2e] rounded-xl border border-white/5 text-xs space-y-1.5">
//                 {workout.exercises.map((ex, i) => (
//                   <div key={i} className="flex justify-between">
//                     <span className="text-gray-500">{ex.name}</span>
//                     <span className="text-white">
//                       {ex.sets} × {ex.reps}
//                       {ex.weight ? ` @ ${ex.weight}kg` : ""}
//                     </span>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}

//         {/* ── Actions ── */}
//         <div className="px-4 py-3 border-t border-white/5 flex items-center gap-4">
//           <button
//             onClick={() =>
//               onRespect(post._id, post.didRespect, post.respectCount || 0)
//             }
//             className={`flex items-center gap-1.5 text-xs transition-all active:scale-95 ${
//               post.didRespect
//                 ? "text-purple-400"
//                 : "text-gray-500 hover:text-gray-300"
//             }`}
//           >
//             <ThumbsUp
//               size={14}
//               fill={post.didRespect ? "currentColor" : "none"}
//             />
//             <span className="font-semibold">{post.respectCount || 0}</span>{" "}
//             <span>Respects</span>
//           </button>
//           <button
//             onClick={() => setShowComments((prev) => !prev)}
//             className={`flex items-center gap-1.5 text-xs transition-all active:scale-95 ${
//               showComments
//                 ? "text-purple-400"
//                 : "text-gray-500 hover:text-gray-300"
//             }`}
//           >
//             <MessageCircle
//               size={14}
//               fill={showComments ? "currentColor" : "none"}
//             />
//             <span className="font-semibold">{post.commentCount || 0}</span>{" "}
//             <span>Comments</span>
//           </button>
//         </div>

//         {/* ── Comments Section ── */}
//         {showComments && (
//           <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
//             <div className="flex gap-2">
//               <input
//                 type="text"
//                 ref={commentInputRef}
//                 value={commentText}
//                 onChange={(e) => setCommentText(e.target.value)}
//                 onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
//                 placeholder="Add a comment..."
//                 className="flex-1 bg-[#0a0a0a] rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-white/5 placeholder-gray-600"
//               />
//               <button
//                 onClick={handleAddComment}
//                 disabled={postingComment || !commentText.trim()}
//                 className="w-8 h-8 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/30 flex items-center justify-center transition-colors"
//               >
//                 {postingComment ? (
//                   <Loader2 size={14} className="animate-spin" />
//                 ) : (
//                   <Send size={14} />
//                 )}
//               </button>
//             </div>

//             {commentsLoading ? (
//               <div className="flex justify-center py-4">
//                 <Loader2 size={16} className="animate-spin text-purple-400" />
//               </div>
//             ) : comments.length === 0 ? (
//               <p className="text-xs text-gray-600 text-center py-2">
//                 No comments yet
//               </p>
//             ) : (
//               <div className="space-y-2.5">
//                 {comments.map((comment) => {
//                   const isCommentOwner =
//                     currentUserId && comment.user?._id === currentUserId;
//                   const isEditingThisComment = editingCommentId === comment._id;
//                   const reactionSummary = comment.reactionSummary || {};

//                   return (
//                     <div
//                       key={comment._id}
//                       ref={(el) => {
//                         if (el) commentRefs.current[comment._id] = el;
//                       }}
//                       className={`flex gap-2 group rounded-xl transition-colors ${
//                         comment._id === focusCommentId
//                           ? "ring-2 ring-purple-500/40 bg-purple-500/5 -mx-1 px-1 py-1"
//                           : ""
//                       }`}
//                     >
//                       <UserAvatar user={comment.user} size={7} />
//                       <div className="flex-1 min-w-0">
//                         {isEditingThisComment ? (
//                           <div className="space-y-2">
//                             <input
//                               type="text"
//                               value={editCommentText}
//                               onChange={(e) =>
//                                 setEditCommentText(e.target.value)
//                               }
//                               onKeyDown={(e) => {
//                                 if (e.key === "Enter")
//                                   handleSaveEditComment(comment._id);
//                                 if (e.key === "Escape")
//                                   handleCancelEditComment();
//                               }}
//                               className="w-full bg-[#0a0a0a] rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-white/5"
//                               autoFocus
//                             />
//                             <div className="flex gap-2">
//                               <button
//                                 onClick={() =>
//                                   handleSaveEditComment(comment._id)
//                                 }
//                                 disabled={savingCommentId === comment._id}
//                                 className="text-[10px] text-purple-400 hover:text-purple-300"
//                               >
//                                 {savingCommentId === comment._id
//                                   ? "Saving..."
//                                   : "Save"}
//                               </button>
//                               <button
//                                 onClick={handleCancelEditComment}
//                                 className="text-[10px] text-gray-500 hover:text-gray-400"
//                               >
//                                 Cancel
//                               </button>
//                             </div>
//                           </div>
//                         ) : (
//                           <>
//                             <div className="bg-[#0a0a0a] rounded-xl px-3 py-2">
//                               <div className="flex items-center justify-between">
//                                 <p className="text-[10px] font-semibold text-gray-400 mb-0.5">
//                                   {comment.user?.name || "Anonymous"}
//                                 </p>
//                                 {isCommentOwner && (
//                                   <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
//                                     <button
//                                       onClick={() =>
//                                         handleStartEditComment(comment)
//                                       }
//                                       className="text-gray-600 hover:text-purple-400 transition-colors"
//                                       title="Edit"
//                                     >
//                                       <Pencil size={10} />
//                                     </button>
//                                     <button
//                                       onClick={() =>
//                                         handleDeleteComment(comment._id)
//                                       }
//                                       className="text-gray-600 hover:text-red-400 transition-colors"
//                                       title="Delete"
//                                     >
//                                       <Trash2 size={10} />
//                                     </button>
//                                   </div>
//                                 )}
//                               </div>
//                               <p className="text-xs text-gray-300">
//                                 {comment.content}
//                               </p>
//                             </div>

//                             {/* ── Reactions row ── */}
//                             <div className="flex items-center gap-1.5 mt-1 ml-1 flex-wrap">
//                               {REACTION_EMOJIS.map((emoji) => {
//                                 const count = reactionSummary[emoji] || 0;
//                                 if (count === 0) return null;
//                                 const isMine = comment.myReaction === emoji;
//                                 return (
//                                   <button
//                                     key={emoji}
//                                     onClick={() =>
//                                       handleReactToComment(comment._id, emoji)
//                                     }
//                                     disabled={reactingCommentId === comment._id}
//                                     className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border transition-colors disabled:opacity-50 ${
//                                       isMine
//                                         ? "bg-purple-500/20 border-purple-500/30 text-purple-300"
//                                         : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
//                                     }`}
//                                   >
//                                     <span>{emoji}</span>
//                                     <span>{count}</span>
//                                   </button>
//                                 );
//                               })}

//                               {/* Add-reaction picker */}
//                               <div
//                                 className="relative"
//                                 onClick={(e) => e.stopPropagation()}
//                               >
//                                 <button
//                                   onClick={() =>
//                                     setOpenPickerId((prev) =>
//                                       prev === comment._id ? null : comment._id,
//                                     )
//                                   }
//                                   disabled={reactingCommentId === comment._id}
//                                   className="text-gray-600 hover:text-purple-400 transition-colors p-0.5 disabled:opacity-50"
//                                   title="React"
//                                 >
//                                   <SmilePlus size={13} />
//                                 </button>

//                                 {openPickerId === comment._id && (
//                                   <div className="absolute bottom-full left-0 mb-1.5 flex gap-1 bg-[#1a1a2e] border border-white/10 rounded-full px-2 py-1.5 shadow-xl shadow-black/50 z-10">
//                                     {REACTION_EMOJIS.map((emoji) => (
//                                       <button
//                                         key={emoji}
//                                         onClick={() =>
//                                           handleReactToComment(
//                                             comment._id,
//                                             emoji,
//                                           )
//                                         }
//                                         className="text-base leading-none hover:scale-125 transition-transform"
//                                       >
//                                         {emoji}
//                                       </button>
//                                     ))}
//                                   </div>
//                                 )}
//                               </div>
//                             </div>

//                             <div className="flex items-center gap-2 mt-0.5 ml-1">
//                               <p className="text-[10px] text-gray-600">
//                                 {new Date(comment.createdAt).toLocaleDateString(
//                                   "en-US",
//                                   {
//                                     month: "short",
//                                     day: "numeric",
//                                   },
//                                 )}
//                                 {comment.updatedAt &&
//                                   comment.updatedAt !== comment.createdAt && (
//                                     <span className="text-gray-700 ml-1">
//                                       · Edited
//                                     </span>
//                                   )}
//                               </p>
//                             </div>
//                           </>
//                         )}
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       {/* ── Report Modal ── */}
//       <ReportModal
//         isOpen={showReportModal}
//         onClose={() => setShowReportModal(false)}
//         onSubmit={handleReport}
//         postTitle={post.content || workout.title}
//       />

//       {/* ── Toast ── */}
//       {toast && (
//         <Toast
//           message={toast.message}
//           type={toast.type}
//           onClose={() => setToast(null)}
//         />
//       )}

//       {/* ── Image Preview Modal ── */}
//       {previewOpen && (
//         <ImagePreviewModal
//           src={workout.imageUrl}
//           alt={workout.title || "Workout"}
//           onClose={() => setPreviewOpen(false)}
//         />
//       )}
//     </>
//   );
// }

import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  MoreHorizontal,
  Heart,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  MessageCircle,
  Pencil,
  Check,
  Trash2,
  Send,
  Loader2,
  Bookmark,
  EyeOff,
  Share2,
  Flag,
  X,
  AlertTriangle,
  SmilePlus,
} from "lucide-react";

import {
  updatePost,
  deletePost,
  respectPost,
  getComments,
  addComment,
  deleteComment,
  updateComment,
  reactToComment,
  followUserById,
} from "../api/posts";

import {
  savePost,
  unsavePost,
  hidePost,
  unhidePost,
  reportPost,
  trackShare,
} from "../api/interactions";

import { useSocket } from "../context/SocketContext.jsx";

// Must match REACTION_EMOJIS in the backend Comment model — keep in sync.
const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮"];

// ─── Toast ────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl text-xs font-medium shadow-lg shadow-black/50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
        type === "success"
          ? "bg-green-500/90 text-white"
          : type === "error"
            ? "bg-red-500/90 text-white"
            : "bg-[#1a1a2e] text-gray-300 border border-white/10"
      }`}
    >
      {type === "success" && <Check size={14} />}
      {type === "error" && <AlertTriangle size={14} />}
      {message}
    </div>
  );
}

// ─── Report Modal ─────────────────────────────────────────────
function ReportModal({ isOpen, onClose, onSubmit, postTitle }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const reasons = [
    "Spam or misleading",
    "Harassment or bullying",
    "Inappropriate content",
    "False information",
    "Other",
  ];

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await onSubmit(reason);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] px-4">
      <div className="bg-[#1a1a2e] rounded-2xl p-5 w-full max-w-xs border border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Report Post</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-3 line-clamp-1">
          "{postTitle || "Untitled post"}"
        </p>
        <div className="space-y-1.5 mb-4">
          {reasons.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all ${
                reason === r
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason || submitting}
            className="flex-1 py-2.5 text-xs bg-red-500/80 hover:bg-red-500 disabled:bg-red-500/30 text-white rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            {submitting ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Flag size={12} />
            )}
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Image Preview Modal ──────────────────────────────────────
function ImagePreviewModal({ src, alt, onClose }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[80] px-4 py-8"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        title="Close"
      >
        <X size={18} />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-full object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ─── Avatar Component ─────────────────────────────────────────
function UserAvatar({ user, size = 10 }) {
  const { isUserOnline } = useSocket();

  const sizeClasses = {
    7: "w-7 h-7 text-[10px]",
    10: "w-10 h-10 text-sm",
  };
  const dotSize = size === 7 ? "w-2 h-2" : "w-2.5 h-2.5";

  const photo = user?.photo || user?.avatar;
  const initial = user?.name?.charAt(0)?.toUpperCase() || "?";
  const online = isUserOnline(user?._id);

  return (
    <div className="relative shrink-0">
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#a78bfa] flex items-center justify-center font-bold overflow-hidden`}
      >
        {photo ? (
          <img
            src={photo}
            alt={user?.name || "User"}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <span>{initial}</span>
        )}
      </div>
      {online && (
        <div
          className={`absolute -bottom-0.5 -right-0.5 ${dotSize} bg-green-500 rounded-full border-2 border-[#13131f]`}
        />
      )}
    </div>
  );
}

// ─── Main FeedPostCard ────────────────────────────────────────
export default function FeedPostCard({
  post,
  currentUserId,
  onUpdate,
  onDelete,
  onRespect,
  autoOpenComments = false,
  focusCommentId = null,
  autoFocusReply = false,
}) {
  const [showStats, setShowStats] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.content || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [saved, setSaved] = useState(post.isSaved || false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [hidden, setHidden] = useState(post.isHidden || false);
  const [hiding, setHiding] = useState(false);
  const [showComments, setShowComments] = useState(autoOpenComments);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [savingCommentId, setSavingCommentId] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // ── Follow state ──
  const [following, setFollowing] = useState(post.user?.isFollowing ?? false);
  const [followLoading, setFollowLoading] = useState(false);

  // ── Reaction picker state ──
  const [openPickerId, setOpenPickerId] = useState(null);
  const [reactingCommentId, setReactingCommentId] = useState(null);

  const menuRef = useRef(null);
  const commentInputRef = useRef(null);
  const commentRefs = useRef({});
  const autoFocusDone = useRef(false);

  const user = post.user || {};
  const workout = post.workout || {};
  const isOwner = currentUserId && user._id === currentUserId;

  const timeAgo = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "Recently";

  const userHandle =
    user.handle ||
    user.username ||
    user.name?.toLowerCase().replace(/\s+/g, "") ||
    "user";

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
  }, []);

  // Menu click-outside
  useEffect(() => {
    if (!showMenu) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setShowMenu(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showMenu]);

  // Close reaction picker on outside click
  useEffect(() => {
    if (!openPickerId) return;
    const close = () => setOpenPickerId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [openPickerId]);

  // Load comments
  useEffect(() => {
    if (!showComments) return;
    let cancelled = false;
    async function load() {
      setCommentsLoading(true);
      try {
        const { data } = await getComments(post._id);
        if (!cancelled) setComments(data.comments || []);
      } catch (err) {
        console.error("Failed to load comments:", err);
      } finally {
        if (!cancelled) setCommentsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [showComments, post._id]);

  // Auto-scroll to focused comment / focus reply input
  useEffect(() => {
    if (!showComments || commentsLoading || autoFocusDone.current) return;
    autoFocusDone.current = true;

    if (focusCommentId && commentRefs.current[focusCommentId]) {
      commentRefs.current[focusCommentId].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
    if (autoFocusReply) {
      commentInputRef.current?.focus();
    }
  }, [showComments, commentsLoading, focusCommentId, autoFocusReply]);

  // ── FOLLOW / UNFOLLOW ──
  const handleToggleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (followLoading) return;
    setFollowLoading(true);
    const next = !following;
    setFollowing(next);
    try {
      await followUserById(user._id);
    } catch (err) {
      setFollowing(!next);
      showToast("Failed to update follow status", "error");
      console.error("Follow error:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  // ── SAVE TO FAVORITES ──
  const handleToggleSave = async () => {
    if (savingFavorite) return;
    setSavingFavorite(true);
    const newState = !saved;
    setSaved(newState);
    setShowMenu(false);
    try {
      if (newState) {
        await savePost(post._id);
        showToast("Saved to favorites", "success");
      } else {
        await unsavePost(post._id);
        showToast("Removed from favorites", "info");
      }
    } catch (err) {
      setSaved(!newState);
      showToast("Failed to update favorites", "error");
      console.error("Save error:", err);
    } finally {
      setSavingFavorite(false);
    }
  };

  // ── NOT INTERESTED ──
  const handleToggleInterest = async () => {
    if (hiding) return;
    setHiding(true);
    const newHidden = !hidden;
    setHidden(newHidden);
    setShowMenu(false);
    try {
      if (newHidden) {
        await hidePost(post._id);
        showToast("Post hidden from feed", "info");
      } else {
        await unhidePost(post._id);
        showToast("Post will show in feed", "info");
      }
    } catch (err) {
      setHidden(!newHidden);
      showToast("Failed to update preferences", "error");
      console.error("Hide error:", err);
    } finally {
      setHiding(false);
    }
  };

  // ── SHARE ──
  const handleShare = async () => {
    const shareData = {
      title: `${user.name}'s workout on Zyft`,
      text: post.content || `${workout.title} - ${workout.category}`,
      url: `${window.location.origin}/post/${post._id}`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        trackShare(post._id, "native").catch(() => {});
        showToast("Shared successfully", "success");
      } else {
        await navigator.clipboard.writeText(shareData.url);
        trackShare(post._id, "clipboard").catch(() => {});
        showToast("Link copied to clipboard!", "success");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Share failed:", err);
        showToast("Share cancelled", "info");
      }
    }
    setShowMenu(false);
  };

  // ── REPORT ──
  const handleReport = async (reason) => {
    try {
      await reportPost(post._id, reason);
      showToast("Report submitted. Thanks for keeping Zyft safe.", "success");
    } catch (err) {
      showToast("Failed to submit report", "error");
      console.error("Report error:", err);
    }
  };

  // ── POST EDITING ──
  const handleSaveEdit = async () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === post.content) {
      setIsEditing(false);
      setEditText(post.content || "");
      return;
    }
    setIsSaving(true);
    try {
      await onUpdate(post._id, { content: trimmed });
      setIsEditing(false);
    } catch {
      setEditText(post.content || "");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditText(post.content || "");
    setIsEditing(false);
  };

  // ── COMMENTS ──
  const handleAddComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    setPostingComment(true);
    try {
      const { data } = await addComment(post._id, { content: trimmed });
      setComments((prev) => [data.comment, ...prev]);
      setCommentText("");
    } catch {
      showToast("Failed to post comment", "error");
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await deleteComment(post._id, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch {
      showToast("Failed to delete comment", "error");
    }
  };

  const handleStartEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditCommentText(comment.content);
  };

  const handleSaveEditComment = async (commentId) => {
    const trimmed = editCommentText.trim();
    if (!trimmed) {
      setEditingCommentId(null);
      return;
    }
    setSavingCommentId(commentId);
    try {
      const { data } = await updateComment(post._id, commentId, {
        content: trimmed,
      });
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? data.comment : c)),
      );
      setEditingCommentId(null);
    } catch {
      showToast("Failed to update comment", "error");
    } finally {
      setSavingCommentId(null);
    }
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentText("");
  };

  // ── REACTIONS ──
  const handleReactToComment = async (commentId, emoji) => {
    if (reactingCommentId) return;
    setReactingCommentId(commentId);
    try {
      const { data } = await reactToComment(post._id, commentId, emoji);
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId
            ? {
                ...c,
                reactionSummary: data.reactionSummary,
                myReaction: data.myReaction,
              }
            : c,
        ),
      );
    } catch (err) {
      showToast("Failed to react", "error");
      console.error("React error:", err);
    } finally {
      setReactingCommentId(null);
      setOpenPickerId(null);
    }
  };

  // Hide posts with no valid user (deleted accounts etc.)
  if (!user._id) return null;

  // Hidden state
  if (hidden) {
    return (
      <div className="bg-[#13131f] rounded-2xl p-4 border border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <EyeOff size={16} className="text-gray-500" />
          <span className="text-xs text-gray-500">Post hidden</span>
        </div>
        <button
          onClick={handleToggleInterest}
          disabled={hiding}
          className="text-xs text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
        >
          {hiding ? "Updating..." : "Undo"}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#13131f] rounded-2xl overflow-hidden border border-white/5">
        {/* ── User header ── */}
        <div className="p-4 flex items-center justify-between">
          <Link
            to={`/profile/${user._id}`}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <UserAvatar user={user} size={10} />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate">
                {user.name || "Anonymous"}
              </h3>
              <p className="text-xs text-gray-500 truncate">
                @{userHandle} · {timeAgo}
                {post.updatedAt && post.updatedAt !== post.createdAt && (
                  <span className="text-gray-600 ml-1">· Edited</span>
                )}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            {/* ── Follow button (hidden on your own posts) ── */}
            {!isOwner && (
              <button
                onClick={handleToggleFollow}
                disabled={followLoading}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all disabled:opacity-50 ${
                  following
                    ? "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                    : "bg-purple-600 text-white hover:bg-purple-500"
                }`}
              >
                {followLoading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : following ? (
                  "Following"
                ) : (
                  "Follow"
                )}
              </button>
            )}

            {/* ── 3-dot menu ── */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-all"
              >
                <MoreHorizontal size={18} />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-9 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-xl shadow-black/50 py-1 min-w-[200px] z-50">
                  {/* Visit profile */}
                  <Link
                    to={`/profile/${user._id}`}
                    onClick={() => setShowMenu(false)}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5"
                  >
                    <div className="w-4 h-4 rounded-full border-2 border-purple-400 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    </div>
                    Visit profile
                  </Link>

                  <div className="my-1 border-t border-white/5" />

                  {/* Save to Favorites */}
                  <button
                    onClick={handleToggleSave}
                    disabled={savingFavorite}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5 disabled:opacity-50"
                  >
                    <Bookmark
                      size={14}
                      className={
                        saved
                          ? "text-purple-400 fill-purple-400"
                          : "text-gray-500"
                      }
                    />
                    <span className={saved ? "text-purple-300" : ""}>
                      {saved ? "Saved to favorites" : "Save to favorites"}
                    </span>
                    {savingFavorite && (
                      <Loader2 size={12} className="animate-spin ml-auto" />
                    )}
                  </button>

                  {/* Not Interested */}
                  <button
                    onClick={handleToggleInterest}
                    disabled={hiding}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5 disabled:opacity-50"
                  >
                    <EyeOff size={14} className="text-gray-500" />
                    Not interested
                    {hiding && (
                      <Loader2 size={12} className="animate-spin ml-auto" />
                    )}
                  </button>

                  {/* Share */}
                  <button
                    onClick={handleShare}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5"
                  >
                    <Share2 size={14} className="text-gray-500" />
                    Share
                  </button>

                  <div className="my-1 border-t border-white/5" />

                  {/* Edit (owner only) */}
                  {isOwner && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setIsEditing(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5"
                    >
                      <Pencil size={14} className="text-purple-400" />
                      Edit post
                    </button>
                  )}

                  {/* Report */}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowReportModal(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2.5"
                  >
                    <Flag size={14} />
                    Report
                  </button>

                  {/* Delete (owner only) */}
                  {isOwner && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(post._id);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2.5"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Post content (edit mode) ── */}
        {isEditing ? (
          <div className="px-4 pb-3 space-y-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                  handleSaveEdit();
                if (e.key === "Escape") handleCancelEdit();
              }}
              className="w-full bg-[#0a0a0a] rounded-xl p-3 text-sm text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-white/5 placeholder-gray-600"
              rows={3}
              maxLength={500}
              placeholder="What's on your mind?"
              autoFocus
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-600">
                {editText.length}/500 · Cmd+Enter to save
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50 rounded-lg hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editText.trim()}
                  className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 rounded-lg transition-colors flex items-center gap-1"
                >
                  {isSaving ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}{" "}
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          post.content && (
            <div className="px-4 pb-3">
              <p className="text-sm text-gray-300">{post.content}</p>
            </div>
          )
        )}

        {/* ── Workout info ── */}
        {workout.title && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 mb-0.5">
              <Dumbbell size={13} className="text-purple-400 shrink-0" />
              <h4 className="text-xs font-bold tracking-wide">
                {workout.title}
              </h4>
            </div>
            <p className="text-[11px] text-gray-500 ml-5">
              {workout.category || ""}
            </p>
          </div>
        )}

        {/* ── Workout stats ── */}
        {workout.title && (
          <div className="px-4 py-3 flex gap-2">
            {workout.duration != null && (
              <div className="flex-1 py-2 rounded-xl text-center text-xs font-semibold bg-white/5 border border-white/5 text-gray-300">
                <p className="text-[10px] text-gray-500 mb-0.5">Duration</p>
                {workout.duration} min
              </div>
            )}
            {workout.caloriesBurned != null && (
              <div className="flex-1 py-2 rounded-xl text-center text-xs font-semibold bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 text-[#a78bfa]">
                <p className="text-[10px] text-gray-500 mb-0.5">Calories</p>
                {workout.caloriesBurned}
              </div>
            )}
            {workout.exercises?.length > 0 && (
              <div className="flex-1 py-2 rounded-xl text-center text-xs font-semibold bg-white/5 border border-white/5 text-gray-300">
                <p className="text-[10px] text-gray-500 mb-0.5">Exercises</p>
                {workout.exercises.length}
              </div>
            )}
          </div>
        )}

        {/* ── Workout image ── */}
        {workout.imageUrl && (
          <div className="px-4 pb-3">
            <img
              src={workout.imageUrl}
              alt={workout.title || "Workout"}
              className="w-full h-56 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
              loading="lazy"
              onClick={() => setPreviewOpen(true)}
            />
          </div>
        )}

        {/* ── Detailed stats toggle ── */}
        {workout.exercises?.length > 0 && (
          <div className="px-4 pb-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-all"
            >
              {showStats ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {showStats ? "Hide" : "View"} detailed stats
            </button>
            {showStats && (
              <div className="mt-2 p-3 bg-[#1a1a2e] rounded-xl border border-white/5 text-xs space-y-1.5">
                {workout.exercises.map((ex, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-500">{ex.name}</span>
                    <span className="text-white">
                      {ex.sets} × {ex.reps}
                      {ex.weight ? ` @ ${ex.weight}kg` : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Actions ── */}
        <div className="px-4 py-3 border-t border-white/5 flex items-center gap-4">
          <button
            onClick={() =>
              onRespect(post._id, post.didRespect, post.respectCount || 0)
            }
            className={`flex items-center gap-1.5 text-xs transition-all active:scale-95 ${
              post.didRespect
                ? "text-pink-500"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Heart size={14} fill={post.didRespect ? "currentColor" : "none"} />
            <span className="font-semibold">{post.respectCount || 0}</span>{" "}
            <span>Respects</span>
          </button>
          <button
            onClick={() => setShowComments((prev) => !prev)}
            className={`flex items-center gap-1.5 text-xs transition-all active:scale-95 ${
              showComments
                ? "text-purple-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <MessageCircle
              size={14}
              fill={showComments ? "currentColor" : "none"}
            />
            <span className="font-semibold">{post.commentCount || 0}</span>{" "}
            <span>Comments</span>
          </button>
        </div>

        {/* ── Comments Section ── */}
        {showComments && (
          <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                ref={commentInputRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                placeholder="Add a comment..."
                className="flex-1 bg-[#0a0a0a] rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-white/5 placeholder-gray-600"
              />
              <button
                onClick={handleAddComment}
                disabled={postingComment || !commentText.trim()}
                className="w-8 h-8 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/30 flex items-center justify-center transition-colors"
              >
                {postingComment ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </div>

            {commentsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 size={16} className="animate-spin text-purple-400" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-2">
                No comments yet
              </p>
            ) : (
              <div className="space-y-2.5">
                {comments.map((comment) => {
                  const isCommentOwner =
                    currentUserId && comment.user?._id === currentUserId;
                  const isEditingThisComment = editingCommentId === comment._id;
                  const reactionSummary = comment.reactionSummary || {};

                  return (
                    <div
                      key={comment._id}
                      ref={(el) => {
                        if (el) commentRefs.current[comment._id] = el;
                      }}
                      className={`flex gap-2 group rounded-xl transition-colors ${
                        comment._id === focusCommentId
                          ? "ring-2 ring-purple-500/40 bg-purple-500/5 -mx-1 px-1 py-1"
                          : ""
                      }`}
                    >
                      <UserAvatar user={comment.user} size={7} />
                      <div className="flex-1 min-w-0">
                        {isEditingThisComment ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editCommentText}
                              onChange={(e) =>
                                setEditCommentText(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleSaveEditComment(comment._id);
                                if (e.key === "Escape")
                                  handleCancelEditComment();
                              }}
                              className="w-full bg-[#0a0a0a] rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-white/5"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleSaveEditComment(comment._id)
                                }
                                disabled={savingCommentId === comment._id}
                                className="text-[10px] text-purple-400 hover:text-purple-300"
                              >
                                {savingCommentId === comment._id
                                  ? "Saving..."
                                  : "Save"}
                              </button>
                              <button
                                onClick={handleCancelEditComment}
                                className="text-[10px] text-gray-500 hover:text-gray-400"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="bg-[#0a0a0a] rounded-xl px-3 py-2">
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] font-semibold text-gray-400 mb-0.5">
                                  {comment.user?.name || "Anonymous"}
                                </p>
                                {isCommentOwner && (
                                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() =>
                                        handleStartEditComment(comment)
                                      }
                                      className="text-gray-600 hover:text-purple-400 transition-colors"
                                      title="Edit"
                                    >
                                      <Pencil size={10} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteComment(comment._id)
                                      }
                                      className="text-gray-600 hover:text-red-400 transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-gray-300">
                                {comment.content}
                              </p>
                            </div>

                            {/* ── Reactions row ── */}
                            <div className="flex items-center gap-1.5 mt-1 ml-1 flex-wrap">
                              {REACTION_EMOJIS.map((emoji) => {
                                const count = reactionSummary[emoji] || 0;
                                if (count === 0) return null;
                                const isMine = comment.myReaction === emoji;
                                return (
                                  <button
                                    key={emoji}
                                    onClick={() =>
                                      handleReactToComment(comment._id, emoji)
                                    }
                                    disabled={reactingCommentId === comment._id}
                                    className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border transition-colors disabled:opacity-50 ${
                                      isMine
                                        ? "bg-purple-500/20 border-purple-500/30 text-purple-300"
                                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                    }`}
                                  >
                                    <span>{emoji}</span>
                                    <span>{count}</span>
                                  </button>
                                );
                              })}

                              {/* Add-reaction picker */}
                              <div
                                className="relative"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() =>
                                    setOpenPickerId((prev) =>
                                      prev === comment._id ? null : comment._id,
                                    )
                                  }
                                  disabled={reactingCommentId === comment._id}
                                  className="text-gray-600 hover:text-purple-400 transition-colors p-0.5 disabled:opacity-50"
                                  title="React"
                                >
                                  <SmilePlus size={13} />
                                </button>

                                {openPickerId === comment._id && (
                                  <div className="absolute bottom-full left-0 mb-1.5 flex gap-1 bg-[#1a1a2e] border border-white/10 rounded-full px-2 py-1.5 shadow-xl shadow-black/50 z-10">
                                    {REACTION_EMOJIS.map((emoji) => (
                                      <button
                                        key={emoji}
                                        onClick={() =>
                                          handleReactToComment(
                                            comment._id,
                                            emoji,
                                          )
                                        }
                                        className="text-base leading-none hover:scale-125 transition-transform"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mt-0.5 ml-1">
                              <p className="text-[10px] text-gray-600">
                                {new Date(comment.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  },
                                )}
                                {comment.updatedAt &&
                                  comment.updatedAt !== comment.createdAt && (
                                    <span className="text-gray-700 ml-1">
                                      · Edited
                                    </span>
                                  )}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Report Modal ── */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReport}
        postTitle={post.content || workout.title}
      />

      {/* ── Toast ── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ── Image Preview Modal ── */}
      {previewOpen && (
        <ImagePreviewModal
          src={workout.imageUrl}
          alt={workout.title || "Workout"}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}
