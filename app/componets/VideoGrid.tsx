"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { FaYoutube, FaCalendar, FaFolder } from "react-icons/fa";

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

// Helper function for YouTube thumbnails
const getYouTubeThumbnail = (url: string) => {
  if (!url) return null;
  const videoId = url.split("v=")[1]?.split("&")[0];
  return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
};

// Video Card Component for Izindi Video section
const VideoCard = ({ video }: { video: Video }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (videoRef.current) {
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

  const thumbnailUrl =
    video.thumbnail_url || getYouTubeThumbnail(video.youtube_url);

  return (
    <div className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div
        className="relative w-full h-[160px] bg-gray-200 overflow-hidden cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Thumbnail Image - visible when not hovering */}
        {!isHovering && thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        )}

        {/* Video - plays on hover */}
        <video
          ref={videoRef}
          src={video.video_url}
          className="w-full h-full object-cover"
          muted
          loop
          playsInline
          style={{ display: isHovering ? "block" : "none" }}
        />

        {/* Category Badge */}
        <div className="absolute top-2 left-2 z-10">
          <span className="px-1.5 py-0.5 bg-black bg-opacity-70 text-white text-[10px] rounded-full flex items-center gap-1">
            <FaFolder size={8} />
            {video.category}
          </span>
        </div>

        {/* Play Overlay */}
        {!isHovering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <div className="w-10 h-10 rounded-full bg-white bg-opacity-80 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-black ml-0.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-gray-900 mb-1 text-sm leading-tight line-clamp-2">
          {video.title}
        </h3>
        <p className="text-gray-600 mb-2 text-xs line-clamp-2">
          {video.description}
        </p>

        <div className="flex items-center justify-between flex-wrap gap-1">
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <div className="flex items-center gap-1">
              <FaCalendar size={10} />
              <span>
                {new Date(video.published_date).toLocaleDateString("rw-RW")}
              </span>
            </div>
          </div>

          <Link
            href={video.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5"
          >
            <button className="flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full hover:bg-gray-800 transition text-[10px] whitespace-nowrap">
              <FaYoutube size={10} className="text-white" />
              Reba Videwo Yose
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

const VideoGrid = () => {
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const videosPerPage = 6;

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("featured_order", { ascending: true })
      .order("published_date", { ascending: false });

    if (error) {
      console.error("Error fetching videos:", error);
    } else {
      setAllVideos(data || []);
    }

    setLoading(false);
  };

  const heroVideos = allVideos.slice(0, 3);
  const remainingVideos = allVideos.slice(3);

  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentRemainingVideos = remainingVideos.slice(
    indexOfFirstVideo,
    indexOfLastVideo,
  );
  const totalPages = Math.ceil(remainingVideos.length / videosPerPage);

  if (loading) {
    return (
      <div className="container mx-auto p-6 md:px-20 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-96 bg-gray-200 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (allVideos.length === 0) {
    return (
      <div className="container mx-auto p-6 md:px-20 py-8 text-center">
        <FaYoutube className="text-6xl text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">
          Nta video ziboneka
        </h3>
        <p className="text-gray-500">Hari ikindi gihe uze kureba</p>
      </div>
    );
  }

  const largeCard = heroVideos[0];
  const smallCards = heroVideos.slice(1, 3);

  return (
    <div className="container mx-auto p-6 md:px-20 py-8">
      {/* Hero Section Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Videwo
        </h1>
        <p className="text-gray-600">Ibyegeranyo bikoze mu mashusho</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-10 max-w-6xl mx-auto">
        {/* Large Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="relative w-full h-[280px] bg-gray-200 overflow-hidden">
              <video
                src={largeCard.video_url}
                className="object-cover w-full h-full"
                controls
                loop
                muted
                poster={
                  largeCard.thumbnail_url ||
                  getYouTubeThumbnail(largeCard.youtube_url) ||
                  undefined
                }
              />
            </div>

            <div className="p-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 line-clamp-2">
                {largeCard.title}
              </h2>
              <p className="text-gray-600 mb-6 text-justify line-clamp-4">
                {largeCard.description}
              </p>

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <FaCalendar size={12} />
                    <span>
                      {new Date(largeCard.published_date).toLocaleDateString(
                        "rw-RW",
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaFolder size={12} />
                    <span>{largeCard.category}</span>
                  </div>
                </div>

                <Link
                  href={largeCard.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1"
                >
                  <button className="flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full hover:bg-gray-800 transition text-xs whitespace-nowrap">
                    <FaYoutube size={12} className="text-white" />
                    REBA VIDEO YOSE
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Two Small Cards */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {smallCards.map((video) => (
            <div
              key={video.id}
              className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-[280px] h-[240px] bg-gray-200 overflow-hidden flex-shrink-0">
                  <video
                    src={video.video_url}
                    className="w-full h-full object-cover"
                    controls
                    muted
                    poster={
                      video.thumbnail_url ||
                      getYouTubeThumbnail(video.youtube_url) ||
                      undefined
                    }
                  />
                </div>

                <div className="p-4 flex-1">
                  <h3 className="text-base font-bold text-gray-900 mb-2 leading-tight line-clamp-2">
                    {video.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 text-justify line-clamp-3">
                    {video.description}
                  </p>

                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <FaCalendar size={12} />
                        <span>
                          {new Date(video.published_date).toLocaleDateString(
                            "rw-RW",
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaFolder size={12} />
                        <span>{video.category}</span>
                      </div>
                    </div>

                    <Link
                      href={video.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5"
                    >
                      <button className="flex items-center gap-5 px-3 py-1.5 bg-black text-white rounded-full hover:bg-gray-800 transition text-xs whitespace-nowrap">
                        <FaYoutube size={12} className="text-white" />
                        REBA VIDEO YOSE
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <br />

      {/* Izindi Video Section */}
      {remainingVideos.length > 0 && (
        <div className="mt-12">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Ibindi byegeranyo bigaragara
            </h2>
            <p className="text-gray-500 text-sm mt-1">Bimwe mu byo wakunda</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentRemainingVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
        </div>
      )}
    </div>
  );
};

export default VideoGrid;
