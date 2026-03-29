/**
 * Generic Fetch Wrapper to auto-inject the Authorization Bearer token 
 * natively from localStorage to all outgoing requests.
 * 
 * Uses a relative '/api' base so requests go through the Next.js rewrite proxy
 * (configured in next.config.ts) and avoid CORS issues.
 */

const API_BASE = '/api';

export async function fetchWithAuth(endpoint: string, options: RequestInit) {
  const response = await fetch(`${API_BASE}${endpoint}`, options);

  let data;
  try {
    data = await response.json();
  } catch (error) {
    console.error('Failed to parse JSON response:', error);
    data = null;
  }

  if (!response.ok) {
    console.error(`[API ERROR] ${endpoint} Status: ${response.status}`, data);
    throw new Error(data?.error || `API Request Failed with status ${response.status}`);
  }

  return data;
}