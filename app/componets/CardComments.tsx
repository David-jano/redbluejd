"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FaThumbsUp, FaReply, FaUser } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";

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

interface ArticleCommentsProps {
  articleId: string | number;
}

export default function ArticleComments({ articleId }: ArticleCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userName, setUserName] = useState("");
  const [showNameInput, setShowNameInput] = useState(true);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(
    new Set(),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedName = localStorage.getItem("commentUserName");
    if (savedName) {
      setUserName(savedName);
      setShowNameInput(false);
    }

    if (articleId && !isNaN(Number(articleId))) {
      fetchComments();
    } else {
      setError("Invalid article ID");
      setLoading(false);
    }
  }, [articleId]);

  const fetchComments = async () => {
    if (!articleId || isNaN(Number(articleId))) {
      setError("Cannot fetch comments: Invalid article ID");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const articleIdNum = Number(articleId);

      // Fetch all comments for this article
      const { data: commentsData, error: commentsError } = await supabase
        .from("article_comments")
        .select("*")
        .eq("article_id", articleIdNum)
        .order("created_at", { ascending: false });

      if (commentsError) {
        console.error("Error fetching comments:", commentsError);
        setError(`Failed to load comments: ${commentsError.message}`);
        setLoading(false);
        return;
      }

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        setLoading(false);
        return;
      }

      // Fetch replies for all comments
      const commentIds = commentsData.map((comment) => comment.id);
      let repliesData: any[] = [];

      if (commentIds.length > 0) {
        const { data, error: repliesError } = await supabase
          .from("article_comment_replies")
          .select("*")
          .in("comment_id", commentIds)
          .order("created_at", { ascending: true });

        if (!repliesError && data) {
          repliesData = data;
        }
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
        const { data: likesData } = await supabase
          .from("article_comment_likes")
          .select("comment_id")
          .in("comment_id", commentIds)
          .eq("user_name", userName);

        const likedCommentIds = new Set(
          likesData?.map((like) => like.comment_id) || [],
        );

        commentsWithLikeStatus = commentsData.map((comment) => ({
          ...comment,
          user_has_liked: likedCommentIds.has(comment.id),
          replies: (repliesByComment[comment.id] || []).map((reply) => ({
            ...reply,
            user_has_liked: false,
          })),
        }));
      } else {
        commentsWithLikeStatus = commentsData.map((comment) => ({
          ...comment,
          user_has_liked: false,
          replies: repliesByComment[comment.id] || [],
        }));
      }

      setComments(commentsWithLikeStatus);
    } catch (error) {
      console.error("Unexpected error in fetchComments:", error);
      setError(
        `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const saveUserName = () => {
    if (userName.trim()) {
      localStorage.setItem("commentUserName", userName);
      setShowNameInput(false);
      fetchComments();
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !userName) return;
    if (!articleId || isNaN(Number(articleId))) {
      setError("Cannot post comment: Invalid article ID");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const articleIdNum = Number(articleId);
      const { error } = await supabase.from("article_comments").insert([
        {
          article_id: articleIdNum,
          user_name: userName,
          comment: newComment.trim(),
          user_avatar: "/avatar.png",
        },
      ]);

      if (error) throw error;

      setNewComment("");
      await fetchComments(); // Wait for fetch to complete
    } catch (error) {
      console.error("Error adding comment:", error);
      setError(
        `Failed to post comment: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReply = async (commentId: number) => {
    if (!replyText.trim() || !userName) return;

    setSubmitting(true);
    setError(null);
    try {
      const { error } = await supabase.from("article_comment_replies").insert([
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
      await fetchComments(); // Wait for fetch to complete
    } catch (error) {
      console.error("Error adding reply:", error);
      setError(
        `Failed to post reply: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: number, isLiked: boolean) => {
    if (!userName) {
      alert("Please enter your name first");
      return;
    }

    // Store current likes for rollback
    const previousComments = comments.map((c) => ({ ...c }));

    // Optimistically update UI
    setComments((prevComments) =>
      prevComments.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              likes: isLiked
                ? Math.max(0, (comment.likes || 0) - 1)
                : (comment.likes || 0) + 1,
              user_has_liked: !isLiked,
            }
          : comment,
      ),
    );

    try {
      if (isLiked) {
        // Remove the like record
        const { error: deleteError } = await supabase
          .from("article_comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_name", userName);

        if (deleteError) throw deleteError;

        // Update the likes count in article_comments
        const { data: currentComment, error: fetchError } = await supabase
          .from("article_comments")
          .select("likes")
          .eq("id", commentId)
          .single();

        if (fetchError) throw fetchError;

        const newLikesCount = Math.max(0, (currentComment?.likes || 0) - 1);

        const { error: updateError } = await supabase
          .from("article_comments")
          .update({ likes: newLikesCount })
          .eq("id", commentId);

        if (updateError) throw updateError;
      } else {
        // Check if like already exists to prevent duplicates
        const { data: existingLike, error: checkError } = await supabase
          .from("article_comment_likes")
          .select("id")
          .eq("comment_id", commentId)
          .eq("user_name", userName)
          .maybeSingle();

        if (checkError) throw checkError;

        if (!existingLike) {
          // Add the like record
          const { error: insertError } = await supabase
            .from("article_comment_likes")
            .insert([
              {
                comment_id: commentId,
                user_name: userName,
              },
            ]);

          if (insertError) throw insertError;

          // Update the likes count in article_comments
          const { data: currentComment, error: fetchError } = await supabase
            .from("article_comments")
            .select("likes")
            .eq("id", commentId)
            .single();

          if (fetchError) throw fetchError;

          const newLikesCount = (currentComment?.likes || 0) + 1;

          const { error: updateError } = await supabase
            .from("article_comments")
            .update({ likes: newLikesCount })
            .eq("id", commentId);

          if (updateError) throw updateError;
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      setError(
        `Failed to update like: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Revert optimistic update
      setComments(previousComments);
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

  if (loading) {
    return (
      <div className="mt-12 border-t border-gray-200 pt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments</h2>
        <div className="text-center py-8">
          <p className="text-gray-500">Loading comments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 border-t border-gray-200 pt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Comments ({comments.length})
      </h2>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          <p className="font-semibold">Error:</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchComments();
            }}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Name Input */}
      {showNameInput ? (
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter your name to comment
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={saveUserName}
              disabled={!userName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 text-sm text-gray-600 flex items-center gap-2">
          <span>Commenting as:</span>
          <span className="font-semibold text-blue-700">{userName}</span>
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
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <button
            onClick={handleAddComment}
            disabled={submitting || !newComment.trim()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            {submitting ? "Posting..." : "Post Comment"}
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="border-b border-gray-200 pb-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <FaUser className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1">
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
                <p className="text-gray-700 mt-1">{comment.comment}</p>

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
                    disabled={submitting}
                  >
                    {comment.user_has_liked ? <FaThumbsUp /> : <FaThumbsUp />}
                    <span>{comment.likes || 0}</span>
                  </button>

                  <button
                    onClick={() =>
                      setReplyTo(replyTo === comment.id ? null : comment.id)
                    }
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
                    disabled={submitting}
                  >
                    <FaReply size={14} />
                    Reply
                  </button>

                  {comment.replies && comment.replies.length > 0 && (
                    <button
                      onClick={() => toggleReplies(comment.id)}
                      className="text-sm text-gray-500 hover:text-blue-600"
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
                      disabled={submitting}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleAddReply(comment.id)}
                        disabled={!replyText.trim() || submitting}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-300"
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
                            <p className="text-sm text-gray-700 mt-1">
                              {reply.reply}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </div>
        ))}

        {comments.length === 0 && !loading && !error && (
          <p className="text-center text-gray-500 py-4">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
}
