import { useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { PlaceDetailView } from "../components/PlaceDetailView";
import { allPlaces, placesBySlug } from "../data/places";
import { useGooglePlace } from "../hooks/useGooglePlace";
import { fetchGooglePlaceById } from "../lib/googlePlaces";
import type { GooglePlaceData } from "../types";

export function PlaceDetailPage() {
  const { slug } = useParams();
  const place = slug ? placesBySlug.get(slug) : undefined;
  const { data: cardData, loading } = useGooglePlace(place, true);
  const [detailData, setDetailData] = useState<GooglePlaceData | null>(null);

  useEffect(() => {
    let active = true;
    if (!cardData?.id) return;
    void fetchGooglePlaceById(cardData.id).then((result) => {
      if (active) setDetailData(result);
    });
    return () => {
      active = false;
    };
  }, [cardData?.id]);

  const similar = useMemo(
    () =>
      place
        ? allPlaces.filter(
            (candidate) => candidate.id !== place.id && candidate.category === place.category,
          )
        : [],
    [place],
  );

  if (!place) return <Navigate to="/not-found" replace />;
  return (
    <PlaceDetailView
      seed={place}
      googleData={detailData ?? cardData}
      category={place.category}
      loading={loading}
      similar={similar}
    />
  );
}
