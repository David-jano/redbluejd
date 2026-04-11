import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FaHome } from "react-icons/fa";
import ClientImage from "@/app/componets/ClientImage";
import ArticleComments from "@/app/componets/CardComments";
import ArticleLikeButton from "@/app/componets/CardLikeButton";

// Type definitions
interface Card {
  id: number;
  title: string;
  author: string;
  label: string;
  created_at: string;
  image_url: string;
  description?: string;
  content: string;
  button_text: string;
  card_type: "large" | "small";
}

interface Props {
  params: Promise<{ id: string }>;
}

// Default placeholder for missing images
const DEFAULT_IMAGE = "https://placehold.co/800x600/e0e0e0/999?text=No+Image";

// Helper function for Vercel image paths
function getValidImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return DEFAULT_IMAGE;
  }

  // If it's already a full URL
  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  // Handle local paths for Vercel
  if (imageUrl.startsWith("/images/")) {
    return imageUrl.replace("/images/", "/uploads/");
  }

  // If it's already an uploads path
  if (imageUrl.startsWith("/uploads/")) {
    return imageUrl;
  }

  return DEFAULT_IMAGE;
}

// SEO Metadata generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cardId = parseInt(id, 10);

  if (isNaN(cardId)) {
    return {
      title: "Story Not Found",
      description: "The requested story could not be found.",
    };
  }

  const { data, error } = await supabase
    .from("cards")
    .select("title, description, image_url")
    .eq("id", cardId)
    .maybeSingle();

  if (error || !data) {
    return {
      title: "Story Not Found",
      description: "The requested story could not be found.",
    };
  }

  return {
    title: data.title,
    description: data.description || `Read ${data.title}`,
    openGraph: {
      title: data.title,
      description: data.description || `Read ${data.title}`,
      images: [getValidImageUrl(data.image_url)],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description: data.description || `Read ${data.title}`,
      images: [getValidImageUrl(data.image_url)],
    },
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    ),
  };
}

// Static generation - limited to prevent timeout
export async function generateStaticParams() {
  const { data, error } = await supabase
    .from("cards")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error generating static params:", error.message);
    return [];
  }

  return (data || []).map((card) => ({
    id: card.id.toString(),
  }));
}

// ISR Revalidation (1 hour)
export const revalidate = 3600;

function logServerError(context: string, error: any) {
  console.error(`[Server Error] ${context}:`, error?.message || error);
}

export default async function CardDetailPage({ params }: Props) {
  const { id } = await params;
  const cardId = parseInt(id, 10);

  if (isNaN(cardId)) {
    return notFound();
  }

  try {
    // OPTIMIZATION: Run all queries in parallel
    const [cardResult, likeCountResult, moreCardsResult] = await Promise.all([
      // Main card
      supabase.from("cards").select("*").eq("id", cardId).maybeSingle(),

      // Like count
      supabase
        .from("content_likes")
        .select("*", { count: "exact", head: true })
        .eq("content_id", cardId)
        .eq("content_type", "articles"),

      // More cards
      supabase
        .from("cards")
        .select("id, title, author, label, created_at, image_url, description")
        .neq("id", cardId)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

    // Check if card exists
    if (cardResult.error || !cardResult.data) {
      if (cardResult.error?.code !== "PGRST116") {
        logServerError("Fetching card", cardResult.error);
      }
      return notFound();
    }

    const card = cardResult.data;
    const initialLikeCount = likeCountResult.error
      ? 0
      : likeCountResult.count || 0;
    const moreCards = moreCardsResult.error ? [] : moreCardsResult.data || [];

    // Process image URLs
    const processedCardImage = getValidImageUrl(card.image_url);
    const processedMoreCards = moreCards.map((card) => ({
      ...card,
      image_url: getValidImageUrl(card.image_url),
    }));

    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 text-sm text-gray-600 flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
          >
            <FaHome /> Ahabanza
          </Link>

          <span>/</span>

          <span className="text-gray-900 font-medium truncate max-w-[200px] inline-block align-middle">
            {card.title}
          </span>
        </nav>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold leading-snug mb-4 text-gray-900">
          {card.title}
        </h1>

        {/* Author, Label, Date & Social Icons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center flex-wrap gap-2 text-sm text-gray-600">
            <span>
              Yahinduwe: <span className="font-medium">{card.author}</span>
            </span>
            <span>•</span>
            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-semibold uppercase">
              {card.label}
            </span>
            <span>•</span>
            <span>
              {new Date(card.created_at).toLocaleDateString("rw-RW", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          {/* Article Like Button and Social Media Icons */}
          <div className="flex items-center space-x-4">
            <ArticleLikeButton
              contentId={cardId}
              contentType="articles"
              initialCount={initialLikeCount}
            />

            {/* Social Media Icons - Using regular img tags for simplicity */}
            <div className="flex space-x-3">
              <a
                href="https://www.facebook.com/RedBlueJD"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-blue-600 transition-colors"
                aria-label="Facebook"
              >
                <img
                  src="/facebook.svg"
                  width={20}
                  height={20}
                  alt="Facebook"
                />
              </a>
              <a
                href="https://www.youtube.com/@RedBlueJD"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-red-600 transition-colors"
                aria-label="YouTube"
              >
                <img src="/youtube.svg" width={20} height={20} alt="YouTube" />
              </a>
              <a
                href="https://twitter.com/RedBlueJD"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-black transition-colors"
                aria-label="X (Twitter)"
              >
                <img src="/x.svg" width={20} height={20} alt="X (Twitter)" />
              </a>
              <a
                href="https://tiktok.com/@redblue_jd"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-pink-600 transition-colors"
                aria-label="TikTok"
              >
                <img src="/tiktok.svg" width={20} height={20} alt="TikTok" />
              </a>
              <a
                href="https://instagram.com/redbluejd"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-purple-600 transition-colors"
                aria-label="Instagram"
              >
                <img
                  src="/instagram.svg"
                  width={20}
                  height={20}
                  alt="Instagram"
                />
              </a>
            </div>
          </div>
        </div>

        {/* Image with Client Component */}
        <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden shadow-lg">
          <ClientImage
            src={processedCardImage}
            alt={card.title}
            fill
            priority
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          />
        </div>

        {/* Description */}
        {card.description && (
          <p className="text-lg text-gray-700 mb-6 italic border-l-4 border-blue-500 pl-4 py-1 bg-blue-50 rounded-r">
            {card.description}
          </p>
        )}

        {/* Full content */}
        <article
          className="prose prose-sm md:prose-base lg:prose-lg prose-gray max-w-none text-justify"
          aria-label="Article content"
        >
          <div className="whitespace-pre-wrap leading-relaxed">
            {card.content}
          </div>
        </article>

        {/* Article Footer with Social Share */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span>
                  Igice: <strong>{card.label}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>|</span>
                <span>
                  Yanditswe:{" "}
                  {new Date(card.created_at).toLocaleDateString("rw-RW")}
                </span>
              </div>
            </div>

            {/* Share Section */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Sangiza:</span>
              <div className="flex space-x-2">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    `${process.env.NEXT_PUBLIC_SITE_URL}/cards/${card.id}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                  aria-label="Share on Facebook"
                >
                  <img
                    src="/facebook.svg"
                    width={16}
                    height={16}
                    alt="Facebook"
                    className="invert"
                  />
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                    `${process.env.NEXT_PUBLIC_SITE_URL}/cards/${card.id}`,
                  )}&text=${encodeURIComponent(card.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black text-white p-2 rounded-full hover:bg-gray-800 transition-colors"
                  aria-label="Share on X"
                >
                  <img
                    src="/x.svg"
                    width={16}
                    height={16}
                    alt="X"
                    className="invert"
                  />
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `${card.title} - ${process.env.NEXT_PUBLIC_SITE_URL}/cards/${card.id}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors"
                  aria-label="Share on WhatsApp"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Article Comments Section */}
        <ArticleComments articleId={id} />

        {/* More Stories Section */}
        <section className="mt-16">
          <h2 className="text-xl font-bold mb-6 text-gray-900">Izindi nkuru</h2>

          {processedMoreCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedMoreCards.map((card) => (
                <Link
                  key={card.id}
                  href={`/cards/${card.id}`}
                  className="block bg-white rounded-lg hover:shadow-md transition-shadow duration-300 p-4 group"
                >
                  <div className="relative w-full h-40 rounded-md overflow-hidden mb-4">
                    <ClientImage
                      src={card.image_url}
                      alt={card.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {card.title}
                  </h3>
                  {card.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                      {card.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[0.65rem] inline-block bg-gray-100 px-2 py-0.5 rounded-full font-medium text-gray-700">
                      {card.label}
                    </span>
                    <span className="text-[0.65rem] text-gray-500">
                      {new Date(card.created_at).toLocaleDateString("rw-RW", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Nta zindi nkuru zanditswe kuri iki gihe.</p>
              <div className="mt-12 text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-300 font-medium"
                >
                  ← Subira Ahabanza
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    );
  } catch (error) {
    console.error("Unexpected error in card page:", error);
    return notFound();
  }
}
