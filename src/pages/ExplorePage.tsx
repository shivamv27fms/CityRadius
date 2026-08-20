import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Filter,
  LocateFixed,
  Map as MapIcon,
  RefreshCw,
  Search,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { GoogleMapPanel } from "../components/GoogleMapPanel";
import { GoogleResultCard } from "../components/GoogleResultCard";
import { PlaceCard } from "../components/PlaceCard";
import { categories, getCategory } from "../data/categories";
import { allPlaces } from "../data/places";
import { defaultFilters, filterPlaces } from "../lib/filters";
import {
  discoverGooglePlaces,
  googleMapsConfigured,
  GoogleMapsConfigurationError,
} from "../lib/googlePlaces";
import type {
  DelhiNcrCity,
  ExploreFilters,
  GooglePlaceData,
  PlaceCategory,
  PlaceSeed,
} from "../types";

const validCategories = new Set(categories.map((category) => category.id));
const validCities = new Set<DelhiNcrCity>(["New Delhi", "Gurugram", "Noida"]);
const validSorts = new Set<ExploreFilters["sort"]>(["recommended", "work", "food", "budget", "name"]);

function initialFilters(params: URLSearchParams): ExploreFilters {
  const category = params.get("category");
  const city = params.get("city");
  const sort = params.get("sort") as ExploreFilters["sort"] | null;
  return {
    ...defaultFilters,
    query: params.get("q") ?? "",
    category: category && validCategories.has(category as PlaceCategory) ? (category as PlaceCategory) : "all",
    city: city && validCities.has(city as DelhiNcrCity) ? (city as DelhiNcrCity) : "all",
    area: params.get("area") ?? "all",
    maxBudget: params.get("maxBudget") ? Number(params.get("maxBudget")) : null,
    minWorkScore: Number(params.get("minWorkScore") ?? 0),
    minFoodScore: Number(params.get("minFoodScore") ?? 0),
    noise: params.get("noise") ?? "all",
    sockets: params.get("sockets") ?? "all",
    sort: sort && validSorts.has(sort) ? sort : "recommended",
  };
}

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const liveRequested = searchParams.get("live") === "1";
  const [filters, setFilters] = useState<ExploreFilters>(() => initialFilters(searchParams));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mapVisible, setMapVisible] = useState(true);
  const [compare, setCompare] = useState<PlaceSeed[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [livePlaces, setLivePlaces] = useState<GooglePlaceData[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState("");
  const [openNow, setOpenNow] = useState(false);
  const autoLiveRan = useRef(false);
  const navigate = useNavigate();

  const results = useMemo(() => filterPlaces(allPlaces, filters), [filters]);
  const areas = useMemo(
    () =>
      [...new Set(
        allPlaces
          .filter((place) => filters.city === "all" || place.city === filters.city)
          .filter((place) => filters.category === "all" || place.category === filters.category)
          .map((place) => place.area),
      )].sort(),
    [filters.category, filters.city],
  );

  useEffect(() => {
    const next = new URLSearchParams();
    if (filters.query) next.set("q", filters.query);
    if (filters.category !== "all") next.set("category", filters.category);
    if (filters.city !== "all") next.set("city", filters.city);
    if (filters.area !== "all") next.set("area", filters.area);
    if (filters.maxBudget) next.set("maxBudget", String(filters.maxBudget));
    if (filters.minWorkScore) next.set("minWorkScore", String(filters.minWorkScore));
    if (filters.minFoodScore) next.set("minFoodScore", String(filters.minFoodScore));
    if (filters.noise !== "all") next.set("noise", filters.noise);
    if (filters.sockets !== "all") next.set("sockets", filters.sockets);
    if (filters.sort !== "recommended") next.set("sort", filters.sort);
    if (liveRequested) next.set("live", "1");
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [filters, liveRequested, searchParams, setSearchParams]);

  const runLiveSearch = async () => {
    if (filters.category === "all" || filters.city === "all") {
      setLiveError("Choose a category and city for focused live results.");
      return;
    }
    setLiveLoading(true);
    setLiveError("");
    try {
      const places = await discoverGooglePlaces({
        category: filters.category,
        city: filters.city,
        query: filters.query,
        openNow,
      });
      setLivePlaces(places);
    } catch (error) {
      setLiveError(
        error instanceof GoogleMapsConfigurationError
          ? "Connect the restricted Google Maps browser key to run live discovery."
          : "Live Google results could not be loaded. Check API restrictions and quota, then try again.",
      );
    } finally {
      setLiveLoading(false);
    }
  };

  useEffect(() => {
    if (!liveRequested || autoLiveRan.current) return;
    autoLiveRan.current = true;
    void runLiveSearch();
  }, [liveRequested]);

  const update = <K extends keyof ExploreFilters>(key: K, value: ExploreFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value, ...(key === "city" ? { area: "all" } : {}) }));

  const toggleCompare = (place: PlaceSeed) => {
    setCompare((current) => {
      if (current.some((item) => item.id === place.id)) return current.filter((item) => item.id !== place.id);
      if (current.length === 3) return current;
      return [...current, place];
    });
  };

  const activeFilterCount = [
    filters.category !== "all",
    filters.city !== "all",
    filters.area !== "all",
    filters.maxBudget !== null,
    filters.minWorkScore > 0,
    filters.minFoodScore > 0,
    filters.noise !== "all",
    filters.sockets !== "all",
  ].filter(Boolean).length;

  return (
    <div className="explore-page">
      <section className="explore-hero">
        <div className="container">
          <span className="eyebrow">Explore Delhi NCR</span>
          <div className="explore-hero__title">
            <h1>Find the place that fits.</h1>
            <p>{allPlaces.length} researched starting points plus live results from Google Places.</p>
          </div>
          <div className="explore-searchbar">
            <Search size={20} />
            <input
              value={filters.query}
              onChange={(event) => update("query", event.target.value)}
              placeholder="Search by name, area, mood or amenity"
              aria-label="Search places"
            />
            {filters.query ? (
              <button type="button" aria-label="Clear search" onClick={() => update("query", "")}>
                <X size={17} />
              </button>
            ) : null}
          </div>
          <div className="category-pills" role="list" aria-label="Place categories">
            <button
              className={filters.category === "all" ? "active" : ""}
              type="button"
              onClick={() => update("category", "all")}
            >
              All places
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                className={filters.category === category.id ? "active" : ""}
                type="button"
                onClick={() => update("category", category.id)}
              >
                <span>{category.code}</span> {category.shortLabel}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="explore-content container">
        <aside className={`filter-panel ${filtersOpen ? "filter-panel--open" : ""}`}>
          <div className="filter-panel__header">
            <div>
              <SlidersHorizontal size={18} />
              <strong>Filters</strong>
            </div>
            <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
              <X size={19} />
            </button>
          </div>
          <label className="field-label">
            City
            <span className="select-wrap">
              <select value={filters.city} onChange={(event) => update("city", event.target.value as ExploreFilters["city"])}>
                <option value="all">All Delhi NCR</option>
                <option value="New Delhi">Delhi</option>
                <option value="Gurugram">Gurugram</option>
                <option value="Noida">Noida</option>
              </select>
              <ChevronDown size={15} />
            </span>
          </label>
          <label className="field-label">
            Area
            <span className="select-wrap">
              <select value={filters.area} onChange={(event) => update("area", event.target.value)}>
                <option value="all">All areas</option>
                {areas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} />
            </span>
          </label>
          <div className="filter-group">
            <span>Budget for two</span>
            <div className="segmented-control segmented-control--wrap">
              {[null, 900, 1400, 2000].map((budget) => (
                <button
                  key={String(budget)}
                  type="button"
                  className={filters.maxBudget === budget ? "active" : ""}
                  onClick={() => update("maxBudget", budget)}
                >
                  {budget === null ? "Any" : `≤ ₹${budget}`}
                </button>
              ))}
            </div>
          </div>
          <label className="range-field">
            <span>
              Minimum work score <b>{filters.minWorkScore || "Any"}</b>
            </span>
            <input
              type="range"
              min="0"
              max="9"
              step="1"
              value={filters.minWorkScore}
              onChange={(event) => update("minWorkScore", Number(event.target.value))}
            />
          </label>
          <label className="range-field">
            <span>
              Minimum food score <b>{filters.minFoodScore || "Any"}</b>
            </span>
            <input
              type="range"
              min="0"
              max="9"
              step="1"
              value={filters.minFoodScore}
              onChange={(event) => update("minFoodScore", Number(event.target.value))}
            />
          </label>
          <label className="field-label">
            Noise
            <span className="select-wrap">
              <select value={filters.noise} onChange={(event) => update("noise", event.target.value)}>
                <option value="all">Any atmosphere</option>
                <option value="Quiet">Quiet</option>
                <option value="Moderate">Moderate</option>
                <option value="Lively">Lively</option>
              </select>
              <ChevronDown size={15} />
            </span>
          </label>
          <label className="field-label">
            Sockets
            <span className="select-wrap">
              <select value={filters.sockets} onChange={(event) => update("sockets", event.target.value)}>
                <option value="all">Any availability</option>
                <option value="Plenty">Plenty</option>
                <option value="Some">Some</option>
                <option value="Limited">Limited</option>
              </select>
              <ChevronDown size={15} />
            </span>
          </label>
          <button
            className="button button--full button--outline"
            type="button"
            onClick={() => setFilters({ ...defaultFilters, query: filters.query })}
          >
            Reset filters
          </button>
        </aside>

        <div className="results-column">
          <div className="results-toolbar">
            <div>
              <button className="filter-trigger" type="button" onClick={() => setFiltersOpen(true)}>
                <Filter size={17} /> Filters {activeFilterCount ? <b>{activeFilterCount}</b> : null}
              </button>
              <span>
                <strong>{results.length}</strong> curated result{results.length === 1 ? "" : "s"}
              </span>
            </div>
            <div>
              <button
                className="surprise-button"
                type="button"
                disabled={!results.length}
                onClick={() => {
                  const random = results[Math.floor(Math.random() * results.length)];
                  if (random) navigate(`/places/${random.slug}`);
                }}
              >
                <Shuffle size={16} /> Pick for me
              </button>
              <span className="select-wrap select-wrap--compact">
                <select value={filters.sort} onChange={(event) => update("sort", event.target.value as ExploreFilters["sort"])}>
                  <option value="recommended">Recommended</option>
                  <option value="work">Highest work score</option>
                  <option value="food">Highest food score</option>
                  <option value="budget">Lowest cost</option>
                  <option value="name">Name A–Z</option>
                </select>
                <ChevronDown size={14} />
              </span>
              <button className={`map-toggle ${mapVisible ? "active" : ""}`} type="button" onClick={() => setMapVisible((visible) => !visible)}>
                <MapIcon size={16} /> Map
              </button>
            </div>
          </div>

          <div className={`results-layout ${mapVisible ? "results-layout--with-map" : ""}`}>
            <div className="results-list">
              {results.length ? (
                <div className="place-grid place-grid--results">
                  {results.map((place, index) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      enrich={index < 8}
                      index={index + 1}
                      selected={compare.some((item) => item.id === place.id)}
                      onCompare={toggleCompare}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Search size={32} />
                  <h2>No curated places match yet.</h2>
                  <p>Clear a filter or use live Google discovery for a broader city search.</p>
                  <button className="button button--ink" type="button" onClick={() => setFilters(defaultFilters)}>
                    Clear filters
                  </button>
                </div>
              )}
            </div>
            {mapVisible ? (
              <div className="results-map-column">
                <GoogleMapPanel
                  places={results}
                  googlePlaces={livePlaces}
                  city={filters.city}
                  className="explore-map"
                />
              </div>
            ) : null}
          </div>

          <section className="live-discovery">
            <div className="live-discovery__header">
              <div>
                <span className="eyebrow">
                  <span className="live-dot" /> Live Google Places search
                </span>
                <h2>Go beyond the curated list.</h2>
                <p>
                  Choose a specific category and city, then fetch current places, photos, ratings and addresses.
                </p>
              </div>
              <div className="live-discovery__controls">
                <label className="check-field">
                  <input type="checkbox" checked={openNow} onChange={(event) => setOpenNow(event.target.checked)} />
                  <span>Open now</span>
                </label>
                <button className="button button--signal" type="button" onClick={() => void runLiveSearch()} disabled={liveLoading}>
                  {liveLoading ? <RefreshCw className="spin" size={17} /> : <LocateFixed size={17} />}
                  {liveLoading ? "Searching…" : "Search live places"}
                </button>
              </div>
            </div>
            {!googleMapsConfigured ? (
              <div className="integration-note">
                <Sparkles size={20} />
                <div>
                  <strong>Google integration is ready for the restricted key.</strong>
                  <p>The app intentionally does not commit browser keys. Add it in the deployment environment to activate live results.</p>
                </div>
              </div>
            ) : null}
            {liveError ? <p className="form-message form-message--error">{liveError}</p> : null}
            {livePlaces.length ? (
              <div className="place-grid place-grid--results live-results">
                {livePlaces.map((place) => (
                  <GoogleResultCard key={place.id} place={place} category={filters.category === "all" ? "cafe" : filters.category} />
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </section>

      {compare.length ? (
        <div className="compare-bar" role="region" aria-label="Place comparison">
          <div>
            <strong>{compare.length}/3 selected</strong>
            <span>{compare.map((place) => place.name).join(" · ")}</span>
          </div>
          <div>
            <button type="button" onClick={() => setCompare([])}>Clear</button>
            <button className="button button--signal button--small" type="button" onClick={() => setCompareOpen(true)} disabled={compare.length < 2}>
              Compare <ArrowRight size={15} />
            </button>
          </div>
        </div>
      ) : null}

      {compareOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setCompareOpen(false)}>
          <section className="compare-modal" role="dialog" aria-modal="true" aria-labelledby="compare-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">Side by side</span>
                <h2 id="compare-title">Compare your shortlist</h2>
              </div>
              <button type="button" aria-label="Close comparison" onClick={() => setCompareOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="compare-table-wrap">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Signal</th>
                    {compare.map((place) => <th key={place.id}>{place.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr><th>Area</th>{compare.map((place) => <td key={place.id}>{place.area}</td>)}</tr>
                  <tr><th>Work score</th>{compare.map((place) => <td key={place.id}>{place.workScore ? `${place.workScore}/10` : "—"}</td>)}</tr>
                  <tr><th>Food score</th>{compare.map((place) => <td key={place.id}>{place.foodScore ? `${place.foodScore}/10` : "—"}</td>)}</tr>
                  <tr><th>Budget</th>{compare.map((place) => <td key={place.id}>{place.costForTwo ? `₹${place.costForTwo.toLocaleString("en-IN")}` : "Live"}</td>)}</tr>
                  <tr><th>Noise</th>{compare.map((place) => <td key={place.id}>{place.noise ?? "Live"}</td>)}</tr>
                  <tr><th>Sockets</th>{compare.map((place) => <td key={place.id}>{place.sockets ?? "Not listed"}</td>)}</tr>
                  <tr><th>Best for</th>{compare.map((place) => <td key={place.id}>{place.bestFor?.join(", ") ?? place.tags?.join(", ") ?? "—"}</td>)}</tr>
                </tbody>
              </table>
            </div>
            <div className="compare-modal__footer">
              {compare.map((place) => (
                <Link key={place.id} className="text-link" to={`/places/${place.slug}`}>
                  Open {place.name} <ArrowRight size={15} />
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
