"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import ClientImage from "@/app/componets/ClientImage";
import Link from "next/link";
import {
  FaStar,
  FaEdit,
  FaTrash,
  FaEye,
  FaPlus,
  FaTimes,
  FaUpload,
  FaCheck,
  FaExclamationTriangle,
  FaSpinner,
  FaHome,
} from "react-icons/fa";

interface HeaderCard {
  id?: number;
  title: string;
  description: string;
  author: string;
  label: string;
  image_url: string;
  content: string;
  button_text: string;
  card_type: "large" | "small";
  display_order: number;
  is_featured: boolean;
}

// Helper function for Vercel image paths
function getValidImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return "https://placehold.co/800x600/e0e0e0/999?text=No+Image";
  }
  
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  if (imageUrl.startsWith('/images/')) {
    return imageUrl.replace('/images/', '/uploads/');
  }
  
  if (imageUrl.startsWith('/uploads/')) {
    return imageUrl;
  }
  
  return imageUrl;
}

export default function HeaderCardsManagement() {
  const [cards, setCards] = useState<HeaderCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingCard, setEditingCard] = useState<HeaderCard | null>(null);
  const [formData, setFormData] = useState<HeaderCard>({
    title: "",
    description: "",
    author: "",
    label: "",
    image_url: "",
    content: "",
    button_text: "",
    card_type: "small",
    display_order: 0,
    is_featured: false,
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    const { data, error } = await supabase
      .from("header_cards")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching header cards:", error);
    } else {
      setCards(data || []);
    }
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

      setFormData((prev) => ({ ...prev, image_url: data.url }));
      alert("Image uploaded successfully!");
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

    try {
      if (editingCard?.id) {
        const { error } = await supabase
          .from("header_cards")
          .update(formData)
          .eq("id", editingCard.id);
        if (error) throw error;
        alert("Card updated successfully!");
      } else {
        const { error } = await supabase
          .from("header_cards")
          .insert([formData]);
        if (error) throw error;
        alert("Card created successfully!");
      }

      resetForm();
      fetchCards();
    } catch (error: any) {
      console.error("Error saving header card:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (card: HeaderCard) => {
    setEditingCard(card);
    setFormData(card);
    setPreviewImage(getValidImageUrl(card.image_url));
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this header card?")) return;

    const { error } = await supabase.from("header_cards").delete().eq("id", id);

    if (error) {
      console.error("Error deleting header card:", error);
      alert("Error deleting header card");
    } else {
      alert("Card deleted successfully!");
      fetchCards();
    }
  };

  const toggleFeatured = async (id: number, currentValue: boolean) => {
    const { error } = await supabase
      .from("header_cards")
      .update({ is_featured: !currentValue })
      .eq("id", id);

    if (error) {
      console.error("Error toggling featured:", error);
      alert("Error updating featured status");
    } else {
      fetchCards();
    }
  };

  const resetForm = () => {
    setEditingCard(null);
    setFormData({
      title: "",
      description: "",
      author: "",
      label: "",
      image_url: "",
      content: "",
      button_text: "",
      card_type: "small",
      display_order: 0,
      is_featured: false,
    });
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6 text-sm text-gray-600 flex items-center gap-2 overflow-hidden whitespace-nowrap">
        <Link
          href="/admin"
          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
        >
          <span><FaHome className="text-blue-500" /></span> Dashboard
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Header Cards</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Header Cards Management
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage large and small cards displayed in the header section.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">
            {editingCard ? (
              <span className="flex items-center gap-2">
                <FaEdit className="text-blue-500" /> Edit Header Card
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FaPlus className="text-green-500" /> Add New Header Card
              </span>
            )}
          </h2>
          {editingCard && (
            <button
              onClick={resetForm}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <FaTimes /> Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Label */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Label <span className="text-red-500">*</span>
              </label>
              <input
                name="label"
                value={formData.label}
                onChange={handleChange}
                required
                placeholder="e.g., Scandal, History"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Author <span className="text-red-500">*</span>
              </label>
              <input
                name="author"
                value={formData.author}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Button Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Button Text
              </label>
              <input
                name="button_text"
                value={formData.button_text}
                onChange={handleChange}
                placeholder="e.g., SOMA ICYEGERANYO"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Card Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Type
              </label>
              <select
                name="card_type"
                value={formData.card_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="small">Small Card</option>
                <option value="large">Large Card</option>
              </select>
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                name="display_order"
                type="number"
                value={formData.display_order}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Featured Checkbox */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="is_featured"
                id="is_featured"
                checked={formData.is_featured}
                onChange={handleChange}
                className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label
                htmlFor="is_featured"
                className="text-sm font-medium text-gray-700 flex items-center gap-1"
              >
                <FaStar className="text-black" /> Show on homepage (featured)
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center gap-2"
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
              {formData.image_url && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <FaCheck /> Image uploaded
                </span>
              )}
            </div>

            {/* Preview with ClientImage */}
            {(previewImage || formData.image_url) && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Preview:</p>
                <div className="relative w-40 h-40 rounded-lg border border-gray-300 overflow-hidden bg-gray-100">
                  <ClientImage
                    src={getValidImageUrl(previewImage || formData.image_url)}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            {/* URL fallback */}
            <div className="mt-3">
              <label className="block text-xs text-gray-500 mb-1">
                Or enter image URL directly:
              </label>
              <input
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Story Content <span className="text-red-500">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            {editingCard && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <FaTimes /> Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" /> Saving...
                </>
              ) : editingCard ? (
                <>
                  <FaEdit /> Update Card
                </>
              ) : (
                <>
                  <FaPlus /> Add Card
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Header Cards Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <FaStar className="text-black" size={16} />
              </div>
              <span>All Header Cards</span>
              <span className="ml-2 px-8 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                {cards.length} cards
              </span>
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Featured
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Label
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cards.map((card) => (
                <tr
                  key={card.id}
                  className={`hover:bg-gray-50 transition-colors group ${
                    card.is_featured ? "bg-amber-50/50" : ""
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleFeatured(card.id!, card.is_featured)}
                      className={`p-1.5 rounded-lg transition-all ${
                        card.is_featured
                          ? "text-amber-500 hover:bg-amber-100"
                          : "text-gray-300 hover:text-amber-500 hover:bg-amber-50"
                      }`}
                      title={
                        card.is_featured
                          ? "Remove from featured"
                          : "Add to featured"
                      }
                    >
                      <FaStar size={18} />
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          card.card_type === "large"
                            ? "bg-purple-500"
                            : "bg-green-500"
                        }`}
                      ></div>
                      <span
                        className={`px-5 py-1 inline-flex text-xs leading-4 font-medium rounded-full ${
                          card.card_type === "large"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {card.card_type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-1 bg-gray-100 rounded-md text-sm font-mono text-gray-700">
                        #{card.display_order}
                      </span>
                      {card.display_order === 1 && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                          Top
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm">
                        {card.title.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 mb-0.5">
                          {card.title.length > 25
                            ? `${card.title.substring(0, 25)}...`
                            : card.title}
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: {card.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                        {card.author.charAt(0)}
                      </div>
                      <span className="text-sm text-gray-700">
                        {card.author}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-5 py-1 inline-flex text-xs leading-4 font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {card.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() =>
                          window.open(
                            `/preview/header-card/${card.id}`,
                            "_blank",
                          )
                        }
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Preview"
                      >
                        <FaEye size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(card)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit"
                      >
                        <FaEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(card.id!)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {cards.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="inline-flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <FaStar className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">
                        No header cards
                      </h3>
                      <p className="text-gray-500 text-sm">
                        Get started by adding your first header card above.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {cards.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium">1</span> to{" "}
                <span className="font-medium">{cards.length}</span> of{" "}
                <span className="font-medium">{cards.length}</span> cards
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled
                >
                  Previous
                </button>
                <button className="px-3 py-1.5 bg-purple-500 text-white rounded-md text-sm font-medium hover:bg-purple-600">
                  1
                </button>
                <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}