"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ClientImage from "../componets/ClientImage";
import {
  Search,
  Play,
  User,
  Film,
  Eye,
  Bookmark,
  Share2,
  ChevronDown,
  Grid,
  List,
  MapPin,
  Clock,
  Calendar,
  Loader2,
} from "lucide-react";
import { FaHeart as FaHeartSolid, FaComment } from "react-icons/fa";
import ContentCommentsModal from "../componets/ContentCommentsModal";
import CardLikeButton from "../componets/CardLikeButton";

interface Documentary {
  id: number;
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
  is_featured: boolean | null;
  is_new: boolean | null;
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

export default function DocumentariesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedDoc, setSelectedDoc] = useState<Documentary | null>(null);
  const [showActions, setShowActions] = useState<number | null>(null);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedCommentItem, setSelectedCommentItem] =
    useState<Documentary | null>(null);
  const [documentaries, setDocumentaries] = useState<Documentary[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDocumentaries: 0,
    totalViews: 0,
    totalLocations: 0,
    totalHours: 0,
    totalLikes: 0,
  });

  const locations: string[] = [
    "all",
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

  useEffect(() => {
    fetchDocumentaries();
  }, []);

  // OPTIMIZED: Parallel fetching for documentaries, comments, and likes
  const fetchDocumentaries = async () => {
    setLoading(true);
    try {
      const [docsResult, commentsResult, likesResult] = await Promise.all([
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

      if (docsResult.error) throw docsResult.error;

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

      const itemsWithCounts = (docsResult.data || []).map((item) => ({
        ...item,
        comment_count: commentMap.get(item.id) || 0,
        like_count: likeMap.get(item.id) || 0,
      }));

      setDocumentaries(itemsWithCounts);
      calculateStats(itemsWithCounts);
    } catch (error) {
      console.error("Error fetching documentaries:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Documentary[]) => {
    const totalDocs = data.length;
    const totalViews = data.reduce((acc, doc) => acc + (doc.views || 0), 0);
    const locations = new Set(data.map((doc) => doc.location)).size;
    const totalLikes = data.reduce(
      (acc, doc) => acc + (doc.like_count || 0),
      0,
    );

    let totalMinutes = 0;
    data.forEach((doc) => {
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
    });
  };

  const trackView = async (doc: Documentary) => {
    try {
      const newViews = (doc.views || 0) + 1;
      const { error } = await supabase
        .from("documentaries")
        .update({ views: newViews })
        .eq("id", doc.id);

      if (error) throw error;

      setDocumentaries((prevDocs) =>
        prevDocs.map((d) => (d.id === doc.id ? { ...d, views: newViews } : d)),
      );

      setStats((prev) => ({ ...prev, totalViews: prev.totalViews + 1 }));
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  };

  const filteredDocs = documentaries.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.director.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation =
      selectedLocation === "all" || doc.location === selectedLocation;
    return matchesSearch && matchesLocation;
  });

  const sortedDocs = [...filteredDocs].sort((a, b) => {
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

  const handlePlay = async (doc: Documentary) => {
    await trackView(doc);
    window.open(doc.youtube_url, "_blank");
  };

  const handleDocClick = async (doc: Documentary) => {
    await trackView(doc);
    setSelectedDoc(doc);
  };

  const handleOpenComments = (doc: Documentary, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCommentItem(doc);
    setCommentsModalOpen(true);
  };

  const formatLocation = (location: string) => {
    return location
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
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
    <div className="bg-white rounded-xl p-4 shadow-lg border border-green-100">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading documentary collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Film className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Ibyegeranyo
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore the world through captivating documentaries from every
            corner of the globe
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            icon={Film}
            label="Documentaries"
            value={stats.totalDocumentaries.toString()}
            color="bg-gradient-to-r from-green-500 to-emerald-500"
          />
          <StatCard
            icon={MapPin}
            label="Locations"
            value={stats.totalLocations.toString()}
            color="bg-gradient-to-r from-purple-500 to-pink-500"
          />
          <StatCard
            icon={Clock}
            label="Hours of Content"
            value={stats.totalHours.toString()}
            color="bg-gradient-to-r from-orange-500 to-red-500"
          />
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search documentaries or directors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              />
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-green-500"
                >
                  {locations.map((location: string) => (
                    <option key={location} value={location}>
                      {location === "all"
                        ? "All Locations"
                        : formatLocation(location)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-green-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="views">Most Views</option>
                  <option value="title">Title A-Z</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-green-600" : "text-gray-500"}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white shadow-sm text-green-600" : "text-gray-500"}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Documentaries Grid */}
        {sortedDocs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No documentaries found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or location filters
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
            {sortedDocs.map((doc) => (
              <div
                key={doc.id}
                className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer overflow-hidden ${
                  viewMode === "list" ? "flex" : "h-full flex flex-col"
                }`}
                onMouseEnter={() => setShowActions(doc.id)}
                onMouseLeave={() => setShowActions(null)}
                onClick={() => handleDocClick(doc)}
              >
                {/* Thumbnail */}
                <div
                  className={`relative overflow-hidden ${viewMode === "list" ? "w-48 flex-shrink-0" : "h-48"}`}
                >
                  <div className="relative w-full h-full">
                    <ClientImage
                      src={getValidImageUrl(doc.thumbnail)}
                      alt={doc.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes={
                        viewMode === "list"
                          ? "192px"
                          : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      }
                    />
                  </div>

                  <div className="absolute bottom-3 right-3 bg-black/75 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {doc.views?.toLocaleString() || 0}
                  </div>

                  <div className="absolute bottom-3 left-3 bg-black/75 text-white text-xs px-2 py-1 rounded-full">
                    {doc.duration}
                  </div>

                  <div className="absolute top-3 left-3">
                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {formatLocation(doc.location)}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 space-y-2">
                    {doc.is_featured && (
                      <span className="bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                        Featured
                      </span>
                    )}
                    {doc.is_new && (
                      <span className="bg-blue-400 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                        New
                      </span>
                    )}
                  </div>

                  <div
                    className={`absolute top-3 right-3 transition-all duration-300 ${showActions === doc.id ? "opacity-100" : "opacity-0"} space-y-2`}
                  >
                    <button
                      className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Bookmark className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Share2 className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  <div
                    className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-all duration-300 ${
                      showActions === doc.id
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none"
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlay(doc);
                      }}
                      className="bg-red-600 text-white p-4 rounded-full hover:bg-red-700 transition-colors transform hover:scale-110"
                    >
                      <Play className="w-6 h-6 fill-current" />
                    </button>
                  </div>
                </div>

                {/* Documentary Info */}
                <div
                  className={`p-4 flex-1 flex flex-col ${viewMode === "list" ? "flex-1" : ""}`}
                >
                  <div className="mb-3 flex-1">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-2 group-hover:text-green-600 transition-colors">
                      {doc.title}
                    </h3>

                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center text-gray-600">
                          <User className="w-4 h-4 mr-1" />
                          <span className="text-sm font-medium">
                            {doc.director}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{doc.views?.toLocaleString() || 0}</span>
                        </div>

                        <CardLikeButton
                          contentId={doc.id}
                          contentType="documentaries"
                          initialCount={doc.like_count || 0}
                          onLikeChange={(newCount) => {
                            setDocumentaries((prevDocs) =>
                              prevDocs.map((d) =>
                                d.id === doc.id
                                  ? { ...d, like_count: newCount }
                                  : d,
                              ),
                            );
                          }}
                        />

                        <button
                          onClick={(e) => handleOpenComments(doc, e)}
                          className="flex items-center gap-1 hover:text-green-600 transition-colors"
                        >
                          <FaComment className="w-4 h-4" />
                          <span>{doc.comment_count || 0}</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {doc.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
                    <div className="flex flex-wrap gap-1">
                      {(doc.tags || []).slice(0, 2).map((tag: string) => (
                        <span
                          key={tag}
                          className="bg-green-50 text-green-600 text-xs px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(doc.published_date).getFullYear()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Documentary Detail Modal */}
        {selectedDoc && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-2/3 p-6">
                  <div className="aspect-video bg-black rounded-xl overflow-hidden mb-6">
                    <iframe
                      src={selectedDoc.youtube_url}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-24 h-32 relative rounded-lg overflow-hidden flex-shrink-0">
                      <ClientImage
                        src={getValidImageUrl(selectedDoc.thumbnail)}
                        alt={selectedDoc.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedDoc.title}
                      </h2>
                      <div className="flex items-center text-gray-600 mb-1">
                        <User className="w-4 h-4 mr-2" />
                        <span className="font-medium">
                          {selectedDoc.director}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-5 h-5 mr-2" />
                      <span className="font-medium">
                        {formatLocation(selectedDoc.location)}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-5 h-5 mr-2" />
                      <span className="font-medium">
                        {selectedDoc.duration}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Eye className="w-5 h-5 mr-2" />
                      <span className="font-medium">
                        {selectedDoc.views?.toLocaleString() || 0} views
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-5 h-5 mr-2" />
                      <span className="font-medium">
                        {new Date(
                          selectedDoc.published_date,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 leading-relaxed mb-6">
                    {selectedDoc.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {(selectedDoc.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="lg:w-1/3 p-6 border-l border-gray-200">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                      Quick Actions
                    </h3>
                    <button
                      onClick={() => setSelectedDoc(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={() => handlePlay(selectedDoc)}
                      className="w-full bg-red-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-3"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      Watch on YouTube
                    </button>

                    <div className="flex space-x-3">
                      <button className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                        <Bookmark className="w-4 h-4" />
                        Save
                      </button>
                      <button className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 mt-6">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Documentary Info
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Location:</span>
                          <span className="font-medium">
                            {formatLocation(selectedDoc.location)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Duration:</span>
                          <span className="font-medium">
                            {selectedDoc.duration}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Views:</span>
                          <span className="font-medium">
                            {selectedDoc.views?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Published:</span>
                          <span className="font-medium">
                            {new Date(
                              selectedDoc.published_date,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comments Modal */}
        {commentsModalOpen && selectedCommentItem && (
          <ContentCommentsModal
            isOpen={commentsModalOpen}
            onClose={() => {
              setCommentsModalOpen(false);
              setSelectedCommentItem(null);
              fetchDocumentaries();
            }}
            contentId={selectedCommentItem.id}
            contentType="documentaries"
            contentTitle={selectedCommentItem.title}
          />
        )}
      </div>
    </div>
  );
}
