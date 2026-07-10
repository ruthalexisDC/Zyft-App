// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   MoreHorizontal,
//   User,
//   Bookmark,
//   EyeOff,
//   Share2,
//   Flag,
//   Heart,
//   MessageCircle,
//   ChevronDown,
// } from "lucide-react";

// const PostCard = ({ post, onHide }) => {
//   const [showStats, setShowStats] = useState(false);

//   // respectCount is sent by the backend as a number.
//   // Fall back to post.respects?.length in case raw array data is passed.
//   const respectCount = post.respectCount ?? post.respects?.length ?? 0;
//   const commentCount = post.commentCount ?? post.comments ?? 0;

//   return (
//     <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-800 mb-4">
//       {/* Header */}
//       <div className="flex items-center justify-between mb-3">
//         <div className="flex items-center gap-3">
//           <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
//             {post.userName?.[0]?.toUpperCase() || "?"}
//           </div>
//           <div>
//             <p className="font-semibold text-sm">
//               {post.userName || "Anonymous"}
//             </p>
//             <p className="text-xs text-gray-500">
//               @{post.userHandle || "user"} · {formatDate(post.createdAt)}
//             </p>
//           </div>
//         </div>

//         <PostMenu post={post} onHide={onHide} />
//       </div>

//       {/* Content */}
//       <h3 className="font-bold text-lg mb-1">{post.title}</h3>
//       <p className="text-purple-400 text-sm mb-3 flex items-center gap-1">
//         <span className="w-2 h-2 rounded-full bg-purple-500" />
//         {post.category}
//       </p>

//       {/* Stats preview */}
//       <div className="flex gap-3 mb-3">
//         <div className="bg-[#0f0f1a] rounded-lg px-4 py-2 flex-1">
//           <p className="text-xs text-gray-500">Duration</p>
//           <p className="font-bold text-white">{post.duration} min</p>
//         </div>
//         <div className="bg-[#0f0f1a] rounded-lg px-4 py-2 flex-1">
//           <p className="text-xs text-gray-500">Calories</p>
//           <p className="font-bold text-purple-400">{post.calories}</p>
//         </div>
//       </div>

//       {/* Expandable detailed stats */}
//       {showStats && post.exercises && (
//         <div className="bg-[#0f0f1a] rounded-lg p-3 mb-3 space-y-2">
//           {post.exercises.map((ex, i) => (
//             <div key={i} className="flex justify-between text-sm">
//               <span className="text-gray-300">{ex.name}</span>
//               <span className="text-gray-500">
//                 {ex.sets} × {ex.reps} · {ex.weight}kg
//               </span>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Actions */}
//       <div className="flex items-center justify-between pt-3 border-t border-gray-800">
//         <button
//           onClick={() => setShowStats(!showStats)}
//           className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
//         >
//           <ChevronDown
//             size={14}
//             className={`transition-transform ${showStats ? "rotate-180" : ""}`}
//           />
//           {showStats ? "Hide stats" : "View detailed stats"}
//         </button>

//         <div className="flex items-center gap-4">
//           <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-purple-400">
//             <Heart size={16} />
//             {respectCount} Respects
//           </button>
//           <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-purple-400">
//             <MessageCircle size={16} />
//             {commentCount} Comments
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Dropdown Menu Component
// const PostMenu = ({ post, onHide }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const navigate = useNavigate();

//   const handleVisitProfile = () => {
//     navigate(`/profile/${post.userId}`);
//     setIsOpen(false);
//   };

//   const menuItems = [
//     {
//       icon: <User size={16} />,
//       label: "Visit profile",
//       onClick: handleVisitProfile,
//     },
//     { icon: <Bookmark size={16} />, label: "Save to favorites" },
//     {
//       icon: <EyeOff size={16} />,
//       label: "Not interested",
//       onClick: () => {
//         onHide?.(post._id);
//         setIsOpen(false);
//       },
//     },
//     { icon: <Share2 size={16} />, label: "Share" },
//     { divider: true },
//     { icon: <Flag size={16} />, label: "Report", danger: true },
//   ];

//   return (
//     <div className="relative">
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
//       >
//         <MoreHorizontal size={20} />
//       </button>

//       {isOpen && (
//         <>
//           <div
//             className="fixed inset-0 z-40"
//             onClick={() => setIsOpen(false)}
//           />
//           <div className="absolute right-0 top-full mt-1 w-52 bg-[#1a1a2e] rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden z-50 py-1">
//             {menuItems.map((item, i) =>
//               item.divider ? (
//                 <div key={i} className="border-t border-gray-700/50 my-1" />
//               ) : (
//                 <button
//                   key={item.label}
//                   onClick={item.onClick}
//                   className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
//                     item.danger
//                       ? "text-red-400 hover:bg-red-500/10"
//                       : "text-gray-300 hover:bg-white/5"
//                   }`}
//                 >
//                   <span className="opacity-70">{item.icon}</span>
//                   {item.label}
//                 </button>
//               ),
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// const formatDate = (date) => {
//   if (!date) return "";
//   const d = new Date(date);
//   return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
// };

// export default PostCard;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreHorizontal,
  User,
  Bookmark,
  EyeOff,
  Share2,
  Flag,
  Heart,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import RespectsListModal from "./RespectsListModal.jsx";

const PostCard = ({ post, onHide }) => {
  const [showStats, setShowStats] = useState(false);
  const [showRespects, setShowRespects] = useState(false);

  // respectCount is sent by the backend as a number.
  // Fall back to post.respects?.length in case raw array data is passed.
  const respectCount = post.respectCount ?? post.respects?.length ?? 0;
  const commentCount = post.commentCount ?? post.comments ?? 0;

  return (
    <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-800 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
            {post.userName?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="font-semibold text-sm">
              {post.userName || "Anonymous"}
            </p>
            <p className="text-xs text-gray-500">
              @{post.userHandle || "user"} · {formatDate(post.createdAt)}
            </p>
          </div>
        </div>

        <PostMenu post={post} onHide={onHide} />
      </div>

      {/* Content */}
      <h3 className="font-bold text-lg mb-1">{post.title}</h3>
      <p className="text-purple-400 text-sm mb-3 flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-purple-500" />
        {post.category}
      </p>

      {/* Stats preview */}
      <div className="flex gap-3 mb-3">
        <div className="bg-[#0f0f1a] rounded-lg px-4 py-2 flex-1">
          <p className="text-xs text-gray-500">Duration</p>
          <p className="font-bold text-white">{post.duration} min</p>
        </div>
        <div className="bg-[#0f0f1a] rounded-lg px-4 py-2 flex-1">
          <p className="text-xs text-gray-500">Calories</p>
          <p className="font-bold text-purple-400">{post.calories}</p>
        </div>
      </div>

      {/* Expandable detailed stats */}
      {showStats && post.exercises && (
        <div className="bg-[#0f0f1a] rounded-lg p-3 mb-3 space-y-2">
          {post.exercises.map((ex, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-300">{ex.name}</span>
              <span className="text-gray-500">
                {ex.sets} × {ex.reps} · {ex.weight}kg
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
        <button
          onClick={() => setShowStats(!showStats)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <ChevronDown
            size={14}
            className={`transition-transform ${showStats ? "rotate-180" : ""}`}
          />
          {showStats ? "Hide stats" : "View detailed stats"}
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowRespects(true)}
            disabled={respectCount === 0}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-purple-400 disabled:hover:text-gray-400 disabled:cursor-default transition-colors"
          >
            <Heart size={16} />
            {respectCount} Respects
          </button>
          <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-purple-400">
            <MessageCircle size={16} />
            {commentCount} Comments
          </button>
        </div>
      </div>

      <RespectsListModal
        open={showRespects}
        postId={post._id}
        onClose={() => setShowRespects(false)}
      />
    </div>
  );
};

// Dropdown Menu Component
const PostMenu = ({ post, onHide }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleVisitProfile = () => {
    navigate(`/profile/${post.userId}`);
    setIsOpen(false);
  };

  const menuItems = [
    {
      icon: <User size={16} />,
      label: "Visit profile",
      onClick: handleVisitProfile,
    },
    { icon: <Bookmark size={16} />, label: "Save to favorites" },
    {
      icon: <EyeOff size={16} />,
      label: "Not interested",
      onClick: () => {
        onHide?.(post._id);
        setIsOpen(false);
      },
    },
    { icon: <Share2 size={16} />, label: "Share" },
    { divider: true },
    { icon: <Flag size={16} />, label: "Report", danger: true },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
      >
        <MoreHorizontal size={20} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-52 bg-[#1a1a2e] rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden z-50 py-1">
            {menuItems.map((item, i) =>
              item.divider ? (
                <div key={i} className="border-t border-gray-700/50 my-1" />
              ) : (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    item.danger
                      ? "text-red-400 hover:bg-red-500/10"
                      : "text-gray-300 hover:bg-white/5"
                  }`}
                >
                  <span className="opacity-70">{item.icon}</span>
                  {item.label}
                </button>
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
};

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default PostCard;
