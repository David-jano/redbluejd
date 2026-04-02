"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FaThumbsUp } from "react-icons/fa";

interface ArticleLikeButtonProps {
  contentId: string | number;
  contentType: string;
  initialCount: number;
  onLikeChange?: (newCount: number) => void;
}

export default function ArticleLikeButton({
  contentId,
  contentType,
  initialCount,
  onLikeChange,
}: ArticleLikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  // Load user name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem("commentUserName");
    if (savedName) {
      setUserName(savedName);
      checkIfLiked(savedName);
    }
  }, [contentId, contentType]);

  // Check if user already liked this content
  const checkIfLiked = async (name: string) => {
    try {
      const idNum = Number(contentId);
      const { data } = await supabase
        .from("content_likes")
        .select("id")
        .eq("content_id", idNum)
        .eq("content_type", contentType)
        .eq("user_name", name)
        .maybeSingle();

      setLiked(!!data);
    } catch (error) {
      console.error("Error checking like status:", error);
    }
  };

  // Handle like/unlike
  const handleLike = async () => {
    if (!userName) {
      alert("Please enter your name in the comments section first");
      return;
    }

    setLoading(true);
    try {
      const idNum = Number(contentId);

      if (liked) {
        // Unlike
        const { error } = await supabase
          .from("content_likes")
          .delete()
          .eq("content_id", idNum)
          .eq("content_type", contentType)
          .eq("user_name", userName);

        if (error) throw error;

        const newCount = Math.max(0, likeCount - 1);
        setLiked(false);
        setLikeCount(newCount);
        onLikeChange?.(newCount);
      } else {
        // Like
        const { error } = await supabase.from("content_likes").insert([
          {
            content_id: idNum,
            content_type: contentType,
            user_name: userName,
          },
        ]);

        if (error) throw error;

        const newCount = likeCount + 1;
        setLiked(true);
        setLikeCount(newCount);
        onLikeChange?.(newCount);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading || !userName}
      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
        liked
          ? "bg-red-50 text-red-600"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      } ${!userName ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <FaThumbsUp className="w-5 h-5" />
      <span className="font-medium">{likeCount}</span>
    </button>
  );
}
