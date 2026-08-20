import { createClient } from "@supabase/supabase-js";
import { appConfig } from "./config";

const supabaseUrl = appConfig.supabaseUrl;
const supabasePublishableKey = appConfig.supabasePublishableKey;

export const supabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const backendMode = supabaseConfigured ? "supabase" : "preview";
