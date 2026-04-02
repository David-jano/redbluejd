"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
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
// NEW IMPORTS
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
  // NEW: Add comment and like counts
  comment_count?: number;
  like_count?: number;
}

export default function DocumentariesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedDoc, setSelectedDoc] = useState<Documentary | null>(null);
  const [showActions, setShowActions] = useState<number | null>(null);

  // NEW: State for comments modal
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedCommentItem, setSelectedCommentItem] = useState<Documentary | null>(null);

  // State for fetched data
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

  // Fetch data from Supabase
  useEffect(() => {
    fetchDocumentaries();
  }, []);

  const fetchDocumentaries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("documentaries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch comment counts for all items
      const { data: commentData } = await supabase
        .from("content_comments")
        .select("content_id")
        .eq("content_type", "documentaries");

      // Fetch like counts for all items
      const { data: likeData } = await supabase
        .from("content_likes")
        .select("content_id")
        .eq("content_type", "documentaries");

      // Create maps for counts
      const commentMap = new Map();
      if (commentData) {
        commentData.forEach((item: any) => {
          commentMap.set(item.content_id, (commentMap.get(item.content_id) || 0) + 1);
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
    const totalLikes = data.reduce((acc, doc) => acc + (doc.like_count || 0), 0);

    // Calculate total hours from duration strings (e.g., "18:04", "1h 30m")
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

  // 🔥 VIEW TRACKING FUNCTION
  const trackView = async (doc: Documentary) => {
    try {
      const newViews = (doc.views || 0) + 1;
      
      // Update in database
      const { error } = await supabase
        .from("documentaries")
        .update({ views: newViews })
        .eq("id", doc.id);

      if (error) throw error;

      // Update local state
      setDocumentaries(prevDocs => 
        prevDocs.map(d => 
          d.id === doc.id 
            ? { ...d, views: newViews } 
            : d
        )
      );

      // Update stats
      setStats(prev => ({
        ...prev,
        totalViews: prev.totalViews + 1
      }));

      console.log(`View tracked for: ${doc.title} (Total: ${newViews})`);
      return true;
    } catch (error) {
      console.error("Error tracking view:", error);
      return false;
    }
  };

  // Filter and sort
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

  // 🔥 UPDATED HANDLERS WITH VIEW TRACKING
  const handlePlay = async (doc: Documentary) => {
    // Track view when documentary is played
    await trackView(doc);
    window.open(doc.youtube_url, "_blank");
  };

  const handleDocClick = async (doc: Documentary) => {
    // Track view when documentary is clicked
    await trackView(doc);
    setSelectedDoc(doc);
  };

  // NEW: Handle opening comments modal
  const handleOpenComments = (doc: Documentary, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
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
        {/* Header - EXACTLY as you had it */}
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

        {/* Stats Section - Now with 5 cards horizontal */}
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

        {/* Search & Filters - EXACTLY as you had it */}
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

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                >
                  {locations.map((location: string) => (
                    <option key={location} value={location}>
                      {location === "all"
                        ? "All Locations"
                        : formatLocation(location)}
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
                  className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="views">Most Views</option>
                  <option value="title">Title A-Z</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all duration-200 ${viewMode === "grid" ? "bg-white shadow-sm text-green-600" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all duration-200 ${viewMode === "list" ? "bg-white shadow-sm text-green-600" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Documentaries Grid - EXACTLY as you had it, but with likes/comments */}
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
            className={`${
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-6"
            }`}
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
                {/* Thumbnail with Play Button */}
                <div
                  className={`relative overflow-hidden ${
                    viewMode === "list" ? "w-48 flex-shrink-0" : "h-48"
                  }`}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={doc.thumbnail}
                      alt={doc.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* View Count Badge */}
                  <div className="absolute bottom-3 right-3 bg-black/75 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {doc.views?.toLocaleString() || 0}
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute bottom-3 left-3 bg-black/75 text-white text-xs px-2 py-1 rounded-full">
                    {doc.duration}
                  </div>

                  {/* Location Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {formatLocation(doc.location)}
                    </span>
                  </div>

                  {/* Featured/New Badges */}
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

                  {/* Action Buttons */}
                  <div
                    className={`absolute top-3 right-3 transition-all duration-300 ${
                      showActions === doc.id ? "opacity-100" : "opacity-0"
                    } space-y-2`}
                  >
                    <button
                      className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Bookmark functionality
                      }}
                    >
                      <Bookmark className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Share functionality
                      }}
                    >
                      <Share2 className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Play Button Overlay */}
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

                      {/* Stats row with views, likes, and comments */}
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{doc.views?.toLocaleString() || 0}</span>
                        </div>
                        
                        {/* NEW: Like Button */}
                        <CardLikeButton 
                          contentId={doc.id}
                          contentType="documentaries"
                          initialCount={doc.like_count || 0}
                          onLikeChange={(newCount) => {
                            setDocumentaries(prevDocs => 
                              prevDocs.map(d => 
                                d.id === doc.id ? { ...d, like_count: newCount } : d
                              )
                            );
                          }}
                        />
                        
                        {/* NEW: Comment Button */}
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
                {/* Video Player */}
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
                    {/* Cover Image in Modal */}
                    <div className="w-24 h-32 relative rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={selectedDoc.thumbnail}
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

                {/* Documentary Details Sidebar */}
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

        {/* NEW: Comments Modal */}
        {commentsModalOpen && selectedCommentItem && (
          <ContentCommentsModal
            isOpen={commentsModalOpen}
            onClose={() => {
              setCommentsModalOpen(false);
              setSelectedCommentItem(null);
              // Refresh comment counts when modal closes
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