import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Role = 'SUPERADMIN' | 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT';

interface User {
  id: string;
  username: string;
  role: Role;
  permissions?: string[]; // Used when role === "ADMIN"
}
 
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  login: (user: User) => void;
  logout: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hasHydrated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
