"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FaThumbsUp } from "react-icons/fa";

interface HeaderCardLikeButtonProps {
  headerCardId: number;
  initialCount: number;
}

export default function HeaderCardLikeButton({
  headerCardId,
  initialCount,
}: HeaderCardLikeButtonProps) {
  const [likeCount, setLikeCount] = useState(initialCount);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string>("");

  // Generate or get device ID from localStorage
  useEffect(() => {
    let storedDeviceId = localStorage.getItem("deviceId");
    if (!storedDeviceId) {
      storedDeviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("deviceId", storedDeviceId);
    }
    setDeviceId(storedDeviceId);
  }, []);

  // Check if this device has liked this header card
  useEffect(() => {
    const checkDeviceLike = async () => {
      if (!deviceId || !headerCardId) return;

      try {
        const { data, error } = await supabase
          .from("header_card_likes")
          .select("id")
          .eq("header_card_id", headerCardId)
          .eq("device_id", deviceId)
          .maybeSingle();

        if (error) {
          console.error("Error checking like status:", error);
          return;
        }

        if (data) {
          setHasLiked(true);
        }
      } catch (err) {
        console.error("Unexpected error checking like:", err);
      }
    };

    if (deviceId) {
      checkDeviceLike();
    }
  }, [headerCardId, deviceId]);

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
        // Unlike
        const { error } = await supabase
          .from("header_card_likes")
          .delete()
          .eq("header_card_id", headerCardId)
          .eq("device_id", deviceId);

        if (error) {
          console.error("Error unliking:", error);
          setError(`Failed to unlike: ${error.message}`);
          return;
        }

        setLikeCount((prev) => Math.max(0, prev - 1));
        setHasLiked(false);
      } else {
        // Like - check if like already exists
        const { data: existingLike, error: checkError } = await supabase
          .from("header_card_likes")
          .select("id")
          .eq("header_card_id", headerCardId)
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

        const { error } = await supabase.from("header_card_likes").insert({
          header_card_id: headerCardId,
          device_id: deviceId,
        });

        if (error) {
          console.error("Error liking:", error);
          setError(`Failed to like: ${error.message}`);
          return;
        }

        setLikeCount((prev) => prev + 1);
        setHasLiked(true);
      }
    } catch (err) {
      console.error("Unexpected error in handleLike:", err);
      setError(
        `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
      );
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
        } disabled:opacity-50`}
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
