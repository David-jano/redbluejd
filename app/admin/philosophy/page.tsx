"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  FaBrain,
  FaUser,
  FaCalendar,
  FaYoutube,
  FaFilePdf,
  FaDownload,
  FaSearch,
  FaLightbulb,
  FaGlobe,
  FaUsers,
  FaClock,
} from "react-icons/fa";

interface PhilosophyItem {
  id?: number;
  title: string;
  author: string | null;
  narrator: string | null;
  published_date: string;
  views: number;
  description: string;
  cover_image: string;
  branch: string;
  era:
    | "Ancient"
    | "Medieval"
    | "Modern"
    | "Contemporary"
    | "Enlightenment"
    | "Existential";
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
  philosophical_school: string | null;
  pdf_url: string | null;
}

export default function PhilosophyAdminPage() {
  const pathname = usePathname();
  const [items, setItems] = useState<PhilosophyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [editingItem, setEditingItem] = useState<PhilosophyItem | null>(null);
  const [formData, setFormData] = useState<PhilosophyItem>({
    title: "",
    author: "",
    narrator: "",
    published_date: new Date().toISOString().split("T")[0],
    views: 0,
    description: "",
    cover_image: "",
    branch: "Metaphysics",
    era: "Ancient",
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
    philosophical_school: "",
    pdf_url: "",
  });

  const [previewCover, setPreviewCover] = useState<string | null>(null);
  const [selectedPdfName, setSelectedPdfName] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Stats
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalDocumentaries: 0,
    totalBranches: 0,
    totalPhilosophers: 0,
  });

  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "book" | "documentary">(
    "all",
  );
  const [filterFeatured, setFilterFeatured] = useState<boolean | null>(null);
  const [filterBranch, setFilterBranch] = useState<string>("all");
  const [filterEra, setFilterEra] = useState<string>("all");

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [items]);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("philosophy_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching philosophy items:", error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const calculateStats = () => {
    const books = items.filter((i) => i.type === "book").length;
    const docs = items.filter((i) => i.type === "documentary").length;
    const branches = new Set(items.map((i) => i.branch)).size;
    const philosophers = new Set(
      items.map((i) => i.author || i.narrator).filter(Boolean),
    ).size;

    setStats({
      totalBooks: books,
      totalDocumentaries: docs,
      totalBranches: branches,
      totalPhilosophers: philosophers,
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
    const value = e.target.value === "" ? 0 : Number(e.target.value);
    setFormData({ ...formData, [e.target.name]: value });
  };

  // Cover image upload
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
    reader.onloadend = () => {
      setPreviewCover(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploadingCover(true);
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("bucket", "philosophy_covers");

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setFormData((prev) => ({ ...prev, cover_image: data.url }));
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Failed to upload image: " + error.message);
      setPreviewCover(null);
      if (coverInputRef.current) coverInputRef.current.value = "";
    } finally {
      setUploadingCover(false);
    }
  };

  // PDF upload
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
    uploadFormData.append("bucket", "philosophy_pdfs");

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setFormData((prev) => ({ ...prev, pdf_url: data.url }));
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
          .from("philosophy_items")
          .update(formData)
          .eq("id", editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("philosophy_items")
          .insert([formData]);
        if (error) throw error;
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

  const handleEdit = (item: PhilosophyItem) => {
    setEditingItem(item);
    setFormData(item);
    setPreviewCover(item.cover_image);
    setSelectedPdfName(item.pdf_url ? "PDF uploaded" : null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const { error } = await supabase
      .from("philosophy_items")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting item:", error);
      alert("Error deleting item");
    } else {
      fetchItems();
    }
  };

  const toggleFeatured = async (id: number, currentValue: boolean) => {
    const { error } = await supabase
      .from("philosophy_items")
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
      branch: "Metaphysics",
      era: "Ancient",
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
      philosophical_school: "",
      pdf_url: "",
    });
    setPreviewCover(null);
    setSelectedPdfName(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  // Filter items for display
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
    const matchesBranch =
      filterBranch === "all" || item.branch === filterBranch;
    const matchesEra = filterEra === "all" || item.era === filterEra;

    return (
      matchesSearch &&
      matchesType &&
      matchesFeatured &&
      matchesBranch &&
      matchesEra
    );
  });

  const branches: string[] = [
    "Metaphysics",
    "Ethics",
    "Epistemology",
    "Logic",
    "Political Philosophy",
    "Aesthetics",
    "Philosophy of Mind",
    "Philosophy of Science",
    "Existentialism",
    "Stoicism",
    "Eastern Philosophy",
    "Analytic Philosophy",
    "Continental Philosophy",
  ];

  const eras = [
    "Ancient",
    "Medieval",
    "Enlightenment",
    "Modern",
    "Contemporary",
    "Existential",
  ];

  const navigationItems = [
    { name: "Articles", href: "/admin", icon: "📄" },
    { name: "Header Cards", href: "/admin/header-cards", icon: "🎯" },
    { name: "Cards", href: "/admin/cards", icon: "📊" },
    { name: "History", href: "/admin/history", icon: "📚" },
    { name: "Science", href: "/admin/science", icon: "🔬" },
    { name: "Books", href: "/admin/books", icon: "📖" },
    { name: "Ubuzima", href: "/admin/ubuzima", icon: "❤️" },
    { name: "Ubumenyamuntu", href: "/admin/ubumenyamuntu", icon: "🧠" },
    { name: "Ubugeni", href: "/admin/ubugeni", icon: "🎨" },
    { name: "Ibyegeranyo", href: "/admin/ibyegeranyo", icon: "🎬" },
    { name: "Filozofiya", href: "/admin/filozofiya", icon: "🧠" },
  ];

  const getBranchIcon = (branch: string) => {
    switch (branch) {
      case "Metaphysics":
        return <FaBrain className="w-3 h-3" />;
      case "Ethics":
        return <FaBook className="w-3 h-3" />;
      case "Epistemology":
        return <FaLightbulb className="w-3 h-3" />;
      case "Logic":
        return <FaBrain className="w-3 h-3" />;
      case "Political Philosophy":
        return <FaUsers className="w-3 h-3" />;
      case "Aesthetics":
        return <FaEye className="w-3 h-3" />;
      case "Philosophy of Mind":
        return <FaBrain className="w-3 h-3" />;
      case "Existentialism":
        return <FaUser className="w-3 h-3" />;
      case "Stoicism":
        return <FaBrain className="w-3 h-3" />;
      case "Eastern Philosophy":
        return <FaGlobe className="w-3 h-3" />;
      default:
        return <FaBook className="w-3 h-3" />;
    }
  };

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
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                A
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
              <nav className="mt-10 text-sm text-gray-600 flex items-center gap-2">
                <Link
                  href="/admin"
                  className="hover:text-indigo-600 transition-colors"
                >
                  Dashboard
                </Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">
                  Filozofiya Management
                </span>
              </nav>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium">
                      Philosophical Texts
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {stats.totalBooks}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                    <FaBook className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-500 to-slate-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-100 text-sm font-medium">
                      Philosophical Studies
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {stats.totalDocumentaries}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                    <FaFilm className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">
                      Philosophical Branches
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {stats.totalBranches}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                    <FaBrain className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">
                      Philosophers
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {stats.totalPhilosophers}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                    <FaUser className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by title, author, or narrator..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Types</option>
                    <option value="book">Books Only</option>
                    <option value="documentary">Documentaries Only</option>
                  </select>

                  <select
                    value={filterBranch}
                    onChange={(e) => setFilterBranch(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Branches</option>
                    {branches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterEra}
                    onChange={(e) => setFilterEra(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Eras</option>
                    {eras.map((e) => (
                      <option key={e} value={e}>
                        {e}
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
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Items</option>
                    <option value="featured">Featured Only</option>
                    <option value="not">Not Featured</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                  {editingItem ? (
                    <>
                      <FaEdit className="text-blue-500" /> Edit Philosophy Item
                    </>
                  ) : (
                    <>
                      <FaPlus className="text-green-500" /> Add New Philosophy
                      Item
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
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="book">Book</option>
                      <option value="documentary">Documentary</option>
                    </select>
                  </div>

                  {/* Author / Narrator */}
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  {/* Published Date */}
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Branch */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Branch <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {branches.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Era */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Era <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="era"
                      value={formData.era}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {eras.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language
                    </label>
                    <input
                      name="language"
                      value={formData.language}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Philosophical School */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Philosophical School
                    </label>
                    <input
                      name="philosophical_school"
                      value={formData.philosophical_school || ""}
                      onChange={handleChange}
                      placeholder="e.g., Stoicism, Platonism, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Book-specific fields */}
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </>
                  )}

                  {/* Documentary-specific fields */}
                  {formData.type === "documentary" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration (e.g., 1h 30m)
                        </label>
                        <input
                          name="duration"
                          value={formData.duration || ""}
                          onChange={handleChange}
                          placeholder="1h 30m"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </>
                  )}

                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rating (0-5)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      name="rating"
                      value={formData.rating}
                      onChange={handleNumberChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Views (read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Views
                    </label>
                    <input
                      type="number"
                      value={formData.views}
                      disabled
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-500"
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="flex items-center gap-6 flex-wrap">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_featured"
                        checked={formData.is_featured}
                        onChange={handleChange}
                        className="w-4 h-4 text-indigo-500 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        Foundational (Featured)
                      </span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_new"
                        checked={formData.is_new}
                        onChange={handleChange}
                        className="w-4 h-4 text-indigo-500 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        Contemporary (New)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Description */}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 flex items-center gap-2"
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

                  {/* Cover Preview */}
                  {(previewCover || formData.cover_image) && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Preview:</p>
                      <div className="relative w-40 h-40 rounded-lg border border-gray-300 overflow-hidden bg-gray-100">
                        <Image
                          src={previewCover || formData.cover_image}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* PDF Upload (for books) */}
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
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 flex items-center gap-2"
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
                          className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          <FaEye /> View uploaded PDF
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Form Actions - Enhanced Visibility */}
                <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-200 mt-6">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 bg-white border-2 border-gray-400 rounded-xl text-sm font-semibold text-gray-800 hover:bg-gray-100 hover:border-gray-500 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <FaTimes className="w-4 h-4" />
                    Clear Form
                  </button>

                  <button
                    type="submit"
                    disabled={loading || uploadingCover || uploadingPdf}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:from-indigo-300 disabled:to-purple-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] min-w-[160px]"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin w-4 h-4" />
                        <span>Saving...</span>
                      </>
                    ) : editingItem ? (
                      <>
                        <FaEdit className="w-4 h-4" />
                        <span>Update Item</span>
                      </>
                    ) : (
                      <>
                        <FaPlus className="w-4 h-4" />
                        <span>Add New Item</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Philosophy Items Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <FaBrain className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-800">
                        Filozofiya Collection
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Manage all philosophy books and documentaries
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
                      <span className="text-xs font-medium text-indigo-700">
                         {stats.totalBooks} Books
                      </span>
                    </div>
                    <div className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-xs font-medium text-gray-700">
                        {stats.totalDocumentaries} Documentaries
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="p-16 text-center">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-gray-500 font-medium mt-4">
                    Loading philosophy items...
                  </p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="inline-flex flex-col items-center gap-4 max-w-sm">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                      <FaBrain className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">
                      No items found
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {searchQuery ||
                      filterBranch !== "all" ||
                      filterEra !== "all" ||
                      filterType !== "all"
                        ? "Try adjusting your filters to see more results"
                        : "Get started by adding your first philosophy item"}
                    </p>
                    {(searchQuery ||
                      filterBranch !== "all" ||
                      filterEra !== "all" ||
                      filterType !== "all") && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setFilterBranch("all");
                          setFilterEra("all");
                          setFilterType("all");
                          setFilterFeatured(null);
                        }}
                        className="mt-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Title & Author
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Branch
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Era
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Views
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Rating
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Featured
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredItems.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-indigo-50/30 transition-colors group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1.5 text-xs font-semibold rounded-full inline-flex items-center gap-1.5 ${
                                item.type === "book"
                                  ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                                  : "bg-gray-100 text-gray-800 border border-gray-200"
                              }`}
                            >
                              {item.type === "book" ? (
                                <>
                                  <FaBook className="w-3 h-3" />
                                  Book
                                </>
                              ) : (
                                <>
                                  <FaFilm className="w-3 h-3" />
                                  Documentary
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden shadow-sm ring-2 ring-gray-100 group-hover:ring-indigo-200 transition-all">
                                <Image
                                  src={item.cover_image}
                                  alt={item.title}
                                  fill
                                  className="object-cover"
                                />
                                {item.is_new && (
                                  <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-semibold text-gray-900">
                                    {item.title.length > 40
                                      ? `${item.title.substring(0, 40)}...`
                                      : item.title}
                                  </h3>
                                  {item.is_featured && (
                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">
                                      Foundational
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  <FaUser className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">
                                    {item.type === "book"
                                      ? item.author
                                      : item.narrator}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium border border-indigo-100 inline-flex items-center gap-1">
                              {getBranchIcon(item.branch)}
                              {item.branch}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-md text-xs font-medium ${
                                item.era === "Ancient"
                                  ? "bg-stone-100 text-stone-700 border border-stone-200"
                                  : item.era === "Medieval"
                                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                                    : item.era === "Enlightenment"
                                      ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                      : item.era === "Modern"
                                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                                        : item.era === "Contemporary"
                                          ? "bg-green-100 text-green-700 border border-green-200"
                                          : "bg-gray-100 text-gray-700 border border-gray-200"
                              }`}
                            >
                              {item.era}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.views.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium text-gray-900 mr-1">
                                {item.rating?.toFixed(1) || "0.0"}
                              </span>
                              <FaStar className="w-4 h-4 text-amber-400" />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() =>
                                toggleFeatured(item.id!, item.is_featured)
                              }
                              className={`p-2 rounded-lg transition-all ${
                                item.is_featured
                                  ? "text-amber-500 hover:bg-amber-100"
                                  : "text-gray-300 hover:text-amber-500 hover:bg-amber-50"
                              }`}
                              title={
                                item.is_featured
                                  ? "Remove from featured"
                                  : "Add to featured"
                              }
                            >
                              <FaStar size={18} />
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() =>
                                  window.open(
                                    `/filozofiya/${item.id}`,
                                    "_blank",
                                  )
                                }
                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Preview"
                              >
                                <FaEye size={16} />
                              </button>
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Edit"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id!)}
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
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
