import { Compass } from "lucide-react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return <section className="status-page container"><span className="status-page__icon"><Compass size={30} /></span><span className="eyebrow">404 · Off the map</span><h1>That place is not on CityRadius.</h1><p>It may have moved, or the link may be incomplete.</p><Link className="button button--signal" to="/explore">Explore places</Link></section>;
}
