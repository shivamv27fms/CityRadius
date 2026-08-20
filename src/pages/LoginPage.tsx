import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Brand } from "../components/Brand";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
  const { profile, requestMagicLink, backendMode } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const requestedReturnTo = params.get("returnTo") || "/profile";
  const returnTo = requestedReturnTo.startsWith("/") && !requestedReturnTo.startsWith("//")
    ? requestedReturnTo
    : "/profile";

  useEffect(() => {
    if (profile && backendMode === "supabase") navigate(returnTo, { replace: true });
  }, [backendMode, navigate, profile, returnTo]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await requestMagicLink(email, returnTo);
      if (backendMode === "preview") navigate(returnTo, { replace: true });
      else setSent(true);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "We could not send the sign-in email.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <Brand />
        {sent ? (
          <div className="auth-success">
            <span><CheckCircle2 size={28} /></span>
            <h1>Check your inbox.</h1>
            <p>We sent a secure CityRadius sign-in link to <strong>{email}</strong>. It expires shortly.</p>
            <button className="button button--outline button--full" type="button" onClick={() => setSent(false)}>
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <span className="eyebrow">Email-only access</span>
            <h1>Join the city’s local layer.</h1>
            <p>Sign in to rate places, write reviews, upload photos, save lists and suggest additions. No password to remember.</p>
            <form className="auth-form" onSubmit={(event) => void submit(event)}>
              <label className="field-label">
                Email address
                <span className="input-with-icon">
                  <Mail size={18} />
                  <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
                </span>
              </label>
              {error ? <p className="form-message form-message--error">{error}</p> : null}
              <button className="button button--signal button--full" type="submit" disabled={submitting}>
                {submitting ? "Sending…" : backendMode === "preview" ? "Enter preview" : "Email me a sign-in link"}
                <ArrowRight size={17} />
              </button>
            </form>
            <div className="auth-benefits">
              <span><ShieldCheck size={16} /> Email stays private</span>
              <span><Sparkles size={16} /> One review per place</span>
            </div>
            {backendMode === "preview" ? <p className="preview-note">Supabase is not connected, so this device uses local preview data. Email delivery starts automatically after deployment credentials are added.</p> : null}
          </>
        )}
        <Link className="auth-back" to="/">Continue browsing without signing in</Link>
      </div>
      <div className="auth-aside">
        <span className="auth-aside__pulse" />
        <blockquote>“Tell me if the Wi-Fi holds up, whether the photos match, and what the listing forgot.”</blockquote>
        <p>That is the CityRadius layer.</p>
      </div>
    </section>
  );
}
