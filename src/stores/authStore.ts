import { create } from 'zustand';

/**
 * - disabled: Supabase not configured → guest mode only
 * - loading: restoring the session on startup
 */
export type AuthStatus = 'disabled' | 'loading' | 'signed_in' | 'signed_out';

export interface AuthUser {
  id: string;
  email: string | null;
}

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  /** Set while the user arrived from a password-recovery link. */
  recovering: boolean;
  setSignedIn: (user: AuthUser) => void;
  setSignedOut: () => void;
  setDisabled: () => void;
  setRecovering: (value: boolean) => void;
}

/** Session state is owned by Supabase (persisted in its own storage); this store only mirrors it. */
export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  recovering: false,
  setSignedIn: (user) => set({ status: 'signed_in', user }),
  setSignedOut: () => set({ status: 'signed_out', user: null, recovering: false }),
  setDisabled: () => set({ status: 'disabled', user: null, recovering: false }),
  setRecovering: (recovering) => set({ recovering }),
}));
