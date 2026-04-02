"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  FaEye,
  FaBook,
  FaFilm,
  FaUsers,
  FaStar,
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaComments,
  FaShare,
  FaClock,
  FaMapMarkerAlt,
  FaGlobe,
  FaHeart,
  FaDownload,
} from "react-icons/fa";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ContentStats {
  id: number;
  title: string;
  views: number;
  rating: number;
  type: string;
  category: string;
  table_name: string;
}

interface DailyView {
  date: string;
  views: number;
  unique: number;
}

interface CategoryStat {
  name: string;
  value: number;
  color: string;
}

interface TypeStat {
  name: string;
  value: number;
}

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">(
    "month",
  );
  const [loading, setLoading] = useState(true);
  const [contentStats, setContentStats] = useState<ContentStats[]>([]);
  const [dailyViews, setDailyViews] = useState<DailyView[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [typeStats, setTypeStats] = useState<TypeStat[]>([]);
  const [totals, setTotals] = useState({
    totalViews: 0,
    totalContent: 0,
    avgRating: 0,
    activeUsers: 0,
    growth: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();

    switch (timeframe) {
      case "week":
        start.setDate(start.getDate() - 7);
        break;
      case "month":
        start.setMonth(start.getMonth() - 1);
        break;
      case "year":
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    return { start: start.toISOString(), end: end.toISOString() };
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();

      // Define all content tables with their display names
      const tables = [
        {
          name: "articles",
          type: "article",
          category: "News",
          label: "Main Articles",
        },
        {
          name: "history_items",
          type: "history",
          category: "History",
          label: "Amateka",
        },
        {
          name: "science_items",
          type: "science",
          category: "Science",
          label: "Siyansi",
        },
        {
          name: "books",
          type: "book",
          category: "Literature",
          label: "Ibitabo",
        },
        {
          name: "health_items",
          type: "health",
          category: "Health",
          label: "Ubuzima",
        },
        {
          name: "psychology_items",
          type: "psychology",
          category: "Psychology",
          label: "Ubumenyamuntu",
        },
        {
          name: "arts_items",
          type: "arts",
          category: "Arts",
          label: "Ubugeni",
        },
        {
          name: "documentaries",
          type: "documentary",
          category: "Documentary",
          label: "Ibyegeranyo",
        },
        {
          name: "philosophy_items",
          type: "philosophy",
          category: "Philosophy",
          label: "Filozofiya",
        },
      ];

      let allContent: ContentStats[] = [];
      let totalViews = 0;
      let totalRating = 0;
      let ratingCount = 0;

      // Category and type aggregators
      const categoryMap = new Map<string, number>();
      const typeMap = new Map<string, number>();

      // Fetch data from each table
      for (const table of tables) {
        const { data, error } = await supabase
          .from(table.name)
          .select("id, title, views, rating")
          .order("views", { ascending: false })
          .limit(50);

        if (!error && data && data.length > 0) {
          console.log(`Fetched ${data.length} items from ${table.name}`);

          data.forEach((item: any) => {
            // Only add if there are views or title exists
            if (item.views > 0 || item.title) {
              // Add to content stats
              allContent.push({
                id: item.id,
                title: item.title || `Untitled ${table.label}`,
                views: item.views || 0,
                rating: item.rating || 0,
                type: table.type,
                category: table.category,
                table_name: table.name,
              });

              // Aggregate totals
              totalViews += item.views || 0;

              if (item.rating) {
                totalRating += item.rating;
                ratingCount++;
              }

              // Category stats (total views per category)
              const currentCat = categoryMap.get(table.category) || 0;
              categoryMap.set(table.category, currentCat + (item.views || 0));

              // Type stats (book vs documentary)
              if (item.type) {
                const typeKey =
                  item.type === "book" ? "Books" : "Documentaries";
                const currentType = typeMap.get(typeKey) || 0;
                typeMap.set(typeKey, currentType + (item.views || 0));
              }
            }
          });
        } else if (error) {
          console.log(`Error fetching from ${table.name}:`, error.message);
        }
      }

      console.log("Total views calculated:", totalViews);
      console.log("Total content items:", allContent.length);

      // Generate mock daily views for demo (replace with real data later)
      const mockDaily: DailyView[] = [];
      const days = timeframe === "week" ? 7 : timeframe === "month" ? 30 : 365;
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));
        mockDaily.push({
          date: date.toISOString().split("T")[0],
          views: Math.floor(Math.random() * 500) + 100,
          unique: Math.floor(Math.random() * 300) + 50,
        });
      }

      // Calculate growth (mock for now)
      const growth = Math.random() * 20 - 5;

      // Prepare category stats for pie chart with colors
      const categoryColors = [
        "#f59e0b",
        "#3b82f6",
        "#10b981",
        "#8b5cf6",
        "#ef4444",
        "#ec4899",
        "#14b8a6",
        "#f97316",
        "#6366f1",
        "#84cc16",
      ];

      const categoryArray: CategoryStat[] = Array.from(categoryMap.entries())
        .map(([name, value], index) => ({
          name,
          value,
          color: categoryColors[index % categoryColors.length],
        }))
        .filter((stat) => stat.value > 0) // Only show categories with views
        .sort((a, b) => b.value - a.value);

      // Prepare type stats
      const typeArray: TypeStat[] = Array.from(typeMap.entries()).map(
        ([name, value]) => ({ name, value }),
      );

      // Sort all content by views to get top performers
      const sortedContent = allContent.sort((a, b) => b.views - a.views);

      setContentStats(sortedContent.slice(0, 15)); // Top 15 content items
      setDailyViews(mockDaily);
      setCategoryStats(categoryArray);
      setTypeStats(typeArray);

      setTotals({
        totalViews,
        totalContent: allContent.length,
        avgRating: ratingCount > 0 ? totalRating / ratingCount : 0,
        activeUsers: Math.floor(Math.random() * 200) + 50, // Mock for now
        growth: Math.round(growth * 10) / 10,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    change,
    icon,
    color,
    suffix = "",
  }: any) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold mt-1 text-gray-800">
            {typeof value === "number" ? value.toLocaleString() : value}
            {suffix}
          </p>
          {change !== undefined && (
            <p
              className={`text-sm mt-2 flex items-center gap-1 ${
                change >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {change >= 0 ? (
                <FaArrowUp className="w-3 h-3" />
              ) : (
                <FaArrowDown className="w-3 h-3" />
              )}
              {Math.abs(change)}% vs previous period
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Loading analytics from all content tables...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Analytics Dashboard
            </h1>
            <p className="text-gray-500 mt-1">
              Tracking {totals.totalContent} content items - Total Views:{" "}
              {totals.totalViews.toLocaleString()}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last 365 Days</option>
            </select>

            <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2">
              <FaDownload className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Views"
            value={totals.totalViews}
            change={totals.growth}
            icon={<FaEye className="w-6 h-6 text-white" />}
            color="bg-gradient-to-r from-blue-500 to-blue-600"
          />
          <StatCard
            title="Total Content"
            value={totals.totalContent}
            icon={<FaBook className="w-6 h-6 text-white" />}
            color="bg-gradient-to-r from-green-500 to-green-600"
          />
          <StatCard
            title="Active Users"
            value={totals.activeUsers}
            icon={<FaUsers className="w-6 h-6 text-white" />}
            color="bg-gradient-to-r from-purple-500 to-purple-600"
          />
          <StatCard
            title="Avg. Rating"
            value={totals.avgRating.toFixed(1)}
            suffix="/5"
            icon={<FaStar className="w-6 h-6 text-white" />}
            color="bg-gradient-to-r from-yellow-500 to-yellow-600"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Views Trend */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaChartLine className="text-blue-500" />
              Views Trend
            </h2>
            {dailyViews.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyViews}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="#f59e0b"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="unique"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No view data available for this period
              </div>
            )}
          </div>

          {/* Content by Category */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaGlobe className="text-green-500" />
              Views by Category
            </h2>
            {categoryStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent = 0 }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No category data available
              </div>
            )}
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Type Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaFilm className="text-purple-500" />
              Books vs Documentaries
            </h2>
            {typeStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No type data available
              </div>
            )}
          </div>

          {/* Engagement Metrics */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaHeart className="text-red-500" />
              Quick Stats
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <FaEye className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-800">
                  {totals.totalViews.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Total Views</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <FaBook className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-800">
                  {totals.totalContent}
                </p>
                <p className="text-sm text-gray-500">Content Items</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <FaUsers className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-800">
                  {totals.activeUsers}
                </p>
                <p className="text-sm text-gray-500">Active Users</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <FaStar className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-800">
                  {totals.avgRating.toFixed(1)}
                </p>
                <p className="text-sm text-gray-500">Avg Rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Content Table - Shows most viewed content across ALL categories */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              🏆 Top Performing Content (Most Viewed)
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Ranked by views across all categories
            </p>
          </div>

          {contentStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contentStats.map((item, index) => {
                    // Determine medal for top 3
                    let medal = null;
                    if (index === 0) medal = "🥇";
                    else if (index === 1) medal = "🥈";
                    else if (index === 2) medal = "🥉";

                    return (
                      <tr
                        key={`${item.table_name}-${item.id}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {medal ? (
                            <span className="text-xl">{medal}</span>
                          ) : (
                            <span className="text-gray-500">#{index + 1}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.title?.length > 40
                            ? `${item.title.substring(0, 40)}...`
                            : item.title || "Untitled"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.type === "book" || item.type === "Books"
                                ? "bg-green-50 text-green-700"
                                : "bg-purple-50 text-purple-700"
                            }`}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                          {item.views.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900 mr-1">
                              {item.rating.toFixed(1)}
                            </span>
                            <FaStar className="w-4 h-4 text-yellow-400" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-400 mb-2">No content data available</p>
              <p className="text-sm text-gray-500">
                Make sure your tables have data with views
              </p>
            </div>
          )}
        </div>

        {/* Category Summary */}
        {categoryStats.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Category Performance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryStats.slice(0, 6).map((cat, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg shadow p-4 border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    ></div>
                    <h3 className="font-semibold text-gray-700">{cat.name}</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {cat.value.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">total views</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
