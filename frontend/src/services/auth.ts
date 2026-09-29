interface AuthData {
  token: string;
  role: string;
  userId: string;
}

const AUTH_KEY = 'aura_auth_data';

export function setAuthData(data: AuthData): void {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save auth data', e);
  }
}

export function getAuthData(): AuthData | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  const data = getAuthData();
  if (data?.token) return data.token;
  // Dev bypass fallback if DEV mode and explicit flag or dev environment
  if (import.meta.env.DEV || import.meta.env.VITE_DEV_AUTH === '1') {
    return 'dev-token-bypass';
  }
  return null;
}

export function clearAuthData(): void {
  try {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('supervisor_auth');
  } catch {}
}

export function isAuthenticated(): boolean {
  const data = getAuthData();
  if (!data?.token) {
    // Check dev bypass mode
    if (import.meta.env.DEV || import.meta.env.VITE_DEV_AUTH === '1') {
      return true;
    }
    return false;
  }
  // Check JWT expiration if possible
  try {
    const payloadBase64 = data.token.split('.')[1];
    if (payloadBase64) {
      const decoded = JSON.parse(atob(payloadBase64));
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        clearAuthData();
        return false;
      }
    }
  } catch {}
  return true;
}

export function getUserRole(): string {
  const data = getAuthData();
  if (data?.role) return data.role;
  if (import.meta.env.DEV || import.meta.env.VITE_DEV_AUTH === '1') {
    return 'supervisor';
  }
  return '';
}

export async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers || {});
  const token = getAuthToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers
  });
}
