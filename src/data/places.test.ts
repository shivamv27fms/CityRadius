import { describe, expect, it } from "vitest";
import { allPlaces, cafes, placesBySlug } from "./places";

describe("CityRadius place data", () => {
  it("includes every supplied cafe row", () => {
    expect(cafes).toHaveLength(30);
    expect(cafes.every((place) => place.category === "cafe")).toBe(true);
    expect(cafes.every((place) => place.name && place.address && place.googleQuery)).toBe(true);
  });

  it("keeps identifiers and routes unique", () => {
    expect(new Set(allPlaces.map((place) => place.id)).size).toBe(allPlaces.length);
    expect(new Set(allPlaces.map((place) => place.slug)).size).toBe(allPlaces.length);
    expect(placesBySlug.size).toBe(allPlaces.length);
  });

  it("adds verified non-cafe starting points", () => {
    const categories = new Set(allPlaces.map((place) => place.category));
    expect(categories).toEqual(new Set(["cafe", "library", "coworking", "bookstore"]));
    expect(allPlaces.filter((place) => place.category !== "cafe")).toHaveLength(10);
  });
});
