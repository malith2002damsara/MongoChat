import { create } from "zustand";
import { DARK_THEMES } from "../constants";

// Function to detect user's system theme preference
const getSystemTheme = () => {
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark";
};

// Get initial theme with smart defaults
const getInitialTheme = () => {
  const storedTheme = localStorage.getItem("chat-theme");
  if (storedTheme) return storedTheme;
  
  // Default to dark theme if no preference stored
  const systemTheme = getSystemTheme();
  return systemTheme === "dark" ? "dark" : "light";
};

export const useThemeStore = create((set, get) => ({
  theme: getInitialTheme(),
  
  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme);
    set({ theme });
    
    // Apply theme to document root for better CSS custom properties support
    document.documentElement.setAttribute("data-theme", theme);
  },
  
  // Check if current theme is dark
  isDarkTheme: () => {
    const { theme } = get();
    return DARK_THEMES.includes(theme);
  },
  
  // Toggle between light and dark
  toggleTheme: () => {
    const { theme } = get();
    const newTheme = DARK_THEMES.includes(theme) ? "light" : "dark";
    get().setTheme(newTheme);
  },
  
  // Set theme based on system preference
  setSystemTheme: () => {
    const systemTheme = getSystemTheme();
    get().setTheme(systemTheme);
  },
  
  // Initialize theme on app start
  initializeTheme: () => {
    const { theme } = get();
    document.documentElement.setAttribute("data-theme", theme);
    
    // Listen for system theme changes
    if (typeof window !== "undefined") {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        // Only auto-switch if user hasn't manually set a theme
        const storedTheme = localStorage.getItem("chat-theme");
        if (!storedTheme) {
          get().setTheme(e.matches ? "dark" : "light");
        }
      });
    }
  }
}));