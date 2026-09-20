export const buildCommentTree = (
  comments,
  userId
) => {
  const commentMap = new Map();
  const topLevelComments = [];

  comments.forEach((comment) => {
    const commentObj =
      comment.toObject();

    commentObj.replies = [];

    // Keep the same property name
    // used by the frontend.
    commentObj.myReaction =
      comment.getUserReaction(userId);

    commentMap.set(
      commentObj._id.toString(),
      commentObj
    );
  });

  comments.forEach((comment) => {
    const commentObj =
      commentMap.get(
        comment._id.toString()
      );

    // Top-level comment
    if (!comment.parentComment) {
      topLevelComments.push(
        commentObj
      );
      return;
    }

    const parentId =
      comment.parentComment.toString();

    const parentComment =
      commentMap.get(parentId);

    if (parentComment) {
      parentComment.replies.push(
        commentObj
      );
    } else {
      // Orphaned reply
      // becomes top-level.
      topLevelComments.push(
        commentObj
      );
    }
  });

  return topLevelComments;
};