import { useEffect, useState } from "react";
import { resolveSeedPlace } from "../lib/googlePlaces";
import type { GooglePlaceData, PlaceSeed } from "../types";

export function useGooglePlace(seed: PlaceSeed | undefined, enabled = true) {
  const [data, setData] = useState<GooglePlaceData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!seed || !enabled) return;
    setLoading(true);
    void resolveSeedPlace(seed)
      .then((result) => {
        if (active) setData(result);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [seed, enabled]);

  return { data, loading };
}
