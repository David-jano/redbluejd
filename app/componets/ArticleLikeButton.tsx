"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FaThumbsUp } from "react-icons/fa";

interface ArticleLikeButtonProps {
  contentId: string | number; // renamed from articleId
  contentType: string; // new prop
  initialCount: number;
  onLikeChange?: (newCount: number) => void; // optional callback
}

export default function ArticleLikeButton({
  contentId,
  contentType,
  initialCount,
  onLikeChange,
}: ArticleLikeButtonProps) {
  const [likeCount, setLikeCount] = useState(initialCount);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string>("");

  // Generate or get device ID from localStorage
  useEffect(() => {
    try {
      let storedDeviceId = localStorage.getItem("articleLikeDeviceId");
      if (!storedDeviceId) {
        storedDeviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("articleLikeDeviceId", storedDeviceId);
      }
      setDeviceId(storedDeviceId);
    } catch {
      setDeviceId(
        `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      );
    }
  }, []);

  // Check if this device has liked this content
  useEffect(() => {
    const checkDeviceLike = async () => {
      if (!deviceId || !contentId) return;
      try {
        const { data, error: fetchError } = await supabase
          .from("content_likes")
          .select("id")
          .eq("content_id", contentId)
          .eq("content_type", contentType)
          .eq("device_id", deviceId)
          .maybeSingle();

        if (fetchError) console.error(fetchError.message);
        if (data) setHasLiked(true);
      } catch (err) {
        console.error(err);
      }
    };

    if (deviceId && contentId) checkDeviceLike();
  }, [deviceId, contentId, contentType]);

  const handleLike = async () => {
    if (isLoading || !deviceId) return;

    setIsLoading(true);
    setError(null);

    try {
      if (hasLiked) {
        // Unlike
        const { error: deleteError } = await supabase
          .from("content_likes")
          .delete()
          .eq("content_id", contentId)
          .eq("content_type", contentType)
          .eq("device_id", deviceId);
        if (deleteError) throw deleteError;

        const newCount = Math.max(0, likeCount - 1);
        setLikeCount(newCount);
        setHasLiked(false);
        onLikeChange?.(newCount);
      } else {
        // Like
        const { error: insertError } = await supabase
          .from("content_likes")
          .insert({
            content_id: contentId,
            content_type: contentType,
            device_id: deviceId,
            user_name: deviceId,
            created_at: new Date().toISOString(),
          });
        if (insertError) throw insertError;

        const newCount = likeCount + 1;
        setLikeCount(newCount);
        setHasLiked(true);
        onLikeChange?.(newCount);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleLike}
        disabled={isLoading}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
          hasLiked
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <FaThumbsUp className={hasLiked ? "fill-current" : ""} />
        <span>{likeCount}</span>
      </button>

      {error && (
        <div className="absolute top-full left-0 mt-1 z-10 bg-red-500 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}
