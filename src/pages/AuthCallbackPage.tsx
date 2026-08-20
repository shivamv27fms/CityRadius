import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function AuthCallbackPage() {
  const { profile, loading } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && profile) {
      const requestedTarget = params.get("returnTo") || "/profile";
      const target = requestedTarget.startsWith("/") && !requestedTarget.startsWith("//")
        ? requestedTarget
        : "/profile";
      const timer = window.setTimeout(() => navigate(target, { replace: true }), 700);
      return () => window.clearTimeout(timer);
    }
  }, [loading, navigate, params, profile]);

  return (
    <section className="status-page container">
      <span className="status-page__icon"><CheckCircle2 size={30} /></span>
      <h1>{profile ? "You’re signed in." : loading ? "Finishing your sign-in…" : "This sign-in link did not work."}</h1>
      <p>{profile || loading ? "CityRadius is preparing your community profile." : "The link may have expired or already been used. Request a fresh one to continue."}</p>
      {!loading && !profile ? <Link className="button button--signal" to="/login">Request a new link</Link> : null}
    </section>
  );
}
