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
  FaUser,
  FaMapMarkerAlt,
  FaClock,
  FaYoutube,
  FaSearch,
  FaTag,
  FaGlobe,
  FaHome,
  FaComment,
  FaThumbsUp,
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

export default function DocumentariesAdminPage() {
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

  const [stats, setStats] = useState({
    totalDocumentaries: 0,
    totalViews: 0,
    totalLocations: 0,
    totalHours: 0,
    totalLikes: 0,
    totalComments: 0,
  });

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
    try {
      const [itemsResult, commentsResult, likesResult] = await Promise.all([
        supabase
          .from("documentaries")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("content_comments")
          .select("content_id")
          .eq("content_type", "documentaries"),
        supabase
          .from("content_likes")
          .select("content_id")
          .eq("content_type", "documentaries"),
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
      console.error("Error fetching documentaries:", error);
      alert("Failed to load documentaries");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalDocs = items.length;
    const totalViews = items.reduce((acc, doc) => acc + (doc.views || 0), 0);
    const locations = new Set(items.map((doc) => doc.location)).size;
    const totalLikes = items.reduce((acc, i) => acc + (i.likes_count || 0), 0);
    const totalComments = items.reduce(
      (acc, i) => acc + (i.comment_count || 0),
      0,
    );

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
      totalLikes,
      totalComments,
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

      setFormData((prev) => ({ ...prev, thumbnail: data.url }));
      alert("Thumbnail uploaded successfully!");
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
        alert("Documentary updated successfully!");
      } else {
        const { error } = await supabase
          .from("documentaries")
          .insert([formData]);
        if (error) throw error;
        alert("Documentary created successfully!");
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
    setPreviewThumbnail(getValidImageUrl(item.thumbnail));
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
      alert("Documentary deleted successfully!");
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
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
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
                  className="hover:text-purple-600 transition-colors"
                >
                  Dashboard
                </Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">Ibyegeranyo</span>
              </nav>
            </div>

            {/* Stats Cards - 6 cards */}
            <div className="grid grid-cols-4 md:grid-cols-6 gap-4 mb-8">
              <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-600 uppercase font-medium">
                      Documentaries
                    </p>
                    <p className="text-2xl font-bold text-green-700">
                      {stats.totalDocumentaries}
                    </p>
                  </div>
                  <FaFilm className="w-5 h-5 text-green-400" />
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-600 uppercase font-medium">
                      Views
                    </p>
                    <p className="text-2xl font-bold text-blue-700">
                      {stats.totalViews.toLocaleString()}
                    </p>
                  </div>
                  <FaEye className="w-5 h-5 text-blue-400" />
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-purple-600 uppercase font-medium">
                      Locations
                    </p>
                    <p className="text-2xl font-bold text-purple-700">
                      {stats.totalLocations}
                    </p>
                  </div>
                  <FaGlobe className="w-5 h-5 text-purple-400" />
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-orange-600 uppercase font-medium">
                      Hours
                    </p>
                    <p className="text-2xl font-bold text-orange-700">
                      {stats.totalHours}
                    </p>
                  </div>
                  <FaClock className="w-5 h-5 text-orange-400" />
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-amber-600 uppercase font-medium">
                      Likes
                    </p>
                    <p className="text-2xl font-bold text-amber-700">
                      {stats.totalLikes.toLocaleString()}
                    </p>
                  </div>
                  <FaThumbsUp className="w-5 h-5 text-amber-400" />
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
                  <FaComment className="w-5 h-5 text-indigo-400" />
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
                    placeholder="Search by title or director..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-green-500"
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
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-green-500"
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Director <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="director"
                      value={formData.director}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500"
                    />
                  </div>

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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500"
                    />
                  </div>

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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500"
                    >
                      {locations.map((l) => (
                        <option key={l} value={l}>
                          {formatLocation(l)}
                        </option>
                      ))}
                    </select>
                  </div>

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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500"
                    />
                  </div>

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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium flex items-center gap-1"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500"
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
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 flex items-center gap-2"
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

                  {(previewThumbnail || formData.thumbnail) && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Preview:</p>
                      <div className="relative w-48 h-28 rounded-md border border-gray-300 overflow-hidden bg-gray-100">
                        <ClientImage
                          src={getValidImageUrl(
                            previewThumbnail || formData.thumbnail,
                          )}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>

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
                    disabled={loading || uploadingThumbnail}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 flex items-center gap-2"
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
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaFilm className="w-5 h-5 text-gray-500" />
                    <h2 className="font-medium text-gray-800">
                      Ibyegeranyo Collection
                    </h2>
                    <span className="text-xs text-gray-500">
                      Manage all documentaries
                    </span>
                  </div>
                  <div className="px-3 py-1 bg-green-50 rounded-md border border-green-100">
                    <span className="text-xs font-medium text-green-700">
                      {stats.totalDocumentaries} Documentaries
                    </span>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500 text-sm">
                      Loading documentaries...
                    </p>
                  </div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="inline-flex flex-col items-center gap-3">
                    <FaFilm className="w-12 h-12 text-gray-300" />
                    <h3 className="text-base font-medium text-gray-700">
                      No documentaries found
                    </h3>
                    <p className="text-gray-500 text-sm max-w-sm">
                      {searchQuery ||
                      filterLocation !== "all" ||
                      filterFeatured !== null
                        ? "Try adjusting your filters"
                        : "Add your first documentary using the form above"}
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
                          Thumbnail
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Title & Director
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Location
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Duration
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
                            <div className="relative w-16 h-12 rounded-md overflow-hidden shadow-sm bg-gray-100">
                              <ClientImage
                                src={getValidImageUrl(item.thumbnail)}
                                alt={item.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
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
                                {item.is_new && (
                                  <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
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
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                              <FaMapMarkerAlt className="w-3 h-3" />
                              {formatLocation(item.location)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs">
                              <FaClock className="w-3 h-3" />
                              {item.duration}
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
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() =>
                                  window.open(
                                    `/ibyegeranyo/${item.id}`,
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
                                className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
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
                        documentaries
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
