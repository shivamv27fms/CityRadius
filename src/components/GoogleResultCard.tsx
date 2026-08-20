import { ArrowUpRight, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { getCategory } from "../data/categories";
import type { GooglePlaceData, PlaceCategory } from "../types";
import { CategoryArt } from "./CategoryArt";
import { GoogleAttribution } from "./GoogleAttribution";

export function GoogleResultCard({
  place,
  category,
}: {
  place: GooglePlaceData;
  category: PlaceCategory;
}) {
  const definition = getCategory(category);
  const target = `/google/${encodeURIComponent(place.id)}?category=${category}`;
  return (
    <article className="place-card place-card--google">
      <Link className="place-card__media" to={target}>
        {place.photoUrl ? (
          <>
            <img src={place.photoUrl} alt={`${place.displayName} from Google Places`} />
            <GoogleAttribution attributions={place.photoAttributions} />
          </>
        ) : (
          <CategoryArt category={category} label={place.displayName} />
        )}
        <span className={`category-badge category-badge--${definition.color}`}>
          LIVE · {definition.code}
        </span>
      </Link>
      <div className="place-card__body">
        <div className="place-card__topline">
          <p>Live from Google Places</p>
        </div>
        <Link className="place-card__link" to={target}>
          <h3>{place.displayName}</h3>
          <p className="place-card__summary">
            {place.formattedAddress ?? "Open the place to see its latest details."}
          </p>
        </Link>
        <div className="place-card__metrics">
          {typeof place.rating === "number" ? (
            <span>
              <Star size={14} fill="currentColor" /> {place.rating.toFixed(1)}
              <small> ({place.userRatingCount?.toLocaleString("en-IN") ?? 0})</small>
            </span>
          ) : (
            <span>Not yet rated</span>
          )}
          <span>{place.primaryTypeDisplayName ?? definition.label}</span>
        </div>
        <div className="place-card__footer">
          <span className="place-card__location">
            <MapPin size={14} /> Google-verified location
          </span>
          <Link className="round-link" to={target} aria-label={`View ${place.displayName}`}>
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
