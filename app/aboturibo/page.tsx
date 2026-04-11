"use client";

import Image from "next/image";
import TestimonialsSection from "../componets/TestimonialsSection";
import { useRef, useState } from "react";

export default function Aboturibo() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayVideo = () => {
    setVideoError(null);
    setIsVideoPlaying(true);

    // Small delay to ensure modal is rendered
    setTimeout(() => {
      if (videoRef.current) {
        console.log("Attempting to play video...");
        const playPromise = videoRef.current.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Video playing successfully");
            })
            .catch((error) => {
              console.log("Playback failed:", error);
              setVideoError("Video playback failed. Please try again.");
            });
        }
      }
    }, 100);
  };

  const handleCloseVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsVideoPlaying(false);
    setVideoError(null);
  };

  const handleVideoError = () => {
    console.log("Video error event triggered");
    if (videoRef.current) {
      let errorMessage = "Video failed to load. ";
      switch (videoRef.current.error?.code) {
        case 1:
          errorMessage += "The video loading was aborted.";
          break;
        case 2:
          errorMessage += "A network error caused the video download to fail.";
          break;
        case 3:
          errorMessage += "The video was corrupted or not supported.";
          break;
        case 4:
          errorMessage += "The video format is not supported.";
          break;
        default:
          errorMessage += "Please check the video file and try again.";
      }
      setVideoError(errorMessage);
    }
  };

  return (
    <>
      <section className="bg-gray-50 py-16 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Side - Circular Images */}
            <div className="relative flex justify-center lg:justify-start">
              <div className="relative w-full max-w-md">
                {/* Main large circle - center */}
                <div className="relative w-80 h-80 mx-auto">
                  <div className="w-full h-full rounded-full overflow-hidden shadow-lg">
                    <Image
                      src="/editing.jpg"
                      alt="Student with headphones"
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                </div>

                {/* Top right small circle */}
                <div className="absolute -top-8 right-8 w-24 h-24 rounded-full overflow-hidden shadow-lg">
                  <Image
                    src="/recording.jpg"
                    alt="Student learning"
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Middle left circle */}
                <div className="absolute top-1/2 -left-12 transform -translate-y-1/2 w-20 h-20 rounded-full overflow-hidden shadow-lg">
                  <Image
                    src="/script.jpg"
                    alt="Student with equipment"
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Bottom left circle */}
                <div className="absolute bottom-8 -left-8 w-32 h-32 rounded-full overflow-hidden shadow-lg">
                  <Image
                    src="/recording.jpg"
                    alt="Students collaborating"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Right Side - Content */}
            <div className="space-y-6">
              <div>
                <h4 className="text-orange-500 font-semibold text-sm uppercase tracking-wide mb-4">
                  ABO TURIBO
                </h4>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                  Turi Ikigo cy’Ikoranabuhanga n’Ubucuruzi gihanga udushya.
                </h2>
              </div>

              <p className="text-gray-600 text-lg leading-relaxed text-justify">
                RedBlue JD Ltd ni kompanyi nyarwanda ikora ibijyanye na
                media-production n’architecture, yashinzwe na Jackson
                Dushimimana. Yatangiye gushyira hanze documentaries kuri YouTube
                mu 2015, ubu ikaba ifite abarenga miliyoni 1.5 bayikurikira
                ndetse ikaba yarahawe Silver na Gold Play Button. Yanditswe muri
                RDB mu 2018 kandi ikorera n’itsinda ry’abantu bari hagati ya 20.
                Mu mishinga yayo, imaze guhugura no guha amahirwe y’akazi
                urubyiruko rurenze 100, bamwe muri bo batangije kompanyi zabo za
                media.
              </p>

              {/* Video Button */}
              <div className="flex items-center space-x-4 pt-4">
                <button
                  onClick={handlePlayVideo}
                  className="flex items-center space-x-3 group"
                >
                  <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center shadow-lg group-hover:bg-orange-600 transition-colors duration-200">
                    <svg
                      className="w-6 h-6 text-white ml-1"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-500 mb-1">
                      Kanda Urebe Amateka Yacu
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      REBA VIDEWO
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal - FIXED VERSION */}
      {isVideoPlaying && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-6xl">
            {/* Close Button */}
            <button
              onClick={handleCloseVideo}
              className="absolute -top-12 right-0 text-white hover:text-orange-500 transition-colors flex items-center space-x-2 z-10"
            >
              <span>Funga</span>
              <svg
                className="w-6 h-6"
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

            {/* Video Container - FIXED */}
            <div className="bg-black rounded-lg overflow-hidden shadow-2xl">
              {videoError ? (
                <div className="bg-gray-900 flex flex-col items-center justify-center text-white p-8 min-h-[400px]">
                  <svg
                    className="w-16 h-16 text-red-500 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-lg text-center mb-2">{videoError}</p>
                  <p className="text-sm text-gray-400 text-center">
                    Make sure us_doc.mp4 exists in the /public/videos/ folder
                  </p>
                  <button
                    onClick={handleCloseVideo}
                    className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  className="w-full h-auto max-h-[80vh]"
                  controls
                  autoPlay
                  onError={handleVideoError}
                  onEnded={handleCloseVideo}
                  playsInline
                >
                  <source src="/videos/us_doc.mp4" type="video/mp4" />
                  <p className="text-white p-4">
                    Your browser doesn't support video. Please try a different
                    browser.
                  </p>
                </video>
              )}
            </div>

            {/* Video Info */}
            {!videoError && (
              <div className="mt-4 text-white text-center">
                <p className="text-lg font-semibold">
                  US Documentary - Our Story
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <TestimonialsSection />
    </>
  );
}
