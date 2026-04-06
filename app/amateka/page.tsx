"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { FaThumbsUp, FaComment } from "react-icons/fa";
import ContentCommentsModal from "../componets/ContentCommentsModal";
import CardLikeButton from "../componets/CardLikeButton";
import {
  Search,
  Eye,
  User,
  Calendar,
  Globe,
  Clock,
  Film,
  BookOpen,
  Play,
  Download,
  Bookmark,
  Share2,
  ChevronDown,
  Grid,
  List,
  ExternalLink,
  Loader2,
} from "lucide-react";

import ClientImage from "../componets/ClientImage";
interface HistoryItem {
  id: number;
  title: string;
  author?: string | null;
  narrator?: string | null;
  published_date: string;
  views: number;
  description: string;
  cover_image: string;
  period: string;
  region: string;
  duration?: string | null;
  youtube_url?: string | null;
  pages?: number | null;
  language: string;
  isbn?: string | null;
  publisher?: string | null;
  type: "book" | "documentary";
  is_featured?: boolean;
  is_new?: boolean;
  rating?: number;
  pdf_url?: string | null;
  comment_count?: number;
  like_count?: number;
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

const SimplePDFViewer = ({
  item,
  onClose,
  onViewTracked,
}: {
  item: HistoryItem;
  onClose: () => void;
  onViewTracked?: () => void;
}) => {
  const pdfUrl = item.pdf_url || "";

  useEffect(() => {
    if (onViewTracked) {
      onViewTracked();
    }
  }, [onViewTracked]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="bg-white border-b border-stone-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-lg font-bold">{item.title}</h2>
        </div>
        {pdfUrl && (
          <a
            href={pdfUrl}
            download
            className="p-2 hover:bg-stone-100 rounded-full flex items-center gap-2 text-stone-700 hover:text-stone-900"
            title="Download PDF"
          >
            <Download className="w-5 h-5" />
            <span className="text-sm hidden sm:inline">Download</span>
          </a>
        )}
      </div>
      <div className="flex-1 bg-stone-100">
        {pdfUrl ? (
          <iframe src={pdfUrl} className="w-full h-full" title={item.title} />
        ) : (
          <div className="flex items-center justify-center h-full text-stone-500">
            PDF not available
          </div>
        )}
      </div>
    </div>
  );
};

export default function HistoryPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedType, setSelectedType] = useState<"all" | "book" | "documentary">("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [activeTab, setActiveTab] = useState<"books" | "documentaries">("books");
  const [selectedPDF, setSelectedPDF] = useState<HistoryItem | null>(null);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedCommentItem, setSelectedCommentItem] = useState<HistoryItem | null>(null);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalDocumentaries: 0,
    totalRegions: 0,
    totalViews: 0,
  });

  const periods: string[] = [
    "all", "Ancient", "Medieval", "Renaissance", "Modern",
    "World Wars", "Cold War", "Contemporary", "Prehistoric",
  ];

  const regions: string[] = [
    "all", "Global", "Europe", "Asia", "Africa", "Americas",
    "Middle East", "Oceania", "Ancient Civilizations",
  ];

  useEffect(() => {
    fetchItems();
  }, []);

  // OPTIMIZED: Parallel fetching for items, comments, and likes
  const fetchItems = async () => {
    setLoading(true);
    try {
      // Run all queries in parallel
      const [itemsResult, commentsResult, likesResult] = await Promise.all([
        supabase
          .from("history_items")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("content_comments")
          .select("content_id")
          .eq("content_type", "history"),
        supabase
          .from("content_likes")
          .select("content_id")
          .eq("content_type", "history")
      ]);

      if (itemsResult.error) throw itemsResult.error;

      // Create maps for counts
      const commentMap = new Map();
      if (commentsResult.data) {
        commentsResult.data.forEach((item: any) => {
          commentMap.set(item.content_id, (commentMap.get(item.content_id) || 0) + 1);
        });
      }

      const likeMap = new Map();
      if (likesResult.data) {
        likesResult.data.forEach((item: any) => {
          likeMap.set(item.content_id, (likeMap.get(item.content_id) || 0) + 1);
        });
      }

      // Merge counts with items
      const itemsWithCounts = (itemsResult.data || []).map((item) => ({
        ...item,
        comment_count: commentMap.get(item.id) || 0,
        like_count: likeMap.get(item.id) || 0,
      }));

      setItems(itemsWithCounts);
      calculateStats(itemsWithCounts);
    } catch (error) {
      console.error("Error fetching history items:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: HistoryItem[]) => {
    const books = data.filter((i) => i.type === "book").length;
    const docs = data.filter((i) => i.type === "documentary").length;
    const regions = new Set(data.map((i) => i.region)).size;
    const views = data.reduce((acc, i) => acc + (i.views || 0), 0);

    setStats({
      totalBooks: books,
      totalDocumentaries: docs,
      totalRegions: regions,
      totalViews: views,
    });
  };

  const trackView = async (item: HistoryItem) => {
    try {
      const newViews = (item.views || 0) + 1;
      const { error } = await supabase
        .from("history_items")
        .update({ views: newViews })
        .eq("id", item.id);

      if (error) throw error;

      setItems((prevItems) =>
        prevItems.map((i) => i.id === item.id ? { ...i, views: newViews } : i)
      );

      setStats((prev) => ({
        ...prev,
        totalViews: prev.totalViews + 1,
      }));
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  };

  const getFilteredItems = () => {
    let filtered = items.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.narrator?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false;

      const matchesPeriod = selectedPeriod === "all" || item.period === selectedPeriod;
      const matchesRegion = selectedRegion === "all" || item.region === selectedRegion;
      const matchesType = selectedType === "all" || item.type === selectedType;

      return matchesSearch && matchesPeriod && matchesRegion && matchesType;
    });

    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.published_date).getTime() - new Date(a.published_date).getTime();
        case "oldest":
          return new Date(a.published_date).getTime() - new Date(b.published_date).getTime();
        case "views":
          return (b.views || 0) - (a.views || 0);
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredItems = getFilteredItems();
  const books = filteredItems.filter((item) => item.type === "book");
  const documentaries = filteredItems.filter((item) => item.type === "documentary");
  const activeItems = activeTab === "books" ? books : documentaries;

  const handleItemClick = async (item: HistoryItem) => {
    await trackView(item);
    if (item.type === "book" && item.pdf_url) {
      setSelectedPDF(item);
    } else {
      setSelectedItem(item);
    }
  };

  const handlePlay = async (item: HistoryItem) => {
    await trackView(item);
    if (item.type === "documentary" && item.youtube_url) {
      window.open(item.youtube_url, "_blank");
    }
  };

  const handleDownload = (item: HistoryItem) => {
    if (item.type === "book" && item.pdf_url) {
      window.open(item.pdf_url, "_blank");
    }
  };

  const handleRead = async (item: HistoryItem) => {
    await trackView(item);
    if (item.pdf_url) {
      setSelectedPDF(item);
    }
  };

  const handlePDFViewTracked = async () => {
    if (selectedPDF) {
      await trackView(selectedPDF);
    }
  };

  const handleOpenComments = (item: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCommentItem(item);
    setCommentsModalOpen(true);
  };

  const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 shadow-sm border border-gray-200">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-stone-600">Loading Amateka collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-amber-600 via-red-600 to-stone-800 rounded-2xl flex items-center justify-center shadow-2xl">
                <Globe className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-stone-900 via-amber-800 to-red-700 mb-4">
            AMATEKA
          </h1>
          <p className="text-l text-gray-600 max-w-3xl mx-auto">
            Menya Umwaduko w'ubuzima bwa muntu binyuze mu bikorwa by'amateka
            n'inyandiko-mashusho z'umwimerere.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={BookOpen} label="Ibitabo by'Amateka" value={stats.totalBooks.toString()} />
          <StatCard icon={Film} label="Dokumanteri" value={stats.totalDocumentaries.toString()} />
          <StatCard icon={Globe} label="Imico n'Umuco" value={stats.totalRegions.toString()} />
          <StatCard icon={Eye} label="Total Views" value={stats.totalViews.toLocaleString()} />
        </div>

        {/* Search & Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-stone-200">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="shaka amateka, umwanditsi, cyangwa umusomyi...."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white/50"
              />
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="appearance-none bg-white border border-stone-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="all">Byose</option>
                  <option value="book">Ibitabo gusa</option>
                  <option value="documentary">Ibyegeranyo gusa</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="appearance-none bg-white border border-stone-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-amber-500"
                >
                  {periods.map((period) => (
                    <option key={period} value={period}>
                      {period === "all" ? "Ibihe byose" : period}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="appearance-none bg-white border border-stone-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-amber-500"
                >
                  {regions.map((region) => (
                    <option key={region} value={region}>
                      {region === "all" ? "Kwisi hose" : region}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-stone-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="newest">Ibishya mbere</option>
                  <option value="oldest">Ibishaje mbere</option>
                  <option value="views">Ibyarebwe cyane</option>
                  <option value="title">Kuva A-Z</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="flex bg-stone-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid" ? "bg-white shadow-sm text-amber-600" : "text-stone-500"
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "list" ? "bg-white shadow-sm text-amber-600" : "text-stone-500"
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="mb-8">
          <div className="border-b border-stone-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("books")}
                className={`py-3 px-1 border-b-2 font-medium text-lg transition-colors flex items-center gap-2 ${
                  activeTab === "books"
                    ? "border-amber-600 text-amber-600"
                    : "border-transparent text-stone-500 hover:text-stone-700"
                }`}
              >
                <BookOpen className="w-5 h-5" />
                Ibitabo
                <span className="bg-stone-100 text-stone-700 text-sm font-normal px-2 py-1 rounded-full">
                  {books.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("documentaries")}
                className={`py-3 px-1 border-b-2 font-medium text-lg transition-colors flex items-center gap-2 ${
                  activeTab === "documentaries"
                    ? "border-amber-600 text-amber-600"
                    : "border-transparent text-stone-500 hover:text-stone-700"
                }`}
              >
                <Film className="w-5 h-5" />
                Ibyegeranyo
                <span className="bg-stone-100 text-stone-700 text-sm font-normal px-2 py-1 rounded-full">
                  {documentaries.length}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Content Grid */}
        {activeItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-stone-400" />
            </div>
            <h3 className="text-2xl font-bold text-stone-900 mb-2">No historical content found</h3>
            <p className="text-stone-600">Try adjusting your search or filters to explore our collection</p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-6"}>
            {activeItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer overflow-hidden border border-stone-200 ${
                  viewMode === "list" ? "flex" : "h-full flex flex-col"
                }`}
                onClick={() => handleItemClick(item)}
              >
                {/* Cover Image */}
                <div className={`relative overflow-hidden bg-gradient-to-br from-stone-100 to-amber-100 ${viewMode === "list" ? "w-40 flex-shrink-0" : "h-48"}`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10" />
                  <div className="relative w-full h-full">
                    <ClientImage
                      src={getValidImageUrl(item.cover_image)}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes={viewMode === "list" ? "160px" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"}
                    />
                  </div>

                  <div className="absolute top-3 left-3 z-20">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${
                      item.type === "book" ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-blue-500 to-purple-500"
                    }`}>
                      {item.type === "book" ? "Book" : "Documentary"}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 z-20 space-y-2">
                    {item.is_featured && (
                      <span className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">Featured</span>
                    )}
                    {item.is_new && (
                      <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">New</span>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30">
                    <div className="flex gap-3">
                      {item.type === "documentary" ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePlay(item); }}
                          className="bg-red-600 text-white p-4 rounded-full hover:bg-red-700 transition-all transform hover:scale-110"
                        >
                          <Play className="w-6 h-6" fill="white" />
                        </button>
                      ) : item.pdf_url && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRead(item); }}
                          className="bg-green-600 text-white p-4 rounded-full hover:bg-green-700 transition-all transform hover:scale-110"
                        >
                          <BookOpen className="w-6 h-6" />
                        </button>
                      )}
                      {item.type === "book" && item.pdf_url && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
                          className="bg-blue-600 text-white p-4 rounded-full hover:bg-blue-700 transition-all transform hover:scale-110"
                        >
                          <Download className="w-6 h-6" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content Info */}
                <div className={`p-4 flex-1 flex flex-col ${viewMode === "list" ? "flex-1" : ""}`}>
                  <div className="mb-3 flex-1">
                    <h3 className="font-bold text-lg text-stone-900 line-clamp-2 mb-2 group-hover:text-amber-700 transition-colors">
                      {item.title}
                    </h3>

                    <div className="mb-3">
                      <div className="flex items-center text-stone-600 mb-2">
                        {item.type === "book" ? (
                          <>
                            <User className="w-4 h-4 mr-1 flex-shrink-0" />
                            <span className="text-sm font-medium truncate">{item.author || "Unknown"}</span>
                          </>
                        ) : (
                          <>
                            <Film className="w-4 h-4 mr-1 flex-shrink-0" />
                            <span className="text-sm font-medium truncate">{item.narrator || "Unknown"}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{item.views?.toLocaleString() || 0}</span>
                        </div>

                        <CardLikeButton
                          contentId={item.id}
                          contentType="science"
                          initialCount={item.like_count || 0}
                          onLikeChange={(newCount) => {
                            setItems((prevItems) =>
                              prevItems.map((i) => i.id === item.id ? { ...i, like_count: newCount } : i)
                            );
                          }}
                        />

                        <button onClick={(e) => handleOpenComments(item, e)} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                          <FaComment className="w-4 h-4" />
                          <span>{item.comment_count || 0}</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-stone-600 text-sm line-clamp-2 mb-3">{item.description}</p>
                  </div>

                  <div className="pt-3 border-t border-stone-100">
                    <div className="flex items-center justify-between text-sm text-stone-500 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(item.published_date).getFullYear()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <span>{item.region}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="bg-stone-100 text-stone-700 text-xs px-2 py-1 rounded-full">{item.period}</span>
                        {item.type === "book" && item.pages && (
                          <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">{item.pages}p</span>
                        )}
                        {item.type === "documentary" && item.duration && (
                          <span className="flex items-center gap-1 bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full">
                            <Clock className="w-3 h-3" />
                            {item.duration}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 hover:bg-stone-100 rounded-full" onClick={(e) => e.stopPropagation()}>
                          <Bookmark className="w-4 h-4 text-stone-400 hover:text-stone-600" />
                        </button>
                        <button className="p-1 hover:bg-stone-100 rounded-full" onClick={(e) => e.stopPropagation()}>
                          <Share2 className="w-4 h-4 text-stone-400 hover:text-stone-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-2/5 p-8 bg-gradient-to-br from-stone-50 to-amber-50">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
                    <ClientImage
                      src={getValidImageUrl(selectedItem.cover_image)}
                      alt={selectedItem.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-4 left-4">
                      <span className={`px-4 py-2 rounded-full text-sm font-bold text-white shadow-lg ${
                        selectedItem.type === "book" ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-blue-500 to-purple-500"
                      }`}>
                        {selectedItem.type === "book" ? "Historical Book" : "Documentary Film"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lg:w-3/5 p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-stone-900 mb-2">{selectedItem.title}</h2>
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex items-center text-stone-600">
                          {selectedItem.type === "book" ? (
                            <>
                              <User className="w-5 h-5 mr-2" />
                              <span className="text-lg font-medium">{selectedItem.author || "Unknown"}</span>
                            </>
                          ) : (
                            <>
                              <Film className="w-5 h-5 mr-2" />
                              <span className="text-lg font-medium">{selectedItem.narrator || "Unknown"}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center text-stone-500">
                          <Eye className="w-5 h-5 mr-2" />
                          <span>{selectedItem.views?.toLocaleString() || 0} views</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setSelectedItem(null)} className="text-stone-400 hover:text-stone-600 text-2xl p-2 hover:bg-stone-100 rounded-full">
                      ×
                    </button>
                  </div>

                  <div className="space-y-6">
                    <p className="text-stone-700 leading-relaxed text-lg">{selectedItem.description}</p>

                    <div className="grid grid-cols-2 gap-4 py-4 bg-stone-50 rounded-xl p-4">
                      <div>
                        <span className="text-sm text-stone-500">Historical Period</span>
                        <p className="font-bold text-lg text-stone-800">{selectedItem.period}</p>
                      </div>
                      <div>
                        <span className="text-sm text-stone-500">Region</span>
                        <p className="font-bold text-lg text-stone-800">{selectedItem.region}</p>
                      </div>
                      <div>
                        <span className="text-sm text-stone-500">Published</span>
                        <p className="font-medium">{new Date(selectedItem.published_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                      </div>
                      <div>
                        <span className="text-sm text-stone-500">{selectedItem.type === "book" ? "Pages" : "Duration"}</span>
                        <p className="font-medium">{selectedItem.type === "book" ? `${selectedItem.pages || 0} pages` : selectedItem.duration || "N/A"}</p>
                      </div>
                    </div>

                    <div className="flex space-x-4 pt-6">
                      {selectedItem?.type === "documentary" ? (
                        selectedItem?.youtube_url && (
                          <button
                            onClick={() => { window.open(selectedItem.youtube_url!, "_blank"); setSelectedItem(null); }}
                            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all flex items-center justify-center gap-3 shadow-lg"
                          >
                            <Play className="w-5 h-5" fill="white" />
                            Watch on YouTube
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )
                      ) : selectedItem?.pdf_url && (
                        <button
                          onClick={() => handleRead(selectedItem)}
                          className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 transition-all flex items-center justify-center gap-3 shadow-lg"
                        >
                          <BookOpen className="w-5 h-5" />
                          Read Now
                        </button>
                      )}
                      {selectedItem?.type === "book" && selectedItem?.pdf_url && (
                        <button
                          onClick={() => handleDownload(selectedItem)}
                          className="flex-1 border border-stone-300 text-stone-700 py-4 px-6 rounded-xl font-semibold hover:bg-stone-50 transition-all flex items-center justify-center gap-3"
                        >
                          <Download className="w-5 h-5" />
                          Download PDF
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PDF Viewer */}
        {selectedPDF && (
          <SimplePDFViewer
            item={selectedPDF}
            onClose={() => setSelectedPDF(null)}
            onViewTracked={handlePDFViewTracked}
          />
        )}

        {/* Comments Modal */}
        {commentsModalOpen && selectedCommentItem && (
          <ContentCommentsModal
            isOpen={commentsModalOpen}
            onClose={() => {
              setCommentsModalOpen(false);
              setSelectedCommentItem(null);
              fetchItems();
            }}
            contentId={selectedCommentItem.id}
            contentType="history"
            contentTitle={selectedCommentItem.title}
          />
        )}
      </div>
    </div>
  );
}