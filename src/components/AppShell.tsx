import { useEffect, useState } from "react";
import { Bookmark, ChevronDown, Menu, Plus, UserRound, X } from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { categories } from "../data/categories";
import { Brand } from "./Brand";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export function AppShell() {
  const { profile, loading, backendMode } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    setCategoriesOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <ScrollToTop />
      {backendMode === "preview" ? (
        <div className="preview-strip">
          Preview mode · Connect Supabase for real email delivery and shared community data.
        </div>
      ) : null}
      <header className="site-header">
        <div className="site-header__inner container">
          <Brand />
          <nav className="desktop-nav" aria-label="Primary navigation">
            <NavLink to="/explore">Explore</NavLink>
            <div className="nav-menu">
              <button
                type="button"
                onClick={() => setCategoriesOpen((open) => !open)}
                aria-expanded={categoriesOpen}
              >
                Categories <ChevronDown size={14} />
              </button>
              {categoriesOpen ? (
                <div className="nav-menu__panel">
                  {categories.map((category) => (
                    <Link key={category.id} to={`/explore?category=${category.id}`}>
                      <span>{category.code}</span>
                      <div>
                        <strong>{category.label}</strong>
                        <small>{category.description}</small>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
            <NavLink to="/submit">Add a place</NavLink>
          </nav>
          <div className="header-actions">
            {profile ? (
              <>
                <Link className="header-icon-link" to="/saved" aria-label="Saved places">
                  <Bookmark size={18} />
                </Link>
                <Link className="account-chip" to="/profile">
                  <span>{profile.displayName.slice(0, 1).toUpperCase()}</span>
                  <strong>{profile.displayName.split(" ")[0]}</strong>
                </Link>
              </>
            ) : loading ? (
              <span className="header-loading" />
            ) : (
              <Link className="button button--small button--ink" to="/login">
                <UserRound size={16} /> Sign in
              </Link>
            )}
            <button
              className="mobile-menu-button"
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
        {mobileOpen ? (
          <nav className="mobile-nav container" aria-label="Mobile navigation">
            <Link to="/explore">Explore all places</Link>
            <Link to="/saved">Saved places</Link>
            <Link to="/submit">
              <Plus size={17} /> Add a place
            </Link>
            <div className="mobile-nav__categories">
              {categories.map((category) => (
                <Link key={category.id} to={`/explore?category=${category.id}`}>
                  <span>{category.code}</span> {category.label}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}
      </header>
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container site-footer__grid">
          <div>
            <Brand />
            <p>Find your place in Delhi NCR—through live local data and honest community context.</p>
          </div>
          <div>
            <strong>Discover</strong>
            <Link to="/explore">Explore all</Link>
            <Link to="/explore?category=cafe">Cafés</Link>
            <Link to="/explore?category=pg">PGs & hostels</Link>
            <Link to="/explore?category=library">Libraries</Link>
          </div>
          <div>
            <strong>Community</strong>
            <Link to="/submit">Add a place</Link>
            <Link to="/login">Sign in</Link>
            <Link to="/profile">Your profile</Link>
          </div>
          <div>
            <strong>Information</strong>
            <Link to="/about">About CityRadius</Link>
            <Link to="/privacy">Privacy</Link>
            <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
              Google Privacy
            </a>
          </div>
        </div>
        <div className="container site-footer__bottom">
          <span>© {new Date().getFullYear()} CityRadius</span>
          <span>Delhi · Gurugram · Noida</span>
          <span>Google data is shown with attribution.</span>
        </div>
      </footer>
    </div>
  );
}
