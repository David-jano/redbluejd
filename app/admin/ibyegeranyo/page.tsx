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
  FaUser,
  FaMapMarkerAlt,
  FaClock,
  FaYoutube,
  FaSearch,
  FaTag,
  FaGlobe,
} from "react-icons/fa";

interface Documentary {
  id?: number;
  title: string;
  director: string;
  published_date: string;
  views: number;
  description: string;
  thumbnail: string;
  youtube_url: string;
  duration: string;
  location: string;
  tags: string[];
  is_featured: boolean;
  is_new: boolean;
}

export default function DocumentariesAdminPage() {
  const pathname = usePathname();
  const [items, setItems] = useState<Documentary[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [editingItem, setEditingItem] = useState<Documentary | null>(null);
  const [formData, setFormData] = useState<Documentary>({
    title: "",
    director: "",
    published_date: new Date().toISOString().split("T")[0],
    views: 0,
    description: "",
    thumbnail: "",
    youtube_url: "",
    duration: "",
    location: "africa",
    tags: [],
    is_featured: false,
    is_new: false,
  });

  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // Stats
  const [stats, setStats] = useState({
    totalDocumentaries: 0,
    totalViews: 0,
    totalLocations: 0,
    totalHours: 0,
  });

  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [filterFeatured, setFilterFeatured] = useState<boolean | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [items]);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("documentaries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching documentaries:", error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const calculateStats = () => {
    const totalDocs = items.length;
    const totalViews = items.reduce((acc, doc) => acc + (doc.views || 0), 0);
    const locations = new Set(items.map((doc) => doc.location)).size;

    // Calculate total hours from duration strings
    let totalMinutes = 0;
    items.forEach((doc) => {
      if (doc.duration) {
        if (doc.duration.includes(":")) {
          const [minutes, seconds] = doc.duration.split(":").map(Number);
          totalMinutes += minutes + seconds / 60;
        } else if (doc.duration.includes("h")) {
          const hours = parseFloat(doc.duration.split("h")[0]);
          totalMinutes += hours * 60;
        }
      }
    });

    setStats({
      totalDocumentaries: totalDocs,
      totalViews,
      totalLocations: locations,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
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

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tagToRemove),
    });
  };

  // Thumbnail upload
  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
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
      setPreviewThumbnail(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploadingThumbnail(true);
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("bucket", "documentary_thumbnails");

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setFormData((prev) => ({ ...prev, thumbnail: data.url }));
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Failed to upload thumbnail: " + error.message);
      setPreviewThumbnail(null);
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingItem?.id) {
        const { error } = await supabase
          .from("documentaries")
          .update(formData)
          .eq("id", editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("documentaries")
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

  const handleEdit = (item: Documentary) => {
    setEditingItem(item);
    setFormData(item);
    setPreviewThumbnail(item.thumbnail);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this documentary?")) return;

    const { error } = await supabase
      .from("documentaries")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting documentary:", error);
      alert("Error deleting documentary");
    } else {
      fetchItems();
    }
  };

  const toggleFeatured = async (id: number, currentValue: boolean) => {
    const { error } = await supabase
      .from("documentaries")
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
      director: "",
      published_date: new Date().toISOString().split("T")[0],
      views: 0,
      description: "",
      thumbnail: "",
      youtube_url: "",
      duration: "",
      location: "africa",
      tags: [],
      is_featured: false,
      is_new: false,
    });
    setPreviewThumbnail(null);
    setTagInput("");
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  };

  // Filter items for display
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.director.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation =
      filterLocation === "all" || item.location === filterLocation;
    const matchesFeatured =
      filterFeatured === null || item.is_featured === filterFeatured;

    return matchesSearch && matchesLocation && matchesFeatured;
  });

  const locations: string[] = [
    "africa",
    "asia",
    "europe",
    "north-america",
    "south-america",
    "australia",
    "antarctica",
    "middle-east",
    "global",
  ];

  const formatLocation = (location: string) => {
    return location
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

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
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
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
                  className="hover:text-green-600 transition-colors"
                >
                  Dashboard
                </Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">Ibyegeranyo</span>
              </nav>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">
                      Documentaries
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

              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">
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

              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">
                      Locations
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {stats.totalLocations}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                    <FaGlobe className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">
                      Hours of Content
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {stats.totalHours}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                    <FaClock className="w-6 h-6 text-white" />
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
                    placeholder="Search by title or director..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Locations</option>
                    {locations.map((l) => (
                      <option key={l} value={l}>
                        {formatLocation(l)}
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
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
                      <FaEdit className="text-blue-500" /> Edit Documentary
                    </>
                  ) : (
                    <>
                      <FaPlus className="text-green-500" /> Add New Documentary
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Director */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Director <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="director"
                      value={formData.director}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      placeholder="e.g., 18:04 or 1h 30m"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      {locations.map((l) => (
                        <option key={l} value={l}>
                          {formatLocation(l)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* YouTube URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      YouTube URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="youtube_url"
                      value={formData.youtube_url}
                      onChange={handleChange}
                      placeholder="https://youtube.com/watch?v=..."
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Views */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Views
                    </label>
                    <input
                      type="number"
                      name="views"
                      value={formData.views}
                      onChange={handleNumberChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
                        className="w-4 h-4 text-green-500 rounded"
                      />
                      <span className="text-sm text-gray-700">Featured</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_new"
                        checked={formData.is_new}
                        onChange={handleChange}
                        className="w-4 h-4 text-green-500 rounded"
                      />
                      <span className="text-sm text-gray-700">New</span>
                    </label>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addTag())
                      }
                      placeholder="Add a tag..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1"
                      >
                        <FaTag className="w-3 h-3" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-green-700 hover:text-green-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Thumbnail Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thumbnail <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <input
                      type="file"
                      ref={thumbnailInputRef}
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => thumbnailInputRef.current?.click()}
                      disabled={uploadingThumbnail}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 flex items-center gap-2"
                    >
                      {uploadingThumbnail ? (
                        <>
                          <FaSpinner className="animate-spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          <FaUpload /> Choose Thumbnail
                        </>
                      )}
                    </button>
                    {formData.thumbnail && (
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <FaCheck /> Thumbnail ready
                      </span>
                    )}
                  </div>

                  {/* Thumbnail Preview */}
                  {(previewThumbnail || formData.thumbnail) && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Preview:</p>
                      <div className="relative w-48 h-28 rounded-lg border border-gray-300 overflow-hidden bg-gray-100">
                        <Image
                          src={previewThumbnail || formData.thumbnail}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>

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
                    disabled={loading || uploadingThumbnail}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-green-300 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" /> Saving...
                      </>
                    ) : editingItem ? (
                      <>
                        <FaEdit /> Update Documentary
                      </>
                    ) : (
                      <>
                        <FaPlus /> Add Documentary
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Documentaries Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FaFilm className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-800">
                        Ibyegeranyo Collection
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Manage all documentaries
                      </p>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 bg-green-50 rounded-lg border border-green-100">
                    <span className="text-xs font-medium text-green-700">
                      🎬 {stats.totalDocumentaries} Documentaries
                    </span>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="p-16 text-center">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-gray-500 font-medium mt-4">
                    Loading documentaries...
                  </p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="inline-flex flex-col items-center gap-4 max-w-sm">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                      <FaFilm className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">
                      No documentaries found
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {searchQuery ||
                      filterLocation !== "all" ||
                      filterFeatured !== null
                        ? "Try adjusting your filters to see more results"
                        : "Get started by adding your first documentary"}
                    </p>
                    {(searchQuery ||
                      filterLocation !== "all" ||
                      filterFeatured !== null) && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setFilterLocation("all");
                          setFilterFeatured(null);
                        }}
                        className="mt-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
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
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Thumbnail
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Title & Director
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Views
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
                          className="hover:bg-green-50/30 transition-colors group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="relative w-16 h-12 rounded-lg overflow-hidden shadow-sm ring-2 ring-gray-100">
                              <Image
                                src={item.thumbnail}
                                alt={item.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-gray-900">
                                  {item.title.length > 40
                                    ? `${item.title.substring(0, 40)}...`
                                    : item.title}
                                </h3>
                                {item.is_featured && (
                                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">
                                    Featured
                                  </span>
                                )}
                                {item.is_new && (
                                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">
                                    New
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <FaUser className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {item.director}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-100 flex items-center gap-1 w-fit">
                              <FaMapMarkerAlt className="w-3 h-3" />
                              {formatLocation(item.location)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium border border-purple-100 flex items-center gap-1 w-fit">
                              <FaClock className="w-3 h-3" />
                              {item.duration}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.views.toLocaleString()}
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
                                    `/ibyegeranyo/${item.id}`,
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
                                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
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
