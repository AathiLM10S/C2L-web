// Client-side and server-accessible token management

export const TOKEN_COOKIE_NAME = "c2l_token";
export const USER_COOKIE_NAME = "c2l_user";

export const getClientCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
};

export const setClientCookie = (name: string, value: string, days: number = 7) => {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

export const removeClientCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
};

export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const fromCookie = getClientCookie(TOKEN_COOKIE_NAME);
  if (fromCookie) return fromCookie;
  return localStorage.getItem("c2l_token");
};

export const setStoredAuth = (token: string, user: any) => {
  if (typeof window === "undefined") return;
  setClientCookie(TOKEN_COOKIE_NAME, token);
  setClientCookie(USER_COOKIE_NAME, JSON.stringify(user));
  localStorage.setItem("c2l_token", token);
  localStorage.setItem("c2l_user", JSON.stringify(user));
};

export const clearStoredAuth = () => {
  if (typeof window === "undefined") return;
  removeClientCookie(TOKEN_COOKIE_NAME);
  removeClientCookie(USER_COOKIE_NAME);
  localStorage.removeItem("c2l_token");
  localStorage.removeItem("c2l_user");
};
