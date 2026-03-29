/**
 * Generic Fetch Wrapper to auto-inject the Authorization Bearer token 
 * natively from localStorage to all outgoing requests.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('flowpay_token') : null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  console.log(`[API ${options.method || 'GET'}] ${endpoint} -> Status ${response.status}`);

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    console.error(`[API ERROR] ${endpoint} Status: ${response.status}`, data);
    throw new Error(data?.error || 'API Request Failed');
  }

  return data;
}
