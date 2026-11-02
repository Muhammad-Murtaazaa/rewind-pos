import { create } from "zustand";
import { SAMPLE_STAFF } from "../lib/data/sample-menu";

export interface CurrentUser {
  id: string;
  name: string;
  role: "OWNER" | "MANAGER" | "CASHIER" | "WAITER" | "BARISTA" | "KITCHEN" | "ACCOUNTANT";
  email?: string;
  avatar?: string;
  discount_limit?: number;
}

interface AuthState {
  currentUser: CurrentUser | null;
  isAuthenticated: boolean;
  isLocked: boolean;
  loginWithPin: (pin: string) => boolean;
  loginWithUser: (user: CurrentUser) => void;
  logout: () => void;
  lockTerminal: () => void;
  unlockTerminal: (pin: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Default to Ali Raza (Cashier) so POS is ready instantly
  currentUser: {
    id: "user-3",
    name: "Ali Raza (Cashier)",
    role: "CASHIER",
    email: "ali@rewindcafe.pk",
    avatar: "🧑‍💻",
    discount_limit: 15,
  },
  isAuthenticated: true,
  isLocked: false,

  loginWithPin: (pin: string) => {
    const staff = SAMPLE_STAFF.find((s) => s.pin === pin);
    if (staff) {
      set({
        currentUser: {
          id: staff.id,
          name: staff.name,
          role: staff.role as any,
          email: staff.email,
          avatar: staff.avatar,
          discount_limit: staff.role === "OWNER" || staff.role === "MANAGER" ? 100 : 15,
        },
        isAuthenticated: true,
        isLocked: false,
      });
      return true;
    }
    return false;
  },

  loginWithUser: (user: CurrentUser) => {
    set({ currentUser: user, isAuthenticated: true, isLocked: false });
  },

  logout: () => {
    set({ currentUser: null, isAuthenticated: false, isLocked: true });
  },

  lockTerminal: () => {
    set({ isLocked: true });
  },

  unlockTerminal: (pin: string) => {
    const { currentUser } = get();
    // Allow either the current user's PIN or manager/owner PIN to unlock
    const staff = SAMPLE_STAFF.find((s) => s.pin === pin);
    if (staff) {
      set({ isLocked: false });
      return true;
    }
    return false;
  },
}));
