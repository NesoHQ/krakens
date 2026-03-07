import axios, { AxiosError } from 'axios';
import type {
  AuthResponse,
  Domain,
  APIKey,
  RealtimeStats,
  OverviewStats,
  DomainSettings,
  TrackEventRequest,
  TrackEventResponse
} from '../types';

import { ENV } from './env';

const API_URL = ENV.API_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Try to get token from Zustand persist store first
      const authStore = localStorage.getItem('krakens-auth');
      if (authStore) {
        try {
          const { state } = JSON.parse(authStore);
          if (state?.token) {
            config.headers.Authorization = `Bearer ${state.token}`;
            return config;
          }
        } catch (e) {
          // Fall through to legacy token check
        }
      }

      // Fallback to legacy token storage
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Clear storage
      localStorage.removeItem('krakens-auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


// Domains
export const getDomains = () => api.get<Domain[]>('/domains');
export const getDomainById = (id: string) => api.get<Domain>(`/domains/${id}`);
export const createDomain = (domain: string) => api.post<Domain>('/domains', { domain });
export const updateDomain = (id: string, settings: Partial<DomainSettings>) =>
  api.put<Domain>(`/domains/${id}`, { settings });
export const deleteDomain = (id: string) => api.delete(`/domains/${id}`);

// API Keys
export const getAPIKeys = () => api.get<APIKey[]>('/api-keys');
export const createAPIKey = (domain_ids: string[]) =>
  api.post<APIKey>('/api-keys', { domain_ids });
export const revokeAPIKey = (id: string) => api.delete(`/api-keys/${id}`);

// Stats
export const getRealtimeStats = (domainId: string) =>
  api.get<RealtimeStats>('/stats/realtime', { params: { domain_id: domainId } });
export const getOverviewStats = (domainId: string) =>
  api.get<OverviewStats>('/stats/overview', { params: { domain_id: domainId } });

// Tracking
export const trackEvent = (apiKey: string, data: TrackEventRequest) =>
  axios.post<TrackEventResponse>(`${API_URL}/api/track`, data, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
  });

export default api;
