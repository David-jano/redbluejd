"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { FaPlay, FaYoutube, FaCalendar, FaFolder } from "react-icons/fa";

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  youtube_url: string;
  thumbnail_url: string;
  category: string;
  published_date: string;
  is_featured: boolean;
}

const VideoGrid = () => {
  const [featuredVideos, setFeaturedVideos] = useState<Video[]>([]);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const videosPerPage = 6;

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);

    // Fetch featured videos (limited to 6)
    const { data: featured, error: featuredError } = await supabase
      .from("videos")
      .select("*")
      .eq("is_featured", true)
      .order("featured_order", { ascending: true })
      .limit(6);

    if (featuredError) {
      console.error("Error fetching featured videos:", featuredError);
    } else {
      setFeaturedVideos(featured || []);
    }

    // Fetch all other videos (non-featured)
    const { data: all, error: allError } = await supabase
      .from("videos")
      .select("*")
      .eq("is_featured", false)
      .order("published_date", { ascending: false });

    if (allError) {
      console.error("Error fetching all videos:", allError);
    } else {
      setAllVideos(all || []);
    }

    setLoading(false);
  };

  // Pagination logic
  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = allVideos.slice(indexOfFirstVideo, indexOfLastVideo);
  const totalPages = Math.ceil(allVideos.length / videosPerPage);

  // Video Card Component with Hover Play
  const VideoCard = ({
    video,
    isFeatured = false,
  }: {
    video: Video;
    isFeatured?: boolean;
  }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isHovering, setIsHovering] = useState(false);

    const handleMouseEnter = () => {
      setIsHovering(true);
      if (videoRef.current && video.video_url) {
        videoRef.current
          .play()
          .catch((e) => console.log("Autoplay prevented:", e));
      }
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    };

    return (
      <div
        className={`bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group ${
          isFeatured ? "lg:col-span-2 lg:row-span-2" : ""
        }`}
      >
        {/* Video Container */}
        <div
          className="relative w-full bg-gray-900 overflow-hidden cursor-pointer"
          style={{ height: isFeatured ? "400px" : "220px" }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {video.video_url ? (
            <>
              <video
                ref={videoRef}
                src={video.video_url}
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
                poster={video.thumbnail_url}
              />
              {!isHovering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 transition-opacity group-hover:bg-opacity-20">
                  <div className="w-16 h-16 rounded-full bg-white bg-opacity-80 flex items-center justify-center">
                    <FaPlay className="text-black text-2xl ml-1" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <FaYoutube className="text-red-500 text-5xl" />
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded-full flex items-center gap-1">
              <FaFolder size={10} />
              {video.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3
            className={`font-bold text-gray-900 mb-2 leading-tight ${
              isFeatured ? "text-2xl" : "text-lg"
            }`}
          >
            {video.title}
          </h3>

          <p
            className={`text-gray-600 mb-4 line-clamp-2 ${
              isFeatured ? "text-base" : "text-sm"
            }`}
          >
            {video.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <FaCalendar size={12} />
                <span>
                  {new Date(video.published_date).toLocaleDateString("rw-RW")}
                </span>
              </div>
            </div>

            <Link href={video.youtube_url} target="_blank">
              <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition text-sm">
                <FaYoutube size={16} />
                Reba Videwo yose
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 md:px-20 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-96 bg-gray-200 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 md:px-20 py-8">
      {/* Hero Section - Featured Videos */}
      {featuredVideos.length > 0 && (
        <div className="mb-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Videwo 
            </h1>
            <p className="text-gray-600">
              Ibyegeranyo bikoze mu mashusho
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {featuredVideos.map((video, index) => (
              <VideoCard
                key={video.id}
                video={video}
                isFeatured={index === 0}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Videos Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Izindi Video</h2>
            <p className="text-gray-500 text-sm mt-1">
              Izindi Videwo wakunda
            </p>
          </div>
          <div className="text-sm text-gray-500">{allVideos.length} videos</div>
        </div>

        {currentVideos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <FaYoutube className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              Nta video zindi zihari ubu
            </h3>
            <p className="text-gray-500">Wazongera kureba ikindi gihe</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Inyuma
                </button>

                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg transition ${
                          currentPage === page
                            ? "bg-orange-500 text-white"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Imbere
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VideoGrid;
