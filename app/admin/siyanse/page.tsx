"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import ClientImage from "@/app/componets/ClientImage";
import Link from "next/link";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaStar,
  FaUpload,
  FaSpinner,
  FaTimes,
  FaCheck,
  FaFilm,
  FaBook,
  FaGlobe,
  FaUser,
  FaFilePdf,
  FaSearch,
  FaAtom,
  FaBrain,
  FaMicrochip,
  FaFlask,
  FaRocket,
  FaDna,
  FaComment,
  FaHeartbeat,
  FaHome,
  FaThumbsUp,
} from "react-icons/fa";

interface ScienceItem {
  id?: number;
  title: string;
  author: string | null;
  narrator: string | null;
  published_date: string;
  views: number;
  description: string;
  cover_image: string;
  field: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string | null;
  youtube_url: string | null;
  pages: number | null;
  language: string;
  isbn: string | null;
  publisher: string | null;
  type: "book" | "documentary";
  is_featured: boolean;
  is_new: boolean;
  rating: number;
  pdf_url: string | null;
  comment_count?: number;
  likes_count?: number;
}

// Helper function for Vercel image paths
function getValidImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return "https://placehold.co/800x600/e0e0e0/999?text=No+Image";
  }

  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/images/")) {
    return imageUrl.replace("/images/", "/uploads/");
  }

  if (imageUrl.startsWith("/uploads/")) {
    return imageUrl;
  }

  return imageUrl;
}

export default function ScienceAdminPage() {
  const [items, setItems] = useState<ScienceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [editingItem, setEditingItem] = useState<ScienceItem | null>(null);
  const [formData, setFormData] = useState<ScienceItem>({
    title: "",
    author: "",
    narrator: "",
    published_date: new Date().toISOString().split("T")[0],
    views: 0,
    description: "",
    cover_image: "",
    field: "Physics",
    difficulty: "Beginner",
    duration: "",
    youtube_url: "",
    pages: null,
    language: "English",
    isbn: "",
    publisher: "",
    type: "book",
    is_featured: false,
    is_new: false,
    rating: 0,
    pdf_url: "",
  });

  const [previewCover, setPreviewCover] = useState<string | null>(null);
  const [selectedPdfName, setSelectedPdfName] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState({
    totalBooks: 0,
    totalDocumentaries: 0,
    totalFields: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "book" | "documentary">(
    "all",
  );
  const [filterFeatured, setFilterFeatured] = useState<boolean | null>(null);
  const [filterField, setFilterField] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [items]);

  // OPTIMIZED: Parallel fetching for items with counts
  const fetchItems = async () => {
    setLoading(true);
    try {
      const [itemsResult, commentsResult, likesResult] = await Promise.all([
        supabase
          .from("science_items")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("content_comments")
          .select("content_id")
          .eq("content_type", "science"),
        supabase
          .from("content_likes")
          .select("content_id")
          .eq("content_type", "science"),
      ]);

      if (itemsResult.error) throw itemsResult.error;

      const commentMap = new Map();
      if (commentsResult.data) {
        commentsResult.data.forEach((item: any) => {
          commentMap.set(
            item.content_id,
            (commentMap.get(item.content_id) || 0) + 1,
          );
        });
      }

      const likeMap = new Map();
      if (likesResult.data) {
        likesResult.data.forEach((item: any) => {
          likeMap.set(item.content_id, (likeMap.get(item.content_id) || 0) + 1);
        });
      }

      const itemsWithCounts = (itemsResult.data || []).map((item) => ({
        ...item,
        comment_count: commentMap.get(item.id) || 0,
        likes_count: likeMap.get(item.id) || 0,
      }));

      setItems(itemsWithCounts);
    } catch (error) {
      console.error("Error fetching science items:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const books = items.filter((i) => i.type === "book").length;
    const docs = items.filter((i) => i.type === "documentary").length;
    const fields = new Set(items.map((i) => i.field)).size;
    const views = items.reduce((acc, i) => acc + (i.views || 0), 0);
    const likes = items.reduce((acc, i) => acc + (i.likes_count || 0), 0);
    const comments = items.reduce((acc, i) => acc + (i.comment_count || 0), 0);

    setStats({
      totalBooks: books,
      totalDocumentaries: docs,
      totalFields: fields,
      totalViews: views,
      totalLikes: likes,
      totalComments: comments,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const value =
      e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? null : Number(e.target.value);
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    reader.onloadend = () => setPreviewCover(reader.result as string);
    reader.readAsDataURL(file);

    setUploadingCover(true);
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setFormData((prev) => ({ ...prev, cover_image: data.url }));
      alert("Image uploaded successfully!");
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Failed to upload image: " + error.message);
      setPreviewCover(null);
      if (coverInputRef.current) coverInputRef.current.value = "";
    } finally {
      setUploadingCover(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert("File too large. Maximum size is 50MB.");
      return;
    }

    setSelectedPdfName(file.name);
    setUploadingPdf(true);
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setFormData((prev) => ({ ...prev, pdf_url: data.url }));
      alert("PDF uploaded successfully!");
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Failed to upload PDF: " + error.message);
      setSelectedPdfName(null);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingItem?.id) {
        const { error } = await supabase
          .from("science_items")
          .update(formData)
          .eq("id", editingItem.id);
        if (error) throw error;
        alert("Item updated successfully!");
      } else {
        const { error } = await supabase
          .from("science_items")
          .insert([formData]);
        if (error) throw error;
        alert("Item created successfully!");
      }

      resetForm();
      fetchItems();
    } catch (error: any) {
      console.error("Error saving item:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: ScienceItem) => {
    setEditingItem(item);
    setFormData(item);
    setPreviewCover(getValidImageUrl(item.cover_image));
    setSelectedPdfName(item.pdf_url ? "PDF uploaded" : null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const { error } = await supabase
      .from("science_items")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting item:", error);
      alert("Error deleting item");
    } else {
      alert("Item deleted successfully!");
      fetchItems();
    }
  };

  const toggleFeatured = async (id: number, currentValue: boolean) => {
    const { error } = await supabase
      .from("science_items")
      .update({ is_featured: !currentValue })
      .eq("id", id);

    if (error) {
      console.error("Error toggling featured:", error);
      alert("Error updating featured status");
    } else {
      fetchItems();
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      author: "",
      narrator: "",
      published_date: new Date().toISOString().split("T")[0],
      views: 0,
      description: "",
      cover_image: "",
      field: "Physics",
      difficulty: "Beginner",
      duration: "",
      youtube_url: "",
      pages: null,
      language: "English",
      isbn: "",
      publisher: "",
      type: "book",
      is_featured: false,
      is_new: false,
      rating: 0,
      pdf_url: "",
    });
    setPreviewCover(null);
    setSelectedPdfName(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false ||
      item.narrator?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false;

    const matchesType = filterType === "all" || item.type === filterType;
    const matchesFeatured =
      filterFeatured === null || item.is_featured === filterFeatured;
    const matchesField = filterField === "all" || item.field === filterField;
    const matchesDifficulty =
      filterDifficulty === "all" || item.difficulty === filterDifficulty;

    return (
      matchesSearch &&
      matchesType &&
      matchesFeatured &&
      matchesField &&
      matchesDifficulty
    );
  });

  const fields: string[] = [
    "Physics",
    "Biology",
    "Chemistry",
    "Astronomy",
    "Neuroscience",
    "Computer Science",
    "Mathematics",
    "Quantum Mechanics",
    "Astrophysics",
    "Genetics",
    "Artificial Intelligence",
    "Climate Science",
    "Psychology",
    "Engineering",
    "Robotics",
    "Biotechnology",
  ];

  const difficulties = ["Beginner", "Intermediate", "Advanced"];

  const getFieldIcon = (field: string) => {
    const icons: Record<string, React.ReactNode> = {
      Physics: <FaAtom className="w-3 h-3" />,
      Biology: <FaDna className="w-3 h-3" />,
      Chemistry: <FaFlask className="w-3 h-3" />,
      Astronomy: <FaRocket className="w-3 h-3" />,
      Neuroscience: <FaBrain className="w-3 h-3" />,
      "Computer Science": <FaMicrochip className="w-3 h-3" />,
      "Artificial Intelligence": <FaBrain className="w-3 h-3" />,
      "Quantum Mechanics": <FaAtom className="w-3 h-3" />,
    };
    return icons[field] || <FaFlask className="w-3 h-3" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-800">
                Admin Dashboard
              </span>
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
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
              <nav className="mt-10 text-sm text-gray-600 flex items-center gap-2">
                <Link
                  href="/admin"
                  className="hover:text-orange-600 transition-colors"
                >
                  Dashboard
                </Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">Siyanse</span>
              </nav>
            </div>

            {/* Stats Cards - Colored but no gradients */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-600 uppercase font-medium">
                      Books
                    </p>
                    <p className="text-2xl font-bold text-blue-700">
                      {stats.totalBooks}
                    </p>
                  </div>
                  <FaBook className="w-8 h-8 text-blue-400" />
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-purple-600 uppercase font-medium">
                      Documentaries
                    </p>
                    <p className="text-2xl font-bold text-purple-700">
                      {stats.totalDocumentaries}
                    </p>
                  </div>
                  <FaFilm className="w-8 h-8 text-purple-400" />
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-amber-600 uppercase font-medium">
                      Views
                    </p>
                    <p className="text-2xl font-bold text-amber-700">
                      {stats.totalViews.toLocaleString()}
                    </p>
                  </div>
                  <FaEye className="w-8 h-8 text-amber-400" />
                </div>
              </div>

              <div className="bg-pink-50 rounded-lg border border-pink-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-pink-600 uppercase font-medium">
                      Likes
                    </p>
                    <p className="text-2xl font-bold text-pink-700">
                      {stats.totalLikes.toLocaleString()}
                    </p>
                  </div>
                  <FaThumbsUp className="w-5 h-5 text-pink-400" />
                </div>
              </div>

              <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-indigo-600 uppercase font-medium">
                      Comments
                    </p>
                    <p className="text-2xl font-bold text-indigo-700">
                      {stats.totalComments.toLocaleString()}
                    </p>
                  </div>
                  <FaComment className="w-8 h-8 text-indigo-400" />
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by title, author, or narrator..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="book">Books Only</option>
                    <option value="documentary">Documentaries Only</option>
                  </select>

                  <select
                    value={filterField}
                    onChange={(e) => setFilterField(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Fields</option>
                    {fields.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Difficulties</option>
                    {difficulties.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>

                  <select
                    value={
                      filterFeatured === null
                        ? "all"
                        : filterFeatured
                          ? "featured"
                          : "not"
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      setFilterFeatured(
                        val === "all" ? null : val === "featured",
                      );
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Items</option>
                    <option value="featured">Featured Only</option>
                    <option value="not">Not Featured</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <h2 className="font-medium text-gray-700 flex items-center gap-2">
                  {editingItem ? (
                    <>
                      <FaEdit className="text-blue-500" /> Edit Science Item
                    </>
                  ) : (
                    <>
                      <FaPlus className="text-green-500" /> Add New Science Item
                    </>
                  )}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {editingItem && (
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="book">Book</option>
                      <option value="documentary">Documentary</option>
                    </select>
                  </div>

                  {formData.type === "book" ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Author <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="author"
                        value={formData.author || ""}
                        onChange={handleChange}
                        required={formData.type === "book"}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Narrator <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="narrator"
                        value={formData.narrator || ""}
                        onChange={handleChange}
                        required={formData.type === "documentary"}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Published Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="published_date"
                      value={formData.published_date}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scientific Field <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="field"
                      value={formData.field}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                    >
                      {fields.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="difficulty"
                      value={formData.difficulty}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                    >
                      {difficulties.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language
                    </label>
                    <input
                      name="language"
                      value={formData.language}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {formData.type === "book" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pages
                        </label>
                        <input
                          type="number"
                          name="pages"
                          value={formData.pages || ""}
                          onChange={handleNumberChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ISBN
                        </label>
                        <input
                          name="isbn"
                          value={formData.isbn || ""}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Publisher
                        </label>
                        <input
                          name="publisher"
                          value={formData.publisher || ""}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}

                  {formData.type === "documentary" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration
                        </label>
                        <input
                          name="duration"
                          value={formData.duration || ""}
                          onChange={handleChange}
                          placeholder="2h 30m"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          YouTube URL
                        </label>
                        <input
                          name="youtube_url"
                          value={formData.youtube_url || ""}
                          onChange={handleChange}
                          placeholder="https://youtube.com/watch?v=..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_featured"
                        checked={formData.is_featured}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-500 rounded"
                      />
                      <span className="text-sm text-gray-700">Featured</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_new"
                        checked={formData.is_new}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-500 rounded"
                      />
                      <span className="text-sm text-gray-700">New</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Cover Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Image <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <input
                      type="file"
                      ref={coverInputRef}
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={uploadingCover}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 flex items-center gap-2"
                    >
                      {uploadingCover ? (
                        <>
                          <FaSpinner className="animate-spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          <FaUpload /> Choose Cover Image
                        </>
                      )}
                    </button>
                    {formData.cover_image && (
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <FaCheck /> Image ready
                      </span>
                    )}
                  </div>

                  {(previewCover || formData.cover_image) && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Preview:</p>
                      <div className="relative w-40 h-40 rounded-md border border-gray-300 overflow-hidden bg-gray-100">
                        <ClientImage
                          src={getValidImageUrl(
                            previewCover || formData.cover_image,
                          )}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* PDF Upload */}
                {formData.type === "book" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PDF File
                    </label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <input
                        type="file"
                        ref={pdfInputRef}
                        accept="application/pdf"
                        onChange={handlePdfUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => pdfInputRef.current?.click()}
                        disabled={uploadingPdf}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 flex items-center gap-2"
                      >
                        {uploadingPdf ? (
                          <>
                            <FaSpinner className="animate-spin" /> Uploading...
                          </>
                        ) : (
                          <>
                            <FaFilePdf /> Choose PDF
                          </>
                        )}
                      </button>
                      {selectedPdfName && (
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <FaCheck /> {selectedPdfName}
                        </span>
                      )}
                    </div>
                    {formData.pdf_url && (
                      <div className="mt-2">
                        <a
                          href={formData.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <FaEye /> View uploaded PDF
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FaTimes /> Clear
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploadingCover || uploadingPdf}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" /> Saving...
                      </>
                    ) : editingItem ? (
                      <>
                        <FaEdit /> Update Item
                      </>
                    ) : (
                      <>
                        <FaPlus /> Add Item
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Science Items Table - Clean & Professional */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaFlask className="w-5 h-5 text-gray-500" />
                    <h2 className="font-medium text-gray-800">
                      Science Collection
                    </h2>
                    <span className="text-xs text-gray-500">
                      Manage scientific books and documentaries
                    </span>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500 text-sm">Loading items...</p>
                  </div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="inline-flex flex-col items-center gap-3">
                    <FaFlask className="w-12 h-12 text-gray-300" />
                    <h3 className="text-base font-medium text-gray-700">
                      No items found
                    </h3>
                    <p className="text-gray-500 text-sm max-w-sm">
                      {searchQuery ||
                      filterField !== "all" ||
                      filterDifficulty !== "all" ||
                      filterType !== "all"
                        ? "Try adjusting your filters"
                        : "Add your first science item using the form above"}
                    </p>
                    {(searchQuery ||
                      filterField !== "all" ||
                      filterDifficulty !== "all" ||
                      filterType !== "all") && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setFilterField("all");
                          setFilterDifficulty("all");
                          setFilterType("all");
                          setFilterFeatured(null);
                        }}
                        className="mt-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Title & Details
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Field
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Difficulty
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Views
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Likes
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Comments
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Featured
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredItems.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md ${
                                item.type === "book"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-purple-50 text-purple-700"
                              }`}
                            >
                              {item.type === "book" ? "Book" : "Documentary"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                                <ClientImage
                                  src={getValidImageUrl(item.cover_image)}
                                  alt={item.title}
                                  fill
                                  className="object-cover"
                                />
                                {item.is_new && (
                                  <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full"></div>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-medium text-gray-900">
                                    {item.title.length > 40
                                      ? `${item.title.substring(0, 40)}...`
                                      : item.title}
                                  </h3>
                                  {item.is_featured && (
                                    <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                      Featured
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                  {item.type === "book" ? (
                                    <>
                                      <FaUser className="w-3 h-3" />
                                      <span>
                                        {item.author || "Unknown author"}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <FaFilm className="w-3 h-3" />
                                      <span>
                                        {item.narrator || "Unknown narrator"}
                                      </span>
                                    </>
                                  )}
                                  <span className="text-gray-300">•</span>
                                  <span>
                                    {new Date(
                                      item.published_date,
                                    ).getFullYear()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                              {getFieldIcon(item.field)}
                              {item.field}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-md ${
                                item.difficulty === "Beginner"
                                  ? "bg-green-50 text-green-700"
                                  : item.difficulty === "Intermediate"
                                    ? "bg-yellow-50 text-yellow-700"
                                    : "bg-red-50 text-red-700"
                              }`}
                            >
                              {item.difficulty}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {item.views.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {item.likes_count?.toLocaleString() || 0}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {item.comment_count?.toLocaleString() || 0}
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() =>
                                toggleFeatured(item.id!, item.is_featured)
                              }
                              className={`p-1.5 rounded-md transition-colors ${item.is_featured ? "text-amber-500 hover:bg-amber-50" : "text-gray-300 hover:text-amber-500 hover:bg-amber-50"}`}
                              title={
                                item.is_featured
                                  ? "Remove from featured"
                                  : "Add to featured"
                              }
                            >
                              <FaStar size={14} />
                            </button>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() =>
                                  window.open(`/science/${item.id}`, "_blank")
                                }
                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                title="View"
                              >
                                <FaEye size={14} />
                              </button>

                              <button
                                onClick={() => handleEdit(item)}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Edit"
                              >
                                <FaEdit size={14} />
                              </button>

                              <button
                                onClick={() => handleDelete(item.id!)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Delete"
                              >
                                <FaTrash size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Showing{" "}
                        <span className="font-medium">
                          {filteredItems.length}
                        </span>{" "}
                        of <span className="font-medium">{items.length}</span>{" "}
                        items
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
