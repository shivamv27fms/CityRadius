import { describe, expect, it } from "vitest";
import { defaultFilters, filterPlaces } from "./filters";
import type { PlaceSeed } from "../types";

const fixtures: PlaceSeed[] = [
  {
    id: "one",
    slug: "one",
    name: "Quiet Cafe",
    category: "cafe",
    area: "CP",
    city: "New Delhi",
    address: "One Street",
    googleQuery: "Quiet Cafe Delhi",
    costForTwo: 500,
    workScore: 9,
    foodScore: 7,
    noise: "Quiet",
    sockets: "Plenty",
  },
  {
    id: "two",
    slug: "two",
    name: "Study Library",
    category: "library",
    area: "Sector 1",
    city: "Noida",
    address: "Two Street",
    googleQuery: "Study Library Noida",
  },
];

describe("filterPlaces", () => {
  it("filters across category and query", () => {
    const result = filterPlaces(fixtures, {
      ...defaultFilters,
      category: "cafe",
      query: "quiet",
    });
    expect(result.map((place) => place.id)).toEqual(["one"]);
  });

  it("keeps non-cafe places when score filters are inactive", () => {
    const result = filterPlaces(fixtures, { ...defaultFilters, city: "Noida" });
    expect(result.map((place) => place.id)).toEqual(["two"]);
  });
});
