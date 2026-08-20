import { useMemo } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  Check,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  Laptop,
  MapPin,
  Navigation,
  Phone,
  PlugZap,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Utensils,
  Volume2,
  Wifi,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useFavorites } from "../contexts/FavoritesContext";
import { getCategory } from "../data/categories";
import { placeKey } from "../lib/filters";
import type { PlaceIdentity } from "../lib/community";
import type { GooglePlaceData, PlaceCategory, PlaceSeed } from "../types";
import { CategoryArt } from "./CategoryArt";
import { GoogleAttribution } from "./GoogleAttribution";
import { GoogleMapPanel } from "./GoogleMapPanel";
import { PlaceCard } from "./PlaceCard";
import { ReviewSection } from "./ReviewSection";

interface PlaceDetailViewProps {
  seed?: PlaceSeed;
  googleData?: GooglePlaceData | null;
  googlePlaceId?: string;
  category: PlaceCategory;
  loading?: boolean;
  similar?: PlaceSeed[];
}

export function PlaceDetailView({
  seed,
  googleData,
  googlePlaceId,
  category,
  loading,
  similar = [],
}: PlaceDetailViewProps) {
  const definition = getCategory(category);
  const navigate = useNavigate();
  const location = useLocation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const identity: PlaceIdentity = {
    placeKey: seed ? placeKey(seed) : `g_${googlePlaceId ?? googleData?.id ?? "unknown"}`,
    googlePlaceId: googleData?.id ?? googlePlaceId,
    slug: seed?.slug,
    name: googleData?.displayName ?? seed?.name ?? "CityRadius place",
    category,
    city: seed?.city,
    area: seed?.area,
  };
  const saved = isFavorite(identity.placeKey);
  const displayName = googleData?.displayName ?? seed?.name ?? "Place details";
  const address = googleData?.formattedAddress ?? seed?.address;
  const mapSeeds = useMemo(() => (seed ? [seed] : []), [seed]);
  const mapGooglePlaces = useMemo(() => (googleData ? [googleData] : []), [googleData]);

  const save = async () => {
    try {
      await toggleFavorite(identity);
    } catch (error) {
      if (error instanceof Error && error.message === "LOGIN_REQUIRED") {
        navigate(`/login?returnTo=${encodeURIComponent(location.pathname)}`);
      }
    }
  };

  const share = async () => {
    const payload = { title: `${displayName} · CityRadius`, text: `Take a look at ${displayName} on CityRadius.`, url: window.location.href };
    if (navigator.share) await navigator.share(payload).catch(() => undefined);
    else await navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="place-detail-page">
      <div className="container place-breadcrumbs">
        <Link to="/explore"><ArrowLeft size={15} /> Explore</Link>
        <span>/</span>
        <Link to={`/explore?category=${category}`}>{definition.label}</Link>
        <span>/</span>
        <span>{displayName}</span>
      </div>

      <section className="place-hero container">
        <div className="place-hero__media">
          {googleData?.photoUrl ? (
            <>
              <img src={googleData.photoUrl} alt={`${displayName} from Google Places`} />
              <GoogleAttribution attributions={googleData.photoAttributions} />
            </>
          ) : (
            <CategoryArt category={category} label={displayName} />
          )}
          {loading ? <span className="place-hero__loading">Loading live Google details…</span> : null}
          <span className={`category-badge category-badge--${definition.color}`}>{definition.code}</span>
        </div>

        <div className="place-hero__content">
          <div className="place-hero__meta">
            <span>{definition.label}</span>
            {seed?.confidence ? <span><ShieldCheck size={14} /> {seed.confidence} editorial confidence</span> : null}
          </div>
          <h1>{displayName}</h1>
          <p className="place-hero__summary">{seed?.summary ?? seed?.foodNote ?? "Live local details from Google Places, with CityRadius reviews layered separately."}</p>
          <p className="place-address"><MapPin size={17} /> {address ?? "Address available from Google Places"}</p>

          <div className="place-hero__signals">
            <div>
              <span>Google rating</span>
              <strong>{googleData?.rating ? <><Star size={17} fill="currentColor" /> {googleData.rating.toFixed(1)}</> : "Live"}</strong>
              <small>{googleData?.userRatingCount ? `${googleData.userRatingCount.toLocaleString("en-IN")} ratings` : "via Google"}</small>
            </div>
            {seed?.workScore ? (
              <div><span>Work score</span><strong>{seed.workScore}/10</strong><small>CityRadius editorial</small></div>
            ) : null}
            {seed?.costForTwo ? (
              <div><span>Typical spend</span><strong>₹{seed.costForTwo.toLocaleString("en-IN")}</strong><small>approximately for two</small></div>
            ) : null}
            <div>
              <span>Current status</span>
              <strong>Check live</strong>
              <small>from Google hours</small>
            </div>
          </div>

          <div className="place-actions">
            {googleData?.googleMapsURI ? (
              <a className="button button--signal" href={googleData.googleMapsURI} target="_blank" rel="noreferrer">
                <Navigation size={17} /> Directions
              </a>
            ) : null}
            <button className={`button button--outline ${saved ? "button--saved" : ""}`} type="button" onClick={() => void save()}>
              <Bookmark size={17} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save"}
            </button>
            <button className="button button--outline" type="button" onClick={() => void share()}>
              <Share2 size={17} /> Share
            </button>
          </div>
        </div>
      </section>

      <section className="container place-main-grid">
        <div className="place-main-column">
          {seed ? (
            <section className="detail-section">
              <span className="eyebrow">CityRadius take</span>
              <h2>The useful context</h2>
              <p className="detail-lead">{seed.foodNote ?? seed.summary}</p>
              {seed.category === "cafe" ? (
                <div className="insight-grid">
                  <article><Laptop size={20} /><span>Best for</span><strong>{seed.bestFor?.join(" · ")}</strong></article>
                  <article><Clock3 size={20} /><span>Best time</span><strong>{seed.bestTime}</strong></article>
                  <article><Wifi size={20} /><span>Wi-Fi</span><strong>{seed.wifi ? "Available" : "Unconfirmed"}</strong></article>
                  <article><PlugZap size={20} /><span>Sockets</span><strong>{seed.sockets}</strong></article>
                  <article><Volume2 size={20} /><span>Noise</span><strong>{seed.noise}</strong></article>
                  <article><CircleDollarSign size={20} /><span>Laptop tolerance</span><strong>{seed.laptopTolerance}</strong></article>
                </div>
              ) : seed.categoryDetails ? (
                <div className="insight-grid">
                  {Object.entries(seed.categoryDetails).map(([label, value]) => (
                    <article key={label}><Check size={20} /><span>{label}</span><strong>{String(value)}</strong></article>
                  ))}
                </div>
              ) : null}
            </section>
          ) : (
            <section className="detail-section">
              <span className="eyebrow">Live place</span>
              <h2>Add the local layer</h2>
              <p className="detail-lead">This place came from a live Google search. Be the first CityRadius member to add context through a rating and review.</p>
            </section>
          )}

          {seed?.mustOrder?.length ? (
            <section className="detail-section must-order-section">
              <div>
                <span className="eyebrow">Worth ordering</span>
                <h2>Start with these.</h2>
              </div>
              <div className="must-order-list">
                {seed.mustOrder.map((item, index) => (
                  <span key={item}><b>{String(index + 1).padStart(2, "0")}</b><Utensils size={17} />{item}</span>
                ))}
              </div>
            </section>
          ) : null}

          <ReviewSection identity={identity} />
        </div>

        <aside className="place-sidebar">
          <section className="sidebar-card sidebar-card--map">
            <GoogleMapPanel
              places={mapSeeds}
              googlePlaces={mapGooglePlaces}
              city={seed?.city ?? "all"}
            />
            <div>
              <strong>Location</strong>
              <p>{address ?? "Live location pending"}</p>
              {googleData?.googleMapsURI ? <a className="text-link" href={googleData.googleMapsURI} target="_blank" rel="noreferrer">Open in Google Maps <ArrowUpRight size={15} /></a> : null}
            </div>
          </section>

          <section className="sidebar-card">
            <h3>Live details</h3>
            <dl className="contact-list">
              {googleData?.nationalPhoneNumber ? <div><dt><Phone size={16} /> Phone</dt><dd><a href={`tel:${googleData.nationalPhoneNumber}`}>{googleData.nationalPhoneNumber}</a></dd></div> : null}
              {googleData?.websiteURI ? <div><dt><ExternalLink size={16} /> Website</dt><dd><a href={googleData.websiteURI} target="_blank" rel="noreferrer">Visit website</a></dd></div> : null}
              <div><dt><Sparkles size={16} /> Source</dt><dd>Google Places</dd></div>
            </dl>
          </section>

          {googleData?.regularOpeningHours?.weekdayDescriptions?.length ? (
            <section className="sidebar-card">
              <h3>Opening hours</h3>
              <ul className="hours-list">
                {googleData.regularOpeningHours.weekdayDescriptions.map((day) => <li key={day}>{day}</li>)}
              </ul>
            </section>
          ) : null}

          {seed?.evidenceBasis ? (
            <section className="sidebar-card evidence-card">
              <h3><ShieldCheck size={18} /> Editorial evidence</h3>
              <p>{seed.evidenceBasis}</p>
              <small>Last checked {seed.lastVerified ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(seed.lastVerified)) : "recently"}</small>
              {seed.sources?.length ? (
                <div className="source-links">
                  {seed.sources.map((source, index) => <a key={source} href={source} target="_blank" rel="noreferrer">Source {index + 1} <ArrowUpRight size={13} /></a>)}
                </div>
              ) : null}
            </section>
          ) : null}
        </aside>
      </section>

      {similar.length ? (
        <section className="section section--soft similar-section">
          <div className="container">
            <div className="section-heading">
              <div><span className="eyebrow">Keep exploring</span><h2>More {definition.label.toLowerCase()}</h2></div>
              <Link className="text-link" to={`/explore?category=${category}`}>View all <ArrowUpRight size={15} /></Link>
            </div>
            <div className="place-grid place-grid--featured">
              {similar.slice(0, 3).map((place) => <PlaceCard key={place.id} place={place} enrich />)}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
