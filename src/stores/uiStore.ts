import { create } from "zustand";

interface UiState {
  language: "en" | "ur";
  isRtl: boolean;
  theme: "light" | "dark";
  soundEnabled: boolean;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  setLanguage: (lang: "en" | "ur") => void;
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
  toggleSound: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  playSound: (type: "bell" | "chime" | "click") => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  language: "en",
  isRtl: false,
  theme: "light",
  soundEnabled: true,
  sidebarCollapsed: false,
  mobileMenuOpen: false,

  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  setLanguage: (lang) => {
    set({
      language: lang,
      isRtl: lang === "ur",
    });
    if (typeof document !== "undefined") {
      document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
      document.documentElement.lang = lang;
    }
  },

  toggleTheme: () => {
    const nextTheme = get().theme === "light" ? "dark" : "light";
    set({ theme: nextTheme });
    if (typeof document !== "undefined") {
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  },

  setTheme: (theme) => {
    set({ theme });
    if (typeof document !== "undefined") {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  },

  toggleSound: () => {
    set({ soundEnabled: !get().soundEnabled });
  },

  playSound: (type) => {
    if (!get().soundEnabled || typeof window === "undefined") return;
    try {
      // Synthesize clean web audio chime/tones without needing external mp3 files
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === "bell") {
        // High register checkout ding (e.g. 880Hz -> 1760Hz)
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === "chime") {
        // Soft kitchen two-tone chime (523Hz -> 659Hz)
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.12);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else {
        // Quick gentle haptic click
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch {
      // Audio context might be restricted before interaction
    }
  },
}));
