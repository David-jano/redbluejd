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
  FaNewspaper,
  FaCaretDown,
  FaBook,
  FaBible,
  FaFile,
  FaHistory,
  FaFlask,
  FaBookOpen,
  FaHeart,
  FaBrain,
  FaPalette,
  FaFilm,
  FaComment,
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

interface Article {
  id: number;
  title: string;
  author: string;
  label: string;
  image_url: string;
  description: string;
  content: string;
  created_at: string;
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

  // Articles list
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  // Fetch all data on mount
  useEffect(() => {
    fetchStats();
    fetchRecentComments();
    fetchArticles();
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
        `,
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

  const fetchArticles = async () => {
    setLoadingArticles(true);
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching articles:", error);
    } else {
      setArticles(data || []);
    }
    setLoadingArticles(false);
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
    >,
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
      let response;
      if (editingArticle) {
        // Update existing article
        response = await fetch(`/api/articles/${editingArticle.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
          headers: { "Content-Type": "application/json" },
        });
      } else {
        // Create new article
        response = await fetch("/api/articles", {
          method: "POST",
          body: JSON.stringify(formData),
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await response.json();

      if (!response.ok) {
        alert("Error: " + (result.error || "Unknown error"));
        return;
      }

      setSuccess(true);
      resetForm();
      fetchArticles();
      fetchStats();
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      alert("Network error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      description: article.description || "",
      author: article.author,
      label: article.label,
      imageUrl: article.image_url,
      content: article.content,
    });
    setPreviewImage(article.image_url);
  };

  const handleDeleteArticle = async (id: number) => {
    if (!confirm("Emeza kuvanaho iki gitekerezo?")) return;

    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      fetchArticles();
      fetchStats();
    } catch (error) {
      console.error("Error deleting article:", error);
      alert("Failed to delete article");
    }
  };

  const resetForm = () => {
    setEditingArticle(null);
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
  };

  const navigationItems = [
    // Main Content
    {
      name: "Main Article",
      href: "/admin",
      icon: <FaNewspaper className="text-gray-600" />,
    },
    {
      name: "Header Cards",
      href: "/admin/header-cards",
      icon: <FaBook className="text-gray-600" />,
    },
    {
      name: "Footer Cards",
      href: "/admin/cards",
      icon: <FaFile className="text-gray-600" />,
    },

    // History Section
    {
      name: "Amateka",
      href: "/admin/amateka",
      icon: <FaHistory className="text-gray-600" />,
    },

    // Science Section
    {
      name: "Siyansi",
      href: "/admin/siyanse",
      icon: <FaFlask className="text-gray-600" />,
    },

    // Books Section
    {
      name: "Ibitabo",
      href: "/admin/ibitabo",
      icon: <FaBookOpen className="text-gray-600" />,
    },

    // Health Section
    {
      name: "Ubuzima",
      href: "/admin/ubuzima",
      icon: <FaHeart className="text-gray-600" />,
    },

    // Psychology Section
    {
      name: "Ubumenyamuntu",
      href: "/admin/ubumenyamuntu",
      icon: <FaBrain className="text-gray-600" />,
    },

    // Arts Section
    {
      name: "Ubugeni",
      href: "/admin/ubugeni",
      icon: <FaPalette className="text-gray-600" />,
    },

    // Documentaries Section
    {
      name: "Ibyegeranyo",
      href: "/admin/ibyegeranyo",
      icon: <FaFilm className="text-gray-600" />,
    },

    // Philosophy Section
    {
      name: "Filozofiya",
      href: "/admin/philosophy",
      icon: <FaBible className="text-gray-600" />,
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
              <span className="text-sm text-gray-500">Welcome, RedBlue Jd</span>
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                JD
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

            {/* Main Content Group */}
            <div className="mb-4 mt-10">
              {" "}
              {/* Changed from mt-6 to mt-8 */}
              <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Core
              </h3>
              <nav className="space-y-1">
                {navigationItems.slice(0, 3).map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={
                        "flex items-center gap-4 px-3 py-3 text-sm font-medium rounded-lg transition-all"
                      }
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Educational Content Group */}
            <div className="mb-4">
              <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Educational
              </h3>
              <nav className="space-y-1">
                {navigationItems.slice(3, 6).map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-4 px-3 py-3 text-sm font-medium rounded-lg transition-all ${
                        isActive
                          ? "bg-orange-50 text-orange-600 border-l-4 border-orange-500"
                          : "text-gray-700 hover:bg-gray-50 hover:text-orange-600"
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Humanities Content Group */}
            <div className="mb-4">
              <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Humanities
              </h3>
              <nav className="space-y-1">
                {navigationItems.slice(6, 9).map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-4 px-3 py-3 text-sm font-medium rounded-lg transition-all ${
                        isActive
                          ? "bg-orange-50 text-orange-600 border-l-4 border-orange-500"
                          : "text-gray-700 hover:bg-gray-50 hover:text-orange-600"
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Media Content Group */}
            <div className="mb-4">
              <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Media
              </h3>
              <nav className="space-y-1">
                {navigationItems.slice(9).map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-4 px-3 py-3 text-sm font-medium rounded-lg transition-all ${
                        isActive
                          ? "bg-orange-50 text-orange-600 border-l-4 border-orange-500"
                          : "text-gray-700 hover:bg-gray-50 hover:text-orange-600"
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-6xl mx-auto">
            {/* Epic Breadcrumb Navigation */}
            <nav className="mb-8 mt-10">
              <ol
                className="flex items-center space-x-2 text-sm"
                aria-label="Breadcrumb"
              >
                <li>
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-orange-300 hover:text-orange-600 transition-all duration-200 group"
                  >
                    <FaHome
                      className="text-gray-400 group-hover:text-orange-500 transition-colors mr-2"
                      size={16}
                    />
                    <span className="font-medium text-gray-700 group-hover:text-orange-600">
                      Dashboard
                    </span>
                  </Link>
                </li>

                <li className="flex items-center">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </li>
                <li>
                  <div className="flex items-center gap-2 px-3 py-2 bg-linear-to-r from-orange-50 to-amber-50 ">
                    <span className="font-semibold text-black">
                      New Article
                    </span>
                    <span className="flex items-center justify-center w-5 h-5 bg-orange-200 text-orange-700 rounded-full text-xs font-bold">
                      1
                    </span>
                  </div>
                </li>
              </ol>

              {/* Optional: Page Title with Action Buttons */}
              <div className="flex justify-between items-center mt-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-1.5 h-8 bg-orange-500 rounded-full"></span>
                    Create New Article
                  </h1>
                  <p className="text-sm text-gray-500 mt-1 ml-3">
                    Fill in the details below to publish your article
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 text-sm text-gray-600">
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
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Quick Actions
                  </button>

                  <button className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all flex items-center gap-2 text-sm shadow-md hover:shadow-lg">
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
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Save Draft
                  </button>
                </div>
              </div>
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
                <div className="bg-gradient-to-br from-blue-600 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
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
                <div className="bg-gradient-to-br from-green-600 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
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
                <div className="bg-gradient-to-br from-purple-600 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
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
                <div className="bg-gradient-to-br from-amber-600 to-amber-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
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
                  {editingArticle ? (
                    <>
                      <FaEdit className="text-blue-500" /> Edit Article
                    </>
                  ) : (
                    <>
                      <FaPlus className="text-green-500" /> Add New Article
                    </>
                  )}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {editingArticle && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <FaTimes /> Cancel editing
                    </button>
                  </div>
                )}

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
                        onClick={resetForm}
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
                            <FaSpinner className="animate-spin" />{" "}
                            {editingArticle ? "Updating..." : "Publishing..."}
                          </>
                        ) : editingArticle ? (
                          "Update Article"
                        ) : (
                          "Publish Article"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Epic Articles List */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
              {/* Header with actions */}
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <FaBook className="text-black" size={16} />
                    </div>
                    <span>All Articles</span>
                    <span className="ml-2 px-5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {articles.length} total
                    </span>
                  </h2>

                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        />
                      </svg>
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {loadingArticles ? (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center gap-3">
                    <svg
                      className="animate-spin h-5 w-5 text-orange-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="text-gray-500">Loading articles...</span>
                  </div>
                </div>
              ) : articles.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="inline-flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-gray-400"
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
                    <h3 className="text-lg font-medium text-gray-900">
                      No articles yet
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Get started by creating your first article above.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            />
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                            Title
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
                                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                              />
                            </svg>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Author
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                            Date
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
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {articles.map((article, index) => (
                        <tr
                          key={article.id}
                          className="hover:bg-gray-50 transition-colors group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                {article.title.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 mb-0.5">
                                  {article.title.length > 40
                                    ? `${article.title.substring(0, 40)}...`
                                    : article.title}
                                </div>
                                <div className="text-xs text-gray-400">
                                  ID: {article.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                                {article.author.charAt(0)}
                              </div>
                              <span className="text-sm text-gray-700">
                                {article.author}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className="px-2.5 py-1 inline-flex text-xs leading-4 font-medium rounded-full"
                              style={{
                                backgroundColor:
                                  article.label === "Politiki"
                                    ? "#fee2e2"
                                    : article.label === "Uburezi"
                                      ? "#dbeafe"
                                      : article.label === "Ubukungu"
                                        ? "#dcfce7"
                                        : article.label === "Umuco"
                                          ? "#fef3c7"
                                          : article.label === "Imikino"
                                            ? "#e0e7ff"
                                            : "#f3e8ff",
                                color:
                                  article.label === "Politiki"
                                    ? "#991b1b"
                                    : article.label === "Uburezi"
                                      ? "#1e40af"
                                      : article.label === "Ubukungu"
                                        ? "#166534"
                                        : article.label === "Umuco"
                                          ? "#92400e"
                                          : article.label === "Imikino"
                                            ? "#3730a3"
                                            : "#6b21a5",
                              }}
                            >
                              {article.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <svg
                                className="w-4 h-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <span className="text-sm text-gray-600">
                                {new Date(
                                  article.created_at,
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="relative flex h-2.5 w-2.5 mr-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                              </span>
                              <span className="text-xs text-gray-500">
                                Published
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() =>
                                  window.open(
                                    `/articles/${article.id}`,
                                    "_blank",
                                  )
                                }
                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Preview"
                              >
                                <FaEye size={16} />
                              </button>
                              <button
                                onClick={() => handleEditArticle(article)}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteArticle(article.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete"
                              >
                                <FaTrash size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Table Footer with Pagination */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Showing <span className="font-medium">1</span> to{" "}
                        <span className="font-medium">{articles.length}</span>{" "}
                        of{" "}
                        <span className="font-medium">{articles.length}</span>{" "}
                        results
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled
                        >
                          Previous
                        </button>
                        <button className="px-3 py-1.5 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600">
                          1
                        </button>
                        <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                          2
                        </button>
                        <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                          3
                        </button>
                        <span className="px-2 text-gray-400">...</span>
                        <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                          8
                        </button>
                        <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Comments Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                  <FaComment className="text-black" /> Recent Comments
                </h2>
                <span className="text-sm text-gray-500">
                  Total: {commentCount}
                </span>
              </div>

              {recentComments.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No comments yet.
                </div>
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
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() =>
                                  window.open(
                                    `/comments/${comment.id}`,
                                    "_blank",
                                  )
                                }
                                className="text-gray-500 hover:text-indigo-900"
                                title="View"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-gray-500 hover:text-red-900"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
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
