import { useState, type FormEvent } from "react";
import { Camera, LogOut, Settings2, ShieldCheck, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { DelhiNcrCity } from "../types";

export function ProfilePage() {
  const { profile, updateProfile, uploadAvatar, signOut, backendMode } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [homeCity, setHomeCity] = useState<DelhiNcrCity | "">(profile?.homeCity ?? "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  if (!profile) {
    return <section className="gate-page container"><span><UserRound size={30} /></span><h1>Your CityRadius profile</h1><p>Sign in to manage your public name, home city and contributions.</p><Link className="button button--signal" to="/login?returnTo=%2Fprofile">Sign in</Link></section>;
  }

  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage("");
    try { await updateProfile({ displayName, homeCity: homeCity || undefined }); setMessage("Profile updated."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not update your profile."); }
    finally { setSaving(false); }
  };

  return (
    <section className="profile-page container">
      <div className="profile-sidebar">
        <div className="profile-avatar">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : profile.displayName.slice(0, 1).toUpperCase()}</div>
        <h1>{profile.displayName}</h1><p>{profile.email}</p><span className="role-chip"><ShieldCheck size={14} /> {profile.role}</span>
        <nav><a className="active" href="#settings"><Settings2 size={16} /> Profile settings</a><Link to="/saved">Saved places</Link>{profile.role !== "user" ? <Link to="/admin">Moderation</Link> : null}</nav>
      </div>
      <div className="profile-content" id="settings">
        <span className="eyebrow">Account</span><h2>Profile settings</h2><p>Your display name appears beside reviews. Your email never does.</p>
        <form className="profile-form" onSubmit={(event) => void save(event)}>
          <label className="avatar-upload"><span>{profile.avatarUrl ? <img src={profile.avatarUrl} alt="Current profile" /> : <Camera size={23} />}</span><div><strong>Profile photo</strong><small>JPG, PNG or WebP · maximum 2 MB</small></div><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadAvatar(file).then(() => setMessage("Photo updated.")).catch((error) => setMessage(error.message)); }} /></label>
          <label className="field-label">Display name<input value={displayName} minLength={2} maxLength={60} required onChange={(event) => setDisplayName(event.target.value)} /></label>
          <label className="field-label">Home city<select value={homeCity} onChange={(event) => setHomeCity(event.target.value as DelhiNcrCity | "")}><option value="">Not set</option><option value="New Delhi">Delhi</option><option value="Gurugram">Gurugram</option><option value="Noida">Noida</option></select></label>
          {message ? <p className="form-message">{message}</p> : null}
          <button className="button button--signal" type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
        </form>
        <div className="profile-account-note"><div><strong>Email-only account</strong><p>Login links are sent to {profile.email}. There is no password stored by CityRadius.</p></div><span>{backendMode === "preview" ? "Preview session" : "Verified by Supabase Auth"}</span></div>
        <button className="danger-button" type="button" onClick={() => void signOut().then(() => navigate("/"))}><LogOut size={16} /> Sign out</button>
      </div>
    </section>
  );
}
