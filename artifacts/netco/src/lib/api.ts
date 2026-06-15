import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import { supabase } from "./supabase";

const raw = import.meta.env.VITE_API_BASE_URL;
export const API_BASE = raw ? raw.replace(/\/+$/, "") : "";

// Set the base URL for Orval-generated hooks too
setBaseUrl(API_BASE || null);

setAuthTokenGetter(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
});

export function apiUrl(path: string): string {
  if (!path.startsWith("/")) return path;
  if (API_BASE) return `${API_BASE}${path}`;
  return path;
}
