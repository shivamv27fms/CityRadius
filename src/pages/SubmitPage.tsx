import { useState, type FormEvent } from "react";
import { CheckCircle2, LocateFixed, MapPinned, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { categories } from "../data/categories";
import { submitPlaceSuggestion } from "../lib/community";
import type { DelhiNcrCity, PlaceCategory } from "../types";

export function SubmitPage() {
  const { profile, backendMode } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<PlaceCategory>("cafe");
  const [city, setCity] = useState<DelhiNcrCity>("New Delhi");
  const [area, setArea] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  if (!profile) {
    return (
      <section className="gate-page container">
        <span><MapPinned size={30} /></span>
        <span className="eyebrow">Community submissions</span>
        <h1>Know somewhere CityRadius should cover?</h1>
        <p>Sign in with your email before suggesting a place. It helps us follow up and keeps the queue useful.</p>
        <Link className="button button--signal" to="/login?returnTo=%2Fsubmit">Sign in to add a place</Link>
      </section>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      await submitPlaceSuggestion(profile, { name, category, city, area, googleMapsUrl, notes });
      setMessage("Thanks—your place is in the moderation queue.");
      setName("");
      setArea("");
      setGoogleMapsUrl("");
      setNotes("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The place could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="form-page container">
      <div className="form-page__intro">
        <span className="eyebrow">Contribute to CityRadius</span>
        <h1>Put a useful place on the radar.</h1>
        <p>Suggest the essentials. Moderators verify the listing and connect it to Google Places before it becomes public.</p>
        <div className="form-page__steps">
          <span><b>01</b> You suggest</span>
          <span><b>02</b> We verify</span>
          <span><b>03</b> The city reviews</span>
        </div>
      </div>
      <form className="submission-form" onSubmit={(event) => void submit(event)}>
        <div className="submission-form__header">
          <LocateFixed size={22} />
          <div><strong>Place details</strong><span>Required fields are marked clearly.</span></div>
        </div>
        <label className="field-label">Place name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Neighbourhood Study Room" /></label>
        <div className="form-grid form-grid--two">
          <label className="field-label">Category<select value={category} onChange={(event) => setCategory(event.target.value as PlaceCategory)}>{categories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label className="field-label">City<select value={city} onChange={(event) => setCity(event.target.value as DelhiNcrCity)}><option>New Delhi</option><option>Gurugram</option><option>Noida</option></select></label>
        </div>
        <label className="field-label">Area or neighbourhood<input required value={area} onChange={(event) => setArea(event.target.value)} placeholder="e.g. Sector 50" /></label>
        <label className="field-label">Google Maps link <span className="optional">Recommended</span><input type="url" value={googleMapsUrl} onChange={(event) => setGoogleMapsUrl(event.target.value)} placeholder="https://maps.app.goo.gl/…" /></label>
        <label className="field-label">What should we know? <span className="optional">Optional</span><textarea rows={5} maxLength={1200} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Share useful context: rent, membership, Wi-Fi, opening hours, entry rules…" /><small>{notes.length}/1,200</small></label>
        {message ? <p className={`form-message ${message.startsWith("Thanks") ? "form-message--success" : "form-message--error"}`}><CheckCircle2 size={17} /> {message}</p> : null}
        <button className="button button--signal button--full" type="submit" disabled={submitting}>{submitting ? "Sending…" : "Submit for review"}</button>
        <p className="form-disclaimer"><ShieldCheck size={15} /> Submissions are moderated. Your private email is never shown publicly.{backendMode === "preview" ? " This submission currently stays on this device." : ""}</p>
      </form>
    </section>
  );
}
