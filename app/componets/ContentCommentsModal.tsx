"use client";

import { useState, useEffect, useRef } from "react";
import ContentComments from "./ContentComments";

interface ContentCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: number;
  contentType: string;
  contentTitle: string;
}

export default function ContentCommentsModal({
  isOpen,
  onClose,
  contentId,
  contentType,
  contentTitle,
}: ContentCommentsModalProps) {
  const [userName, setUserName] = useState("");
  const [showNameInput, setShowNameInput] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);

  // Load saved username
  useEffect(() => {
    const savedName = localStorage.getItem("commentUserName");
    if (savedName) {
      setUserName(savedName);
      setShowNameInput(false);
    }
  }, []);

  const saveUserName = () => {
    if (userName.trim()) {
      localStorage.setItem("commentUserName", userName);
      setShowNameInput(false);
    }
  };

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200"
      >
        {/* Fixed Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-xl z-10">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-800">Comments</h2>
            <p className="text-sm text-gray-500 truncate">
              {contentTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl ml-4 flex-shrink-0"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div 
          ref={commentsContainerRef}
          className="flex-1 overflow-y-auto px-6 py-4"
          style={{ maxHeight: "calc(90vh - 80px)" }}
        >
          <ContentComments
            contentId={contentId}
            contentType={contentType}
            currentUser={userName}
          />
        </div>

        {/* Fixed Footer with Name Input (if needed) */}
        {showNameInput && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl sticky bottom-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your name to comment
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your name..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && userName.trim()) {
                    saveUserName();
                  }
                }}
              />
              <button
                onClick={saveUserName}
                disabled={!userName.trim()}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-300 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}