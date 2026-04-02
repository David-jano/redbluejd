"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface Reply {
  id: number;
  comment_id: number;
  name: string;
  text: string;
  date: string;
  created_at: string;
}

interface Comment {
  id: number;
  name: string;
  avatar: string;
  date: string;
  text: string;
  created_at: string;
  replies: Reply[];
}

interface CommentCardProps {
  comment: Comment;
  onReply: (id: number | null) => void;
  replyingTo: number | null;
  replyText: string;
  setReplyText: (text: string) => void;
  handleReply: (commentId: number) => void;
  currentUser: string;
  isNew?: boolean;
  onEdit: (commentId: number, newText: string) => void;
  onDelete: (commentId: number) => void;
}

const Comments = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [showNameInput, setShowNameInput] = useState(true);
  const [filter, setFilter] = useState<"all" | "latest" | "oldest">("all");
  const [visibleCount, setVisibleCount] = useState(5);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  // Success message state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Load username from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem("commentUserName");
    if (savedName) {
      setUserName(savedName);
      setShowNameInput(false);
    }
  }, []);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  // Fetch comments on mount
  useEffect(() => {
    fetchComments();

    // Set up realtime subscription
    const subscription = supabase
      .channel("comments-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments" },
        (payload) => {
          fetchNewComment(payload.new.id);
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "replies" },
        (payload) => {
          handleNewReply(payload.new);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "comments" },
        (payload) => {
          handleUpdateComment(payload.new);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "comments" },
        (payload) => {
          handleDeleteComment(payload.old.id);
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchComments = async () => {
    setLoading(true);

    const { data: commentsData, error: commentsError } = await supabase
      .from("comments")
      .select("*")
      .order("created_at", { ascending: false });

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
      setLoading(false);
      return;
    }

    const { data: repliesData, error: repliesError } = await supabase
      .from("replies")
      .select("*")
      .order("created_at", { ascending: true });

    if (repliesError) {
      console.error("Error fetching replies:", repliesError);
      setLoading(false);
      return;
    }

    const commentsWithReplies = commentsData.map((comment) => ({
      ...comment,
      replies:
        repliesData.filter((reply) => reply.comment_id === comment.id) || [],
    }));

    setComments(commentsWithReplies);
    setLoading(false);
  };

  const fetchNewComment = async (commentId: number) => {
    const { data: comment, error } = await supabase
      .from("comments")
      .select("*")
      .eq("id", commentId)
      .single();

    if (error) {
      console.error("Error fetching new comment:", error);
      return;
    }

    const { data: replies } = await supabase
      .from("replies")
      .select("*")
      .eq("comment_id", commentId);

    const newCommentWithReplies = {
      ...comment,
      replies: replies || [],
    };

    setComments((prevComments) => [newCommentWithReplies, ...prevComments]);
  };

  const handleNewReply = (newReply: any) => {
    setComments((prevComments) =>
      prevComments.map((comment) => {
        if (comment.id === newReply.comment_id) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply],
          };
        }
        return comment;
      }),
    );
  };

  const handleUpdateComment = (updatedComment: any) => {
    setComments((prevComments) =>
      prevComments.map((comment) =>
        comment.id === updatedComment.id
          ? { ...comment, text: updatedComment.text }
          : comment,
      ),
    );
  };

  const handleDeleteComment = (deletedId: number) => {
    setComments((prevComments) =>
      prevComments.filter((comment) => comment.id !== deletedId),
    );
  };

  const saveUserName = () => {
    if (userName.trim()) {
      localStorage.setItem("commentUserName", userName);
      setShowNameInput(false);
      setSuccessMessage("Izina ryanyu ryabitswe neza!");
      setShowSuccessMessage(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !userName) return;

    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const { error } = await supabase.from("comments").insert([
      {
        name: userName,
        avatar: "/avatar.png",
        date: currentDate,
        text: newComment.trim(),
      },
    ]);

    if (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment. Please try again.");
    } else {
      setNewComment("");
      setSuccessMessage("Igitekerezo cyanyu cyakiriwe neza!");
      setShowSuccessMessage(true);
    }
  };

  const handleReply = async (commentId: number) => {
    if (!replyText.trim() || !userName) return;

    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const { error } = await supabase.from("replies").insert([
      {
        comment_id: commentId,
        name: userName,
        text: replyText.trim(),
        date: currentDate,
      },
    ]);

    if (error) {
      console.error("Error adding reply:", error);
      alert("Failed to add reply. Please try again.");
    } else {
      setReplyingTo(null);
      setReplyText("");
      setSuccessMessage("Igisubizo cyanyu cyakiriwe neza!");
      setShowSuccessMessage(true);
    }
  };

  const handleEdit = async (commentId: number, newText: string) => {
    if (!newText.trim()) return;

    const { error } = await supabase
      .from("comments")
      .update({ text: newText.trim() })
      .eq("id", commentId);

    if (error) {
      console.error("Error updating comment:", error);
      alert("Failed to edit comment. Please try again.");
    } else {
      setEditingComment(null);
      setEditText("");
      setSuccessMessage("Igitekerezo cyanyu cyahinduwe neza!");
      setShowSuccessMessage(true);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm("Emeza kuvanaho iki gitekerezo?")) return;

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment. Please try again.");
    } else {
      setSuccessMessage("Igitekerezo cyanyu cyakuweho neza!");
      setShowSuccessMessage(true);
    }
  };

  // Filter and sort comments
  const getFilteredComments = () => {
    let filtered = [...comments];

    switch (filter) {
      case "latest":
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        break;
      default:
        // Keep as is (already sorted by created_at desc from fetch)
        break;
    }

    return filtered;
  };

  const filteredComments = getFilteredComments();
  const visibleComments = filteredComments.slice(0, visibleCount);
  const hasMore = visibleCount < filteredComments.length;

  const loadMore = () => {
    setVisibleCount((prev) => prev + 5);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-10 max-w-7xl mx-auto my-12">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 md:p-10 max-w-7xl mx-auto my-12 relative">
      {/* Success Message Toast */}
      {showSuccessMessage && (
        <div className="fixed top-5 right-5 z-50 animate-slide-down">
          <div className="bg-green-50 border-l-4 border-green-500 text-green-800 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <div className="bg-green-500 rounded-full p-1">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Header with name input */}
      <div className="mb-8 border-b pb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="text-3xl font-bold text-gray-800">
            Ibitekerezo ({comments.length})
          </h3>

          {/* Name input */}
          {showNameInput ? (
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="border rounded-lg px-4 py-2 text-sm flex-1 md:w-44 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                placeholder="Andika izina ryawe..."
                autoFocus
              />
              <button
                onClick={saveUserName}
                disabled={!userName.trim()}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-orange-50 px-4 py-2 rounded-lg">
              <span className="text-gray-600">Uratanga igitekerezo nka:</span>
              <span className="font-semibold text-orange-500">{userName}</span>
              <button
                onClick={() => setShowNameInput(true)}
                className="text-sm text-gray-400 hover:text-gray-600"
                title="Hindura izina"
              >
                ✎
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === "all"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Byose
          </button>
          <button
            onClick={() => setFilter("latest")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === "latest"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Ibiheruka
          </button>
          <button
            onClick={() => setFilter("oldest")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === "oldest"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Ibya kera
          </button>
        </div>
        <span className="text-sm text-gray-500">
          {visibleComments.length} / {filteredComments.length} yerekanwa
        </span>
      </div>

      {/* Comments list */}
      <div className="space-y-6 mb-10 max-h-[600px] overflow-y-auto pr-2">
        {visibleComments.length > 0 ? (
          visibleComments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onReply={setReplyingTo}
              replyingTo={replyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              handleReply={handleReply}
              currentUser={userName}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">
            Nta gitekerezo kirahari
          </p>
        )}

        {/* Load more button */}
        {hasMore && (
          <div className="text-center pt-4">
            <button
              onClick={loadMore}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Reba ibindi ({filteredComments.length - visibleCount})
            </button>
          </div>
        )}
      </div>

      {/* Comment input */}
      <div className="border-t pt-8">
        <h4 className="text-xl font-semibold text-gray-800 mb-4">
          Andika igitekerezo cyawe
        </h4>
        <form onSubmit={handleSubmit} className="mt-4">
          <textarea
            className="w-full border border-gray-300 rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
            rows={4}
            placeholder="Andika igitekerezo cyawe hano..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            required
            disabled={!userName}
          ></textarea>
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-500">
              {userName ? (
                <>
                  Utanga igitekerezo nka:{" "}
                  <span className="font-semibold text-orange-500">
                    {userName}
                  </span>
                </>
              ) : (
                <span className="text-red-500">
                  Nyamuganiza wandika izina ryawe
                </span>
              )}
            </p>
            <button
              type="submit"
              disabled={!userName || !newComment.trim()}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Ohereza
            </button>
          </div>
        </form>
      </div>

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

// Comment Card Component
const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  onReply,
  replyingTo,
  replyText,
  setReplyText,
  handleReply,
  currentUser,
  onEdit,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const isOwner = currentUser === comment.name;

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== comment.text) {
      onEdit(comment.id, editText);
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        <div className="w-12 h-12 relative flex-shrink-0">
          <Image
            src={comment.avatar}
            alt={comment.name}
            fill
            className="rounded-full object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-800">{comment.name}</p>
              {isOwner && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                  Wowe
                </span>
              )}
            </div>
            <span className="text-sm text-gray-400">{comment.date}</span>
          </div>

          {/* Comment text with edit functionality */}
          {isEditing ? (
            <div className="mt-2">
              <textarea
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                rows={3}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(comment.text);
                  }}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 mt-1">{comment.text}</p>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => onReply(comment.id)}
              className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
              Reply
            </button>

            {isOwner && !isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => onDelete(comment.id)}
                  className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </button>
              </>
            )}
          </div>

          {/* Reply form */}
          {replyingTo === comment.id && (
            <div className="mt-3 ml-8 bg-white p-3 rounded-lg border">
              <textarea
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                rows={2}
                placeholder="Andika igisubizo..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleReply(comment.id)}
                  className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
                >
                  Ohereza
                </button>
                <button
                  onClick={() => onReply(null)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Display replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="ml-8 mt-4 space-y-3">
              <p className="text-xs text-gray-400">
                {comment.replies.length} replies
              </p>
              {comment.replies.map((reply) => (
                <div
                  key={reply.id}
                  className="flex gap-3 bg-white p-3 rounded-lg"
                >
                  <div className="w-8 h-8 relative flex-shrink-0">
                    <Image
                      src="/avatar.png"
                      alt={reply.name}
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800 text-sm">
                        {reply.name}
                      </p>
                      {reply.name === currentUser && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                          Wowe
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {reply.date}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm mt-1">{reply.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comments;
