import { cityCenters, getCategory } from "../data/categories";
import { appConfig } from "./config";
import type {
  GooglePlaceData,
  GooglePhotoAttribution,
  LiveDiscoveryOptions,
  PlaceSeed,
} from "../types";

const apiKey = appConfig.googleMapsApiKey;
let loaderPromise: Promise<typeof google> | null = null;
const seedCache = new Map<string, Promise<GooglePlaceData | null>>();
const placeIdCache = new Map<string, Promise<GooglePlaceData | null>>();

export const googleMapsConfigured = Boolean(apiKey);

export class GoogleMapsConfigurationError extends Error {
  constructor() {
    super("Google Maps is not configured. Add VITE_GOOGLE_MAPS_API_KEY to .env.local.");
    this.name = "GoogleMapsConfigurationError";
  }
}

export function loadGoogleMaps() {
  if (!apiKey) return Promise.reject(new GoogleMapsConfigurationError());
  if (typeof window.google !== "undefined" && window.google.maps) return Promise.resolve(window.google);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-cityradius-google-maps]");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Maps failed to load.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.dataset.cityradiusGoogleMaps = "true";
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey,
    )}&loading=async&libraries=places,marker&v=weekly&auth_referrer_policy=origin`;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Google Maps failed to load."));
    document.head.appendChild(script);
  });

  return loaderPromise;
}

function locationToLiteral(location?: google.maps.LatLng | null) {
  if (!location) return undefined;
  return { lat: location.lat(), lng: location.lng() };
}

function photoData(place: google.maps.places.Place) {
  const photo = place.photos?.[0];
  if (!photo) return {};
  const photoAttributions: GooglePhotoAttribution[] = (photo.authorAttributions ?? []).map(
    (attribution) => ({
      displayName: attribution.displayName,
      uri: attribution.uri ?? undefined,
    }),
  );
  return {
    photoUrl: photo.getURI({ maxWidth: 1400, maxHeight: 1000 }),
    photoAttributions,
  };
}

function serializePlace(place: google.maps.places.Place): GooglePlaceData {
  return {
    id: place.id,
    displayName: place.displayName ?? "Untitled place",
    formattedAddress: place.formattedAddress ?? undefined,
    location: locationToLiteral(place.location),
    rating: place.rating ?? undefined,
    userRatingCount: place.userRatingCount ?? undefined,
    priceLevel: place.priceLevel ?? undefined,
    nationalPhoneNumber: place.nationalPhoneNumber ?? undefined,
    websiteURI: place.websiteURI ?? undefined,
    googleMapsURI: place.googleMapsURI ?? undefined,
    regularOpeningHours: place.regularOpeningHours
      ? {
          weekdayDescriptions: place.regularOpeningHours.weekdayDescriptions,
        }
      : undefined,
    primaryType: place.primaryType ?? undefined,
    primaryTypeDisplayName: place.primaryTypeDisplayName ?? undefined,
    ...photoData(place),
    source: "google",
  };
}

const cardFields = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "rating",
  "userRatingCount",
  "priceLevel",
  "photos",
  "googleMapsURI",
  "regularOpeningHours",
  "primaryType",
  "primaryTypeDisplayName",
];

const detailFields = [
  ...cardFields,
  "nationalPhoneNumber",
  "websiteURI",
];

export async function resolveSeedPlace(seed: PlaceSeed) {
  if (!googleMapsConfigured) return null;
  const cached = seedCache.get(seed.id);
  if (cached) return cached;

  const request = (async () => {
    await loadGoogleMaps();
    const { Place } = (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;
    const { places } = await Place.searchByText({
      textQuery: seed.googleQuery,
      fields: cardFields,
      maxResultCount: 1,
      region: "in",
      language: "en-IN",
      locationBias: cityCenters[seed.city],
    });
    return places[0] ? serializePlace(places[0]) : null;
  })().catch((error) => {
    console.warn(`Could not resolve ${seed.name} with Google Places.`, error);
    return null;
  });

  seedCache.set(seed.id, request);
  return request;
}

export async function fetchGooglePlaceById(id: string) {
  if (!googleMapsConfigured) return null;
  const cached = placeIdCache.get(id);
  if (cached) return cached;

  const request = (async () => {
    await loadGoogleMaps();
    const { Place } = (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;
    const place = new Place({ id, requestedLanguage: "en" });
    await place.fetchFields({ fields: detailFields });
    return serializePlace(place);
  })().catch((error) => {
    console.warn(`Could not fetch Google Place ${id}.`, error);
    return null;
  });

  placeIdCache.set(id, request);
  return request;
}

export async function discoverGooglePlaces(options: LiveDiscoveryOptions) {
  if (!googleMapsConfigured) throw new GoogleMapsConfigurationError();
  await loadGoogleMaps();
  const { Place } = (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;
  const category = getCategory(options.category);
  const textQuery = options.query?.trim()
    ? `${options.query.trim()} in ${options.city}`
    : `${category.discoveryTerm} in ${options.city}, Delhi NCR`;
  const { places } = await Place.searchByText({
    textQuery,
    fields: cardFields,
    maxResultCount: 12,
    isOpenNow: options.openNow || undefined,
    region: "in",
    language: "en-IN",
    locationBias: cityCenters[options.city],
  });
  return places.map(serializePlace);
}

export function googleResultPlaceKey(id: string) {
  return `g_${id}`;
}
