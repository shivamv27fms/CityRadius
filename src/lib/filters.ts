import type { ExploreFilters, PlaceSeed } from "../types";

export const defaultFilters: ExploreFilters = {
  query: "",
  category: "all",
  city: "all",
  area: "all",
  maxBudget: null,
  minWorkScore: 0,
  minFoodScore: 0,
  noise: "all",
  sockets: "all",
  sort: "recommended",
};

function searchableText(place: PlaceSeed) {
  return [
    place.name,
    place.area,
    place.city,
    place.address,
    place.summary,
    place.foodNote,
    ...(place.tags ?? []),
    ...(place.bestFor ?? []),
    ...(place.mustOrder ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
}

export function filterPlaces(places: PlaceSeed[], filters: ExploreFilters) {
  const query = filters.query.trim().toLocaleLowerCase();
  const result = places.filter((place) => {
    if (filters.category !== "all" && place.category !== filters.category) return false;
    if (filters.city !== "all" && place.city !== filters.city) return false;
    if (filters.area !== "all" && place.area !== filters.area) return false;
    if (filters.maxBudget !== null && (place.costForTwo ?? 0) > filters.maxBudget) return false;
    if ((place.workScore ?? 0) < filters.minWorkScore) return false;
    if ((place.foodScore ?? 0) < filters.minFoodScore) return false;
    if (filters.noise !== "all" && place.noise !== filters.noise) return false;
    if (filters.sockets !== "all" && place.sockets !== filters.sockets) return false;
    return !query || searchableText(place).includes(query);
  });

  return result.sort((a, b) => {
    switch (filters.sort) {
      case "work":
        return (b.workScore ?? 0) - (a.workScore ?? 0);
      case "food":
        return (b.foodScore ?? 0) - (a.foodScore ?? 0);
      case "budget":
        return (a.costForTwo ?? Number.MAX_SAFE_INTEGER) - (b.costForTwo ?? Number.MAX_SAFE_INTEGER);
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return (
          (b.workScore ?? 7) +
          (b.foodScore ?? 7) +
          (b.confidence === "High" ? 1 : 0) -
          ((a.workScore ?? 7) + (a.foodScore ?? 7) + (a.confidence === "High" ? 1 : 0))
        );
    }
  });
}

export function placeKey(place: PlaceSeed | { id: string }) {
  return place.id.startsWith("g_") ? place.id : `seed_${place.id}`;
}
