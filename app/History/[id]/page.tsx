import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  FaEye,
  FaStar,
  FaPlay,
  FaDownload,
  FaBook,
  FaFilm,
} from "react-icons/fa";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const { data, error } = await supabase
    .from("history_items")
    .select("title, description, cover_image")
    .eq("id", id)
    .single();

  if (error || !data) {
    return {
      title: "History Item Not Found",
      description: "The requested history item could not be found.",
    };
  }

  return {
    title: data.title,
    description: data.description || `Learn about ${data.title}`,
    openGraph: {
      title: data.title,
      description: data.description || `Learn about ${data.title}`,
      images: [data.cover_image],
      type: "article",
    },
  };
}

export default async function HistoryDetailPage({ params }: Props) {
  const { id } = await params;

  // Increment view count
  await supabase.rpc("increment_views", { row_id: id });

  const { data: item, error } = await supabase
    .from("history_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !item) {
    return notFound();
  }

  // Fetch related items
  const { data: related } = await supabase
    .from("history_items")
    .select("*")
    .eq("period", item.period)
    .neq("id", id)
    .limit(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <Link href="/" className="text-gray-500 hover:text-amber-600">
            Home
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href="/history" className="text-gray-500 hover:text-amber-600">
            History
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900 font-medium">{item.title}</span>
        </nav>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Cover Image */}
            <div className="lg:w-2/5 p-8 bg-gradient-to-br from-stone-100 to-amber-50">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src={item.cover_image}
                  alt={item.title}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute bottom-4 left-4">
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-bold text-white shadow-lg ${
                      item.type === "book"
                        ? "bg-gradient-to-r from-amber-500 to-orange-500"
                        : "bg-gradient-to-r from-blue-500 to-purple-500"
                    }`}
                  >
                    {item.type === "book"
                      ? "Historical Book"
                      : "Documentary Film"}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-white/80 backdrop-blur rounded-xl p-4 text-center">
                  <FaEye className="w-5 h-5 mx-auto text-gray-400 mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {item.views.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Views</div>
                </div>
                <div className="bg-white/80 backdrop-blur rounded-xl p-4 text-center">
                  <FaStar className="w-5 h-5 mx-auto text-amber-400 mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {item.rating}
                  </div>
                  <div className="text-xs text-gray-500">Rating</div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="lg:w-3/5 p-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {item.title}
              </h1>

              <div className="mb-6">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  {item.type === "book" ? (
                    <>
                      <FaBook className="w-5 h-5" />
                      <span className="text-lg">By {item.author}</span>
                    </>
                  ) : (
                    <>
                      <FaFilm className="w-5 h-5" />
                      <span className="text-lg">
                        Narrated by {item.narrator}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-stone-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500">Period</div>
                  <div className="font-bold text-gray-900">{item.period}</div>
                </div>
                <div className="bg-stone-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500">Region</div>
                  <div className="font-bold text-gray-900">{item.region}</div>
                </div>
                <div className="bg-stone-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500">Published</div>
                  <div className="font-bold text-gray-900">
                    {new Date(item.published_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <div className="bg-stone-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500">Language</div>
                  <div className="font-bold text-gray-900">{item.language}</div>
                </div>
              </div>

              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                {item.description}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-4">
                {item.type === "book" && item.pdf_url && (
                  <>
                    <a
                      href={item.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-3 text-lg"
                    >
                      <FaBook className="w-5 h-5" />
                      Read Now
                    </a>
                    <a
                      href={item.pdf_url}
                      download
                      className="flex-1 border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-3 text-lg"
                    >
                      <FaDownload className="w-5 h-5" />
                      Download PDF
                    </a>
                  </>
                )}

                {item.type === "documentary" && item.youtube_url && (
                  <>
                    <a
                      href={item.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center gap-3 text-lg"
                    >
                      <FaPlay className="w-5 h-5" />
                      Watch on YouTube
                    </a>
                    {item.duration && (
                      <div className="px-6 py-4 bg-gray-100 rounded-xl flex items-center gap-2">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-bold text-gray-900">
                          {item.duration}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Items */}
        {related && related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              You might also like
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((relatedItem) => (
                <Link
                  key={relatedItem.id}
                  href={`/history/${relatedItem.id}`}
                  className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group"
                >
                  <div className="relative h-48">
                    <Image
                      src={relatedItem.cover_image}
                      alt={relatedItem.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-2">
                      {relatedItem.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {relatedItem.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
