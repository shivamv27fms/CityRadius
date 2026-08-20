import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Coffee,
  Dumbbell,
  LibraryBig,
  Pill,
  Printer,
} from "lucide-react";
import type { PlaceCategory } from "../types";

const icons = {
  cafe: Coffee,
  pg: Building2,
  library: LibraryBig,
  coworking: BriefcaseBusiness,
  bookstore: BookOpen,
  printing: Printer,
  fitness: Dumbbell,
  pharmacy: Pill,
};

export function CategoryIcon({ category, size = 20 }: { category: PlaceCategory; size?: number }) {
  const Icon = icons[category];
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}
