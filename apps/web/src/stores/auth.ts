import { create } from "zustand";
import { api, type User } from "@/lib/api";

interface AuthState {
  user: User | null;
  needsSetup: boolean;
  checked: boolean;
  cloud: boolean;
  providers: string[];
  check: () => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  needsSetup: false,
  checked: false,
  cloud: false,
  providers: [],

  check: async () => {
    const [status, meta] = await Promise.all([api.getStatus(), api.getMeta()]);
    set({
      user: status.user,
      needsSetup: status.needsSetup,
      checked: true,
      cloud: meta.cloud,
      providers: meta.providers,
    });
  },

  setUser: (user) => set({ user, needsSetup: false }),

  logout: async () => {
    await api.logout();
    set({ user: null });
  },
}));
