"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FaThumbsUp, FaRegHeart } from "react-icons/fa";

interface ArticleLikeButtonProps {
  articleId: string | number;
  initialCount: number;
}

export default function ArticleLikeButton({
  articleId,
  initialCount,
}: ArticleLikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const savedName = localStorage.getItem("commentUserName");
    if (savedName) {
      setUserName(savedName);
      checkIfLiked(savedName);
    }
  }, [articleId]);

  const checkIfLiked = async (name: string) => {
    try {
      const articleIdNum = Number(articleId);
      const { data } = await supabase
        .from("content_likes")
        .select("id")
        .eq("content_id", articleIdNum)
        .eq("content_type", "articles")
        .eq("user_name", name)
        .maybeSingle();

      setLiked(!!data);
    } catch (error) {
      console.error("Error checking like status:", error);
    }
  };

  const handleLike = async () => {
    if (!userName) {
      alert("Please enter your name in the comments section first");
      return;
    }

    setLoading(true);
    try {
      const articleIdNum = Number(articleId);

      if (liked) {
        const { error } = await supabase
          .from("content_likes")
          .delete()
          .eq("content_id", articleIdNum)
          .eq("content_type", "articles")
          .eq("user_name", userName);

        if (error) throw error;
        setLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
      } else {
        const { error } = await supabase.from("content_likes").insert([
          {
            content_id: articleIdNum,
            content_type: "articles",
            user_name: userName,
          },
        ]);

        if (error) throw error;
        setLiked(true);
        setLikeCount((prev) => prev + 1);
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
      {liked ? (
        <FaThumbsUp className="w-5 h-5" />
      ) : (
        <FaThumbsUp className="w-5 h-5" />
      )}
      <span className="font-medium">{likeCount}</span>
    </button>
  );
}
