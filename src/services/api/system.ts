import { apiClient } from './client';
import type { AppInfo, SuccessEnvelope } from './types';

/** Fetches backend app info and unwraps the success envelope. Route lands in Phase 1. */
export const getSystemInfo = async (): Promise<AppInfo> => {
  const response = await apiClient.get<SuccessEnvelope<AppInfo>>('/system/info');
  return response.data.data;
};
