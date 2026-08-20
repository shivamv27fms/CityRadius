import { ArrowUpRight, Bookmark, MapPin, Star } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCategory } from "../data/categories";
import { useFavorites } from "../contexts/FavoritesContext";
import { useGooglePlace } from "../hooks/useGooglePlace";
import { placeKey } from "../lib/filters";
import type { PlaceSeed } from "../types";
import { CategoryArt } from "./CategoryArt";
import { GoogleAttribution } from "./GoogleAttribution";

interface PlaceCardProps {
  place: PlaceSeed;
  enrich?: boolean;
  selected?: boolean;
  onCompare?: (place: PlaceSeed) => void;
  index?: number;
}

export function PlaceCard({ place, enrich = false, selected, onCompare, index }: PlaceCardProps) {
  const { data: googleData, loading } = useGooglePlace(place, enrich);
  const { isFavorite, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();
  const category = getCategory(place.category);
  const key = placeKey(place);
  const saved = isFavorite(key);

  const handleFavorite = async () => {
    try {
      await toggleFavorite({
        placeKey: key,
        slug: place.slug,
        googlePlaceId: googleData?.id,
        name: place.name,
        category: place.category,
        city: place.city,
        area: place.area,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "LOGIN_REQUIRED") {
        navigate(`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`);
      }
    }
  };

  return (
    <article className="place-card">
      <Link className="place-card__media" to={`/places/${place.slug}`}>
        {googleData?.photoUrl ? (
          <>
            <img src={googleData.photoUrl} alt={`${googleData.displayName} from Google Places`} />
            <GoogleAttribution attributions={googleData.photoAttributions} />
          </>
        ) : (
          <CategoryArt category={place.category} label={place.name} />
        )}
        {loading && <span className="place-card__loading">Finding live photo…</span>}
        <span className={`category-badge category-badge--${category.color}`}>
          {category.code} {index ? String(index).padStart(2, "0") : ""}
        </span>
      </Link>

      <div className="place-card__body">
        <div className="place-card__topline">
          <p>{category.shortLabel}</p>
          <button
            className={`icon-button ${saved ? "icon-button--active" : ""}`}
            type="button"
            aria-label={saved ? `Remove ${place.name} from saved places` : `Save ${place.name}`}
            onClick={() => void handleFavorite()}
          >
            <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
        <Link className="place-card__link" to={`/places/${place.slug}`}>
          <h3>{place.name}</h3>
          <p className="place-card__summary">{place.summary ?? place.foodNote}</p>
        </Link>

        <div className="place-card__metrics">
          {typeof googleData?.rating === "number" ? (
            <span>
              <Star size={14} fill="currentColor" /> {googleData.rating.toFixed(1)}
              <small> Google</small>
            </span>
          ) : typeof place.workScore === "number" ? (
            <span>
              <strong>{place.workScore}</strong>/10 work
            </span>
          ) : (
            <span>Live details</span>
          )}
          {place.costForTwo ? <span>₹{place.costForTwo.toLocaleString("en-IN")} for two</span> : null}
        </div>

        <div className="place-card__footer">
          <span className="place-card__location">
            <MapPin size={14} /> {place.area}, {place.city === "New Delhi" ? "Delhi" : place.city}
          </span>
          <Link className="round-link" to={`/places/${place.slug}`} aria-label={`View ${place.name}`}>
            <ArrowUpRight size={16} />
          </Link>
        </div>

        {onCompare ? (
          <button
            className={`compare-toggle ${selected ? "compare-toggle--selected" : ""}`}
            type="button"
            onClick={() => onCompare(place)}
          >
            {selected ? "Added to compare" : "Compare"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
