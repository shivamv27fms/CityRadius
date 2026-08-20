import { ArrowRight, HeartHandshake, MapPinned, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export function AboutPage() {
  return (
    <article className="prose-page container">
      <span className="eyebrow">About CityRadius</span>
      <h1>A clearer local layer for Delhi NCR.</h1>
      <p className="prose-lead">CityRadius combines current place facts from Google with structured editorial research and reviews from email-verified members.</p>
      <div className="prose-feature-grid"><section><MapPinned size={23} /><h2>Current facts</h2><p>Google Places supplies live photos, addresses, hours, contact details and navigation links.</p></section><section><HeartHandshake size={23} /><h2>Human context</h2><p>CityRadius adds the things that matter in real decisions: noise, Wi-Fi, rules, comfort, cost and lived experience.</p></section><section><ShieldCheck size={23} /><h2>Clear provenance</h2><p>Google ratings, editorial scores and CityRadius community ratings are labelled separately rather than blended.</p></section></div>
      <h2>Starting coverage</h2><p>The first dataset contains 30 researched cafés across Delhi, Gurugram and Noida. Libraries, PGs, coworking spaces, bookstores, printing shops, fitness centres and pharmacies expand through curated listings, live search and moderated community submissions.</p>
      <Link className="button button--signal" to="/explore">Explore CityRadius <ArrowRight size={16} /></Link>
    </article>
  );
}

export function PrivacyPage() {
  return (
    <article className="prose-page container">
      <span className="eyebrow">Privacy and data use</span><h1>What CityRadius stores—and what it does not.</h1><p className="prose-lead">This project is designed to keep private account data separate from public community contributions.</p>
      <h2>Account information</h2><p>Email addresses are processed by Supabase Auth for passwordless sign-in. They are not exposed in public profiles or reviews. Public profiles contain a display name, optional avatar and optional home city.</p>
      <h2>Reviews and photos</h2><p>Reviews, ratings and uploaded photos are stored with your account identifier. Your display name appears publicly beside approved contributions. Uploaded photos may be moderated or removed.</p>
      <h2>Google Maps Platform</h2><p>CityRadius uses Google Maps and Places to retrieve current place information. Use of Google features is subject to the <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google Privacy Policy</a> and <a href="https://maps.google.com/help/terms_maps/" target="_blank" rel="noreferrer">Google Maps terms</a>. Google place photos and live details are not copied into the CityRadius database.</p>
      <h2>Location</h2><p>“Near me” uses your browser’s geolocation permission. CityRadius does not store your precise device location.</p>
      <h2>Control</h2><p>You can edit your review or profile after signing in. A production operator should add a support contact and data-deletion process before public launch.</p>
    </article>
  );
}
