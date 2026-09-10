import { cookies } from "next/headers";
import { TOKEN_COOKIE_NAME } from "@/lib/auth/token";

const API_BASE = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function serverFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    cache: options.cache || "no-store",
  });

  if (!res.ok) {
    // If unauthorized, attempt default service token for initial server render
    if (res.status === 401 && !token) {
      try {
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "dharunkumar.j@solidpro-es.com", password: "Welcome@123" }),
          cache: "no-store",
        });
        if (loginRes.ok) {
          const authData = await loginRes.json();
          headers["Authorization"] = `Bearer ${authData.access_token}`;
          const retryRes = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
            cache: options.cache || "no-store",
          });
          if (retryRes.ok) {
            return retryRes.json();
          }
        }
      } catch (e) {
        console.error("Server fetch fallback error:", e);
      }
    }
    const errData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errData.detail || `Server fetch failed with status ${res.status}`);
  }

  return res.json();
}
