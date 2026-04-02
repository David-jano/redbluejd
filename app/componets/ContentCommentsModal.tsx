"use client";

import { useState, useEffect } from "react";
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Comments</h2>
            <p className="text-sm text-gray-500 truncate max-w-md">
              {contentTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(80vh-180px)] px-6 pb-6">
          <ContentComments
            contentId={contentId}
            contentType={contentType}
            currentUser={userName}
          />
        </div>
      </div>
    </div>
  );
}
