"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaTimes,
  FaUpload,
  FaCheck,
  FaSpinner,
  FaStar,
  FaHome,
} from "react-icons/fa";

// Types
interface Comment {
  id: number;
  name: string;
  avatar: string;
  date: string;
  text: string;
  created_at: string;
  replies_count?: number;
}

export default function AdminDashboard() {
  // Article form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    author: "",
    label: "",
    imageUrl: "",
    content: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  // Stats and comments
  const [articleCount, setArticleCount] = useState<number>(0);
  const [commentCount, setCommentCount] = useState<number>(0);
  const [recentComments, setRecentComments] = useState<Comment[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
    fetchRecentComments();
  }, []);

  const fetchStats = async () => {
    try {
      const { count: articles, error: articlesError } = await supabase
        .from("articles")
        .select("*", { count: "exact", head: true });

      if (articlesError) throw articlesError;

      const { count: comments, error: commentsError } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true });

      if (commentsError) throw commentsError;

      setArticleCount(articles || 0);
      setCommentCount(comments || 0);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchRecentComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(
          `
          *,
          replies:replies(count)
        `
        )
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const commentsWithCount = data.map((c: any) => ({
        ...c,
        replies_count: c.replies?.[0]?.count || 0,
      }));

      setRecentComments(commentsWithCount);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleDeleteComment = async (id: number) => {
    if (!confirm("Emeza kuvanaho iki gitekerezo?")) return;

    try {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) throw error;

      fetchRecentComments();
      fetchStats();
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Maximum size is 5MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Server returned: ${text.substring(0, 100)}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setFormData((prev) => ({ ...prev, imageUrl: data.url }));
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Failed to upload image: " + error.message);
      setPreviewImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (!response.ok) {
        alert("Error: " + (result.error || "Unknown error"));
        return;
      }

      setSuccess(true);
      setFormData({
        title: "",
        description: "",
        author: "",
        label: "",
        imageUrl: "",
        content: "",
      });
      setPreviewImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      fetchStats();
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      alert("Network error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const navigationItems = [
    {
      name: "New Article",
      href: "/admin",
      icon: <FaStar className="text-amber-400" />,
    },
    {
      name: "Header Cards",
      href: "/admin/header-cards",
      icon: <FaEye className="text-blue-500" />,
    },
    {
      name: "Cards",
      href: "/admin/cards",
      icon: <FaEdit className="text-green-500" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-gray-800">
                  Admin Dashboard
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome, Admin</span>
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                A
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 fixed h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-4">
            <div className="mb-6 px-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Management
              </h2>
            </div>
            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all ${
                      isActive
                        ? "bg-orange-50 text-orange-600 border-l-4 border-orange-500"
                        : "text-gray-700 hover:bg-gray-50 hover:text-orange-600"
                    }`}
                  >
                    <span className="mr-3 text-xl">{item.icon}</span>
                    <div>
                      <p className="font-medium">{item.name}</p>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb */}
            <nav className="mb-6 text-sm text-gray-600 flex items-center gap-2">
              <Link
                href="/admin"
                className="flex items-center gap-1 hover:text-orange-600 transition-colors"
              >
                <FaHome /> Dashboard
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">New Article</span>
            </nav>

            {/* Stats Cards */}
            {loadingStats ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse h-24"
                  ></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Total Articles */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">
                        Total Articles
                      </p>
                      <p className="text-3xl font-bold mt-1">{articleCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-3 text-blue-100 text-sm flex items-center">
                    <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    +12 this week
                  </div>
                </div>

                {/* Total Comments */}
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium">
                        Total Comments
                      </p>
                      <p className="text-3xl font-bold mt-1">{commentCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-3 text-emerald-100 text-sm flex items-center">
                    <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                    5 pending moderation
                  </div>
                </div>

                {/* New Today */}
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">
                        New Today
                      </p>
                      <p className="text-3xl font-bold mt-1">12</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-3 text-purple-100 text-sm flex items-center">
                    <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    +8 from yesterday
                  </div>
                </div>

                {/* Pending Reviews */}
                <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-sm font-medium">
                        Pending Reviews
                      </p>
                      <p className="text-3xl font-bold mt-1">3</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-3 text-amber-100 text-sm flex items-center">
                    <span className="inline-block w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                    Requires attention
                  </div>
                </div>
              </div>
            )}

            {/* Article Form Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                  <FaPlus className="text-green-500" /> Add New Article
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="title"
                      placeholder="Enter article title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="description"
                      placeholder="Brief description of the article"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                    />
                  </div>

                  {/* Author and Category Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Author <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="author"
                        placeholder="Author name"
                        value={formData.author}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="label"
                        value={formData.label}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition bg-white"
                      >
                        <option value="">Select category</option>
                        <option value="Politiki">Politiki</option>
                        <option value="Uburezi">Uburezi</option>
                        <option value="Ubukungu">Ubukungu</option>
                        <option value="Umuco">Umuco</option>
                        <option value="Imikino">Imikino</option>
                        <option value="Technology">Technology</option>
                      </select>
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Featured Image <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {uploading ? (
                          <>
                            <FaSpinner className="animate-spin" /> Uploading...
                          </>
                        ) : (
                          <>
                            <FaUpload /> Choose Image
                          </>
                        )}
                      </button>
                      {formData.imageUrl && (
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <FaCheck /> Image uploaded
                        </span>
                      )}
                    </div>

                    {/* Image Preview */}
                    {(previewImage || formData.imageUrl) && (
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-2">Preview:</p>
                        <div className="relative w-40 h-40 rounded-lg border border-gray-200 overflow-hidden bg-gray-100">
                          <Image
                            src={previewImage || formData.imageUrl}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {/* URL Input (fallback) */}
                    <div className="mt-3">
                      <label className="block text-xs text-gray-500 mb-1">
                        Or enter image URL directly:
                      </label>
                      <input
                        name="imageUrl"
                        placeholder="https://example.com/image.jpg"
                        value={formData.imageUrl}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-sm"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Article Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="content"
                      placeholder="Write your article content here..."
                      value={formData.content}
                      onChange={handleChange}
                      required
                      rows={8}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition resize-y"
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div>
                      {success && (
                        <div className="flex items-center text-green-600 text-sm">
                          <svg
                            className="w-5 h-5 mr-2"
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
                          Article published successfully
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            title: "",
                            description: "",
                            author: "",
                            label: "",
                            imageUrl: "",
                            content: "",
                          });
                          setPreviewImage(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <FaTimes /> Clear
                      </button>
                      <button
                        type="submit"
                        disabled={loading || uploading}
                        className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:bg-orange-300 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <FaSpinner className="animate-spin" /> Publishing...
                          </>
                        ) : (
                          "Publish Article"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Recent Comments Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                  <FaEye className="text-blue-500" /> Recent Comments
                </h2>
                <span className="text-sm text-gray-500">Total: {commentCount}</span>
              </div>

              {recentComments.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No comments yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Author
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Comment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Replies
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentComments.map((comment) => (
                        <tr key={comment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 relative rounded-full overflow-hidden bg-gray-200">
                                <Image
                                  src={comment.avatar}
                                  alt={comment.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-800">
                                {comment.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {comment.text}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {comment.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {comment.replies_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => window.open(`/comments/${comment.id}`, '_blank')}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                              title="View"
                            >
                              <FaEye />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* View All Link */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-right">
                <Link
                  href="/admin/comments"
                  className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                >
                  View All Comments →
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}