import { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPinned } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cityCenters } from "../data/categories";
import {
  googleMapsConfigured,
  loadGoogleMaps,
  resolveSeedPlace,
} from "../lib/googlePlaces";
import type { DelhiNcrCity, GooglePlaceData, PlaceSeed } from "../types";

interface GoogleMapPanelProps {
  places?: PlaceSeed[];
  googlePlaces?: GooglePlaceData[];
  city?: DelhiNcrCity | "all";
  className?: string;
}

export function GoogleMapPanel({ places = [], googlePlaces = [], city = "all", className = "" }: GoogleMapPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const markers: google.maps.Marker[] = [];
    if (!googleMapsConfigured || !containerRef.current) return;

    const render = async () => {
      setStatus("loading");
      await loadGoogleMaps();
      if (!active || !containerRef.current) return;
      const center = city === "all" ? cityCenters["New Delhi"] : cityCenters[city];
      const map = new google.maps.Map(containerRef.current, {
        center,
        zoom: city === "all" ? 10 : 12,
        disableDefaultUI: true,
        zoomControl: true,
        fullscreenControl: true,
        clickableIcons: false,
        styles: [
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
          { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
        ],
      });
      mapRef.current = map;
      const bounds = new google.maps.LatLngBounds();

      const resolvedSeeds: Array<{ seed: PlaceSeed; live: GooglePlaceData }> = [];
      for (const seed of places.slice(0, 14)) {
        if (!active) return;
        const live = await resolveSeedPlace(seed);
        if (live?.location) resolvedSeeds.push({ seed, live });
      }

      for (const { seed, live } of resolvedSeeds) {
        if (!live.location) continue;
        const marker = new google.maps.Marker({
          map,
          position: live.location,
          title: seed.name,
          label: {
            text: String((seed.workScore ?? 0) || "•"),
            color: "#ffffff",
            fontFamily: "Manrope",
            fontWeight: "700",
          },
        });
        marker.addListener("click", () => navigate(`/places/${seed.slug}`));
        markers.push(marker);
        bounds.extend(live.location);
      }

      for (const place of googlePlaces) {
        if (!place.location) continue;
        const marker = new google.maps.Marker({
          map,
          position: place.location,
          title: place.displayName,
        });
        marker.addListener("click", () => navigate(`/google/${encodeURIComponent(place.id)}`));
        markers.push(marker);
        bounds.extend(place.location);
      }

      if (!bounds.isEmpty()) map.fitBounds(bounds, 60);
      if (active) setStatus("ready");
    };

    void render().catch((error) => {
      console.warn("CityRadius map could not be rendered.", error);
      if (active) setStatus("error");
    });

    return () => {
      active = false;
      markers.forEach((marker) => marker.setMap(null));
    };
  }, [city, googlePlaces, navigate, places]);

  if (!googleMapsConfigured) {
    return (
      <div className={`map-fallback ${className}`}>
        <div className="map-fallback__grid" aria-hidden="true">
          <span className="map-pin map-pin--one">D</span>
          <span className="map-pin map-pin--two">G</span>
          <span className="map-pin map-pin--three">N</span>
          <span className="map-route" />
        </div>
        <div className="map-fallback__message">
          <MapPinned size={24} />
          <strong>Live map ready to connect</strong>
          <span>Add the restricted Google browser key to show live places and photos.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`google-map-shell ${className}`}>
      <div ref={containerRef} className="google-map" aria-label="Map of CityRadius places" />
      {status === "loading" ? <span className="map-status">Locating places…</span> : null}
      {status === "error" ? <span className="map-status map-status--error">Map unavailable</span> : null}
      <button
        className="map-locate"
        type="button"
        onClick={() => {
          navigator.geolocation?.getCurrentPosition(({ coords }) => {
            mapRef.current?.panTo({ lat: coords.latitude, lng: coords.longitude });
            mapRef.current?.setZoom(14);
          });
        }}
      >
        <LocateFixed size={16} /> Near me
      </button>
    </div>
  );
}
