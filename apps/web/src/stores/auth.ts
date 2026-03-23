import { create } from "zustand";
import { api, type User } from "@/lib/api";

interface AuthState {
  user: User | null;
  needsSetup: boolean;
  checked: boolean;
  cloud: boolean;
  providers: string[];
  registrationOpen: boolean;
  emailSignup: boolean;
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
  registrationOpen: true,
  emailSignup: false,

  check: async () => {
    try {
      const [status, meta] = await Promise.all([api.getStatus(), api.getMeta()]);
      set({
        user: status.user,
        needsSetup: status.needsSetup,
        checked: true,
        cloud: meta.cloud,
        providers: meta.providers,
        registrationOpen: meta.registrationOpen,
        emailSignup: meta.emailSignup ?? false,
      });
    } catch {
      // Server error (e.g. DB not initialized) — treat as needs setup
      set({ user: null, needsSetup: true, checked: true });
    }
  },

  setUser: (user) => set({ user, needsSetup: false }),

  logout: async () => {
    await api.logout();
    set({ user: null });
  },
}));
