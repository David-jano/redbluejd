"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  FaHeart,
  FaRegHeart,
  FaReply,
  FaTrash,
  FaUser,
  FaSpinner,
} from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";

interface ContentCommentsProps {
  contentId: number;
  contentType: string;
  currentUser?: string; // Make optional
  onClose?: () => void;
}

interface Comment {
  id: number;
  user_name: string;
  user_avatar: string;
  comment: string;
  likes: number;
  created_at: string;
  replies?: Reply[];
  user_has_liked?: boolean;
}

interface Reply {
  id: number;
  user_name: string;
  user_avatar: string;
  reply: string;
  likes: number;
  created_at: string;
  user_has_liked?: boolean;
}

export default function ContentComments({
  contentId,
  contentType,
  currentUser = "",
  onClose,
}: ContentCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(
    new Set(),
  );
  const [userName, setUserName] = useState(currentUser);
  const [showNameInput, setShowNameInput] = useState(!currentUser);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setUserName(currentUser);
      setShowNameInput(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (contentId && contentType) {
      fetchComments();
    }
  }, [contentId, contentType]);

  const fetchComments = async () => {
    try {
      setError(null);
      setLoading(true);

      // Fetch comments first
      const { data: commentsData, error: commentsError } = await supabase
        .from("content_comments")
        .select("*")
        .eq("content_id", contentId)
        .eq("content_type", contentType)
        .order("created_at", { ascending: false });

      if (commentsError) {
        console.error("Error fetching comments:", commentsError);
        setError(commentsError.message);
        setLoading(false);
        return;
      }

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        setLoading(false);
        return;
      }

      // Try to fetch replies, but don't fail if table doesn't exist
      let repliesData: any[] = [];
      const commentIds = commentsData.map((c) => c.id);

      try {
        // Check if replies table exists first
        const { error: tableCheckError } = await supabase
          .from("content_comment_replies")
          .select("id", { count: "exact", head: true })
          .limit(1);

        // If table exists, fetch replies
        if (!tableCheckError) {
          const { data, error: repliesError } = await supabase
            .from("content_comment_replies")
            .select("*")
            .in("comment_id", commentIds)
            .order("created_at", { ascending: true });

          if (repliesError) {
            // Log but don't show error to user - replies are optional
            console.warn("Could not fetch replies:", repliesError.message);
          } else if (data) {
            repliesData = data;
          }
        } else {
          console.log("Replies table doesn't exist yet, skipping replies");
        }
      } catch (replyErr) {
        // Silently handle replies error - they're not critical
        console.warn("Replies feature not available:", replyErr);
      }

      // Group replies by comment_id
      const repliesByComment: { [key: number]: any[] } = {};
      repliesData.forEach((reply) => {
        if (!repliesByComment[reply.comment_id]) {
          repliesByComment[reply.comment_id] = [];
        }
        repliesByComment[reply.comment_id].push(reply);
      });

      // Check like status for comments if user exists
      let commentsWithLikeStatus = commentsData;
      if (userName && userName.trim()) {
        try {
          // Get comment likes
          const { data: commentLikes } = await supabase
            .from("comment_likes")
            .select("comment_id")
            .in("comment_id", commentIds)
            .eq("user_name", userName);

          const likedCommentIds = new Set(
            commentLikes?.map((l) => l.comment_id) || [],
          );

          // Get reply likes if there are replies
          const allReplyIds = repliesData.map((r) => r.id);
          let likedReplyIds = new Set<number>();

          if (allReplyIds.length > 0) {
            try {
              const { data: replyLikes } = await supabase
                .from("comment_likes")
                .select("comment_id")
                .in("comment_id", allReplyIds)
                .eq("user_name", userName);

              likedReplyIds = new Set(
                replyLikes?.map((l) => l.comment_id) || [],
              );
            } catch (likeErr) {
              console.warn("Could not fetch reply likes:", likeErr);
            }
          }

          commentsWithLikeStatus = commentsData.map((comment) => ({
            ...comment,
            user_has_liked: likedCommentIds.has(comment.id),
            replies: (repliesByComment[comment.id] || []).map((reply) => ({
              ...reply,
              user_has_liked: likedReplyIds.has(reply.id),
            })),
          }));
        } catch (likeErr) {
          console.warn("Could not fetch like status:", likeErr);
          commentsWithLikeStatus = commentsData.map((comment) => ({
            ...comment,
            user_has_liked: false,
            replies: repliesByComment[comment.id] || [],
          }));
        }
      } else {
        commentsWithLikeStatus = commentsData.map((comment) => ({
          ...comment,
          user_has_liked: false,
          replies: repliesByComment[comment.id] || [],
        }));
      }

      setComments(commentsWithLikeStatus);
    } catch (error) {
      console.error("Unexpected error fetching comments:", error);
      setError("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !userName) {
      setError("Please enter a comment and your name");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase.from("content_comments").insert([
        {
          content_id: contentId,
          content_type: contentType,
          user_name: userName,
          comment: newComment.trim(),
          user_avatar: "/avatar.png",
        },
      ]);

      if (error) throw error;

      setNewComment("");
      await fetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
      setError("Failed to add comment");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReply = async (commentId: number) => {
    if (!replyText.trim() || !userName) {
      setError("Please enter a reply");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase.from("content_comment_replies").insert([
        {
          comment_id: commentId,
          user_name: userName,
          reply: replyText.trim(),
          user_avatar: "/avatar.png",
        },
      ]);

      if (error) throw error;

      setReplyTo(null);
      setReplyText("");
      await fetchComments();
    } catch (error) {
      console.error("Error adding reply:", error);
      setError("Failed to add reply");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: number, isLiked: boolean) => {
    if (!userName) {
      setError("Please enter your name first");
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Optimistic update
    const previousComments = [...comments];
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              likes: isLiked ? (c.likes || 0) - 1 : (c.likes || 0) + 1,
              user_has_liked: !isLiked,
            }
          : c,
      ),
    );

    try {
      if (isLiked) {
        // Unlike
        const { error: deleteError } = await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_name", userName);

        if (deleteError) throw deleteError;

        // Update count in content_comments
        const { error: updateError } = await supabase
          .from("content_comments")
          .update({
            likes: Math.max(
              0,
              (comments.find((c) => c.id === commentId)?.likes || 0) - 1,
            ),
          })
          .eq("id", commentId);

        if (updateError) throw updateError;
      } else {
        // Check if already liked
        const { data: existingLike } = await supabase
          .from("comment_likes")
          .select("id")
          .eq("comment_id", commentId)
          .eq("user_name", userName)
          .maybeSingle();

        if (!existingLike) {
          // Like
          const { error: insertError } = await supabase
            .from("comment_likes")
            .insert([
              {
                comment_id: commentId,
                user_name: userName,
              },
            ]);

          if (insertError) throw insertError;

          // Update count in content_comments
          const { error: updateError } = await supabase
            .from("content_comments")
            .update({
              likes: (comments.find((c) => c.id === commentId)?.likes || 0) + 1,
            })
            .eq("id", commentId);

          if (updateError) throw updateError;
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      setError("Failed to update like");
      setTimeout(() => setError(null), 3000);
      // Revert optimistic update
      setComments(previousComments);
    }
  };

  const handleLikeReply = async (replyId: number, isLiked: boolean) => {
    if (!userName) {
      setError("Please enter your name first");
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Optimistic update
    const previousComments = [...comments];
    setComments((prev) =>
      prev.map((c) => ({
        ...c,
        replies:
          c.replies?.map((r) =>
            r.id === replyId
              ? {
                  ...r,
                  likes: isLiked ? (r.likes || 0) - 1 : (r.likes || 0) + 1,
                  user_has_liked: !isLiked,
                }
              : r,
          ) || [],
      })),
    );

    try {
      if (isLiked) {
        // Unlike
        const { error: deleteError } = await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", replyId)
          .eq("user_name", userName);

        if (deleteError) throw deleteError;

        // Update count in content_comment_replies
        const { error: updateError } = await supabase
          .from("content_comment_replies")
          .update({
            likes: supabase.rpc("decrement", { row_id: replyId, amount: 1 }),
          })
          .eq("id", replyId);

        if (updateError) throw updateError;
      } else {
        // Check if already liked
        const { data: existingLike } = await supabase
          .from("comment_likes")
          .select("id")
          .eq("comment_id", replyId)
          .eq("user_name", userName)
          .maybeSingle();

        if (!existingLike) {
          // Like
          const { error: insertError } = await supabase
            .from("comment_likes")
            .insert([
              {
                comment_id: replyId,
                user_name: userName,
              },
            ]);

          if (insertError) throw insertError;

          // Update count in content_comment_replies
          const { error: updateError } = await supabase
            .from("content_comment_replies")
            .update({
              likes: supabase.rpc("increment", { row_id: replyId, amount: 1 }),
            })
            .eq("id", replyId);

          if (updateError) throw updateError;
        }
      }
    } catch (error) {
      console.error("Error toggling reply like:", error);
      setError("Failed to update like");
      setTimeout(() => setError(null), 3000);
      // Revert optimistic update
      setComments(previousComments);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      // Delete replies first
      await supabase
        .from("content_comment_replies")
        .delete()
        .eq("comment_id", commentId);

      // Delete comment likes
      await supabase.from("comment_likes").delete().eq("comment_id", commentId);

      // Delete comment
      const { error } = await supabase
        .from("content_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      await fetchComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
      setError("Failed to delete comment");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteReply = async (replyId: number, commentId: number) => {
    if (!confirm("Are you sure you want to delete this reply?")) return;

    try {
      // Delete reply likes
      await supabase.from("comment_likes").delete().eq("comment_id", replyId);

      // Delete reply
      const { error } = await supabase
        .from("content_comment_replies")
        .delete()
        .eq("id", replyId);

      if (error) throw error;

      await fetchComments();
    } catch (error) {
      console.error("Error deleting reply:", error);
      setError("Failed to delete reply");
      setTimeout(() => setError(null), 3000);
    }
  };

  const toggleReplies = (commentId: number) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  const saveUserName = () => {
    if (userName.trim()) {
      setShowNameInput(false);
      fetchComments();
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-center items-center py-8">
          <FaSpinner className="animate-spin text-amber-600 w-6 h-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">
          Comments ({comments.length})
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* User Name Input */}
      {showNameInput ? (
        <div className="mb-6 p-4 bg-amber-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter your name to comment
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={saveUserName}
              disabled={!userName.trim()}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-300"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 text-sm text-gray-600 flex items-center gap-2">
          <span>Commenting as:</span>
          <span className="font-semibold text-amber-700">{userName}</span>
          <button
            onClick={() => setShowNameInput(true)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            (change)
          </button>
        </div>
      )}

      {/* Add Comment Form */}
      {!showNameInput && (
        <div className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            rows={3}
          />
          <button
            onClick={handleAddComment}
            disabled={submitting || !newComment.trim()}
            className="mt-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-300 transition-colors"
          >
            {submitting ? "Posting..." : "Post Comment"}
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="border-b border-gray-200 pb-6 last:border-0"
          >
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <FaUser className="w-5 h-5 text-gray-500" />
              </div>

              <div className="flex-1">
                {/* Comment Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">
                      {comment.user_name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  {comment.user_name === userName && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash size={14} />
                    </button>
                  )}
                </div>

                {/* Comment Text */}
                <p className="text-gray-700 mt-1">{comment.comment}</p>

                {/* Comment Actions */}
                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() =>
                      handleLikeComment(
                        comment.id,
                        comment.user_has_liked || false,
                      )
                    }
                    className={`flex items-center gap-1 text-sm ${
                      comment.user_has_liked
                        ? "text-red-500"
                        : "text-gray-500 hover:text-red-500"
                    }`}
                  >
                    {comment.user_has_liked ? <FaHeart /> : <FaRegHeart />}
                    <span>{comment.likes || 0}</span>
                  </button>

                  <button
                    onClick={() =>
                      setReplyTo(replyTo === comment.id ? null : comment.id)
                    }
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-amber-600"
                  >
                    <FaReply size={14} />
                    Reply
                  </button>

                  {comment.replies && comment.replies.length > 0 && (
                    <button
                      onClick={() => toggleReplies(comment.id)}
                      className="text-sm text-gray-500 hover:text-amber-600"
                    >
                      {expandedComments.has(comment.id) ? "Hide" : "Show"}{" "}
                      {comment.replies.length} replies
                    </button>
                  )}
                </div>

                {/* Reply Form */}
                {replyTo === comment.id && !showNameInput && (
                  <div className="mt-3 ml-8">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      rows={2}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleAddReply(comment.id)}
                        disabled={submitting}
                        className="px-3 py-1 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 disabled:bg-gray-300"
                      >
                        {submitting ? "Posting..." : "Post Reply"}
                      </button>
                      <button
                        onClick={() => {
                          setReplyTo(null);
                          setReplyText("");
                        }}
                        className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {expandedComments.has(comment.id) &&
                  comment.replies &&
                  comment.replies.length > 0 && (
                    <div className="ml-8 mt-4 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-2">
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <FaUser className="w-3 h-3 text-gray-500" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {reply.user_name}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {formatDistanceToNow(
                                    new Date(reply.created_at),
                                    { addSuffix: true },
                                  )}
                                </span>
                              </div>
                              {reply.user_name === userName && (
                                <button
                                  onClick={() =>
                                    handleDeleteReply(reply.id, comment.id)
                                  }
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <FaTrash size={12} />
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 mt-1">
                              {reply.reply}
                            </p>

                            {/* Reply Like Button */}
                            <button
                              onClick={() =>
                                handleLikeReply(
                                  reply.id,
                                  reply.user_has_liked || false,
                                )
                              }
                              className={`flex items-center gap-1 text-xs mt-1 ${
                                reply.user_has_liked
                                  ? "text-red-500"
                                  : "text-gray-400 hover:text-red-500"
                              }`}
                            >
                              {reply.user_has_liked ? (
                                <FaHeart size={12} />
                              ) : (
                                <FaRegHeart size={12} />
                              )}
                              <span>{reply.likes || 0}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            No comments yet. Be the first to share your thoughts!
          </p>
        )}
      </div>
    </div>
  );
}
