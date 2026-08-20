import { getCategory } from "../data/categories";
import type { PlaceCategory } from "../types";
import { CategoryIcon } from "./CategoryIcon";

export function CategoryArt({ category, label }: { category: PlaceCategory; label: string }) {
  const definition = getCategory(category);
  return (
    <div className={`category-art category-art--${definition.color}`} aria-label={label} role="img">
      <span className="category-art__orbit" />
      <span className="category-art__orbit category-art__orbit--small" />
      <span className="category-art__icon">
        <CategoryIcon category={category} size={34} />
      </span>
      <span className="category-art__code">{definition.code}</span>
    </div>
  );
}
