"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import ClientImage from "@/app/componets/ClientImage";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaStar,
  FaStarHalf,
  FaUpload,
  FaSpinner,
  FaTimes,
  FaCheck,
  FaFilm,
  FaBook,
  FaGlobe,
  FaCalendar,
  FaUser,
  FaYoutube,
  FaFilePdf,
  FaDownload,
  FaSearch,
  FaFilter,
  FaSort,
} from "react-icons/fa";

interface HistoryItem {
  id?: number;
  title: string;
  author: string | null;
  narrator: string | null;
  published_date: string;
  views: number;
  description: string;
  cover_image: string;
  period: string;
  region: string;
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

export default function HistoryAdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [editingItem, setEditingItem] = useState<HistoryItem | null>(null);
  const [formData, setFormData] = useState<HistoryItem>({
    title: "",
    author: "",
    narrator: "",
    published_date: new Date().toISOString().split("T")[0],
    views: 0,
    description: "",
    cover_image: "",
    period: "Ancient",
    region: "Global",
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
    totalRegions: 0,
    totalViews: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "book" | "documentary">(
    "all",
  );
  const [filterFeatured, setFilterFeatured] = useState<boolean | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [items]);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("history_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching history items:", error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const calculateStats = () => {
    const books = items.filter((i) => i.type === "book").length;
    const docs = items.filter((i) => i.type === "documentary").length;
    const regions = new Set(items.map((i) => i.region)).size;
    const views = items.reduce((acc, i) => acc + (i.views || 0), 0);

    setStats({
      totalBooks: books,
      totalDocumentaries: docs,
      totalRegions: regions,
      totalViews: views,
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
    reader.onloadend = () => {
      setPreviewCover(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploadingCover(true);
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("bucket", "history_covers");

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
    uploadFormData.append("bucket", "history_pdfs");

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
          .from("history_items")
          .update(formData)
          .eq("id", editingItem.id);
        if (error) throw error;
        alert("Item updated successfully!");
      } else {
        const { error } = await supabase
          .from("history_items")
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

  const handleEdit = (item: HistoryItem) => {
    setEditingItem(item);
    setFormData(item);
    setPreviewCover(getValidImageUrl(item.cover_image));
    setSelectedPdfName(item.pdf_url ? "PDF uploaded" : null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const { error } = await supabase
      .from("history_items")
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
      .from("history_items")
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
      period: "Ancient",
      region: "Global",
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
    const matchesPeriod =
      filterPeriod === "all" || item.period === filterPeriod;
    const matchesRegion =
      filterRegion === "all" || item.region === filterRegion;

    return (
      matchesSearch &&
      matchesType &&
      matchesFeatured &&
      matchesPeriod &&
      matchesRegion
    );
  });

  const periods: string[] = [
    "Ancient",
    "Medieval",
    "Renaissance",
    "Modern",
    "World Wars",
    "Cold War",
    "Contemporary",
    "Prehistoric",
  ];

  const regions: string[] = [
    "Global",
    "Europe",
    "Asia",
    "Africa",
    "Americas",
    "Middle East",
    "Oceania",
    "Ancient Civilizations",
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
        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
              <nav className="mt-6 text-sm text-gray-600 flex items-center gap-2">
                <Link
                  href="/admin"
                  className="hover:text-orange-600 transition-colors"
                >
                  Dashboard
                </Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">Amateka</span>
              </nav>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm font-medium">
                      Ibitabo by'Amateka
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

              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">
                      Amasaha ya Dokumentari
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

              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">
                      Imico n'Umuco Bikubiyemo
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {stats.totalRegions}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                    <FaGlobe className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">
                      Total Views
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {stats.totalViews.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                    <FaEye className="w-6 h-6 text-white" />
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Types</option>
                    <option value="book">Books Only</option>
                    <option value="documentary">Documentaries Only</option>
                  </select>

                  <select
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Periods</option>
                    {periods.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterRegion}
                    onChange={(e) => setFilterRegion(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Regions</option>
                    {regions.map((r) => (
                      <option key={r} value={r}>
                        {r}
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
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                      <FaEdit className="text-blue-500" /> Edit History Item
                    </>
                  ) : (
                    <>
                      <FaPlus className="text-green-500" /> Add New History Item
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Period */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Period <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="period"
                      value={formData.period}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      {periods.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Region */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Region <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      {regions.map((r) => (
                        <option key={r} value={r}>
                          {r}
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </>
                  )}

                  {/* Documentary-specific fields */}
                  {formData.type === "documentary" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration (e.g., 2h 30m)
                        </label>
                        <input
                          name="duration"
                          value={formData.duration || ""}
                          onChange={handleChange}
                          placeholder="2h 30m"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </>
                  )}

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
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_featured"
                        checked={formData.is_featured}
                        onChange={handleChange}
                        className="w-4 h-4 text-orange-500 rounded"
                      />
                      <span className="text-sm text-gray-700">Featured</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_new"
                        checked={formData.is_new}
                        onChange={handleChange}
                        className="w-4 h-4 text-orange-500 rounded"
                      />
                      <span className="text-sm text-gray-700">New</span>
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 flex items-center gap-2"
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

                  {/* Cover Preview with ClientImage */}
                  {(previewCover || formData.cover_image) && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Preview:</p>
                      <div className="relative w-40 h-40 rounded-lg border border-gray-300 overflow-hidden bg-gray-100">
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
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 flex items-center gap-2"
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

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FaTimes /> Clear
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploadingCover || uploadingPdf}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-orange-300 flex items-center gap-2"
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

            {/* History Items Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {loading ? (
                <div className="p-32 text-center">
                  <div className="inline-flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                      <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-gray-500 font-medium">
                      Loading history items...
                    </p>
                  </div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="inline-flex flex-col items-center gap-4 max-w-sm">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                      <FaBook className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">
                      No items found
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {searchQuery ||
                      filterPeriod !== "all" ||
                      filterRegion !== "all" ||
                      filterType !== "all"
                        ? "Try adjusting your filters to see more results"
                        : "Get started by adding your first historical item"}
                    </p>
                    {(searchQuery ||
                      filterPeriod !== "all" ||
                      filterRegion !== "all" ||
                      filterType !== "all") && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setFilterPeriod("all");
                          setFilterRegion("all");
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
                  {/* History Items Table - Clean & Human Friendly */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {/* Table Header */}
                    <div className="px-12 py-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FaBook className="w-5 h-5 text-gray-500" />
                          <div>
                            <h2 className="font-medium text-gray-800">
                              History Collection
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Manage historical books and documentaries
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-gray-100 rounded-md">
                            <span className="text-xs text-gray-600">
                              {stats.totalBooks} Books
                            </span>
                          </div>
                          <div className="px-3 py-1 bg-gray-100 rounded-md">
                            <span className="text-xs text-gray-600">
                              {stats.totalDocumentaries} Documentaries
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {loading ? (
                      <div className="p-12 text-center">
                        <div className="inline-flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                          <p className="text-gray-500 text-sm">
                            Loading items...
                          </p>
                        </div>
                      </div>
                    ) : filteredItems.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="inline-flex flex-col items-center gap-3">
                          <FaBook className="w-12 h-12 text-gray-300" />
                          <h3 className="text-base font-medium text-gray-700">
                            No items found
                          </h3>
                          <p className="text-gray-500 text-sm max-w-sm">
                            {searchQuery ||
                            filterPeriod !== "all" ||
                            filterRegion !== "all" ||
                            filterType !== "all"
                              ? "Try adjusting your filters"
                              : "Add your first historical item using the form above"}
                          </p>
                          {(searchQuery ||
                            filterPeriod !== "all" ||
                            filterRegion !== "all" ||
                            filterType !== "all") && (
                            <button
                              onClick={() => {
                                setSearchQuery("");
                                setFilterPeriod("all");
                                setFilterRegion("all");
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
                      <>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Title & Details
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Period
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Region
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Views
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Featured
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                                  {/* Type */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                                        item.type === "book"
                                          ? "bg-amber-50 text-amber-700"
                                          : "bg-blue-50 text-blue-700"
                                      }`}
                                    >
                                      {item.type === "book"
                                        ? "Book"
                                        : "Documentary"}
                                    </span>
                                  </td>

                                  {/* Title & Details */}
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="relative w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                        <ClientImage
                                          src={getValidImageUrl(
                                            item.cover_image,
                                          )}
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
                                                {item.author ||
                                                  "Unknown author"}
                                              </span>
                                            </>
                                          ) : (
                                            <>
                                              <FaFilm className="w-3 h-3" />
                                              <span>
                                                {item.narrator ||
                                                  "Unknown narrator"}
                                              </span>
                                            </>
                                          )}
                                          <span className="text-gray-300">
                                            •
                                          </span>
                                          <span>
                                            {new Date(
                                              item.published_date,
                                            ).getFullYear()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Period */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm text-gray-600">
                                      {item.period}
                                    </span>
                                  </td>

                                  {/* Region */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm text-gray-600">
                                      {item.region}
                                    </span>
                                  </td>

                                  {/* Views */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-1">
                                      <FaEye className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm text-gray-700">
                                        {item.views.toLocaleString()}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Featured Toggle */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                      onClick={() =>
                                        toggleFeatured(
                                          item.id!,
                                          item.is_featured,
                                        )
                                      }
                                      className={`p-1.5 rounded-md transition-colors ${
                                        item.is_featured
                                          ? "text-amber-500 hover:bg-amber-50"
                                          : "text-gray-300 hover:text-amber-500 hover:bg-amber-50"
                                      }`}
                                      title={
                                        item.is_featured
                                          ? "Remove from featured"
                                          : "Add to featured"
                                      }
                                    >
                                      <FaStar size={16} />
                                    </button>
                                  </td>

                                  {/* Actions */}
                                  <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        onClick={() =>
                                          window.open(
                                            `/history/${item.id}`,
                                            "_blank",
                                          )
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
                        </div>

                        {/* Table Footer */}
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              Showing{" "}
                              <span className="font-medium">
                                {filteredItems.length}
                              </span>{" "}
                              of{" "}
                              <span className="font-medium">
                                {items.length}
                              </span>{" "}
                              items
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
                                disabled
                              >
                                Previous
                              </button>
                              <button className="px-3 py-1 text-sm text-white bg-gray-700 border border-gray-700 rounded-md hover:bg-gray-800">
                                1
                              </button>
                              <button className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100">
                                Next
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
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
