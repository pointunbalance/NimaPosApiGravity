import React, { useState, useEffect, useRef } from 'react';
import { 
  Sun, Moon, Palette, Droplets, Leaf, Flower2, Sunset, Gem, Sparkles 
} from 'lucide-react';
import { THEMES } from '../../context/ThemeContext';

interface ThemeSelectorProps {
  theme: string;
  setTheme: (theme: string, e: any) => void;
  dir: string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ theme, setTheme, dir }) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowThemeMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getThemeIcon = () => {
    switch (theme) {
      case 'dark': return <Moon className="w-5 h-5" />;
      case 'ocean': return <Droplets className="w-5 h-5" />;
      case 'nature': return <Leaf className="w-5 h-5" />;
      case 'rose': return <Flower2 className="w-5 h-5" />;
      case 'lavender': return <Sparkles className="w-5 h-5" />;
      case 'sunset': return <Sunset className="w-5 h-5" />;
      case 'orchid': return <Gem className="w-5 h-5" />;
      default: return <Sun className="w-5 h-5" />;
    }
  };

  return (
    <div className="relative" ref={themeMenuRef} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
      <button 
        onClick={() => setShowThemeMenu(!showThemeMenu)}
        className={`w-10 h-10 rounded-full shadow-sm border flex items-center justify-center transition-all ${
          showThemeMenu 
            ? 'bg-brand-50 border-brand-200 text-brand-600' 
            : 'bg-white border-slate-200 text-slate-500 hover:text-brand-600 hover:border-brand-200 hover:shadow-md'
        }`}
        title="تغيير المظهر"
      >
        {getThemeIcon()}
      </button>
      
      {showThemeMenu && (
        <div className={`absolute top-14 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden ${dir === 'rtl' ? 'left-0' : 'right-0'}`}>
          <div className="p-3 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50" dir="rtl">
            <Palette className="w-4 h-4 text-brand-500" />
            <span className="font-bold text-sm text-gray-805 text-gray-800">المظهر</span>
          </div>
          <div className="p-2 space-y-1">
            {THEMES.map(tOption => (
              <button
                key={tOption.id}
                onClick={(e) => {
                  setTheme(tOption.id, e);
                  setShowThemeMenu(false);
                }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-sm font-medium transition-colors ${
                  theme === tOption.id ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                  theme === tOption.id ? 'bg-white border-brand-200 text-brand-600 shadow-sm' : 'bg-white border-slate-100 text-slate-400'
                }`}>
                  {tOption.id === 'light' && <Sun className="w-4 h-4" />}
                  {tOption.id === 'dark' && <Moon className="w-4 h-4" />}
                  {tOption.id === 'ocean' && <Droplets className="w-4 h-4" />}
                  {tOption.id === 'nature' && <Leaf className="w-4 h-4" />}
                  {tOption.id === 'rose' && <Flower2 className="w-4 h-4" />}
                  {tOption.id === 'lavender' && <Sparkles className="w-4 h-4" />}
                  {tOption.id === 'sunset' && <Sunset className="w-4 h-4" />}
                  {tOption.id === 'orchid' && <Gem className="w-4 h-4" />}
                </div>
                <span className="text-right flex-1">{tOption.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
