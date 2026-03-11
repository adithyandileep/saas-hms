import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Role = 'SUPERADMIN' | 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT';

interface User {
  id: string;
  username: string;
  role: Role;
  permissions?: string[];
}
 
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hasHydrated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'auth-storage',
      version: 1, // bumped from 0 — forces reset for users with old cached state (no token field)
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

