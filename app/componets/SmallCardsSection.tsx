"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface HeaderCard {
  id: number;
  title: string;
  description: string;
  author: string;
  label: string;
  image_url: string;
  content: string;
  button_text: string;
  card_type: "large" | "small";
  display_order: number;
  is_featured: boolean;
}

const SmallCardsSection = () => {
  const [largeCard, setLargeCard] = useState<HeaderCard | null>(null);
  const [smallCards, setSmallCards] = useState<HeaderCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchFeaturedCards();
  }, []);

  const fetchFeaturedCards = async () => {
    try {
      const { data, error } = await supabase
        .from("header_cards")
        .select("*")
        .eq("is_featured", true)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching header cards:", error);
        return;
      }

      if (data && data.length > 0) {
        // Separate large and small cards based on card_type
        const largeCards = data.filter((card) => card.card_type === "large");
        const smallCardsData = data.filter(
          (card) => card.card_type === "small",
        );

        // Set the first large card (if any)
        if (largeCards.length > 0) {
          setLargeCard(largeCards[0]);
        }

        // Set small cards (up to 2)
        setSmallCards(smallCardsData.slice(0, 2));
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (cardId: number) => {
    setImageErrors((prev) => new Set(prev).add(cardId));
  };

  const getImageUrl = (card: HeaderCard) => {
    if (imageErrors.has(card.id)) {
      return "/placeholder-image.jpg";
    }
    return card.image_url;
  };

  if (loading) {
    return <div className="text-center py-10">Loading stories...</div>;
  }

  if (!largeCard && smallCards.length === 0) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto p-10">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-10 gap-y-6">
        {/* Large Card */}
        {largeCard && (
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl overflow-hidden">
              <Link href={`/header-cards/${largeCard.id}`} prefetch={false}>
                <div className="relative h-[280px] bg-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                  <Image
                    src={getImageUrl(largeCard)}
                    alt={largeCard.title}
                    fill
                    className="object-cover"
                    priority
                    onError={() => handleImageError(largeCard.id)}
                  />
                </div>
              </Link>

              <div className="p-6">
                <Link href={`/header-cards/${largeCard.id}`} prefetch={false}>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 cursor-pointer hover:text-gray-700 transition-colors">
                    {largeCard.title}
                    <span className="rounded-full bg-gray-200 ml-4 text-black px-1.5 py-0.5 text-[0.65rem] font-semibold">
                      {largeCard.label}
                    </span>
                  </h2>
                </Link>

                <p className="text-gray-600 mb-6">{largeCard.description}</p>

                <Link href={`/header-cards/${largeCard.id}`} prefetch={false}>
                  <button className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200">
                    {largeCard.button_text || "SOMA ICYEGERANYO"}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Small Cards */}
        {smallCards.length > 0 && (
          <div className="lg:col-span-2 flex flex-col gap-6">
            {smallCards.map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-2xl overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center">
                  <Link
                    href={`/header-cards/${card.id}`}
                    prefetch={false}
                    className="w-full sm:w-[280px]"
                  >
                    <div className="h-[240px] bg-gray-200 rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                      <Image
                        src={getImageUrl(card)}
                        alt={card.title}
                        className="object-cover w-full h-full"
                        width={280}
                        height={240}
                        onError={() => handleImageError(card.id)}
                      />
                    </div>
                  </Link>

                  <div className="p-4 flex-1">
                    <Link href={`/header-cards/${card.id}`} prefetch={false}>
                      <h3 className="text-base font-bold text-gray-900 mb-2 leading-tight cursor-pointer hover:text-gray-700 transition-colors">
                        {card.title}
                      </h3>
                    </Link>

                    <p className="text-sm text-gray-600 text-justify mb-2">
                      {card.description}
                    </p>

                    <span className="rounded-full bg-gray-200 text-black px-1.5 py-0.5 text-[0.65rem] font-semibold">
                      {card.label}
                    </span>

                    <br />

                    <Link href={`/header-cards/${card.id}`} prefetch={false}>
                      <button className="text-xs mt-3 bg-transparent border border-gray-300 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-50 transition-colors duration-200">
                        {card.button_text || "SOMA BIRAMBUYE"}
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SmallCardsSection;
