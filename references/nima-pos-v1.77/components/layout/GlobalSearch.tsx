import React, { useMemo, useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, X, FileSearch } from 'lucide-react';
import { normalizeArabic } from './navigationConfig';

interface SearchablePage {
  path: string;
  label: string;
  icon: any;
  section: string;
  isVisible: boolean;
  features: string[];
}

interface GlobalSearchProps {
  searchablePages: SearchablePage[];
  dir: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ searchablePages, dir }) => {
  const navigate = useNavigate();
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchResults = useMemo(() => {
    if (!globalSearchTerm.trim()) return [];
    const normalizedQuery = normalizeArabic(globalSearchTerm);
    return searchablePages.filter(p => {
      const normalizedLabel = normalizeArabic(p.label);
      const normalizedPath = p.path.toLowerCase();
      const featuresMatch = p.features.some(feat => normalizeArabic(feat).includes(normalizedQuery));
      return normalizedLabel.includes(normalizedQuery) || normalizedPath.includes(normalizedQuery) || featuresMatch;
    }).slice(0, 8);
  }, [globalSearchTerm, searchablePages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div id="header-global-search-container" className="relative flex-1 max-w-xl mx-4">
      <div className={`flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border transition-all ${isSearchFocused ? 'border-white/30 ring-4 ring-white/5 bg-white/10' : 'border-white/10 hover:border-white/20'} shadow-sm`}>
        <Search className={`w-5 h-5 ${isSearchFocused ? 'text-white' : 'text-white/40'}`} />
        <input 
          ref={searchInputRef}
          type="text" 
          placeholder="ابحث عن صفحة (Ctrl+K)..." 
          className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-white/30 font-medium w-full min-w-0"
          value={globalSearchTerm}
          onChange={(e) => setGlobalSearchTerm(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
        />
        {globalSearchTerm && (
          <button onClick={() => setGlobalSearchTerm('')} className="p-1 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {(isSearchFocused && globalSearchTerm) && (
        <div className={`absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${dir === 'rtl' ? 'right-0' : 'left-0'}`}>
          {searchResults.length > 0 ? (
            <div className="p-2 space-y-1">
              {searchResults.map(result => {
                const Icon = result.icon;
                return (
                  <NavLink 
                    key={result.path} 
                    to={result.path}
                    onClick={() => {
                      setGlobalSearchTerm('');
                      setIsSearchFocused(false);
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 text-right" dir="rtl">
                      <p className="text-sm font-bold text-slate-800 truncate">{result.label}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest truncate">{result.section}</p>
                      {globalSearchTerm && result.features.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {result.features.filter(f => normalizeArabic(f).includes(normalizeArabic(globalSearchTerm))).slice(0, 2).map((feat, idx) => (
                            <span key={idx} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md truncate max-w-[120px]">
                              {feat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </NavLink>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center flex flex-col items-center">
              <FileSearch className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-slate-500 text-sm font-bold">لا توجد نتائج مطابقة</p>
              <p className="text-slate-400 text-xs mt-1">حاول البحث بكلمة أخرى</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
