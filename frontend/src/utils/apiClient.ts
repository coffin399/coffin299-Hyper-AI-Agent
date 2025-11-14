// API Client utility for handling backend communication
// Supports both local (bundled) and network (remote) modes

let apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:18000';

// Listen for backend config from Electron
if (window.electronAPI) {
  window.electronAPI.onBackendConfig((config: { mode: string; apiBaseUrl: string }) => {
    console.log('Received backend config:', config);
    apiBaseUrl = config.apiBaseUrl;
  });
}

/**
 * Get the current API base URL
 */
export function getApiBaseUrl(): string {
  return apiBaseUrl;
}

/**
 * Set the API base URL (useful for settings changes)
 */
export function setApiBaseUrl(url: string): void {
  apiBaseUrl = url;
}

/**
 * Make an API request with automatic base URL handling
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${apiBaseUrl}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * GET request helper
 */
export async function apiGet<T = any>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST request helper
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request helper
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = any>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}
