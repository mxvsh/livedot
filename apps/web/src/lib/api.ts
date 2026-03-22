export interface User {
  id: string;
  username: string;
}

export interface Project {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
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
  getStatus: () => request<StatusResponse>("/api/status"),
  setup: (username: string, password: string) =>
    request<{ ok: boolean; user: User }>("/api/setup", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  login: (username: string, password: string) =>
    request<{ ok: boolean; user: User }>("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request<{ ok: boolean }>("/api/logout", { method: "POST" }),
  getProjects: () => request<Project[]>("/api/projects"),
  createProject: (name: string) =>
    request<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  deleteProject: (id: string) =>
    request<{ ok: boolean }>(`/api/projects/${id}`, { method: "DELETE" }),
};
