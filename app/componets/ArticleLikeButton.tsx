// ArticleLikeButton.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ArticleLikeButton({
  articleId,
  initialCount = 0,
}: {
  articleId: string;
  initialCount?: number;
}) {
  const [likes, setLikes] = useState(initialCount);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getDeviceId = () => {
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("device_id", deviceId);
    }
    return deviceId;
  };

  useEffect(() => {
    const checkIfLiked = async () => {
      const deviceId = getDeviceId();
      const { data } = await supabase
        .from("article_likes")
        .select("id")
        .eq("article_id", articleId)
        .eq("device_id", deviceId)
        .maybeSingle();

      setHasLiked(!!data);
    };

    checkIfLiked();
  }, [articleId]);

  const handleLike = async () => {
    if (isLoading) return;

    setIsLoading(true);
    const deviceId = getDeviceId();

    if (!hasLiked) {
      const { error } = await supabase.from("article_likes").insert({
        article_id: articleId,
        user_name: "anonymous",
        device_id: deviceId,
      });

      if (!error) {
        setLikes(likes + 1);
        setHasLiked(true);
      }
    } else {
      const { error } = await supabase
        .from("article_likes")
        .delete()
        .eq("article_id", articleId)
        .eq("device_id", deviceId);

      if (!error) {
        setLikes(likes - 1);
        setHasLiked(false);
      }
    }

    setIsLoading(false);
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200 ${
        hasLiked
          ? "bg-gray-100 text-gray-500"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}
      aria-label={hasLiked ? "Unlike" : "Like"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={hasLiked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
      {likes > 0 && <span className="text-sm font-medium">{likes}</span>}
    </button>
  );
}
