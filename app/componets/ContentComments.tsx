"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  FaHeart, 
  FaRegHeart, 
  FaReply, 
  FaTrash, 
  FaUser,
  FaSpinner 
} from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";

interface ContentCommentsProps {
  contentId: number;
  contentType: string;
  currentUser: string;
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
  currentUser,
  onClose 
}: ContentCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [userName, setUserName] = useState(currentUser);
  const [showNameInput, setShowNameInput] = useState(!currentUser);

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
      const { data: commentsData, error: commentsError } = await supabase
        .from("content_comments")
        .select(`
          *,
          replies:content_comment_replies(*)
        `)
        .eq("content_id", contentId)
        .eq("content_type", contentType)
        .order("created_at", { ascending: false });

      if (commentsError) throw commentsError;

      // Check if current user liked each comment
      const commentsWithLikeStatus = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: likeData } = await supabase
            .from("comment_likes")
            .select("id")
            .eq("comment_id", comment.id)
            .eq("user_name", userName)
            .maybeSingle();

          // Check if user liked each reply
          const repliesWithLikeStatus = await Promise.all(
            (comment.replies || []).map(async (reply: any) => {
              const { data: replyLikeData } = await supabase
                .from("comment_likes")
                .select("id")
                .eq("comment_id", reply.id)
                .eq("user_name", userName)
                .maybeSingle();

              return {
                ...reply,
                user_has_liked: !!replyLikeData
              };
            })
          );

          return {
            ...comment,
            user_has_liked: !!likeData,
            replies: repliesWithLikeStatus || []
          };
        })
      );

      setComments(commentsWithLikeStatus);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !userName) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("content_comments")
        .insert([{
          content_id: contentId,
          content_type: contentType,
          user_name: userName,
          comment: newComment.trim(),
          user_avatar: '/avatar.png'
        }]);

      if (error) throw error;

      setNewComment("");
      fetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReply = async (commentId: number) => {
    if (!replyText.trim() || !userName) return;

    try {
      const { error } = await supabase
        .from("content_comment_replies")
        .insert([{
          comment_id: commentId,
          user_name: userName,
          reply: replyText.trim(),
          user_avatar: '/avatar.png'
        }]);

      if (error) throw error;

      setReplyTo(null);
      setReplyText("");
      fetchComments();
    } catch (error) {
      console.error("Error adding reply:", error);
    }
  };

  const handleLikeComment = async (commentId: number, isLiked: boolean) => {
    if (!userName) return;

    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_name", userName);

        await supabase
          .from("content_comments")
          .update({ likes: supabase.rpc('decrement', { x: 1 }) })
          .eq("id", commentId);
      } else {
        // Like
        await supabase
          .from("comment_likes")
          .insert([{
            comment_id: commentId,
            user_name: userName
          }]);

        await supabase
          .from("content_comments")
          .update({ likes: supabase.rpc('increment', { x: 1 }) })
          .eq("id", commentId);
      }

      // Update local state
      setComments(prev => 
        prev.map(c => 
          c.id === commentId 
            ? { 
                ...c, 
                likes: isLiked ? c.likes - 1 : c.likes + 1,
                user_has_liked: !isLiked 
              }
            : c
        )
      );
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleLikeReply = async (replyId: number, isLiked: boolean) => {
    if (!userName) return;

    try {
      if (isLiked) {
        await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", replyId)
          .eq("user_name", userName);

        await supabase
          .from("content_comment_replies")
          .update({ likes: supabase.rpc('decrement', { x: 1 }) })
          .eq("id", replyId);
      } else {
        await supabase
          .from("comment_likes")
          .insert([{
            comment_id: replyId,
            user_name: userName
          }]);

        await supabase
          .from("content_comment_replies")
          .update({ likes: supabase.rpc('increment', { x: 1 }) })
          .eq("id", replyId);
      }

      // Update local state
      setComments(prev => 
        prev.map(c => ({
          ...c,
          replies: c.replies?.map(r => 
            r.id === replyId 
              ? { 
                  ...r, 
                  likes: isLiked ? r.likes - 1 : r.likes + 1,
                  user_has_liked: !isLiked 
                }
              : r
          ) || []
        }))
      );
    } catch (error) {
      console.error("Error toggling reply like:", error);
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
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <FaSpinner className="animate-spin text-amber-600 w-6 h-6" />
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
          <div key={comment.id} className="border-b border-gray-200 pb-6 last:border-0">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <FaUser className="w-5 h-5 text-gray-500" />
              </div>
              
              <div className="flex-1">
                {/* Comment Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{comment.user_name}</span>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {comment.user_name === userName && (
                    <button
                      onClick={() => {/* Add delete functionality */}}
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
                    onClick={() => handleLikeComment(comment.id, comment.user_has_liked || false)}
                    className={`flex items-center gap-1 text-sm ${
                      comment.user_has_liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                    }`}
                  >
                    {comment.user_has_liked ? <FaHeart /> : <FaRegHeart />}
                    <span>{comment.likes}</span>
                  </button>

                  <button
                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
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
                      {expandedComments.has(comment.id) ? 'Hide' : 'Show'} {comment.replies.length} replies
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
                        className="px-3 py-1 bg-amber-600 text-white text-sm rounded hover:bg-amber-700"
                      >
                        Post Reply
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
                {expandedComments.has(comment.id) && comment.replies && comment.replies.length > 0 && (
                  <div className="ml-8 mt-4 space-y-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <FaUser className="w-3 h-3 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{reply.user_name}</span>
                              <span className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{reply.reply}</p>
                          
                          {/* Reply Like Button */}
                          <button
                            onClick={() => handleLikeReply(reply.id, reply.user_has_liked || false)}
                            className={`flex items-center gap-1 text-xs mt-1 ${
                              reply.user_has_liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                            }`}
                          >
                            {reply.user_has_liked ? <FaHeart size={12} /> : <FaRegHeart size={12} />}
                            <span>{reply.likes}</span>
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