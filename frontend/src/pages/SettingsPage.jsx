import { THEMES, DARK_THEMES, THEME_DESCRIPTIONS } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { Moon, Palette } from "lucide-react";



const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 pt-20 max-w-6xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Palette className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold gradient-text">Theme Settings</h1>
            </div>
            <p className="text-base-content/70">Customize your chat experience with beautiful themes</p>
          </div>



          {/* Theme Selection Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
           
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {THEMES.map((t) => (
                <ThemeCard key={t} theme={t} currentTheme={theme} setTheme={setTheme} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Theme Card Component
const ThemeCard = ({ theme, currentTheme, setTheme }) => {
  const isSelected = currentTheme === theme;
  const isDark = DARK_THEMES.includes(theme);
  const description = THEME_DESCRIPTIONS[theme];

  return (
    <button
      className={`
        group relative flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-200
        ${isSelected 
          ? "bg-primary/10 border-2 border-primary shadow-lg shadow-primary/20 scale-105" 
          : "bg-base-200/50 border border-base-300/30 hover:bg-base-200 hover:border-primary/30 hover:scale-102"
        }
      `}
      onClick={() => setTheme(theme)}
    >
      {/* Theme preview */}
      <div className="relative w-full h-12 rounded-lg overflow-hidden shadow-md" data-theme={theme}>
        <div className="absolute inset-0 grid grid-cols-4 gap-0.5 p-1">
          <div className="rounded bg-primary shadow-sm"></div>
          <div className="rounded bg-secondary shadow-sm"></div>
          <div className="rounded bg-accent shadow-sm"></div>
          <div className="rounded bg-neutral shadow-sm"></div>
        </div>
        {isDark && (
          <div className="absolute top-1 right-1">
            <Moon className="w-3 h-3 text-base-content/70" />
          </div>
        )}
      </div>
      
      {/* Theme name and description */}
      <div className="text-center">
        <span className={`text-sm font-medium block ${isSelected ? "text-primary" : "text-base-content"}`}>
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </span>
        {description && (
          <span className="text-xs text-base-content/60 block mt-1">
            {description}
          </span>
        )}
      </div>
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg animate-scale-in">
          <svg className="w-3 h-3 text-primary-content" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </button>
  );
};

export default SettingsPage;
