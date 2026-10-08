import axios, { type AxiosResponse } from 'axios';

import { toApiError } from './errors';
import type { SuccessEnvelope } from './types';

/**
 * Shared HTTP client. Requests go through the Vite dev proxy (`/api` → API on :5100)
 * unless VITE_API_URL points elsewhere. Every failure rejects with an `ApiError`.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  timeout: 15_000,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
);

// TODO (Phase 2): request interceptor → attach access token.
// TODO (Phase 2): response interceptor → refresh token on 401, then retry once.

/** Unwraps the success envelope: `await unwrap(apiClient.get<SuccessEnvelope<T>>(…))` → `T`. */
export const unwrap = async <T>(request: Promise<AxiosResponse<SuccessEnvelope<T>>>): Promise<T> =>
  (await request).data.data;
