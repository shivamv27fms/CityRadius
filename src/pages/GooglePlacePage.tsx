import { useEffect, useState } from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { PlaceDetailView } from "../components/PlaceDetailView";
import { fetchGooglePlaceById } from "../lib/googlePlaces";
import type { GooglePlaceData, PlaceCategory } from "../types";

const categories = new Set<PlaceCategory>([
  "cafe",
  "pg",
  "library",
  "coworking",
  "bookstore",
  "printing",
  "fitness",
  "pharmacy",
]);

export function GooglePlacePage() {
  const { placeId } = useParams();
  const [searchParams] = useSearchParams();
  const requestedCategory = searchParams.get("category") as PlaceCategory | null;
  const category = requestedCategory && categories.has(requestedCategory) ? requestedCategory : "cafe";
  const [data, setData] = useState<GooglePlaceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!placeId) return;
    setLoading(true);
    void fetchGooglePlaceById(placeId)
      .then((result) => {
        if (active) setData(result);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [placeId]);

  if (!placeId) return <Navigate to="/not-found" replace />;
  return (
    <PlaceDetailView
      googlePlaceId={placeId}
      googleData={data}
      category={category}
      loading={loading}
    />
  );
}
