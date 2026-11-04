"use client";

import { create } from "zustand";
import { db, type LocalStaff } from "@/lib/db/dexie";
import { SAMPLE_STAFF } from "@/lib/data/sample-menu";
import { generateUUID } from "@/lib/utils";

export interface CurrentUser {
  id: string;
  name: string;
  role: "OWNER" | "MANAGER" | "CASHIER" | "WAITER" | "BARISTA" | "KITCHEN" | "ACCOUNTANT";
  email?: string;
  avatar?: string;
  phone?: string;
  discount_limit?: number;
}

interface AuthState {
  currentUser: CurrentUser | null;
  staffList: LocalStaff[];
  isAuthenticated: boolean;
  isLocked: boolean;
  isLoading: boolean;
  loadStaff: () => Promise<LocalStaff[]>;
  loginWithPin: (pin: string) => Promise<boolean>;
  loginWithUser: (user: CurrentUser) => void;
  logout: () => void;
  lockTerminal: () => void;
  unlockTerminal: (pin: string) => Promise<boolean>;
  createStaff: (data: {
    name: string;
    role: CurrentUser["role"];
    pin: string;
    email?: string;
    phone?: string;
    avatar?: string;
    discount_limit?: number;
  }) => Promise<LocalStaff>;
  updateStaff: (
    id: string,
    data: Partial<{
      name: string;
      role: CurrentUser["role"];
      pin: string;
      email?: string;
      phone?: string;
      avatar?: string;
      discount_limit?: number;
    }>
  ) => Promise<void>;
  deleteStaff: (id: string) => Promise<boolean>;
}

const STORAGE_KEY = "rewind_active_user";

function getSavedUser(): CurrentUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

function saveUserToStorage(user: CurrentUser | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: getSavedUser() || {
    id: "user-1",
    name: "Hamza Malik (Owner)",
    role: "OWNER",
    email: "owner@rewindcafe.pk",
    avatar: "👨‍💼",
    discount_limit: 100,
  },
  staffList: [...SAMPLE_STAFF],
  isAuthenticated: true,
  isLocked: false,
  isLoading: false,

  loadStaff: async () => {
    try {
      set({ isLoading: true });
      let staff = await db.staff.toArray();
      if (!staff || staff.length === 0) {
        await db.seedDefaultsIfEmpty();
        staff = await db.staff.toArray();
      }
      if (!staff || staff.length === 0) {
        staff = [...SAMPLE_STAFF];
      }
      set({ staffList: staff, isLoading: false });

      // If current user is deleted or not found, sync to first available user
      const { currentUser } = get();
      if (currentUser) {
        const found = staff.find((s) => s.id === currentUser.id);
        if (found) {
          const updatedCurrent: CurrentUser = {
            id: found.id,
            name: found.name,
            role: found.role as any,
            email: found.email,
            avatar: found.avatar,
            phone: (found as any).phone,
            discount_limit: found.role === "OWNER" || found.role === "MANAGER" ? 100 : 15,
          };
          set({ currentUser: updatedCurrent });
          saveUserToStorage(updatedCurrent);
        }
      }
      return staff;
    } catch (err) {
      console.warn("Failed to load staff from db:", err);
      set({ staffList: [...SAMPLE_STAFF], isLoading: false });
      return SAMPLE_STAFF;
    }
  },

  loginWithPin: async (pin: string) => {
    let { staffList } = get();
    if (!staffList || staffList.length === 0) {
      staffList = await get().loadStaff();
    }

    // Try finding in database
    let staff = staffList.find((s) => s.pin === pin);
    if (!staff) {
      try {
        const dbStaff = await db.staff.where("pin").equals(pin).first();
        if (dbStaff) staff = dbStaff;
      } catch {
        // fallback
      }
    }

    if (staff) {
      const user: CurrentUser = {
        id: staff.id,
        name: staff.name,
        role: staff.role as any,
        email: staff.email,
        avatar: staff.avatar,
        phone: (staff as any).phone,
        discount_limit: staff.role === "OWNER" || staff.role === "MANAGER" ? 100 : 15,
      };
      set({
        currentUser: user,
        isAuthenticated: true,
        isLocked: false,
      });
      saveUserToStorage(user);
      return true;
    }
    return false;
  },

  loginWithUser: (user: CurrentUser) => {
    set({ currentUser: user, isAuthenticated: true, isLocked: false });
    saveUserToStorage(user);
  },

  logout: () => {
    set({ currentUser: null, isAuthenticated: false, isLocked: true });
    saveUserToStorage(null);
  },

  lockTerminal: () => {
    set({ isLocked: true });
  },

  unlockTerminal: async (pin: string) => {
    return await get().loginWithPin(pin);
  },

  createStaff: async (data) => {
    const newStaff: LocalStaff = {
      id: `user-${Date.now()}`,
      name: data.name.trim(),
      role: data.role,
      pin: data.pin.trim(),
      email: data.email?.trim() || `${data.name.toLowerCase().replace(/\s+/g, "")}@rewindcafe.pk`,
      avatar: data.avatar || "👤",
      ...(data.phone ? { phone: data.phone.trim() } : {}),
      ...(data.discount_limit !== undefined ? { discount_limit: data.discount_limit } : {}),
    } as any;

    await db.staff.put(newStaff);

    // Also add to staffProfiles in HR table for payroll consistency
    try {
      await db.staffProfiles.put({
        id: `profile-${Date.now()}`,
        user_id: newStaff.id,
        name: newStaff.name,
        role: newStaff.role as any,
        cnic: "42101-" + Math.floor(1000000 + Math.random() * 9000000) + "-1",
        phone: (newStaff as any).phone || "0300-1234567",
        email: newStaff.email || `${newStaff.name.toLowerCase().replace(/\s+/g, "")}@rewindcafe.pk`,
        avatar: newStaff.avatar || "👤",
        salary_type: "MONTHLY",
        base_salary: data.role === "OWNER" ? 150000 : data.role === "MANAGER" ? 85000 : 50000,
        joining_date: new Date().toISOString(),
        is_active: true,
      });
    } catch {
      // ignore
    }

    // Refresh store
    await get().loadStaff();
    return newStaff;
  },

  updateStaff: async (id, data) => {
    const existing = await db.staff.get(id);
    if (!existing) return;

    const updated: LocalStaff = {
      ...existing,
      ...data,
    };
    await db.staff.put(updated);

    // Also update staff profile name/role in HR table
    try {
      const profile = await db.staffProfiles.where("user_id").equals(id).first();
      if (profile) {
        await db.staffProfiles.update(profile.id, {
          name: updated.name,
          role: updated.role as any,
          avatar: updated.avatar || profile.avatar,
        });
      }
    } catch {
      // ignore
    }

    // Update current user if editing self
    const { currentUser } = get();
    if (currentUser?.id === id) {
      const updatedUser: CurrentUser = {
        ...currentUser,
        name: updated.name,
        role: updated.role as any,
        email: updated.email,
        avatar: updated.avatar,
      };
      set({ currentUser: updatedUser });
      saveUserToStorage(updatedUser);
    }

    await get().loadStaff();
  },

  deleteStaff: async (id) => {
    const { staffList } = get();
    if (staffList.length <= 1) {
      alert("Cannot delete the only staff account. At least one account must exist.");
      return false;
    }

    await db.staff.delete(id);

    try {
      const profile = await db.staffProfiles.where("user_id").equals(id).first();
      if (profile) {
        await db.staffProfiles.delete(profile.id);
      }
    } catch {
      // ignore
    }

    await get().loadStaff();

    // If deleted the logged-in user, switch to the first remaining staff member
    const { currentUser } = get();
    if (currentUser?.id === id) {
      const remaining = await db.staff.toArray();
      if (remaining.length > 0) {
        const nextStaff = remaining[0];
        get().loginWithUser({
          id: nextStaff.id,
          name: nextStaff.name,
          role: nextStaff.role as any,
          email: nextStaff.email,
          avatar: nextStaff.avatar,
          discount_limit: nextStaff.role === "OWNER" || nextStaff.role === "MANAGER" ? 100 : 15,
        });
      }
    }
    return true;
  },
}));

// Initialize staff on client-side
if (typeof window !== "undefined") {
  useAuthStore.getState().loadStaff().catch(() => {});
}
