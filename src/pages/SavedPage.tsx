import { Bookmark, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { PlaceCard } from "../components/PlaceCard";
import { GoogleResultCard } from "../components/GoogleResultCard";
import { useAuth } from "../contexts/AuthContext";
import { useFavorites } from "../contexts/FavoritesContext";
import { allPlaces } from "../data/places";
import { placeKey } from "../lib/filters";

export function SavedPage() {
  const { profile } = useAuth();
  const { favorites, favoriteRecords } = useFavorites();
  const savedPlaces = allPlaces.filter((place) => favorites.has(placeKey(place)));
  const seededKeys = new Set(savedPlaces.map(placeKey));
  const savedGooglePlaces = favoriteRecords.filter(
    (favorite) => favorite.googlePlaceId && !seededKeys.has(favorite.placeKey),
  );

  if (!profile) {
    return (
      <section className="gate-page container">
        <span><Bookmark size={30} /></span><span className="eyebrow">Your shortlist</span>
        <h1>Keep the places you want to remember.</h1>
        <p>Sign in with your email to save places across your CityRadius sessions.</p>
        <Link className="button button--signal" to="/login?returnTo=%2Fsaved">Sign in to see saved places</Link>
      </section>
    );
  }

  return (
    <section className="listing-page container">
      <div className="listing-page__header"><div><span className="eyebrow">Your CityRadius</span><h1>Saved places</h1><p>{favorites.size} place{favorites.size === 1 ? "" : "s"} in your shortlist.</p></div><Link className="button button--outline" to="/explore"><Compass size={17} /> Explore more</Link></div>
      {favorites.size ? (
        <div className="place-grid place-grid--featured">
          {savedPlaces.map((place) => <PlaceCard key={place.id} place={place} enrich />)}
          {savedGooglePlaces.map((place) => (
            <GoogleResultCard
              key={place.placeKey}
              category={place.category}
              place={{ id: place.googlePlaceId!, displayName: place.name, source: "google" }}
            />
          ))}
        </div>
      ) : <div className="empty-state"><Bookmark size={32} /><h2>Your shortlist is empty.</h2><p>Save a café, library or another useful spot while exploring.</p><Link className="button button--ink" to="/explore">Start exploring</Link></div>}
    </section>
  );
}
