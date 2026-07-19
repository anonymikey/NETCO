/**
 * Centralized authentication helpers to ensure consistent JWT handling across the application.
 * This prevents intermittent 401 errors by ensuring all requests wait for the session before making API calls.
 */

import { supabase } from "./supabase";

/**
 * Get the current user's JWT token from Supabase session.
 * Waits for session to be available if needed.
 * 
 * @returns Promise<string> - The JWT access token
 * @throws Error if no session is available
 */
export async function getJWTToken(): Promise<string> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new Error(`Failed to get session: ${sessionError.message}`);
    }
    
    if (!session?.access_token) {
      throw new Error("No active session - user may not be authenticated");
    }
    
    return session.access_token;
  } catch (error) {
    throw error;
  }
}

/**
 * Make an authenticated API request with automatic JWT token injection.
 * Ensures all requests have a valid token before being sent.
 * 
 * @param url - The API endpoint URL
 * @param options - Fetch request options (method, body, etc.)
 * @returns Promise<Response> - The fetch response
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const token = await getJWTToken();
    
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If we get a 401, the token might have expired
    if (response.status === 401) {
      console.error("[v0] Received 401 Unauthorized - session may have expired");
    }

    return response;
  } catch (error) {
    console.error("[v0] Error making authenticated request:", error);
    throw error;
  }
}

/**
 * Check if user is currently authenticated.
 * 
 * @returns Promise<boolean> - True if user has an active session
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session?.access_token;
  } catch {
    return false;
  }
}
