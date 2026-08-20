import { supabase } from "./supabase";
import type {
  CommunityReview,
  PlaceCategory,
  RatingSummary,
  UserProfile,
} from "../types";

export interface PlaceIdentity {
  placeKey: string;
  googlePlaceId?: string;
  slug?: string;
  name: string;
  category: PlaceCategory;
  city?: string;
  area?: string;
}

export interface ReviewInput {
  rating: number;
  title: string;
  body: string;
  visitContext?: string;
  visitedOn?: string;
  files?: File[];
}

const localReviewsKey = "cityradius.preview-reviews";
const localFavoritesKey = "cityradius.preview-favorites";

function readLocalReviews() {
  try {
    return JSON.parse(localStorage.getItem(localReviewsKey) ?? "[]") as CommunityReview[];
  } catch {
    return [];
  }
}

function writeLocalReviews(reviews: CommunityReview[]) {
  localStorage.setItem(localReviewsKey, JSON.stringify(reviews));
}

function localRatingSummary(reviews: CommunityReview[]): RatingSummary {
  const distribution: RatingSummary["distribution"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((review) => {
    distribution[Math.round(review.rating) as 1 | 2 | 3 | 4 | 5] += 1;
  });
  return {
    average: reviews.length
      ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
      : 0,
    count: reviews.length,
    distribution,
  };
}

export async function getReviews(placeKey: string): Promise<CommunityReview[]> {
  if (!supabase) {
    return readLocalReviews()
      .filter((review) => review.placeKey === placeKey)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const client = supabase;

  const { data, error } = await client
    .from("reviews")
    .select(
      "id, place_key, user_id, rating, title, body, visit_context, visited_on, created_at, updated_at, helpful_count, profiles!reviews_user_id_fkey(display_name, avatar_url), review_photos(id, storage_path, caption, status)",
    )
    .eq("place_key", placeKey)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return Promise.all((data ?? []).map(async (row: any) => {
    const photos = await Promise.all(
      (row.review_photos ?? [])
        .filter((photo: any) => photo.status === "approved")
        .map(async (photo: any) => {
          const { data: signed, error: signedError } = await client.storage
            .from("review-photos")
            .createSignedUrl(photo.storage_path, 60 * 60);
          if (signedError || !signed?.signedUrl) return null;
          return {
            id: photo.id,
            url: signed.signedUrl,
            caption: photo.caption ?? undefined,
          };
        }),
    );
    return {
      id: row.id,
      placeKey: row.place_key,
      userId: row.user_id,
      authorName: row.profiles?.display_name ?? "CityRadius member",
      authorAvatar: row.profiles?.avatar_url ?? undefined,
      rating: row.rating,
      title: row.title,
      body: row.body,
      visitContext: row.visit_context ?? undefined,
      visitedOn: row.visited_on ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      helpfulCount: row.helpful_count ?? 0,
      photos: photos.filter((photo): photo is NonNullable<typeof photo> => Boolean(photo)),
    };
  }));
}

export async function getRatingSummary(placeKey: string): Promise<RatingSummary> {
  if (!supabase) return localRatingSummary(await getReviews(placeKey));
  const { data, error } = await supabase
    .from("place_rating_summaries")
    .select("average_rating, review_count, one_star, two_star, three_star, four_star, five_star")
    .eq("place_key", placeKey)
    .maybeSingle();
  if (error) throw error;
  return {
    average: Number(data?.average_rating ?? 0),
    count: Number(data?.review_count ?? 0),
    distribution: {
      1: Number(data?.one_star ?? 0),
      2: Number(data?.two_star ?? 0),
      3: Number(data?.three_star ?? 0),
      4: Number(data?.four_star ?? 0),
      5: Number(data?.five_star ?? 0),
    },
  };
}

async function ensurePlace(identity: PlaceIdentity) {
  if (!supabase) return;
  const { error } = await supabase.rpc("ensure_place_for_review", {
    p_place_key: identity.placeKey,
    p_google_place_id: identity.googlePlaceId ?? null,
    p_slug: identity.slug ?? null,
    p_name: identity.name,
    p_category: identity.category,
    p_city: identity.city ?? null,
    p_area: identity.area ?? null,
  });
  if (error) throw error;
}

export async function submitReview(
  identity: PlaceIdentity,
  input: ReviewInput,
  profile: UserProfile,
): Promise<void> {
  if (!supabase) {
    const now = new Date().toISOString();
    const reviews = readLocalReviews();
    const existingIndex = reviews.findIndex(
      (review) => review.placeKey === identity.placeKey && review.userId === profile.id,
    );
    const review: CommunityReview = {
      id: existingIndex >= 0 ? reviews[existingIndex].id : crypto.randomUUID(),
      placeKey: identity.placeKey,
      userId: profile.id,
      authorName: profile.displayName,
      rating: input.rating,
      title: input.title.trim(),
      body: input.body.trim(),
      visitContext: input.visitContext,
      visitedOn: input.visitedOn,
      createdAt: existingIndex >= 0 ? reviews[existingIndex].createdAt : now,
      updatedAt: now,
      helpfulCount: existingIndex >= 0 ? reviews[existingIndex].helpfulCount : 0,
    };
    if (existingIndex >= 0) reviews[existingIndex] = review;
    else reviews.push(review);
    writeLocalReviews(reviews);
    return;
  }

  await ensurePlace(identity);
  const { data, error } = await supabase
    .from("reviews")
    .upsert(
      {
        place_key: identity.placeKey,
        user_id: profile.id,
        rating: input.rating,
        title: input.title.trim(),
        body: input.body.trim(),
        visit_context: input.visitContext || null,
        visited_on: input.visitedOn || null,
        status: "published",
      },
      { onConflict: "user_id,place_key" },
    )
    .select("id")
    .single();
  if (error) throw error;

  for (const file of input.files?.slice(0, 4) ?? []) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const storagePath = `${profile.id}/${data.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("review-photos")
      .upload(storagePath, file, { cacheControl: "3600", upsert: false });
    if (uploadError) throw uploadError;
    const { error: photoError } = await supabase.from("review_photos").insert({
      review_id: data.id,
      user_id: profile.id,
      storage_path: storagePath,
      status: "pending",
    });
    if (photoError) throw photoError;
  }
}

function readLocalFavorites(userId: string) {
  try {
    return new Set(readLocalFavoriteRecords(userId).map((favorite) => favorite.placeKey));
  } catch {
    return new Set<string>();
  }
}

function readLocalFavoriteRecords(userId: string): PlaceIdentity[] {
  try {
    const all = JSON.parse(localStorage.getItem(localFavoritesKey) ?? "{}") as Record<
      string,
      Array<PlaceIdentity | string>
    >;
    return (all[userId] ?? []).map((favorite) =>
      typeof favorite === "string"
        ? { placeKey: favorite, name: "Saved place", category: "cafe" }
        : favorite,
    );
  } catch {
    return [];
  }
}

export async function getFavoriteRecords(userId: string): Promise<PlaceIdentity[]> {
  if (!supabase) return readLocalFavoriteRecords(userId);
  const { data, error } = await supabase
    .from("favorites")
    .select("place_key, places!inner(place_key, google_place_id, slug, name, category, city, area)")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    placeKey: row.place_key,
    googlePlaceId: row.places.google_place_id ?? undefined,
    slug: row.places.slug ?? undefined,
    name: row.places.name,
    category: row.places.category as PlaceCategory,
    city: row.places.city ?? undefined,
    area: row.places.area ?? undefined,
  }));
}

export async function getFavorites(userId: string): Promise<Set<string>> {
  if (!supabase) return readLocalFavorites(userId);
  const { data, error } = await supabase
    .from("favorites")
    .select("place_key")
    .eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.place_key));
}

export async function setFavorite(userId: string, identity: PlaceIdentity, saved: boolean) {
  const placeKey = identity.placeKey;
  if (!supabase) {
    const all = JSON.parse(localStorage.getItem(localFavoritesKey) ?? "{}") as Record<
      string,
      Array<PlaceIdentity | string>
    >;
    const favorites = readLocalFavoriteRecords(userId).filter((favorite) => favorite.placeKey !== placeKey);
    if (saved) favorites.push(identity);
    all[userId] = favorites;
    localStorage.setItem(localFavoritesKey, JSON.stringify(all));
    return;
  }

  if (saved) {
    await ensurePlace(identity);
    const { error } = await supabase.from("favorites").upsert({ user_id: userId, place_key: placeKey });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("place_key", placeKey);
    if (error) throw error;
  }
}

export async function submitPlaceSuggestion(
  profile: UserProfile,
  input: {
    name: string;
    category: PlaceCategory;
    city: string;
    area: string;
    googleMapsUrl?: string;
    notes?: string;
  },
) {
  if (!supabase) {
    const key = "cityradius.preview-submissions";
    const submissions = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown[];
    submissions.push({ id: crypto.randomUUID(), userId: profile.id, ...input, status: "pending" });
    localStorage.setItem(key, JSON.stringify(submissions));
    return;
  }
  const { error } = await supabase.from("place_submissions").insert({
    user_id: profile.id,
    name: input.name.trim(),
    category: input.category,
    city: input.city,
    area: input.area.trim(),
    google_maps_url: input.googleMapsUrl?.trim() || null,
    notes: input.notes?.trim() || null,
  });
  if (error) throw error;
}
