"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FaThumbsUp } from "react-icons/fa";

interface ArticleLikeButtonProps {
  articleId: string;
  initialCount: number;
}

export default function ArticleLikeButton({ 
  articleId, 
  initialCount 
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
        // Generate a unique device ID
        storedDeviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("articleLikeDeviceId", storedDeviceId);
      }
      setDeviceId(storedDeviceId);
    } catch (err) {
      console.error("Error accessing localStorage:", err);
      // Fallback to a timestamp-based ID if localStorage fails
      const fallbackId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setDeviceId(fallbackId);
    }
  }, []);

  // Check if this device has liked this article
  useEffect(() => {
    const checkDeviceLike = async () => {
      if (!deviceId || !articleId) return;
      
      try {
        const { data, error: fetchError } = await supabase
          .from("article_likes")
          .select("id")
          .eq("article_id", articleId)
          .eq("device_id", deviceId)
          .maybeSingle();

        if (fetchError) {
          console.error("Error checking like status:", fetchError.message);
          return;
        }

        if (data) {
          setHasLiked(true);
        }
      } catch (err) {
        console.error("Unexpected error checking like:", err);
      }
    };

    if (deviceId && articleId) {
      checkDeviceLike();
    }
  }, [articleId, deviceId]);

  const handleLike = async () => {
    if (isLoading) return;
    
    if (!deviceId) {
      setError("Unable to identify device");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (hasLiked) {
        // Unlike - delete the like record using device_id
        const { error: deleteError } = await supabase
          .from("article_likes")
          .delete()
          .eq("article_id", articleId)
          .eq("device_id", deviceId);

        if (deleteError) {
          console.error("Error unliking:", deleteError);
          setError(`Failed to unlike: ${deleteError.message}`);
          return;
        }

        setLikeCount(prev => Math.max(0, prev - 1));
        setHasLiked(false);
      } else {
        // First, check if there's already a like from this device
        const { data: existingLike, error: checkError } = await supabase
          .from("article_likes")
          .select("id")
          .eq("article_id", articleId)
          .eq("device_id", deviceId)
          .maybeSingle();

        if (checkError) {
          console.error("Error checking existing like:", checkError);
        }

        if (existingLike) {
          setHasLiked(true);
          setIsLoading(false);
          return;
        }

        // Insert new like with both device_id and user_name (set to device_id for consistency)
        const { error: insertError } = await supabase
          .from("article_likes")
          .insert({
            article_id: articleId,
            device_id: deviceId,
            user_name: deviceId, // Set user_name to device_id to satisfy the unique constraint
            created_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error("Error liking:", insertError);
          
          // Check if it's a unique constraint violation
          if (insertError.code === "23505") {
            // Unique violation - already liked
            setHasLiked(true);
            setError(null);
          } else {
            setError(`Failed to like: ${insertError.message}`);
          }
          return;
        }

        setLikeCount(prev => prev + 1);
        setHasLiked(true);
      }
    } catch (err) {
      console.error("Unexpected error in handleLike:", err);
      setError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
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
        aria-label={hasLiked ? "Unlike this article" : "Like this article"}
      >
        <FaThumbsUp className={hasLiked ? "fill-current" : ""} />
        <span>{likeCount}</span>
      </button>
      
      {/* Error Tooltip */}
      {error && (
        <div className="absolute top-full left-0 mt-1 z-10 bg-red-500 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}