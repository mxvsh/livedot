import { create } from "zustand";
import { api, type User } from "@/lib/api";

interface AuthState {
  user: User | null;
  needsSetup: boolean;
  checked: boolean;
  check: () => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  needsSetup: false,
  checked: false,

  check: async () => {
    const status = await api.getStatus();
    set({
      user: status.user,
      needsSetup: status.needsSetup,
      checked: true,
    });
  },

  setUser: (user) => set({ user, needsSetup: false }),

  logout: async () => {
    await api.logout();
    set({ user: null });
  },
}));
