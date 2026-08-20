import cafeRows from "./cafes.json";
import { extraPlaces } from "./extraPlaces";
import type { PlaceSeed } from "../types";

export const cafes = cafeRows as PlaceSeed[];
export const allPlaces: PlaceSeed[] = [...cafes, ...extraPlaces];

export const placesBySlug = new Map(allPlaces.map((place) => [place.slug, place]));

export const featuredPlaces = [
  cafes.find((place) => place.slug === "chelvies-coffee-m-block"),
  cafes.find((place) => place.slug === "blu-turkey-cafe"),
  cafes.find((place) => place.slug === "roastery-coffee-house"),
  extraPlaces.find((place) => place.slug === "british-council-library-delhi"),
  extraPlaces.find((place) => place.slug === "wework-9a-cybercity"),
  extraPlaces.find((place) => place.slug === "bahrisons-booksellers-khan-market"),
].filter((place): place is PlaceSeed => Boolean(place));

export const highWorkScorePlaces = cafes
  .filter((place) => (place.workScore ?? 0) >= 8)
  .sort((a, b) => (b.workScore ?? 0) - (a.workScore ?? 0));

export const quietPlaces = cafes.filter((place) => place.noise === "Quiet");
export const budgetPlaces = cafes
  .filter((place) => (place.costForTwo ?? Number.MAX_SAFE_INTEGER) <= 900)
  .sort((a, b) => (a.costForTwo ?? 0) - (b.costForTwo ?? 0));
