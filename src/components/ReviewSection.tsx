import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Camera,
  CheckCircle2,
  MessageSquareText,
  PencilLine,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getRatingSummary,
  getReviews,
  submitReview,
  type PlaceIdentity,
} from "../lib/community";
import type { CommunityReview, RatingSummary } from "../types";
import { RatingStars } from "./RatingStars";

const emptySummary: RatingSummary = {
  average: 0,
  count: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
};

export function ReviewSection({ identity }: { identity: PlaceIdentity }) {
  const { profile, backendMode } = useAuth();
  const location = useLocation();
  const [reviews, setReviews] = useState<CommunityReview[]>([]);
  const [summary, setSummary] = useState<RatingSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [visitContext, setVisitContext] = useState("");
  const [visitedOn, setVisitedOn] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [nextReviews, nextSummary] = await Promise.all([
        getReviews(identity.placeKey),
        getRatingSummary(identity.placeKey),
      ]);
      setReviews(nextReviews);
      setSummary(nextSummary);
      const mine = profile ? nextReviews.find((review) => review.userId === profile.id) : undefined;
      if (mine) {
        setRating(mine.rating);
        setTitle(mine.title);
        setBody(mine.body);
        setVisitContext(mine.visitContext ?? "");
        setVisitedOn(mine.visitedOn ?? "");
      }
    } catch (error) {
      console.warn("Could not load community reviews.", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [identity.placeKey, profile?.id]);

  const hasOwnReview = useMemo(
    () => Boolean(profile && reviews.some((review) => review.userId === profile.id)),
    [profile, reviews],
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile) return;
    if (!rating || title.trim().length < 3 || body.trim().length < 20) {
      setMessage("Add a rating, a short title, and at least 20 characters of useful detail.");
      return;
    }
    if (files.some((file) => file.size > 5 * 1024 * 1024)) {
      setMessage("Each review photo must be smaller than 5 MB.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      await submitReview(
        identity,
        { rating, title, body, visitContext, visitedOn, files },
        profile,
      );
      setMessage(hasOwnReview ? "Your review has been updated." : "Your review is now part of CityRadius.");
      setFiles([]);
      setFormOpen(false);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Your review could not be saved.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="reviews-section" id="reviews">
      <div className="reviews-heading">
        <div>
          <span className="eyebrow">CityRadius community</span>
          <h2>What people noticed</h2>
          <p>Community ratings are separate from Google ratings, so you always know the source.</p>
        </div>
        {profile ? (
          <button className="button button--signal" type="button" onClick={() => setFormOpen((open) => !open)}>
            <PencilLine size={17} /> {hasOwnReview ? "Edit your review" : "Write a review"}
          </button>
        ) : (
          <Link
            className="button button--signal"
            to={`/login?returnTo=${encodeURIComponent(location.pathname + "#reviews")}`}
          >
            <MessageSquareText size={17} /> Sign in to review
          </Link>
        )}
      </div>

      {formOpen && profile ? (
        <form className="review-form" onSubmit={(event) => void handleSubmit(event)}>
          <div className="review-form__intro">
            <div>
              <strong>{hasOwnReview ? "Update your take" : "Share your take"}</strong>
              <span>One editable review per member keeps ratings harder to game.</span>
            </div>
            <ShieldCheck size={23} />
          </div>
          <fieldset className="star-input">
            <legend>Your rating</legend>
            <div>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={rating >= value ? "active" : ""}
                  onClick={() => setRating(value)}
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                >
                  <Star size={27} fill={rating >= value ? "currentColor" : "none"} />
                </button>
              ))}
              <span>{rating ? `${rating}/5` : "Select"}</span>
            </div>
          </fieldset>
          <div className="form-grid form-grid--two">
            <label className="field-label">
              Review title
              <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={90} placeholder="The detail people should know" />
            </label>
            <label className="field-label">
              Visit type
              <select value={visitContext} onChange={(event) => setVisitContext(event.target.value)}>
                <option value="">Choose one</option>
                <option>Solo visit</option>
                <option>Work or study</option>
                <option>With friends</option>
                <option>With family</option>
                <option>Long-term stay</option>
                <option>Quick errand</option>
              </select>
            </label>
          </div>
          <label className="field-label">
            Your review
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={2000}
              rows={5}
              placeholder="What worked, what did not, and who would you recommend this place to?"
            />
            <small>{body.length}/2,000</small>
          </label>
          <div className="form-grid form-grid--two">
            <label className="field-label">
              Date visited <span className="optional">Optional</span>
              <input type="date" value={visitedOn} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setVisitedOn(event.target.value)} />
            </label>
            <label className="photo-upload">
              <Camera size={20} />
              <span>
                <strong>Add your photos</strong>
                <small>Up to four JPG, PNG, WebP or AVIF files · moderated before display</small>
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 4))}
              />
            </label>
          </div>
          {files.length ? <p className="file-summary">{files.map((file) => file.name).join(" · ")}</p> : null}
          {message ? <p className="form-message">{message}</p> : null}
          <div className="form-actions">
            <button className="button button--outline" type="button" onClick={() => setFormOpen(false)}>Cancel</button>
            <button className="button button--signal" type="submit" disabled={submitting}>
              {submitting ? "Saving…" : hasOwnReview ? "Update review" : "Publish review"}
            </button>
          </div>
        </form>
      ) : null}

      {message && !formOpen ? (
        <p className="form-message form-message--success">
          <CheckCircle2 size={17} /> {message}
        </p>
      ) : null}

      <div className="reviews-layout">
        <aside className="rating-summary-card">
          <span>CityRadius rating</span>
          <strong>{summary.count ? summary.average.toFixed(1) : "—"}</strong>
          {summary.count ? <RatingStars value={summary.average} size={16} /> : <span className="not-rated">Not rated yet</span>}
          <small>{summary.count} community review{summary.count === 1 ? "" : "s"}</small>
          <div className="rating-bars">
            {[5, 4, 3, 2, 1].map((value) => {
              const count = summary.distribution[value as 1 | 2 | 3 | 4 | 5];
              const percent = summary.count ? (count / summary.count) * 100 : 0;
              return (
                <div key={value}>
                  <span>{value}</span>
                  <span className="rating-bar"><i style={{ width: `${percent}%` }} /></span>
                  <small>{count}</small>
                </div>
              );
            })}
          </div>
          {backendMode === "preview" ? <p className="preview-note">Reviews currently stay in this browser until Supabase is connected.</p> : null}
        </aside>

        <div className="review-list">
          {loading ? (
            <div className="review-skeleton"><span /><span /><span /></div>
          ) : reviews.length ? (
            reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <div className="review-card__header">
                  <div className="review-author">
                    {review.authorAvatar ? <img src={review.authorAvatar} alt="" /> : <span>{review.authorName.slice(0, 1).toUpperCase()}</span>}
                    <div>
                      <strong>{review.authorName}</strong>
                      <small>
                        {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(review.createdAt))}
                        {review.visitContext ? ` · ${review.visitContext}` : ""}
                      </small>
                    </div>
                  </div>
                  <span className="review-rating"><Star size={14} fill="currentColor" /> {review.rating}.0</span>
                </div>
                <h3>{review.title}</h3>
                <p>{review.body}</p>
                {review.photos?.length ? (
                  <div className="review-photo-grid">
                    {review.photos.map((photo) => <img key={photo.id} src={photo.url} alt={photo.caption ?? "Community review"} />)}
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <div className="empty-reviews">
              <MessageSquareText size={30} />
              <h3>Be the first CityRadius voice here.</h3>
              <p>Add the useful detail that a generic rating cannot capture.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
