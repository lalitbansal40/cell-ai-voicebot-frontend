import axios from 'axios';

/**
 * Shared HTTP client. Requests go through the Vite dev proxy (`/api` → API on :5100)
 * unless VITE_API_URL points elsewhere.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  timeout: 15_000,
  withCredentials: true,
});

// TODO (Phase 2): request interceptor → attach access token.
// TODO (Phase 2): response interceptor → refresh token on 401, then retry once.
// TODO (Phase 1): normalise `{ success: false, error }` envelope into a typed ApiError.
