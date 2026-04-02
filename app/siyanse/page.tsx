"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
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
  Atom,
  Brain,
  Cpu,
  Zap,
  Server,
  Beaker,
  Telescope,
  Microscope,
  Loader2,
} from "lucide-react";
// NEW IMPORTS
import { FaThumbsUp, FaComment } from "react-icons/fa";
import ContentCommentsModal from "../componets/ContentCommentsModal";
interface ScienceItem {
  id: number;
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
  is_featured: boolean | null;
  is_new: boolean | null;
  rating?: number | null; // Keep optional for backward compatibility
  pdf_url: string | null;
  // NEW: Add comment and like counts
  comment_count?: number;
  like_count?: number;
}

const SimplePDFViewer = ({
  item,
  onClose,
  onViewTracked,
}: {
  item: ScienceItem;
  onClose: () => void;
  onViewTracked?: () => void;
}) => {
  const pdfUrl = item.pdf_url || "";

  // Track view when PDF viewer opens
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
                d="M6 18L18 6M6 6l12 12"
              />
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

export default function SciencePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedField, setSelectedField] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedType, setSelectedType] = useState<
    "all" | "book" | "documentary"
  >("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedItem, setSelectedItem] = useState<ScienceItem | null>(null);
  const [activeTab, setActiveTab] = useState<"books" | "documentaries">(
    "books",
  );
  const [selectedPDF, setSelectedPDF] = useState<ScienceItem | null>(null);

  // NEW: State for comments modal
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedCommentItem, setSelectedCommentItem] =
    useState<ScienceItem | null>(null);

  // State for fetched data
  const [items, setItems] = useState<ScienceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalDocumentaries: 0,
    totalFields: 0,
    totalViews: 0,
  });

  const fields: string[] = [
    "all",
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

  const difficulties = ["all", "Beginner", "Intermediate", "Advanced"];

  // Fetch data from Supabase
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("science_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch comment counts for all items
      const { data: commentData } = await supabase
        .from("content_comments")
        .select("content_id")
        .eq("content_type", "science");

      // Fetch like counts for all items
      const { data: likeData } = await supabase
        .from("content_likes")
        .select("content_id")
        .eq("content_type", "science");

      // Create maps for counts
      const commentMap = new Map();
      if (commentData) {
        commentData.forEach((item: any) => {
          commentMap.set(
            item.content_id,
            (commentMap.get(item.content_id) || 0) + 1,
          );
        });
      }

      const likeMap = new Map();
      if (likeData) {
        likeData.forEach((item: any) => {
          likeMap.set(item.content_id, (likeMap.get(item.content_id) || 0) + 1);
        });
      }

      // Merge counts with items
      const itemsWithCounts = (data || []).map((item) => ({
        ...item,
        comment_count: commentMap.get(item.id) || 0,
        like_count: likeMap.get(item.id) || 0,
      }));

      setItems(itemsWithCounts);
      calculateStats(itemsWithCounts);
    } catch (error) {
      console.error("Error fetching science items:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: ScienceItem[]) => {
    const books = data.filter((i) => i.type === "book").length;
    const docs = data.filter((i) => i.type === "documentary").length;
    const fields = new Set(data.map((i) => i.field)).size;
    const views = data.reduce((acc, i) => acc + (i.views || 0), 0);

    setStats({
      totalBooks: books,
      totalDocumentaries: docs,
      totalFields: fields,
      totalViews: views,
    });
  };

  // 🔥 VIEW TRACKING FUNCTION
  const trackView = async (item: ScienceItem) => {
    try {
      const newViews = (item.views || 0) + 1;

      // Update in database
      const { error } = await supabase
        .from("science_items")
        .update({ views: newViews })
        .eq("id", item.id);

      if (error) throw error;

      // Update local state
      setItems((prevItems) =>
        prevItems.map((i) =>
          i.id === item.id ? { ...i, views: newViews } : i,
        ),
      );

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalViews: prev.totalViews + 1,
      }));

      console.log(`View tracked for: ${item.title} (Total: ${newViews})`);
      return true;
    } catch (error) {
      console.error("Error tracking view:", error);
      return false;
    }
  };

  // Filter and sort items
  const getFilteredItems = () => {
    let filtered = items.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false ||
        item.narrator?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false;

      const matchesField =
        selectedField === "all" || item.field === selectedField;
      const matchesDifficulty =
        selectedDifficulty === "all" || item.difficulty === selectedDifficulty;
      const matchesType = selectedType === "all" || item.type === selectedType;

      return matchesSearch && matchesField && matchesDifficulty && matchesType;
    });

    // Sort items
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.published_date).getTime() -
            new Date(a.published_date).getTime()
          );
        case "oldest":
          return (
            new Date(a.published_date).getTime() -
            new Date(b.published_date).getTime()
          );
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
  const documentaries = filteredItems.filter(
    (item) => item.type === "documentary",
  );
  const activeItems = activeTab === "books" ? books : documentaries;

  // 🔥 UPDATED HANDLERS WITH VIEW TRACKING
  const handleItemClick = async (item: ScienceItem) => {
    // Track view when item is clicked
    await trackView(item);

    if (item.type === "book" && item.pdf_url) {
      setSelectedPDF(item);
    } else {
      setSelectedItem(item);
    }
  };

  const handlePlay = async (item: ScienceItem) => {
    // Track view when documentary is played
    await trackView(item);

    if (item.type === "documentary" && item.youtube_url) {
      window.open(item.youtube_url, "_blank");
    } else {
      alert("Video not available for this item");
    }
  };

  const handleDownload = (item: ScienceItem) => {
    if (item.type === "book" && item.pdf_url) {
      window.open(item.pdf_url, "_blank");
    } else {
      alert("Download not available for this item");
    }
  };

  const handleRead = async (item: ScienceItem) => {
    // Track view when PDF is opened
    await trackView(item);

    if (item.pdf_url) {
      setSelectedPDF(item);
    } else {
      alert("PDF not available for this item");
    }
  };

  // 🔥 TRACK VIEW WHEN PDF VIEWER OPENS
  const handlePDFViewTracked = async () => {
    if (selectedPDF) {
      await trackView(selectedPDF);
    }
  };

  // NEW: Handle opening comments modal
  const handleOpenComments = (item: ScienceItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    setSelectedCommentItem(item);
    setCommentsModalOpen(true);
  };

  const getFieldIcon = (field: string) => {
    switch (field) {
      case "Physics":
        return <Atom className="w-4 h-4" />;
      case "Biology":
        return <Zap className="w-4 h-4" />;
      case "Chemistry":
        return <Beaker className="w-4 h-4" />;
      case "Astronomy":
        return <Telescope className="w-4 h-4" />;
      case "Neuroscience":
        return <Brain className="w-4 h-4" />;
      case "Computer Science":
        return <Cpu className="w-4 h-4" />;
      case "Artificial Intelligence":
        return <Brain className="w-4 h-4" />;
      case "Quantum Mechanics":
        return <Atom className="w-4 h-4" />;
      case "Mathematics":
        return <Server className="w-4 h-4" />;
      case "Engineering":
        return <Cpu className="w-4 h-4" />;
      case "Robotics":
        return <Server className="w-4 h-4" />;
      case "Biotechnology":
        return <Beaker className="w-4 h-4" />;
      case "Genetics":
        return <Zap className="w-4 h-4" />;
      case "Astrophysics":
        return <Telescope className="w-4 h-4" />;
      case "Climate Science":
        return <Globe className="w-4 h-4" />;
      case "Psychology":
        return <Brain className="w-4 h-4" />;
      default:
        return <Beaker className="w-4 h-4" />;
    }
  };

  const StatCard = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: any;
    label: string;
    value: string;
  }) => (
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Science collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <Beaker className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <Atom className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-black bg-clip-text mb-4">
            SIYANSE
          </h1>
          <p className="text-l text-gray-600 max-w-3xl mx-auto">
            Shakisha ibintu byavumbuwe na siyansi ukoresheje ibitabo byemewe na
            documentaire
          </p>
        </div>

        {/* Stats Section - Shows REAL view counts! */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={BookOpen}
            label="Ibitabo bya Siyansi"
            value={stats.totalBooks.toString()}
          />
          <StatCard
            icon={Film}
            label="Dokumanteri"
            value={stats.totalDocumentaries.toString()}
          />
          <StatCard
            icon={Beaker}
            label="Ibyiciro bya Siyansi"
            value={stats.totalFields.toString()}
          />
          <StatCard
            icon={Eye}
            label="Total Views"
            value={stats.totalViews.toLocaleString()}
          />
        </div>

        {/* Search & Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 mb-8 border border-blue-200">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Shaka siyansi, ubumenyi, cyangwa abashakashatsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="appearance-none bg-white border border-blue-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="all">Byose</option>
                  <option value="book">Ibitabo gusa</option>
                  <option value="documentary">Ibyegeranyo gusa</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="relative">
                <select
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value)}
                  className="appearance-none bg-white border border-blue-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  {fields.map((field) => (
                    <option key={field} value={field}>
                      {field === "all" ? "Ibyiciro byose" : field}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="relative">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="appearance-none bg-white border border-blue-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  {difficulties.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty === "all" ? "Icyiciro cyose" : difficulty}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-blue-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="newest">Ibishya mbere</option>
                  <option value="oldest">Ibishaje mbere</option>
                  <option value="views">Ibyarebwe cyane</option>
                  <option value="title">Kuva A-Z</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="flex bg-blue-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-blue-500 hover:text-blue-700"
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === "list"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-blue-500 hover:text-blue-700"
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
          <div className="border-b border-blue-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("books")}
                className={`py-3 px-1 border-b-2 font-medium text-lg transition-colors duration-200 flex items-center gap-2 ${
                  activeTab === "books"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <BookOpen className="w-5 h-5" />
                Ibitabo
                <span className="bg-blue-100 text-blue-700 text-sm font-normal px-2 py-1 rounded-full">
                  {books.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("documentaries")}
                className={`py-3 px-1 border-b-2 font-medium text-lg transition-colors duration-200 flex items-center gap-2 ${
                  activeTab === "documentaries"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Film className="w-5 h-5" />
                Ibyegeranyo
                <span className="bg-blue-100 text-blue-700 text-sm font-normal px-2 py-1 rounded-full">
                  {documentaries.length}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Content Grid */}
        {activeItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No scientific content found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filters to explore our collection
            </p>
          </div>
        ) : (
          <div
            className={`${
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-6"
            }`}
          >
            {activeItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer overflow-hidden border border-blue-100 ${
                  viewMode === "list" ? "flex" : "h-full flex flex-col"
                }`}
                onClick={() => handleItemClick(item)}
              >
                {/* Cover Image with Type Badge */}
                <div
                  className={`relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-100 ${
                    viewMode === "list" ? "w-40 flex-shrink-0" : "h-48"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10" />

                  {/* Custom Cover Image */}
                  <div className="relative w-full h-full">
                    <Image
                      src={item.cover_image}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes={
                        viewMode === "list"
                          ? "160px"
                          : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      }
                    />
                  </div>

                  {/* Type Badge */}
                  <div className="absolute top-3 left-3 z-20">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${
                        item.type === "book"
                          ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                          : "bg-gradient-to-r from-purple-500 to-pink-500"
                      }`}
                    >
                      {item.type === "book" ? "Book" : "Documentary"}
                    </span>
                  </div>

                  {/* Featured/New Badges */}
                  <div className="absolute top-3 right-3 z-20 space-y-2">
                    {item.is_featured && (
                      <span className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                        Featured
                      </span>
                    )}
                    {item.is_new && (
                      <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        New
                      </span>
                    )}
                  </div>

                  {/* View Count Badge */}
                  <div className="absolute bottom-3 right-3 z-20">
                    <span className="bg-black/75 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {item.views?.toLocaleString() || 0}
                    </span>
                  </div>

                  {/* Field Badge */}
                  <div className="absolute bottom-3 left-3 z-20">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-blue-700 text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                      {getFieldIcon(item.field)}
                      {item.field}
                    </span>
                  </div>

                  {/* Quick Action Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 to-indigo-700/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
                    <div className="flex gap-3">
                      {item.type === "documentary" ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlay(item);
                          }}
                          className="bg-red-600 text-white p-4 rounded-full hover:bg-red-700 transition-all transform hover:scale-110"
                        >
                          <Play className="w-6 h-6" fill="white" />
                        </button>
                      ) : (
                        item.pdf_url && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRead(item);
                            }}
                            className="bg-green-600 text-white p-4 rounded-full hover:bg-green-700 transition-all transform hover:scale-110"
                          >
                            <BookOpen className="w-6 h-6" />
                          </button>
                        )
                      )}
                      {item.type === "book" && item.pdf_url && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(item);
                          }}
                          className="bg-blue-600 text-white p-4 rounded-full hover:bg-blue-700 transition-all transform hover:scale-110"
                        >
                          <Download className="w-6 h-6" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content Info */}
                <div
                  className={`p-4 flex-1 flex flex-col ${
                    viewMode === "list" ? "flex-1" : ""
                  }`}
                >
                  <div className="mb-3 flex-1">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>

                    <div className="mb-3">
                      <div className="flex items-center text-gray-600 mb-2">
                        {item.type === "book" ? (
                          <>
                            <User className="w-4 h-4 mr-1 flex-shrink-0" />
                            <span className="text-sm font-medium truncate">
                              {item.author || "Unknown"}
                            </span>
                          </>
                        ) : (
                          <>
                            <Film className="w-4 h-4 mr-1 flex-shrink-0" />
                            <span className="text-sm font-medium truncate">
                              {item.narrator || "Unknown"}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Stats row with views, likes, and comments */}
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{item.views?.toLocaleString() || 0}</span>
                        </div>

                        {/* Card Like Button - Directly on the card */}
                        <CardLikeButton
                          contentId={item.id}
                          contentType="science"
                          initialCount={item.like_count || 0}
                          onLikeChange={(newCount) => {
                            // Update the item's like count in local state
                            setItems((prevItems) =>
                              prevItems.map((i) =>
                                i.id === item.id
                                  ? { ...i, like_count: newCount }
                                  : i,
                              ),
                            );
                          }}
                        />

                        <button
                          onClick={(e) => handleOpenComments(item, e)}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          <FaComment className="w-4 h-4" />
                          <span>{item.comment_count || 0}</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  </div>

                  {/* Meta Info */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(item.published_date).getFullYear()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.difficulty === "Beginner"
                              ? "bg-green-100 text-green-700"
                              : item.difficulty === "Intermediate"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {item.difficulty}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          {getFieldIcon(item.field)}
                          {item.field}
                        </span>
                        {item.type === "book" && item.pages && (
                          <span className="bg-cyan-50 text-cyan-700 text-xs px-2 py-1 rounded-full">
                            {item.pages}p
                          </span>
                        )}
                        {item.type === "documentary" && item.duration && (
                          <span className="flex items-center gap-1 bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full">
                            <Clock className="w-3 h-3" />
                            {item.duration}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Add to bookmarks functionality
                          }}
                        >
                          <Bookmark className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </button>
                        <button
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Share functionality
                          }}
                        >
                          <Share2 className="w-4 h-4 text-gray-400 hover:text-gray-600" />
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
                {/* Cover Image */}
                <div className="lg:w-2/5 p-8 bg-gradient-to-br from-blue-50 to-cyan-50">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
                    <Image
                      src={selectedItem.cover_image}
                      alt={selectedItem.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-4 left-4">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-bold text-white shadow-lg ${
                          selectedItem.type === "book"
                            ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                            : "bg-gradient-to-r from-purple-500 to-pink-500"
                        }`}
                      >
                        {selectedItem.type === "book"
                          ? "Scientific Book"
                          : "Documentary Film"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="lg:w-3/5 p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {selectedItem.title}
                      </h2>
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex items-center text-gray-600">
                          {selectedItem.type === "book" ? (
                            <>
                              <User className="w-5 h-5 mr-2" />
                              <span className="text-lg font-medium">
                                {selectedItem.author || "Unknown"}
                              </span>
                            </>
                          ) : (
                            <>
                              <Film className="w-5 h-5 mr-2" />
                              <span className="text-lg font-medium">
                                {selectedItem.narrator || "Unknown"}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center text-gray-500">
                          <Eye className="w-5 h-5 mr-2" />
                          <span>
                            {selectedItem.views?.toLocaleString() || 0} views
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors text-2xl p-2 hover:bg-gray-100 rounded-full"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-6">
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {selectedItem.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 py-4 bg-blue-50 rounded-xl p-4">
                      <div>
                        <span className="text-sm text-gray-500">
                          Scientific Field
                        </span>
                        <p className="font-bold text-lg text-gray-800">
                          {selectedItem.field}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Published</span>
                        <p className="font-medium">
                          {new Date(
                            selectedItem.published_date,
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">
                          {selectedItem.type === "book" ? "Pages" : "Duration"}
                        </span>
                        <p className="font-medium">
                          {selectedItem.type === "book"
                            ? `${selectedItem.pages || 0} pages`
                            : selectedItem.duration || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">
                          Difficulty
                        </span>
                        <p className="font-medium">{selectedItem.difficulty}</p>
                      </div>
                    </div>

                    <div className="flex space-x-4 pt-6">
                      {selectedItem?.type === "documentary"
                        ? selectedItem?.youtube_url && (
                            <button
                              onClick={() => {
                                if (selectedItem?.youtube_url) {
                                  window.open(
                                    selectedItem.youtube_url,
                                    "_blank",
                                  );
                                  setSelectedItem(null);
                                }
                              }}
                              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all flex items-center justify-center gap-3 shadow-lg"
                            >
                              <Play className="w-5 h-5" fill="white" />
                              Watch on YouTube
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )
                        : selectedItem?.pdf_url && (
                            <button
                              onClick={() => {
                                if (selectedItem) {
                                  handleRead(selectedItem);
                                  setSelectedItem(null);
                                }
                              }}
                              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-3 shadow-lg"
                            >
                              <BookOpen className="w-5 h-5" />
                              Read Now
                            </button>
                          )}
                      {selectedItem?.type === "book" &&
                        selectedItem?.pdf_url && (
                          <button
                            onClick={() => {
                              if (selectedItem) {
                                handleDownload(selectedItem);
                                setSelectedItem(null);
                              }
                            }}
                            className="flex-1 border border-gray-300 text-gray-700 py-4 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
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

        {/* PDF Viewer for Books with view tracking */}
        {selectedPDF && (
          <SimplePDFViewer
            item={selectedPDF}
            onClose={() => setSelectedPDF(null)}
            onViewTracked={handlePDFViewTracked}
          />
        )}

        {/* NEW: Comments Modal */}
        {commentsModalOpen && selectedCommentItem && (
          <ContentCommentsModal
            isOpen={commentsModalOpen}
            onClose={() => {
              setCommentsModalOpen(false);
              setSelectedCommentItem(null);
              // Refresh comment counts when modal closes
              fetchItems();
            }}
            contentId={selectedCommentItem.id}
            contentType="science"
            contentTitle={selectedCommentItem.title}
          />
        )}
      </div>
    </div>
  );
}
