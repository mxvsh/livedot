export interface User {
  id: string;
  username: string;
  email?: string;
  plan: string;
  providers?: string[];
}

export interface Website {
  id: string;
  name: string;
  url: string;
  userId: string;
  shareToken: string | null;
  createdAt: string;
}

export interface MetaResponse {
  cloud: boolean;
  providers: string[];
  registrationOpen: boolean;
  emailSignup: boolean;
  analytics: {
    umami: { url: string; websiteId: string } | null;
    livedot: { url: string; websiteId: string } | null;
  };
}

export interface StatusResponse {
  needsSetup: boolean;
  authenticated: boolean;
  user: User | null;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getMeta: () => request<MetaResponse>("/api/meta"),
  getStatus: () => request<StatusResponse>("/api/status"),
  setup: (username: string, password: string) =>
    request<{ ok: boolean; user: User }>("/api/setup", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  login: (usernameOrEmail: string, password: string, isEmail = false) =>
    request<{ ok: boolean; user: User }>("/api/login", {
      method: "POST",
      body: JSON.stringify(isEmail ? { email: usernameOrEmail, password } : { username: usernameOrEmail, password }),
    }),
  register: (email: string, password: string, name?: string) =>
    request<{ ok: boolean; emailVerificationRequired: boolean; user?: { id: string; username: string; plan: string } }>("/api/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),
  resendVerification: (email: string) =>
    request<{ ok: boolean }>("/api/resend-verification", { method: "POST", body: JSON.stringify({ email }) }),
  logout: () => request<{ ok: boolean }>("/api/logout", { method: "POST" }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: boolean }>("/api/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  forgotPassword: (username: string) =>
    request<{ ok: boolean }>("/api/forgot-password", {
      method: "POST",
      body: JSON.stringify({ username }),
    }),
  forgotPasswordEmail: (email: string) =>
    request<{ ok: boolean }>("/api/forgot-password-email", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (username: string, otp: string, newPassword: string) =>
    request<{ ok: boolean }>("/api/reset-password", {
      method: "POST",
      body: JSON.stringify({ username, otp, newPassword }),
    }),
  getWebsites: () => request<Website[]>("/api/websites"),
  createWebsite: (name: string, url: string) =>
    request<Website>("/api/websites", {
      method: "POST",
      body: JSON.stringify({ name, url }),
    }),
  updateWebsite: (id: string, name: string, url: string) =>
    request<Website>(`/api/websites/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name, url }),
    }),
  deleteWebsite: (id: string) =>
    request<{ ok: boolean }>(`/api/websites/${id}`, { method: "DELETE" }),
  enableSharing: (id: string) =>
    request<{ shareToken: string }>(`/api/websites/${id}/share`, { method: "POST" }),
  disableSharing: (id: string) =>
    request<{ ok: boolean }>(`/api/websites/${id}/share`, { method: "DELETE" }),
};
