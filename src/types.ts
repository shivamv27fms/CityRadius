export type PlaceCategory =
  | "cafe"
  | "pg"
  | "library"
  | "coworking"
  | "bookstore"
  | "printing"
  | "fitness"
  | "pharmacy";

export type DelhiNcrCity = "New Delhi" | "Gurugram" | "Noida";

export interface PlaceSeed {
  id: string;
  slug: string;
  name: string;
  category: PlaceCategory;
  area: string;
  city: DelhiNcrCity;
  address: string;
  googleQuery: string;
  summary?: string;
  tags?: string[];
  source?: "csv" | "curated" | "google";
  costForTwo?: number;
  foodScore?: number;
  mustOrder?: string[];
  foodNote?: string;
  wifi?: boolean;
  workScore?: number;
  noise?: string;
  sockets?: string;
  bestFor?: string[];
  laptopTolerance?: string;
  recommendedDuration?: string;
  bestTime?: string;
  evidenceBasis?: string;
  confidence?: string;
  sources?: string[];
  lastVerified?: string;
  categoryDetails?: Record<string, string | number | boolean>;
}

export interface GooglePhotoAttribution {
  displayName: string;
  uri?: string;
}

export interface GooglePlaceData {
  id: string;
  displayName: string;
  formattedAddress?: string;
  location?: { lat: number; lng: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  nationalPhoneNumber?: string;
  websiteURI?: string;
  googleMapsURI?: string;
  regularOpeningHours?: {
    weekdayDescriptions?: string[];
  };
  photoUrl?: string;
  photoAttributions?: GooglePhotoAttribution[];
  primaryType?: string;
  primaryTypeDisplayName?: string;
  source: "google";
}

export interface CommunityReview {
  id: string;
  placeKey: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  title: string;
  body: string;
  visitContext?: string;
  visitedOn?: string;
  createdAt: string;
  updatedAt: string;
  photos?: ReviewPhoto[];
  helpfulCount?: number;
}

export interface ReviewPhoto {
  id: string;
  url: string;
  caption?: string;
}

export interface RatingSummary {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface UserProfile {
  id: string;
  email?: string;
  displayName: string;
  avatarUrl?: string;
  role: "user" | "moderator" | "admin";
  homeCity?: DelhiNcrCity;
}

export interface ExploreFilters {
  query: string;
  category: PlaceCategory | "all";
  city: DelhiNcrCity | "all";
  area: string | "all";
  maxBudget: number | null;
  minWorkScore: number;
  minFoodScore: number;
  noise: string | "all";
  sockets: string | "all";
  sort: "recommended" | "work" | "food" | "budget" | "name";
}

export interface LiveDiscoveryOptions {
  category: PlaceCategory;
  city: DelhiNcrCity;
  query?: string;
  openNow?: boolean;
}
