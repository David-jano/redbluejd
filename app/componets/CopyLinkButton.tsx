"use client";

import { useState, useEffect, useRef } from "react";

export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setShowPanel(false);
      }
    };

    if (showPanel) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPanel]);

  const handleCopy = async () => {
    if (!currentUrl) return;
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: currentUrl,
        });
      } catch (err) {
        console.error("Failed to share:", err);
      }
    } else {
      setShowPanel(!showPanel);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        aria-label="Share"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        <span className="text-sm font-medium">Share</span>
      </button>

      {showPanel && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">Share</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={currentUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
                </svg>
                <span className="text-sm">Facebook</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DA1F2">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
                </svg>
                <span className="text-sm">Twitter</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {copied && !showPanel && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap z-10">
          Link copied!
        </div>
      )}
    </div>
  );
}