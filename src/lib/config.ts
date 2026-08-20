interface CityRadiusRuntimeConfig {
  googleMapsApiKey?: string;
  supabaseUrl?: string;
  supabasePublishableKey?: string;
}

declare global {
  interface Window {
    CITYRADIUS_CONFIG?: CityRadiusRuntimeConfig;
  }
}

const runtime = typeof window === "undefined" ? undefined : window.CITYRADIUS_CONFIG;

export const appConfig = {
  googleMapsApiKey:
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || runtime?.googleMapsApiKey?.trim(),
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.trim() || runtime?.supabaseUrl?.trim(),
  supabasePublishableKey:
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || runtime?.supabasePublishableKey?.trim(),
};
