"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import ClientImage from "@/app/componets/ClientImage";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaStar,
  FaRegStar,
  FaUpload,
  FaSpinner,
  FaTimes,
  FaCheck,
  FaVideo,
  FaYoutube,
  FaSearch,
  FaCalendar,
  FaFolder,
} from "react-icons/fa";

interface VideoItem {
  id?: string;
  title: string;
  description: string;
  video_url: string;
  youtube_url: string;
  thumbnail_url: string;
  category: string;
  published_date: string;
  is_featured: boolean;
  featured_order: number;
}

export default function VideoAdminPage() {
  const [items, setItems] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [editingItem, setEditingItem] = useState<VideoItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<VideoItem>({
    title: "",
    description: "",
    video_url: "",
    youtube_url: "",
    thumbnail_url: "",
    category: "Educational",
    published_date: new Date().toISOString().split("T")[0],
    is_featured: false,
    featured_order: 0,
  });

  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
  const [selectedVideoName, setSelectedVideoName] = useState<string | null>(
    null,
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterFeatured, setFilterFeatured] = useState<boolean | null>(null);

  const categories = [
    "Educational",
    "Documentary",
    "Entertainment",
    "News",
    "Interview",
    "Tutorial",
    "Review",
    "Music",
    "Sports",
    "Other",
  ];

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("published_date", { ascending: false });

    if (error) {
      console.error("Error fetching videos:", error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
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

  // ✅ CORRECT: Thumbnail upload with bucket="thumbnails"
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
    uploadFormData.append("bucket", "thumbnails"); // ✅ Correct bucket name

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setFormData((prev) => ({ ...prev, thumbnail_url: data.url }));
      alert("Thumbnail uploaded successfully!");
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Failed to upload thumbnail: " + error.message);
      setPreviewThumbnail(null);
    } finally {
      setUploadingThumbnail(false);
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
    }
  };

  // ✅ CORRECT: Video upload with bucket="videos"
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      alert("Please upload a video file.");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      alert("Video file too large. Maximum size is 100MB.");
      return;
    }

    setSelectedVideoName(file.name);
    setUploadingVideo(true);
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("bucket", "videos"); // ✅ Correct bucket name for videos

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setFormData((prev) => ({ ...prev, video_url: data.url }));
      alert("Preview video uploaded successfully!");
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Failed to upload video: " + error.message);
      setSelectedVideoName(null);
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const videoData = {
        title: formData.title,
        description: formData.description,
        video_url: formData.video_url,
        youtube_url: formData.youtube_url,
        thumbnail_url: formData.thumbnail_url,
        category: formData.category,
        published_date: formData.published_date,
        is_featured: formData.is_featured,
        featured_order: formData.is_featured ? formData.featured_order : 0,
        updated_at: new Date().toISOString(),
      };

      if (editingItem?.id) {
        const { error } = await supabase
          .from("videos")
          .update(videoData)
          .eq("id", editingItem.id);
        if (error) throw error;
        alert("Video updated successfully!");
      } else {
        const { error } = await supabase.from("videos").insert([videoData]);
        if (error) throw error;
        alert("Video created successfully!");
      }

      resetForm();
      fetchItems();
    } catch (error: any) {
      console.error("Error saving video:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: VideoItem) => {
    setEditingItem(item);
    setFormData(item);
    setPreviewThumbnail(item.thumbnail_url);
    setSelectedVideoName(item.video_url ? "Preview video uploaded" : null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Emeza kuvanaho iyi video?")) return;

    const { error } = await supabase.from("videos").delete().eq("id", id);

    if (error) {
      console.error("Error deleting video:", error);
      alert("Error deleting video");
    } else {
      alert("Video deleted successfully!");
      fetchItems();
    }
  };

  const toggleFeatured = async (id: string, currentValue: boolean) => {
    const { error } = await supabase
      .from("videos")
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
      description: "",
      video_url: "",
      youtube_url: "",
      thumbnail_url: "",
      category: "Educational",
      published_date: new Date().toISOString().split("T")[0],
      is_featured: false,
      featured_order: 0,
    });
    setPreviewThumbnail(null);
    setSelectedVideoName(null);
    setShowForm(false);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || item.category === filterCategory;
    const matchesFeatured =
      filterFeatured === null || item.is_featured === filterFeatured;
    return matchesSearch && matchesCategory && matchesFeatured;
  });

  const featuredCount = items.filter((i) => i.is_featured).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Video Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your video content - Featured videos: {featuredCount}/6
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
          >
            <FaPlus /> Add New Video
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
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
                setFilterFeatured(val === "all" ? null : val === "featured");
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Videos</option>
              <option value="featured">Featured Only</option>
              <option value="not">Not Featured</option>
            </select>
          </div>
        </div>

        {/* Videos Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-32 text-center">
              <FaSpinner className="animate-spin text-4xl text-orange-500 mx-auto" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-16 text-center">
              <FaVideo className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                No videos found
              </h3>
              <p className="text-gray-500">
                Click "Add New Video" to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Thumbnail
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Published Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Featured
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="relative w-24 h-14 rounded overflow-hidden bg-gray-100">
                          {item.thumbnail_url ? (
                            <ClientImage
                              src={item.thumbnail_url}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                              <FaVideo className="text-white" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {item.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {item.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(item.published_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            toggleFeatured(item.id!, item.is_featured)
                          }
                          className={`p-1 rounded-md transition-colors ${
                            item.is_featured
                              ? "text-amber-500"
                              : "text-gray-300 hover:text-amber-500"
                          }`}
                        >
                          {item.is_featured ? (
                            <FaStar size={18} />
                          ) : (
                            <FaRegStar size={18} />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id!)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
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
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  {editingItem ? "Edit Video" : "Add New Video"}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Published Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Published Date
                    </label>
                    <input
                      type="date"
                      name="published_date"
                      value={formData.published_date}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Featured Checkbox */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={formData.is_featured}
                      onChange={handleChange}
                      className="w-4 h-4 text-orange-500 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Feature this video (max 6 featured videos total)
                    </span>
                  </label>
                  {formData.is_featured && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Featured Order (1-6)
                      </label>
                      <input
                        type="number"
                        name="featured_order"
                        value={formData.featured_order}
                        onChange={handleChange}
                        min="1"
                        max="6"
                        className="w-24 px-3 py-1 border border-gray-300 rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Preview Video Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview Video (MP4, WebM, MOV)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      ref={videoInputRef}
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={uploadingVideo}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                    >
                      {uploadingVideo ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaUpload />
                      )}
                      Upload Preview Video
                    </button>
                    {selectedVideoName && (
                      <span className="text-sm text-green-600">
                        ✓ {selectedVideoName}
                      </span>
                    )}
                  </div>
                  {formData.video_url && (
                    <div className="mt-2">
                      <video
                        src={formData.video_url}
                        className="w-48 h-32 object-cover rounded"
                        controls
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Short preview video (10-30 seconds) that plays on hover
                  </p>
                </div>

                {/* YouTube URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    YouTube URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="youtube_url"
                    value={formData.youtube_url}
                    onChange={handleChange}
                    required
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Thumbnail Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thumbnail Image (Optional)
                  </label>
                  <div className="flex items-center gap-4">
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
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                    >
                      {uploadingThumbnail ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaUpload />
                      )}
                      Upload Thumbnail
                    </button>
                    {formData.thumbnail_url && (
                      <span className="text-sm text-green-600">
                        ✓ Thumbnail ready
                      </span>
                    )}
                  </div>
                  {previewThumbnail && (
                    <div className="mt-2 relative w-32 h-20">
                      <ClientImage
                        src={previewThumbnail}
                        alt="Thumbnail preview"
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploadingVideo || uploadingThumbnail}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <FaSpinner className="animate-spin" />
                    ) : editingItem ? (
                      <FaEdit />
                    ) : (
                      <FaPlus />
                    )}
                    {loading ? "Saving..." : editingItem ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
