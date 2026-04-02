"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaTimes,
  FaUpload,
  FaCheck,
  FaSpinner,
} from "react-icons/fa";

interface Card {
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
}

export default function CardsManagement() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [formData, setFormData] = useState<Card>({
    title: "",
    description: "",
    author: "",
    label: "",
    image_url: "",
    content: "",
    button_text: "",
    card_type: "small",
    display_order: 0,
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    const { data, error } = await supabase
      .from("cards")
      .select("*")
      .order("card_type", { ascending: true })
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching cards:", error);
    } else {
      setCards(data || []);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Image upload handler
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

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setFormData((prev) => ({ ...prev, image_url: data.url }));
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
          .from("cards")
          .update(formData)
          .eq("id", editingCard.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cards")
          .insert([formData]);
        if (error) throw error;
      }

      resetForm();
      fetchCards();
    } catch (error: any) {
      console.error("Error saving card:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (card: Card) => {
    setEditingCard(card);
    setFormData(card);
    setPreviewImage(card.image_url);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this card?")) return;

    const { error } = await supabase
      .from("cards")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting card:", error);
      alert("Error deleting card");
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
    });
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation (optional, can be added if needed) */}
      <nav className="mb-6 text-sm text-gray-600 flex items-center gap-2">
        <Link href="/admin" className="hover:text-blue-600 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Cards</span>
      </nav>

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Cards Management</h1>
      <p className="text-gray-500 mb-8">Manage story cards displayed on the homepage.</p>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            {editingCard ? (
              <>
                <FaEdit className="text-blue-500" /> Edit Story
              </>
            ) : (
              <>
                <FaPlus className="text-green-500" /> Add New Story
              </>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
              <input
                name="button_text"
                value={formData.button_text}
                onChange={handleChange}
                placeholder="e.g., SOMA ICYEGERANYO"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Card Type</label>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input
                name="display_order"
                type="number"
                value={formData.display_order}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

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
                  <FaCheck /> Image ready
                </span>
              )}
            </div>

            {/* Preview */}
            {(previewImage || formData.image_url) && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Preview:</p>
                <div className="relative w-40 h-40 rounded-lg border border-gray-300 overflow-hidden bg-gray-100">
                  <Image
                    src={previewImage || formData.image_url}
                    alt="Preview"
                    fill
                    className="object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              </div>
            )}

            {/* URL fallback */}
            <div className="mt-3">
              <label className="block text-xs text-gray-500 mb-1">Or enter image URL directly:</label>
              <input
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

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
                  <FaEdit /> Update Story
                </>
              ) : (
                <>
                  <FaPlus /> Add Story
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Cards List - Epic Version */}
<div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
  {/* Table Header */}
  <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <div className="p-1.5 bg-emerald-100 rounded-lg">
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <span>Story Cards</span>
        <span className="ml-2 px-5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
          {cards.length} stories
        </span>
      </h2>
      
      <div className="flex items-center gap-2">
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>

  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-4 text-left">
            <div className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
            </div>
          </th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
              Type
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </div>
          </th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
              Order
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-5-5A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
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
        {cards.map((card, index) => (
          <tr 
            key={card.id} 
            className="hover:bg-gray-50 transition-colors group"
          >
            <td className="px-6 py-4 whitespace-nowrap">
              <input type="checkbox" className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  card.card_type === 'large' ? 'bg-purple-500' : 'bg-green-500'
                }`}></div>
                <span className={`px-5 py-1 inline-flex text-xs leading-4 font-medium rounded-full ${
                  card.card_type === 'large' 
                    ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                    : 'bg-green-100 text-green-800 border border-green-200'
                }`}>
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
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">First</span>
                )}
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {card.title.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 mb-0.5">
                    {card.title.length > 30 
                      ? `${card.title.substring(0, 30)}...` 
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
                <span className="text-sm text-gray-700">{card.author}</span>
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
                  onClick={() => window.open(`/cards/${card.id}`, '_blank')}
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
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">No story cards</h3>
                <p className="text-gray-500 text-sm">Get started by adding your first story card above.</p>
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  {/* Table Footer with Pagination */}
  {cards.length > 0 && (
    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">1</span> to{' '}
          <span className="font-medium">{cards.length}</span> of{' '}
          <span className="font-medium">{cards.length}</span> stories
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
            Previous
          </button>
          <button className="px-3 py-1.5 bg-emerald-500 text-white rounded-md text-sm font-medium hover:bg-emerald-600">
            1
          </button>
          <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
            2
          </button>
          <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
            3
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