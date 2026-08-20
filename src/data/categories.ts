import type { DelhiNcrCity, PlaceCategory } from "../types";

export interface CategoryDefinition {
  id: PlaceCategory;
  label: string;
  shortLabel: string;
  description: string;
  code: string;
  color: string;
  discoveryTerm: string;
  details: string[];
}

export const categories: CategoryDefinition[] = [
  {
    id: "cafe",
    label: "Cafés",
    shortLabel: "Cafés",
    description: "Coffee, food and laptop-friendly corners.",
    code: "CAF",
    color: "clay",
    discoveryTerm: "cafes",
    details: ["Work score", "Food score", "Wi-Fi", "Sockets", "Noise"],
  },
  {
    id: "pg",
    label: "PGs & hostels",
    shortLabel: "PGs",
    description: "Rooms, rent, meals, rules and real resident context.",
    code: "PGH",
    color: "blue",
    discoveryTerm: "paying guest accommodation and student hostels",
    details: ["Rent", "Deposit", "Meals", "Curfew", "Room type"],
  },
  {
    id: "library",
    label: "Libraries & study rooms",
    shortLabel: "Libraries",
    description: "Quiet seats, useful hours and places to focus.",
    code: "LIB",
    color: "violet",
    discoveryTerm: "libraries and study rooms",
    details: ["Membership", "Seats", "Silence", "Sockets", "Hours"],
  },
  {
    id: "coworking",
    label: "Coworking",
    shortLabel: "Coworking",
    description: "Day passes, meeting rooms and dependable work setups.",
    code: "COW",
    color: "green",
    discoveryTerm: "coworking spaces",
    details: ["Day pass", "Meeting rooms", "Wi-Fi", "Calls", "Hours"],
  },
  {
    id: "bookstore",
    label: "Bookstores",
    shortLabel: "Books",
    description: "Independent shops, big collections and reading corners.",
    code: "BKS",
    color: "gold",
    discoveryTerm: "book stores",
    details: ["Collection", "Seating", "Events", "Café", "Hours"],
  },
  {
    id: "printing",
    label: "Printing & stationery",
    shortLabel: "Printing",
    description: "Printouts, binding and last-minute project saves.",
    code: "PRT",
    color: "pink",
    discoveryTerm: "printing and stationery shops",
    details: ["Colour prints", "Binding", "Delivery", "Turnaround", "Hours"],
  },
  {
    id: "fitness",
    label: "Fitness",
    shortLabel: "Fitness",
    description: "Gyms, yoga studios and flexible memberships.",
    code: "FIT",
    color: "orange",
    discoveryTerm: "gyms and fitness centers",
    details: ["Day pass", "Classes", "Equipment", "Trainer", "Hours"],
  },
  {
    id: "pharmacy",
    label: "Pharmacies",
    shortLabel: "Pharmacy",
    description: "Reliable medicine stores, including late-night options.",
    code: "MED",
    color: "mint",
    discoveryTerm: "pharmacies",
    details: ["24 hours", "Delivery", "Prescription", "Essentials", "Distance"],
  },
];

export const cityCenters: Record<DelhiNcrCity, { lat: number; lng: number }> = {
  "New Delhi": { lat: 28.6139, lng: 77.209 },
  Gurugram: { lat: 28.4595, lng: 77.0266 },
  Noida: { lat: 28.5355, lng: 77.391 },
};

export const cityCopy: Record<DelhiNcrCity, { label: string; note: string }> = {
  "New Delhi": {
    label: "Delhi",
    note: "From quiet reading rooms to old-city coffee stops.",
  },
  Gurugram: {
    label: "Gurugram",
    note: "Work cafés, coworking hubs and neighbourhood essentials.",
  },
  Noida: {
    label: "Noida",
    note: "Expressway work spots, community cafés and study spaces.",
  },
};

export function getCategory(id: PlaceCategory) {
  return categories.find((category) => category.id === id) ?? categories[0];
}
