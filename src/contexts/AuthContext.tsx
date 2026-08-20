import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { backendMode, supabase } from "../lib/supabase";
import type { DelhiNcrCity, UserProfile } from "../types";

interface AuthContextValue {
  profile: UserProfile | null;
  loading: boolean;
  backendMode: "supabase" | "preview";
  requestMagicLink: (email: string, returnTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { displayName?: string; homeCity?: DelhiNcrCity }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const previewSessionKey = "cityradius.preview-user";

function nameFromEmail(email?: string | null) {
  if (!email) return "CityRadius member";
  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function profileFromSupabaseUser(user: User): Promise<UserProfile> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, role, home_city")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email,
    displayName: data?.display_name || nameFromEmail(user.email),
    avatarUrl: data?.avatar_url ?? undefined,
    role: data?.role ?? "user",
    homeCity: data?.home_city ?? undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!supabase) {
      const saved = localStorage.getItem(previewSessionKey);
      if (saved) {
        try {
          setProfile(JSON.parse(saved) as UserProfile);
        } catch {
          localStorage.removeItem(previewSessionKey);
        }
      }
      setLoading(false);
      return;
    }

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setProfile(data.session?.user ? await profileFromSupabaseUser(data.session.user) : null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        if (!active) return;
        if (!session?.user) {
          setProfile(null);
          setLoading(false);
          return;
        }
        void profileFromSupabaseUser(session.user).then((next) => {
          if (active) setProfile(next);
        });
      }, 0);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const requestMagicLink = useCallback(async (email: string, returnTo = "/profile") => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) throw new Error("Enter your email address.");

    if (!supabase) {
      const previewProfile: UserProfile = {
        id: `preview_${btoa(normalized).replace(/[^a-zA-Z0-9]/g, "").slice(0, 24)}`,
        email: normalized,
        displayName: nameFromEmail(normalized),
        role: normalized.startsWith("admin+") ? "admin" : "user",
      };
      localStorage.setItem(previewSessionKey, JSON.stringify(previewProfile));
      setProfile(previewProfile);
      return;
    }

    const safeReturnTo = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/profile";
    const redirectUrl = new URL("/auth/callback", window.location.origin);
    redirectUrl.searchParams.set("returnTo", safeReturnTo);
    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: { emailRedirectTo: redirectUrl.toString(), shouldCreateUser: true },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else {
      localStorage.removeItem(previewSessionKey);
    }
    setProfile(null);
  }, []);

  const updateProfile = useCallback(
    async (updates: { displayName?: string; homeCity?: DelhiNcrCity }) => {
      if (!profile) throw new Error("Sign in to update your profile.");
      const next: UserProfile = {
        ...profile,
        displayName: updates.displayName?.trim() || profile.displayName,
        homeCity: updates.homeCity ?? profile.homeCity,
      };

      if (supabase) {
        const { error } = await supabase
          .from("profiles")
          .update({ display_name: next.displayName, home_city: next.homeCity })
          .eq("id", profile.id);
        if (error) throw error;
      } else {
        localStorage.setItem(previewSessionKey, JSON.stringify(next));
      }
      setProfile(next);
    },
    [profile],
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!profile) throw new Error("Sign in to upload a profile photo.");
      if (file.size > 2 * 1024 * 1024) throw new Error("Profile photos must be smaller than 2 MB.");
      if (!supabase) {
        const localUrl = URL.createObjectURL(file);
        const next = { ...profile, avatarUrl: localUrl };
        localStorage.setItem(previewSessionKey, JSON.stringify(next));
        setProfile(next);
        return localUrl;
      }
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${profile.id}/avatar.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (uploadError) throw uploadError;
      const publicUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);
      if (error) throw error;
      setProfile({ ...profile, avatarUrl: publicUrl });
      return publicUrl;
    },
    [profile],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ profile, loading, backendMode, requestMagicLink, signOut, updateProfile, uploadAvatar }),
    [profile, loading, requestMagicLink, signOut, updateProfile, uploadAvatar],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
