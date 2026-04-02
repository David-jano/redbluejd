"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import {
  Search,
  Eye,
  User,
  BookOpen,
  Bookmark,
  Share2,
  ChevronDown,
  Grid,
  List,
  Download,
  Play,
  Loader2,
  Calendar,
} from "lucide-react";
// NEW IMPORTS
import { FaHeart, FaComment } from "react-icons/fa";
import ContentCommentsModal from "../componets/ContentCommentsModal";
import CardLikeButton from "../componets/CardLikeButton";

interface Book {
  id: number;
  title: string;
  author: string;
  published_date: string;
  views: number;
  description: string;
  cover_image: string;
  genre: string[];
  pages: number;
  language: string;
  isbn: string | null;
  publisher: string | null;
  is_featured: boolean | null;
  is_new: boolean | null;
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
  item: Book;
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
          <iframe
            src={pdfUrl}
            className="w-full h-full"
            title={item.title}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-stone-500">
            PDF not available
          </div>
        )}
      </div>
    </div>
  );
};

export default function BooksPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedPDF, setSelectedPDF] = useState<Book | null>(null);
  const [showActions, setShowActions] = useState<number | null>(null);

  // NEW: State for comments modal
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedCommentItem, setSelectedCommentItem] = useState<Book | null>(null);

  // State for fetched data
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalViews: 0,
    totalGenres: 0,
    totalLikes: 0,
  });

  const genres: string[] = [
    "all",
    "fiction",
    "non-fiction",
    "science",
    "technology",
    "history",
    "biography",
    "fantasy",
    "mystery",
    "romance",
  ];

  // Fetch data from Supabase
  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch comment counts for all items
      const { data: commentData } = await supabase
        .from("content_comments")
        .select("content_id")
        .eq("content_type", "books");

      // Fetch like counts for all items
      const { data: likeData } = await supabase
        .from("content_likes")
        .select("content_id")
        .eq("content_type", "books");

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

      setBooks(itemsWithCounts);
      calculateStats(itemsWithCounts);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Book[]) => {
    const totalBooks = data.length;
    const totalViews = data.reduce((acc, i) => acc + (i.views || 0), 0);
    const totalLikes = data.reduce((acc, i) => acc + (i.like_count || 0), 0);
    
    // Get unique genres
    const allGenres = data.flatMap(book => book.genre || []);
    const uniqueGenres = new Set(allGenres).size;

    setStats({
      totalBooks,
      totalViews,
      totalGenres: uniqueGenres,
      totalLikes,
    });
  };

  // 🔥 VIEW TRACKING FUNCTION
  const trackView = async (book: Book) => {
    try {
      const newViews = (book.views || 0) + 1;
      
      // Update in database
      const { error } = await supabase
        .from("books")
        .update({ views: newViews })
        .eq("id", book.id);

      if (error) throw error;

      // Update local state
      setBooks(prevBooks => 
        prevBooks.map(b => 
          b.id === book.id 
            ? { ...b, views: newViews } 
            : b
        )
      );

      // Update stats
      setStats(prev => ({
        ...prev,
        totalViews: prev.totalViews + 1
      }));

      console.log(`View tracked for book: ${book.title} (Total: ${newViews})`);
      return true;
    } catch (error) {
      console.error("Error tracking view:", error);
      return false;
    }
  };

  // Filter and sort
  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre =
      selectedGenre === "all" || (book.genre || []).includes(selectedGenre);
    return matchesSearch && matchesGenre;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
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
  const handleBookClick = async (book: Book) => {
    // Track view when book modal opens
    await trackView(book);
    setSelectedBook(book);
  };

  const handleRead = async (book: Book) => {
    if (book.pdf_url) {
      // Track view when PDF is opened
      await trackView(book);
      setSelectedPDF(book);
    } else {
      alert("PDF not available for this book");
    }
  };

  const handleDownload = (book: Book) => {
    if (book.pdf_url) {
      window.open(book.pdf_url, "_blank");
    } else {
      alert("PDF not available for download");
    }
  };

  // 🔥 TRACK VIEW WHEN PDF VIEWER OPENS
  const handlePDFViewTracked = async () => {
    if (selectedPDF) {
      await trackView(selectedPDF);
    }
  };

  // NEW: Handle opening comments modal
  const handleOpenComments = (book: Book, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    setSelectedCommentItem(book);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading our library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-black bg-clip-text mb-4">
            Welcome to our Digital Library
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover your next favorite book from our curated collection
          </p>
        </div>

        {/* Stats Section - Shows REAL view counts! */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={BookOpen} label="Total Books" value={stats.totalBooks.toString()} />
          <StatCard icon={Eye} label="Total Views" value={stats.totalViews.toLocaleString()} />
          <StatCard icon={BookOpen} label="Genres" value={stats.totalGenres.toString()} />
          <StatCard icon={FaHeart} label="Total Likes" value={stats.totalLikes.toLocaleString()} />
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
                placeholder="Search books or authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative">
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  {genres.map((tag: string) => (
                    <option key={tag} value={tag}>
                      {tag === "all"
                        ? "All Genres"
                        : tag.charAt(0).toUpperCase() + tag.slice(1)}
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
                  className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                  className={`p-2 rounded-lg transition-all duration-200 ${viewMode === "grid" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all duration-200 ${viewMode === "list" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Books Grid */}
        {sortedBooks.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No books found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filters
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
            {sortedBooks.map((book) => (
              <div
                key={book.id}
                className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer overflow-hidden ${
                  viewMode === "list" ? "flex" : "h-full flex flex-col"
                }`}
                onMouseEnter={() => setShowActions(book.id)}
                onMouseLeave={() => setShowActions(null)}
                onClick={() => handleBookClick(book)}
              >
                {/* Cover Image */}
                <div
                  className={`relative overflow-hidden bg-gray-100 ${
                    viewMode === "list" ? "w-32 flex-shrink-0" : "h-48"
                  }`}
                >
                  <Image
                    src={book.cover_image}
                    alt={book.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 space-y-2">
                    {book.is_featured && (
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                        Featured
                      </span>
                    )}
                    {book.is_new && (
                      <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                        New
                      </span>
                    )}
                  </div>

                  {/* View Count Badge */}
                  <div className="absolute bottom-3 right-3">
                    <span className="bg-black/75 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {book.views?.toLocaleString() || 0}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div
                    className={`absolute top-3 right-3 transition-all duration-300 ${
                      showActions === book.id ? "opacity-100" : "opacity-0"
                    } space-y-2`}
                  >
                    <button 
                      className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add bookmark functionality
                      }}
                    >
                      <Bookmark className="w-4 h-4 text-gray-600" />
                    </button>
                    <button 
                      className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add share functionality
                      }}
                    >
                      <Share2 className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Quick Actions Overlay */}
                  <div
                    className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-all duration-300 ${
                      showActions === book.id
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="flex gap-3">
                      {book.pdf_url && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRead(book);
                          }}
                          className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 transition-colors"
                        >
                          <Play className="w-5 h-5" />
                        </button>
                      )}
                      {book.pdf_url && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(book);
                          }}
                          className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 transition-colors"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Book Info */}
                <div
                  className={`p-4 flex-1 flex flex-col ${viewMode === "list" ? "flex-1" : ""}`}
                >
                  <div className="mb-3 flex-1">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                      {book.title}
                    </h3>

                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center text-gray-600">
                        <User className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">{book.author}</span>
                      </div>
                      
                      {/* Card Like Button - Directly on the card */}
                      <CardLikeButton 
                        contentId={book.id}
                        contentType="books"
                        initialCount={book.like_count || 0}
                        onLikeChange={(newCount) => {
                          // Update the book's like count in local state
                          setBooks(prevBooks => 
                            prevBooks.map(b => 
                              b.id === book.id ? { ...b, like_count: newCount } : b
                            )
                          );
                          // Update stats
                          setStats(prev => ({
                            ...prev,
                            totalLikes: prev.totalLikes + (newCount - (book.like_count || 0))
                          }));
                        }}
                      />
                      
                      <button 
                        onClick={(e) => handleOpenComments(book, e)}
                        className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        <FaComment className="w-4 h-4" />
                        <span className="text-xs font-medium">{book.comment_count || 0}</span>
                      </button>
                    </div>

                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {book.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
                    <div className="flex flex-wrap gap-1">
                      {(book.genre || []).slice(0, 2).map((tag: string) => (
                        <span
                          key={tag}
                          className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{book.pages}p</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Book Detail Modal */}
        {selectedBook && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex flex-col lg:flex-row">
                {/* Book Cover */}
                <div className="lg:w-2/5 p-8 bg-gradient-to-br from-blue-50 to-purple-50">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
                    <Image
                      src={selectedBook.cover_image}
                      alt={selectedBook.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Book Details */}
                <div className="lg:w-3/5 p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {selectedBook.title}
                      </h2>
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex items-center text-gray-600">
                          <User className="w-5 h-5 mr-2" />
                          <span className="text-lg font-medium">
                            {selectedBook.author}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <Eye className="w-5 h-5 mr-2" />
                          <span>
                            {selectedBook.views?.toLocaleString() || 0} views
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedBook(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors text-2xl p-2 hover:bg-gray-100 rounded-full"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-6">
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {selectedBook.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 py-4 bg-blue-50 rounded-xl p-4">
                      <div>
                        <span className="text-sm text-gray-500">Published</span>
                        <p className="font-medium">
                          {new Date(
                            selectedBook.published_date,
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Pages</span>
                        <p className="font-medium">{selectedBook.pages}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Language</span>
                        <p className="font-medium">{selectedBook.language}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Publisher</span>
                        <p className="font-medium">{selectedBook.publisher || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(selectedBook.genre || []).map((genre) => (
                        <span
                          key={genre}
                          className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium border border-blue-100"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>

                    <div className="flex space-x-4 pt-6">
                      {selectedBook.pdf_url ? (
                        <>
                          <button
                            onClick={() => {
                              handleRead(selectedBook);
                              setSelectedBook(null);
                            }}
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-3 shadow-lg"
                          >
                            <Play className="w-5 h-5" />
                            Read Now
                          </button>
                          <button
                            onClick={() => {
                              handleDownload(selectedBook);
                              setSelectedBook(null);
                            }}
                            className="flex-1 border border-gray-300 text-gray-700 py-4 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
                          >
                            <Download className="w-5 h-5" />
                            Download PDF
                          </button>
                        </>
                      ) : (
                        <div className="w-full text-center py-4 text-gray-500">
                          PDF not available for this book
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PDF Viewer with view tracking */}
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
              fetchBooks();
            }}
            contentId={selectedCommentItem.id}
            contentType="books"
            contentTitle={selectedCommentItem.title}
          />
        )}
      </div>
    </div>
  );
}