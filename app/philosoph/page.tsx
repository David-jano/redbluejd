"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ClientImage from "../componets/ClientImage";
import {
  Search,
  Eye,
  User,
  Calendar,
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
  Brain,
  Lightbulb,
  Scale,
  Target,
  Zap,
  Users,
  Globe,
  Book,
  Loader2,
} from "lucide-react";
import { FaHeart as FaHeartSolid, FaComment } from "react-icons/fa";
import ContentCommentsModal from "../componets/ContentCommentsModal";
import CardLikeButton from "../componets/CardLikeButton";

interface PhilosophyItem {
  id: number;
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
  is_featured: boolean | null;
  is_new: boolean | null;
  philosophical_school: string | null;
  pdf_url: string | null;
  comment_count?: number;
  like_count?: number;
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

const SimplePDFViewer = ({
  item,
  onClose,
  onViewTracked,
}: {
  item: PhilosophyItem;
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
      <div className="bg-white border-b border-indigo-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-indigo-50 rounded-full"
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
            className="p-2 hover:bg-indigo-50 rounded-full flex items-center gap-2 text-indigo-700 hover:text-indigo-900"
            title="Download PDF"
          >
            <Download className="w-5 h-5" />
            <span className="text-sm hidden sm:inline">Download</span>
          </a>
        )}
      </div>
      <div className="flex-1 bg-indigo-50">
        {pdfUrl ? (
          <iframe src={pdfUrl} className="w-full h-full" title={item.title} />
        ) : (
          <div className="flex items-center justify-center h-full text-indigo-600">
            PDF not available
          </div>
        )}
      </div>
    </div>
  );
};

export default function PhilosophyPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedEra, setSelectedEra] = useState("all");
  const [selectedType, setSelectedType] = useState<
    "all" | "book" | "documentary"
  >("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedItem, setSelectedItem] = useState<PhilosophyItem | null>(null);
  const [activeTab, setActiveTab] = useState<"books" | "documentaries">(
    "books",
  );
  const [selectedPDF, setSelectedPDF] = useState<PhilosophyItem | null>(null);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedCommentItem, setSelectedCommentItem] =
    useState<PhilosophyItem | null>(null);
  const [items, setItems] = useState<PhilosophyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalDocumentaries: 0,
    totalBranches: 0,
    totalPhilosophers: 0,
    totalLikes: 0,
  });

  const branches: string[] = [
    "all",
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
    "all",
    "Ancient",
    "Medieval",
    "Enlightenment",
    "Modern",
    "Contemporary",
    "Existential",
  ];

  useEffect(() => {
    fetchItems();
  }, []);

  // OPTIMIZED: Parallel fetching for items, comments, and likes
  const fetchItems = async () => {
    setLoading(true);
    try {
      const [itemsResult, commentsResult, likesResult] = await Promise.all([
        supabase
          .from("philosophy_items")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("content_comments")
          .select("content_id")
          .eq("content_type", "philosophy"),
        supabase
          .from("content_likes")
          .select("content_id")
          .eq("content_type", "philosophy"),
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
        like_count: likeMap.get(item.id) || 0,
      }));

      setItems(itemsWithCounts);
      calculateStats(itemsWithCounts);
    } catch (error) {
      console.error("Error fetching philosophy items:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: PhilosophyItem[]) => {
    const books = data.filter((i) => i.type === "book").length;
    const docs = data.filter((i) => i.type === "documentary").length;
    const branches = new Set(data.map((i) => i.branch)).size;
    const philosophers = new Set(
      data.map((i) => i.author || i.narrator).filter(Boolean),
    ).size;
    const totalLikes = data.reduce((acc, i) => acc + (i.like_count || 0), 0);

    setStats({
      totalBooks: books,
      totalDocumentaries: docs,
      totalBranches: branches,
      totalPhilosophers: philosophers,
      totalLikes,
    });
  };

  const trackView = async (item: PhilosophyItem) => {
    try {
      const newViews = (item.views || 0) + 1;
      const { error } = await supabase
        .from("philosophy_items")
        .update({ views: newViews })
        .eq("id", item.id);

      if (error) throw error;

      setItems((prevItems) =>
        prevItems.map((i) =>
          i.id === item.id ? { ...i, views: newViews } : i,
        ),
      );
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

      const matchesBranch =
        selectedBranch === "all" || item.branch === selectedBranch;
      const matchesEra = selectedEra === "all" || item.era === selectedEra;
      const matchesType = selectedType === "all" || item.type === selectedType;

      return matchesSearch && matchesBranch && matchesEra && matchesType;
    });

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

  const handleItemClick = async (item: PhilosophyItem) => {
    await trackView(item);
    if (item.type === "book" && item.pdf_url) {
      setSelectedPDF(item);
    } else {
      setSelectedItem(item);
    }
  };

  const handlePlay = async (item: PhilosophyItem) => {
    await trackView(item);
    if (item.type === "documentary" && item.youtube_url) {
      window.open(item.youtube_url, "_blank");
    }
  };

  const handleDownload = (item: PhilosophyItem) => {
    if (item.type === "book" && item.pdf_url) {
      window.open(item.pdf_url, "_blank");
    }
  };

  const handleRead = async (item: PhilosophyItem) => {
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

  const handleOpenComments = (item: PhilosophyItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCommentItem(item);
    setCommentsModalOpen(true);
  };

  const getBranchIcon = (branch: string) => {
    const icons: Record<string, React.ReactNode> = {
      Metaphysics: <Brain className="w-4 h-4" />,
      Ethics: <Scale className="w-4 h-4" />,
      Epistemology: <Lightbulb className="w-4 h-4" />,
      Logic: <Target className="w-4 h-4" />,
      "Political Philosophy": <Users className="w-4 h-4" />,
      Aesthetics: <Eye className="w-4 h-4" />,
      "Philosophy of Mind": <Zap className="w-4 h-4" />,
      Existentialism: <User className="w-4 h-4" />,
      Stoicism: <Scale className="w-4 h-4" />,
      "Eastern Philosophy": <Globe className="w-4 h-4" />,
    };
    return icons[branch] || <Book className="w-4 h-4" />;
  };

  const getBranchColor = (branch: string) => {
    const colors: Record<string, string> = {
      Metaphysics: "bg-indigo-100 text-indigo-700",
      Ethics: "bg-emerald-100 text-emerald-700",
      Epistemology: "bg-amber-100 text-amber-700",
      Logic: "bg-blue-100 text-blue-700",
      "Political Philosophy": "bg-rose-100 text-rose-700",
      Aesthetics: "bg-purple-100 text-purple-700",
      "Philosophy of Mind": "bg-cyan-100 text-cyan-700",
      Existentialism: "bg-gray-100 text-gray-700",
      Stoicism: "bg-slate-100 text-slate-700",
      "Eastern Philosophy": "bg-orange-100 text-orange-700",
    };
    return colors[branch] || "bg-gray-100 text-gray-700";
  };

  const getEraColor = (era: string) => {
    const colors: Record<string, string> = {
      Ancient: "bg-stone-100 text-stone-700",
      Medieval: "bg-amber-100 text-amber-700",
      Enlightenment: "bg-yellow-100 text-yellow-700",
      Modern: "bg-blue-100 text-blue-700",
      Contemporary: "bg-green-100 text-green-700",
      Existential: "bg-gray-100 text-gray-700",
    };
    return colors[era] || "bg-gray-100 text-gray-700";
  };

  const StatCard = ({
    icon: Icon,
    label,
    value,
    color,
  }: {
    icon: any;
    label: string;
    value: string;
    color: string;
  }) => (
    <div className="bg-white rounded-xl p-4 shadow-lg border border-indigo-100">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Filozofiya collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-indigo-600 via-purple-600 to-gray-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <Brain className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-black mb-4">Filozofiya</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explore timeless wisdom through foundational texts and profound
            philosophical documentaries
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            icon={BookOpen}
            label="Philosophical Texts"
            value={stats.totalBooks.toString()}
            color="bg-gradient-to-r from-indigo-500 to-purple-500"
          />
          <StatCard
            icon={Brain}
            label="Philosophical Branches"
            value={stats.totalBranches.toString()}
            color="bg-gradient-to-r from-blue-500 to-cyan-500"
          />
          <StatCard
            icon={Users}
            label="Philosophers"
            value={stats.totalPhilosophers.toString()}
            color="bg-gradient-to-r from-emerald-500 to-green-500"
          />
        </div>

        {/* Search & Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-indigo-100">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search philosophical concepts, thinkers, or schools of thought..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/50"
              />
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="appearance-none bg-white border border-indigo-200 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Content</option>
                  <option value="book">Books Only</option>
                  <option value="documentary">Documentaries Only</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="appearance-none bg-white border border-indigo-200 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-indigo-500"
                >
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch === "all" ? "All Branches" : branch}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={selectedEra}
                  onChange={(e) => setSelectedEra(e.target.value)}
                  className="appearance-none bg-white border border-indigo-200 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-indigo-500"
                >
                  {eras.map((era) => (
                    <option key={era} value={era}>
                      {era === "all" ? "All Eras" : era}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-indigo-200 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Classics First</option>
                  <option value="views">Most Studied</option>
                  <option value="title">Title A-Z</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="flex bg-indigo-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-indigo-600" : "text-indigo-500"}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white shadow-sm text-indigo-600" : "text-indigo-500"}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="mb-8">
          <div className="border-b border-indigo-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("books")}
                className={`py-3 px-1 border-b-2 font-medium text-lg transition-colors flex items-center gap-2 ${
                  activeTab === "books"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <BookOpen className="w-5 h-5" />
                Ibitabo
                <span className="bg-indigo-100 text-indigo-700 text-sm font-normal px-2 py-1 rounded-full">
                  {books.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("documentaries")}
                className={`py-3 px-1 border-b-2 font-medium text-lg transition-colors flex items-center gap-2 ${
                  activeTab === "documentaries"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Film className="w-5 h-5" />
                Philosophy
                <span className="bg-indigo-100 text-indigo-700 text-sm font-normal px-2 py-1 rounded-full">
                  {documentaries.length}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Content Grid */}
        {activeItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No philosophical content found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filters to explore our philosophy
              collection
            </p>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-6"
            }
          >
            {activeItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer overflow-hidden border border-indigo-100 ${
                  viewMode === "list" ? "flex" : "h-full flex flex-col"
                }`}
                onClick={() => handleItemClick(item)}
              >
                {/* Cover Image */}
                <div
                  className={`relative overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-100 ${viewMode === "list" ? "w-40 flex-shrink-0" : "h-48"}`}
                >
                  <div className="relative w-full h-full">
                    <ClientImage
                      src={getValidImageUrl(item.cover_image)}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes={
                        viewMode === "list"
                          ? "160px"
                          : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      }
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent z-10" />
                  </div>

                  <div className="absolute top-3 left-3 z-30">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${
                        item.type === "book"
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                          : "bg-gradient-to-r from-gray-500 to-slate-500"
                      }`}
                    >
                      {item.type === "book" ? "Text" : "Documentary"}
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-3 z-30">
                    <span className="bg-black/75 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {item.views?.toLocaleString() || 0}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 z-30 space-y-2">
                    {item.is_featured && (
                      <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        Foundational
                      </span>
                    )}
                    {item.is_new && (
                      <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        Contemporary
                      </span>
                    )}
                    {item.philosophical_school && (
                      <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        {item.philosophical_school}
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 left-3 z-30">
                    <span
                      className={`px-3 py-1 backdrop-blur-sm text-xs font-bold rounded-full shadow-lg flex items-center gap-1 ${getBranchColor(item.branch)}`}
                    >
                      {getBranchIcon(item.branch)}
                      {item.branch}
                    </span>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/80 to-purple-700/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30">
                    <div className="flex gap-3">
                      {item.type === "documentary" ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlay(item);
                          }}
                          className="bg-red-600 text-white p-4 rounded-full hover:bg-red-700 transition-all transform hover:scale-110 shadow-xl"
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
                            className="bg-green-600 text-white p-4 rounded-full hover:bg-green-700 transition-all transform hover:scale-110 shadow-xl"
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
                          className="bg-blue-600 text-white p-4 rounded-full hover:bg-blue-700 transition-all transform hover:scale-110 shadow-xl"
                        >
                          <Download className="w-6 h-6" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content Info */}
                <div
                  className={`p-4 flex-1 flex flex-col ${viewMode === "list" ? "flex-1" : ""}`}
                >
                  <div className="mb-3 flex-1">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
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

                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{item.views?.toLocaleString() || 0}</span>
                        </div>

                        <CardLikeButton
                          contentId={item.id}
                          contentType="philosophy"
                          initialCount={item.like_count || 0}
                          onLikeChange={(newCount) => {
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
                          className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
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

                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(item.published_date).getFullYear()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getEraColor(item.era)}`}
                        >
                          {item.era}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.type === "book" && item.pages ? (
                          <span className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full">
                            {item.pages}p
                          </span>
                        ) : item.type === "documentary" && item.duration ? (
                          <span className="flex items-center gap-1 bg-gray-50 text-gray-700 text-xs px-2 py-1 rounded-full">
                            <Clock className="w-3 h-3" />
                            {item.duration}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1 hover:bg-gray-100 rounded-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Bookmark className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </button>
                        <button
                          className="p-1 hover:bg-gray-100 rounded-full"
                          onClick={(e) => e.stopPropagation()}
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
                <div className="lg:w-2/5 p-8 bg-gradient-to-br from-indigo-50 to-purple-50">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
                    <ClientImage
                      src={getValidImageUrl(selectedItem.cover_image)}
                      alt={selectedItem.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-4 left-4">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-bold text-white shadow-lg ${
                          selectedItem.type === "book"
                            ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                            : "bg-gradient-to-r from-gray-500 to-slate-500"
                        }`}
                      >
                        {selectedItem.type === "book"
                          ? "Philosophical Text"
                          : "Philosophy Documentary"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-center">
                    <div
                      className={`px-4 py-2 rounded-full font-medium ${getEraColor(selectedItem.era)}`}
                    >
                      {selectedItem.era} Era
                    </div>
                  </div>
                </div>

                <div className="lg:w-3/5 p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-3 py-1 text-sm font-bold rounded-full flex items-center gap-1 ${getBranchColor(selectedItem.branch)}`}
                        >
                          {getBranchIcon(selectedItem.branch)}
                          {selectedItem.branch}
                        </span>
                        {selectedItem.philosophical_school && (
                          <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 text-sm font-bold rounded-full">
                            {selectedItem.philosophical_school}
                          </span>
                        )}
                      </div>
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
                            {selectedItem.views?.toLocaleString() || 0} studied
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

                    <div className="grid grid-cols-2 gap-4 py-4 bg-indigo-50 rounded-xl p-4">
                      <div>
                        <span className="text-sm text-gray-500">
                          Philosophical Branch
                        </span>
                        <p className="font-bold text-lg text-gray-800">
                          {selectedItem.branch}
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
                          Historical Era
                        </span>
                        <p className="font-medium">{selectedItem.era}</p>
                      </div>
                    </div>

                    <div className="flex space-x-4 pt-6">
                      {selectedItem?.type === "documentary" ? (
                        selectedItem?.youtube_url ? (
                          <button
                            onClick={() => {
                              window.open(selectedItem.youtube_url!, "_blank");
                              setSelectedItem(null);
                            }}
                            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all flex items-center justify-center gap-3 shadow-lg"
                          >
                            <Play className="w-5 h-5" fill="white" />
                            Watch Documentary
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        ) : null
                      ) : selectedItem?.pdf_url ? (
                        <button
                          onClick={() => {
                            handleRead(selectedItem);
                            setSelectedItem(null);
                          }}
                          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-3 shadow-lg"
                        >
                          <BookOpen className="w-5 h-5" />
                          Study Philosophical Text
                        </button>
                      ) : null}

                      {selectedItem?.type === "book" &&
                        selectedItem?.pdf_url && (
                          <button
                            onClick={() => {
                              handleDownload(selectedItem);
                              setSelectedItem(null);
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
            contentType="philosophy"
            contentTitle={selectedCommentItem.title}
          />
        )}
      </div>
    </div>
  );
}
