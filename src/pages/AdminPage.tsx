import { useEffect, useState } from "react";
import { Check, Flag, Image, Inbox, ShieldCheck, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

interface QueueItem {
  id: string;
  type: "submission" | "photo" | "report";
  title: string;
  detail: string;
  status: string;
  createdAt?: string;
  imageUrl?: string;
}

export function AdminPage() {
  const { profile, backendMode } = useAuth();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = async () => {
    if (!profile || profile.role === "user") return;
    setLoading(true);
    if (!supabase) {
      const submissions = JSON.parse(localStorage.getItem("cityradius.preview-submissions") ?? "[]") as any[];
      setItems(
        submissions.map((submission) => ({
          id: submission.id,
          type: "submission" as const,
          title: submission.name,
          detail: `${submission.category} · ${submission.area}, ${submission.city}`,
          status: submission.status,
        })),
      );
      setLoading(false);
      return;
    }
    const [submissions, photos, reports] = await Promise.all([
      supabase.from("place_submissions").select("id,name,category,city,area,status,created_at").eq("status", "pending").order("created_at"),
      supabase.from("review_photos").select("id,storage_path,status,created_at").eq("status", "pending").order("created_at"),
      supabase.from("reports").select("id,target_type,target_id,reason,status,created_at").eq("status", "open").order("created_at"),
    ]);
    const photoItems = await Promise.all((photos.data ?? []).map(async (row) => {
      const { data: signed } = await supabase!.storage.from("review-photos").createSignedUrl(row.storage_path, 10 * 60);
      return { id: row.id, type: "photo" as const, title: "Community photo", detail: row.storage_path, status: row.status, createdAt: row.created_at, imageUrl: signed?.signedUrl };
    }));
    setItems([
      ...(submissions.data ?? []).map((row) => ({ id: row.id, type: "submission" as const, title: row.name, detail: `${row.category} · ${row.area}, ${row.city}`, status: row.status, createdAt: row.created_at })),
      ...photoItems,
      ...(reports.data ?? []).map((row) => ({ id: row.id, type: "report" as const, title: `${row.reason} report`, detail: `${row.target_type}: ${row.target_id}`, status: row.status, createdAt: row.created_at })),
    ]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [profile?.id]);

  if (!profile) return <section className="gate-page container"><span><ShieldCheck size={30} /></span><h1>Moderation</h1><p>Sign in with an authorised CityRadius account.</p><Link className="button button--signal" to="/login?returnTo=%2Fadmin">Sign in</Link></section>;
  if (profile.role === "user") return <section className="gate-page container"><span><ShieldCheck size={30} /></span><h1>Moderator access only</h1><p>Your account does not have permission to open this workspace.</p><Link className="button button--outline" to="/profile">Back to profile</Link></section>;

  const resolve = async (item: QueueItem, approve: boolean) => {
    setMessage("");
    if (!supabase) {
      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
      setMessage(`${item.title} marked ${approve ? "approved" : "rejected"} in preview mode.`);
      return;
    }
    const table = item.type === "submission" ? "place_submissions" : item.type === "photo" ? "review_photos" : "reports";
    const status = item.type === "report" ? (approve ? "resolved" : "dismissed") : approve ? "approved" : "rejected";
    const { error } = await supabase.from(table).update({ status }).eq("id", item.id);
    if (error) { setMessage(error.message); return; }
    await supabase.from("moderation_actions").insert({ moderator_id: profile.id, target_type: item.type, target_id: item.id, action: status });
    setItems((current) => current.filter((candidate) => candidate.id !== item.id));
    setMessage(`${item.title} marked ${status}.`);
  };

  return (
    <section className="admin-page container">
      <div className="admin-header"><div><span className="eyebrow">CityRadius operations</span><h1>Moderation queue</h1><p>Review new places, community photos and member reports.</p></div><span className="role-chip"><ShieldCheck size={15} /> {profile.role}</span></div>
      <div className="admin-stats"><article><Inbox size={20} /><strong>{items.filter((item) => item.type === "submission").length}</strong><span>Place submissions</span></article><article><Image size={20} /><strong>{items.filter((item) => item.type === "photo").length}</strong><span>Photos pending</span></article><article><Flag size={20} /><strong>{items.filter((item) => item.type === "report").length}</strong><span>Open reports</span></article></div>
      {message ? <p className="form-message">{message}</p> : null}
      <div className="moderation-list">
        {loading ? <div className="review-skeleton"><span /><span /><span /></div> : items.length ? items.map((item) => <article key={`${item.type}-${item.id}`}><span className={`moderation-type moderation-type--${item.type}`}>{item.type}</span><div className="moderation-item__content">{item.imageUrl ? <img className="moderation-preview" src={item.imageUrl} alt="Community upload awaiting moderation" /> : null}<div><h2>{item.title}</h2><p>{item.detail}</p><small>{item.createdAt ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(item.createdAt)) : "Preview item"}</small></div></div><div><button type="button" className="approve-button" onClick={() => void resolve(item, true)}><Check size={16} /> {item.type === "report" ? "Resolve" : "Approve"}</button><button type="button" className="reject-button" onClick={() => void resolve(item, false)}><X size={16} /> {item.type === "report" ? "Dismiss" : "Reject"}</button></div></article>) : <div className="empty-state"><Check size={31} /><h2>The queue is clear.</h2><p>No pending community items need attention.</p></div>}
      </div>
      {backendMode === "preview" ? <p className="preview-note">Use an email starting with “admin+” in preview mode to inspect this screen. Production roles are controlled in the profiles table.</p> : null}
    </section>
  );
}
