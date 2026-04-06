"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  FaHome,
  FaEye,
  FaHeart,
  FaComment,
  FaBook,
  FaFilm,
  FaUsers,
  FaGlobe,
  FaChartLine,
  FaFire,
  FaStar,
  FaThumbsUp,
} from "react-icons/fa";

interface AnalyticsData {
  totalArticles: number;
  totalHeaderCards: number;
  totalCards: number;
  totalBooks: number;
  totalDocumentaries: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  historyItems: number;
  scienceItems: number;
  healthItems: number;
  psychologyItems: number;
  artsItems: number;
  philosophyItems: number;
  recentComments: any[];
  popularContent: any[];
  viewsLast7Days: { date: string; count: number }[];
  likesLast7Days: { date: string; count: number }[];
  commentsLast7Days: { date: string; count: number }[];
  uniqueVisitors: number;
  topArticles: any[];
  topDocumentaries: any[];
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "content" | "engagement">("overview");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoISOString = sevenDaysAgo.toISOString();

      // Fetch all queries individually to avoid TypeScript tuple issues
      const [
        articlesResult,
        headerCardsResult,
        cardsResult,
        booksResult,
        documentariesResult,
        historyResult,
        scienceResult,
        healthResult,
        psychologyResult,
        artsResult,
        philosophyResult,
      ] = await Promise.all([
        supabase.from("articles").select("*", { count: "exact", head: true }),
        supabase.from("header_cards").select("*", { count: "exact", head: true }),
        supabase.from("cards").select("*", { count: "exact", head: true }),
        supabase.from("books").select("*", { count: "exact", head: true }),
        supabase.from("documentaries").select("*", { count: "exact", head: true }),
        supabase.from("history_items").select("*", { count: "exact", head: true }),
        supabase.from("science_items").select("*", { count: "exact", head: true }),
        supabase.from("health_items").select("*", { count: "exact", head: true }),
        supabase.from("psychology_items").select("*", { count: "exact", head: true }),
        supabase.from("arts_items").select("*", { count: "exact", head: true }),
        supabase.from("philosophy_items").select("*", { count: "exact", head: true }),
      ]);

      const viewsResult = await supabase.from("content_likes").select("*", { count: "exact", head: true });
      const likesResult = await supabase.from("content_likes").select("*", { count: "exact", head: true });
      const commentsResult = await supabase.from("content_comments").select("*", { count: "exact", head: true });
      const uniqueVisitorsResult = await supabase.from("unique_visitors").select("*", { count: "exact", head: true });
      
      const recentCommentsResult = await supabase
        .from("content_comments")
        .select("*, content_type")
        .order("created_at", { ascending: false })
        .limit(10);
      
      const topArticlesResult = await supabase
        .from("articles")
        .select("id, title, views")
        .order("views", { ascending: false })
        .limit(5);
      
      const topDocumentariesResult = await supabase
        .from("documentaries")
        .select("id, title, views")
        .order("views", { ascending: false })
        .limit(5);
      
      const dailyViewsResult = await supabase
        .from("daily_views")
        .select("viewed_at")
        .gte("viewed_at", sevenDaysAgoISOString)
        .limit(1000);
      
      const dailyLikesResult = await supabase
        .from("content_likes")
        .select("created_at")
        .gte("created_at", sevenDaysAgoISOString)
        .limit(1000);
      
      const dailyCommentsResult = await supabase
        .from("content_comments")
        .select("created_at")
        .gte("created_at", sevenDaysAgoISOString)
        .limit(1000);

      // Process daily trends
      const viewsByDay = new Map<string, number>();
      const likesByDay = new Map<string, number>();
      const commentsByDay = new Map<string, number>();

      if (dailyViewsResult.data) {
        dailyViewsResult.data.forEach((item: any) => {
          const date = new Date(item.viewed_at).toISOString().split("T")[0];
          viewsByDay.set(date, (viewsByDay.get(date) || 0) + 1);
        });
      }

      if (dailyLikesResult.data) {
        dailyLikesResult.data.forEach((item: any) => {
          const date = new Date(item.created_at).toISOString().split("T")[0];
          likesByDay.set(date, (likesByDay.get(date) || 0) + 1);
        });
      }

      if (dailyCommentsResult.data) {
        dailyCommentsResult.data.forEach((item: any) => {
          const date = new Date(item.created_at).toISOString().split("T")[0];
          commentsByDay.set(date, (commentsByDay.get(date) || 0) + 1);
        });
      }

      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        last7Days.push({
          date: dateStr,
          views: viewsByDay.get(dateStr) || 0,
          likes: likesByDay.get(dateStr) || 0,
          comments: commentsByDay.get(dateStr) || 0,
        });
      }

      setData({
        totalArticles: articlesResult.count || 0,
        totalHeaderCards: headerCardsResult.count || 0,
        totalCards: cardsResult.count || 0,
        totalBooks: booksResult.count || 0,
        totalDocumentaries: documentariesResult.count || 0,
        historyItems: historyResult.count || 0,
        scienceItems: scienceResult.count || 0,
        healthItems: healthResult.count || 0,
        psychologyItems: psychologyResult.count || 0,
        artsItems: artsResult.count || 0,
        philosophyItems: philosophyResult.count || 0,
        totalViews: viewsResult.count || 0,
        totalLikes: likesResult.count || 0,
        totalComments: commentsResult.count || 0,
        uniqueVisitors: uniqueVisitorsResult.count || 0,
        recentComments: recentCommentsResult.data || [],
        popularContent: [],
        topArticles: topArticlesResult.data || [],
        topDocumentaries: topDocumentariesResult.data || [],
        viewsLast7Days: last7Days.map((d) => ({ date: d.date, count: d.views })),
        likesLast7Days: last7Days.map((d) => ({ date: d.date, count: d.likes })),
        commentsLast7Days: last7Days.map((d) => ({ date: d.date, count: d.comments })),
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaChartLine className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-xs text-gray-500">Track your content performance and engagement</p>
              </div>
            </div>
            <Link href="/admin" className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm text-gray-700">
              <FaHome size={14} /> Back to Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-6">
            <button onClick={() => setActiveTab("overview")} className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === "overview" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>Overview</button>
            <button onClick={() => setActiveTab("content")} className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === "content" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>Content Library</button>
            <button onClick={() => setActiveTab("engagement")} className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === "engagement" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>Engagement</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "overview" && (
          <>
            <div className="mb-8">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Key Metrics</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Views" value={data?.totalViews || 0} icon={FaEye} color="bg-blue-500" />
                <StatCard title="Total Likes" value={data?.totalLikes || 0} icon={FaHeart} color="bg-pink-500" />
                <StatCard title="Total Comments" value={data?.totalComments || 0} icon={FaComment} color="bg-green-500" />
                <StatCard title="Unique Visitors" value={data?.uniqueVisitors || 0} icon={FaUsers} color="bg-purple-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Content Distribution</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Articles</span><span className="text-sm font-medium text-gray-900">{data?.totalArticles || 0}</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((data?.totalArticles || 0) / Math.max(1, (data?.totalArticles || 0) + (data?.totalBooks || 0) + (data?.totalDocumentaries || 0))) * 100)}%` }}></div></div>
                  <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Books</span><span className="text-sm font-medium text-gray-900">{data?.totalBooks || 0}</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((data?.totalBooks || 0) / Math.max(1, (data?.totalArticles || 0) + (data?.totalBooks || 0) + (data?.totalDocumentaries || 0))) * 100)}%` }}></div></div>
                  <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Documentaries</span><span className="text-sm font-medium text-gray-900">{data?.totalDocumentaries || 0}</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((data?.totalDocumentaries || 0) / Math.max(1, (data?.totalArticles || 0) + (data?.totalBooks || 0) + (data?.totalDocumentaries || 0))) * 100)}%` }}></div></div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Content by Category</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2"><span className="text-sm text-gray-600">History</span><span className="text-sm font-medium text-gray-900">{data?.historyItems || 0}</span></div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2"><span className="text-sm text-gray-600">Science</span><span className="text-sm font-medium text-gray-900">{data?.scienceItems || 0}</span></div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2"><span className="text-sm text-gray-600">Health</span><span className="text-sm font-medium text-gray-900">{data?.healthItems || 0}</span></div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2"><span className="text-sm text-gray-600">Psychology</span><span className="text-sm font-medium text-gray-900">{data?.psychologyItems || 0}</span></div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2"><span className="text-sm text-gray-600">Arts</span><span className="text-sm font-medium text-gray-900">{data?.artsItems || 0}</span></div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2"><span className="text-sm text-gray-600">Philosophy</span><span className="text-sm font-medium text-gray-900">{data?.philosophyItems || 0}</span></div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Weekly Activity</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-2">Views (Last 7 Days)</p>
                  <div className="flex items-baseline gap-2"><span className="text-2xl font-bold text-gray-900">{data?.viewsLast7Days.reduce((sum, d) => sum + d.count, 0) || 0}</span><span className="text-xs text-gray-500">total views</span></div>
                  <div className="mt-3 flex items-center gap-1 text-xs">{data?.viewsLast7Days.map((day, i) => (<div key={i} className="flex-1 text-center"><div className="bg-blue-100 rounded-sm" style={{ height: `${Math.min(40, (day.count / Math.max(1, (data?.viewsLast7Days.reduce((s, d) => Math.max(s, d.count), 0) || 1))) * 40)}px` }}></div><span className="text-[10px] text-gray-400 mt-1 block">{new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}</span></div>))}</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-2">Likes (Last 7 Days)</p>
                  <div className="flex items-baseline gap-2"><span className="text-2xl font-bold text-gray-900">{data?.likesLast7Days.reduce((sum, d) => sum + d.count, 0) || 0}</span><span className="text-xs text-gray-500">total likes</span></div>
                  <div className="mt-3 flex items-center gap-1 text-xs">{data?.likesLast7Days.map((day, i) => (<div key={i} className="flex-1 text-center"><div className="bg-pink-100 rounded-sm" style={{ height: `${Math.min(40, (day.count / Math.max(1, (data?.likesLast7Days.reduce((s, d) => Math.max(s, d.count), 0) || 1))) * 40)}px` }}></div><span className="text-[10px] text-gray-400 mt-1 block">{new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}</span></div>))}</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-2">Comments (Last 7 Days)</p>
                  <div className="flex items-baseline gap-2"><span className="text-2xl font-bold text-gray-900">{data?.commentsLast7Days.reduce((sum, d) => sum + d.count, 0) || 0}</span><span className="text-xs text-gray-500">total comments</span></div>
                  <div className="mt-3 flex items-center gap-1 text-xs">{data?.commentsLast7Days.map((day, i) => (<div key={i} className="flex-1 text-center"><div className="bg-green-100 rounded-sm" style={{ height: `${Math.min(40, (day.count / Math.max(1, (data?.commentsLast7Days.reduce((s, d) => Math.max(s, d.count), 0) || 1))) * 40)}px` }}></div><span className="text-[10px] text-gray-400 mt-1 block">{new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}</span></div>))}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200"><h3 className="text-sm font-semibold text-gray-900">Recent Comments</h3></div>
              <div className="divide-y divide-gray-100">
                {data?.recentComments.slice(0, 5).map((comment: any) => (<div key={comment.id} className="px-5 py-3 hover:bg-gray-50"><p className="text-sm text-gray-700 line-clamp-2">{comment.comment}</p><div className="flex items-center gap-3 mt-2 text-xs text-gray-400"><span>{comment.user_name}</span><span>•</span><span>{new Date(comment.created_at).toLocaleDateString()}</span><span>•</span><span>{comment.content_type}</span></div></div>))}
                {(!data?.recentComments || data.recentComments.length === 0) && (<div className="px-5 py-8 text-center text-gray-500 text-sm">No comments yet</div>)}
              </div>
            </div>
          </>
        )}

        {activeTab === "content" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"><div className="flex items-center justify-between mb-3"><div className="p-2 bg-blue-100 rounded-lg"><FaBook className="w-4 h-4 text-blue-600" /></div><span className="text-2xl font-bold text-gray-800">{data?.totalArticles || 0}</span></div><h3 className="font-medium text-gray-900">Articles</h3><p className="text-xs text-gray-500 mt-1">Main news articles</p></div>
            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"><div className="flex items-center justify-between mb-3"><div className="p-2 bg-amber-100 rounded-lg"><FaStar className="w-4 h-4 text-amber-600" /></div><span className="text-2xl font-bold text-gray-800">{data?.totalHeaderCards || 0}</span></div><h3 className="font-medium text-gray-900">Header Cards</h3><p className="text-xs text-gray-500 mt-1">Featured header section cards</p></div>
            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"><div className="flex items-center justify-between mb-3"><div className="p-2 bg-green-100 rounded-lg"><FaThumbsUp className="w-4 h-4 text-green-600" /></div><span className="text-2xl font-bold text-gray-800">{data?.totalCards || 0}</span></div><h3 className="font-medium text-gray-900">Footer Cards</h3><p className="text-xs text-gray-500 mt-1">Footer section story cards</p></div>
            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"><div className="flex items-center justify-between mb-3"><div className="p-2 bg-indigo-100 rounded-lg"><FaBook className="w-4 h-4 text-indigo-600" /></div><span className="text-2xl font-bold text-gray-800">{data?.totalBooks || 0}</span></div><h3 className="font-medium text-gray-900">Books</h3><p className="text-xs text-gray-500 mt-1">Digital library books</p></div>
            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"><div className="flex items-center justify-between mb-3"><div className="p-2 bg-purple-100 rounded-lg"><FaFilm className="w-4 h-4 text-purple-600" /></div><span className="text-2xl font-bold text-gray-800">{data?.totalDocumentaries || 0}</span></div><h3 className="font-medium text-gray-900">Documentaries</h3><p className="text-xs text-gray-500 mt-1">Video documentaries</p></div>
            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"><div className="flex items-center justify-between mb-3"><div className="p-2 bg-teal-100 rounded-lg"><FaGlobe className="w-4 h-4 text-teal-600" /></div><span className="text-2xl font-bold text-gray-800">{data?.historyItems || 0}</span></div><h3 className="font-medium text-gray-900">History</h3><p className="text-xs text-gray-500 mt-1">Historical content</p></div>
          </div>
        )}

        {activeTab === "engagement" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden"><div className="px-5 py-4 border-b border-gray-200"><h3 className="text-sm font-semibold text-gray-900">Top Articles</h3></div><div className="divide-y divide-gray-100">{data?.topArticles.map((article, idx) => (<div key={article.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50"><div className="flex items-center gap-3"><span className="text-sm font-bold text-gray-400">#{idx + 1}</span><span className="text-sm text-gray-700 truncate max-w-[200px]">{article.title}</span></div><div className="flex items-center gap-1 text-sm text-gray-500"><FaEye className="w-3 h-3" /> {article.views?.toLocaleString() || 0}</div></div>))}{(!data?.topArticles || data.topArticles.length === 0) && (<div className="px-5 py-8 text-center text-gray-500 text-sm">No articles yet</div>)}</div></div>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden"><div className="px-5 py-4 border-b border-gray-200"><h3 className="text-sm font-semibold text-gray-900">Top Documentaries</h3></div><div className="divide-y divide-gray-100">{data?.topDocumentaries.map((doc, idx) => (<div key={doc.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50"><div className="flex items-center gap-3"><span className="text-sm font-bold text-gray-400">#{idx + 1}</span><span className="text-sm text-gray-700 truncate max-w-[200px]">{doc.title}</span></div><div className="flex items-center gap-1 text-sm text-gray-500"><FaEye className="w-3 h-3" /> {doc.views?.toLocaleString() || 0}</div></div>))}{(!data?.topDocumentaries || data.topDocumentaries.length === 0) && (<div className="px-5 py-8 text-center text-gray-500 text-sm">No documentaries yet</div>)}</div></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-5 text-center"><div className="inline-flex p-3 bg-blue-100 rounded-full mb-3"><FaEye className="w-5 h-5 text-blue-600" /></div><p className="text-2xl font-bold text-gray-900">{data?.totalViews?.toLocaleString() || 0}</p><p className="text-xs text-gray-500 mt-1">Total Views</p></div>
              <div className="bg-white rounded-lg border border-gray-200 p-5 text-center"><div className="inline-flex p-3 bg-pink-100 rounded-full mb-3"><FaHeart className="w-5 h-5 text-pink-600" /></div><p className="text-2xl font-bold text-gray-900">{data?.totalLikes?.toLocaleString() || 0}</p><p className="text-xs text-gray-500 mt-1">Total Likes</p></div>
              <div className="bg-white rounded-lg border border-gray-200 p-5 text-center"><div className="inline-flex p-3 bg-green-100 rounded-full mb-3"><FaComment className="w-5 h-5 text-green-600" /></div><p className="text-2xl font-bold text-gray-900">{data?.totalComments?.toLocaleString() || 0}</p><p className="text-xs text-gray-500 mt-1">Total Comments</p></div>
            </div>

            <div className="mt-8 bg-white rounded-lg border border-gray-200 p-5"><h3 className="text-sm font-semibold text-gray-900 mb-4">Engagement Rate</h3><div className="flex items-center gap-4"><div className="flex-1"><div className="flex justify-between text-sm text-gray-600 mb-1"><span>Likes per View</span><span>{(((data?.totalLikes || 0) / Math.max(1, data?.totalViews || 0)) * 100).toFixed(1)}%</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-pink-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((data?.totalLikes || 0) / Math.max(1, data?.totalViews || 0)) * 100)}%` }}></div></div></div><div className="flex-1"><div className="flex justify-between text-sm text-gray-600 mb-1"><span>Comments per View</span><span>{(((data?.totalComments || 0) / Math.max(1, data?.totalViews || 0)) * 100).toFixed(1)}%</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((data?.totalComments || 0) / Math.max(1, data?.totalViews || 0)) * 100)}%` }}></div></div></div></div></div>
          </>
        )}
      </div>
    </div>
  );
}