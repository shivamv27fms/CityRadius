import { useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  LocateFixed,
  Map,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { CategoryIcon } from "../components/CategoryIcon";
import { GoogleMapPanel } from "../components/GoogleMapPanel";
import { PlaceCard } from "../components/PlaceCard";
import { categories, cityCopy } from "../data/categories";
import {
  allPlaces,
  budgetPlaces,
  cafes,
  featuredPlaces,
  highWorkScorePlaces,
  quietPlaces,
} from "../data/places";

const collections = [
  {
    title: "Deep work, zero drama",
    description: "Strong Wi-Fi, useful sockets and laptop-friendly stays.",
    href: "/explore?category=cafe&minWorkScore=8",
    count: highWorkScorePlaces.length,
    icon: BookOpenCheck,
    color: "green",
  },
  {
    title: "Quiet corners",
    description: "Lower-noise cafés for reading, study and focused work.",
    href: "/explore?category=cafe&noise=Quiet",
    count: quietPlaces.length,
    icon: Sparkles,
    color: "violet",
  },
  {
    title: "Under ₹900 for two",
    description: "Reliable coffee and food without the premium bill.",
    href: "/explore?category=cafe&maxBudget=900",
    count: budgetPlaces.length,
    icon: Star,
    color: "gold",
  },
];

export function HomePage() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="live-dot" /> Delhi NCR, mapped with context
            </span>
            <h1>
              The city is full of places.
              <em> Find your place.</em>
            </h1>
            <p>
              Cafés to work from, PGs worth considering, libraries that stay quiet—and the local
              details generic ratings miss.
            </p>
            <form
              className="hero-search"
              onSubmit={(event) => {
                event.preventDefault();
                navigate(`/explore${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
              }}
            >
              <Search size={21} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Try ‘quiet café in GK’ or ‘library in Noida’"
                aria-label="Search CityRadius"
              />
              <button type="submit">Search</button>
            </form>
            <div className="hero-quick-links">
              <span>Popular:</span>
              <Link to="/explore?category=cafe&minWorkScore=8">Deep-work cafés</Link>
              <Link to="/explore?category=library&city=New+Delhi&live=1">Libraries nearby</Link>
              <Link to="/explore?category=pg&city=Gurugram&live=1">PGs in Gurugram</Link>
            </div>
          </div>

          <div className="hero-pulse" aria-label="CityRadius live city overview">
            <div className="hero-pulse__topline">
              <span>City signal</span>
              <span className="status-chip">Live with Google</span>
            </div>
            <div className="hero-pulse__map">
              <span className="pulse-ring pulse-ring--one" />
              <span className="pulse-ring pulse-ring--two" />
              <span className="pulse-node pulse-node--delhi">
                <b>Delhi</b>
                <small>{cafes.filter((place) => place.city === "New Delhi").length} cafés seeded</small>
              </span>
              <span className="pulse-node pulse-node--gurugram">
                <b>Gurugram</b>
                <small>{cafes.filter((place) => place.city === "Gurugram").length} cafés seeded</small>
              </span>
              <span className="pulse-node pulse-node--noida">
                <b>Noida</b>
                <small>{cafes.filter((place) => place.city === "Noida").length} cafés seeded</small>
              </span>
              <span className="pulse-line pulse-line--one" />
              <span className="pulse-line pulse-line--two" />
            </div>
            <div className="hero-pulse__stats">
              <div>
                <strong>{cafes.length}</strong>
                <span>researched cafés</span>
              </div>
              <div>
                <strong>{categories.length}</strong>
                <span>useful categories</span>
              </div>
              <div>
                <strong>2×</strong>
                <span>Google + community ratings</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="category-section section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Start with what you need</span>
              <h2>The useful city, organised.</h2>
            </div>
            <Link className="text-link" to="/explore">
              Explore everything <ArrowRight size={16} />
            </Link>
          </div>
          <div className="category-grid">
            {categories.map((category) => (
              <Link
                key={category.id}
                className={`category-tile category-tile--${category.color}`}
                to={`/explore?category=${category.id}`}
              >
                <span className="category-tile__icon">
                  <CategoryIcon category={category.id} size={23} />
                </span>
                <span className="category-tile__code">{category.code}</span>
                <strong>{category.label}</strong>
                <small>{category.description}</small>
                <ArrowRight className="category-tile__arrow" size={18} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--soft">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">CityRadius shortlist</span>
              <h2>Good places, with reasons.</h2>
            </div>
            <p className="section-heading__note">
              Our editorial data and Google’s live place information stay clearly separated.
            </p>
          </div>
          <div className="place-grid place-grid--featured">
            {featuredPlaces.map((place, index) => (
              <PlaceCard key={place.id} place={place} enrich index={index + 1} />
            ))}
          </div>
        </div>
      </section>

      <section className="section collections-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Skip the spreadsheet</span>
              <h2>Choose by the day you’re having.</h2>
            </div>
          </div>
          <div className="collection-grid">
            {collections.map((collection) => {
              const Icon = collection.icon;
              return (
                <Link
                  key={collection.title}
                  className={`collection-card collection-card--${collection.color}`}
                  to={collection.href}
                >
                  <span className="collection-card__icon">
                    <Icon size={24} />
                  </span>
                  <span className="collection-card__count">{collection.count} places</span>
                  <h3>{collection.title}</h3>
                  <p>{collection.description}</p>
                  <span className="text-link">
                    Open collection <ArrowRight size={16} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section city-section">
        <div className="container city-grid">
          <div className="city-copy">
            <span className="eyebrow">One NCR, three rhythms</span>
            <h2>Move around the city without losing the plot.</h2>
            <p>
              Switch between Delhi, Gurugram and Noida. Turn on “Near me” for live Google results,
              then layer in CityRadius reviews before you go.
            </p>
            <div className="city-list">
              {Object.entries(cityCopy).map(([city, copy]) => (
                <Link key={city} to={`/explore?city=${encodeURIComponent(city)}`}>
                  <span>{copy.label.slice(0, 1)}</span>
                  <div>
                    <strong>{copy.label}</strong>
                    <small>{copy.note}</small>
                  </div>
                  <ArrowRight size={17} />
                </Link>
              ))}
            </div>
          </div>
          <GoogleMapPanel places={featuredPlaces} className="home-map" />
        </div>
      </section>

      <section className="section trust-section">
        <div className="container trust-grid">
          <div>
            <span className="eyebrow">Two signals, one clearer decision</span>
            <h2>Live facts from Google. Lived experience from people.</h2>
          </div>
          <div className="trust-steps">
            <article>
              <span>01</span>
              <Map size={22} />
              <h3>Find the current facts</h3>
              <p>Photos, address, hours, phone and directions are retrieved live from Google Places.</p>
            </article>
            <article>
              <span>02</span>
              <UsersRound size={22} />
              <h3>Read local context</h3>
              <p>CityRadius members add the texture: noise, reliability, rules and what a visit felt like.</p>
            </article>
            <article>
              <span>03</span>
              <ShieldCheck size={22} />
              <h3>Contribute responsibly</h3>
              <p>Email verification, one review per place and moderation keep the community useful.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="community-cta-section">
        <div className="container community-cta">
          <div>
            <span className="eyebrow eyebrow--light">The pulse gets better with people</span>
            <h2>Know a place worth putting on the map?</h2>
            <p>Add it, rate it or leave the detail that saves someone else a wasted trip.</p>
          </div>
          <div className="community-cta__actions">
            <Link className="button button--paper" to="/submit">
              <LocateFixed size={17} /> Add a place
            </Link>
            <Link className="button button--ghost-light" to="/login">
              <MessageSquareText size={17} /> Join CityRadius
            </Link>
          </div>
          <div className="community-cta__proof">
            <span>
              <CheckCircle2 size={16} /> Email-only sign in
            </span>
            <span>
              <CheckCircle2 size={16} /> Community photo uploads
            </span>
            <span>
              <CheckCircle2 size={16} /> Moderated submissions
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
