import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Code, MessageSquare, Settings, Database, Play, Trash2 } from 'lucide-react';

interface DashboardDevToolsProps {
  onOpenSchema: () => void;
  onOpenSeed: () => void;
  onOpenClear: () => void;
  isSeeding: boolean;
  isClearing: boolean;
}

export const DashboardDevTools: React.FC<DashboardDevToolsProps> = ({
  onOpenSchema,
  onOpenSeed,
  onOpenClear,
  isSeeding,
  isClearing,
}) => {
  const navigate = useNavigate();

  return (
    <div id="dashboard-developer-tools" className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hidden xl:block">
      <div className="p-3 border-b border-slate-100 flex items-center justify-between text-slate-800 font-bold text-sm bg-slate-50">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-indigo-600" />
          <span>أدوات المطور المتكاملة</span>
        </div>
        <span className="bg-indigo-700 text-white font-black text-xs px-2 py-0.5 rounded-lg shadow-sm">٦</span>
      </div>
      <div className="p-3.5 space-y-3.5 bg-white">
        {/* Section 1: Navigation Links */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 mb-2 mr-1">الروابط التطويرية والمستندات</div>
          <div className="space-y-1">
            <button
              id="dev-skills-link"
              onClick={() => navigate('/developer/skills')}
              className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-slate-100 border border-transparent transition-all group cursor-pointer text-right"
              dir="rtl"
            >
              <div className="flex items-center gap-2">
                <Code className="w-3.5 h-3.5 text-indigo-500" />
                <span className="font-bold text-slate-700 text-xs">إدارة أدلة المشاريع (Skills)</span>
              </div>
            </button>
            <button
              id="dev-chatlogs-link"
              onClick={() => navigate('/developer/chat-logs')}
              className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-slate-100 border border-transparent transition-all group cursor-pointer text-right"
              dir="rtl"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                <span className="font-bold text-slate-700 text-xs">سجلات المحادثات والقرارات</span>
              </div>
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100"></div>

        {/* Section 2: Operations */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 mb-2 mr-1">العمليات التشغيلية للنظام</div>
          <div className="space-y-1.5">
            <button 
              id="setup-wizard-btn"
              onClick={() => navigate('/setup')} 
              className="w-full flex items-center justify-start gap-2 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-slate-700 shadow-sm text-right"
              dir="rtl"
            >
              <Settings className="w-4 h-4 text-slate-400 shrink-0" />
              <span>مدير إعدادات المنظومة (Setup)</span>
            </button>
            <button 
              id="show-schema-btn"
              onClick={onOpenSchema}
              className="w-full flex items-center justify-start gap-2 px-3 py-2 rounded-xl text-xs font-bold border border-indigo-100 hover:border-indigo-200 hover:bg-indigo-50/45 transition-all text-indigo-800 shadow-sm text-right"
              dir="rtl"
            >
              <Database className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>عرض هيكل الجداول (Schema)</span>
            </button>
            <button 
              id="seed-large-data-btn"
              onClick={onOpenSeed}
              disabled={isSeeding}
              className="w-full flex items-center justify-start gap-2 px-3 py-2 rounded-xl text-xs font-extrabold border border-emerald-100 hover:border-emerald-200 hover:bg-emerald-50/45 transition-all text-emerald-800 disabled:opacity-55 shadow-sm text-right"
              dir="rtl"
            >
              <Play className="w-4 h-4 text-emerald-500 shrink-0 animate-pulse" />
              <span>{isSeeding ? 'جاري التوليد...' : 'توليد بيانات تجريبية ضخمة'}</span>
            </button>
            <button 
              id="clear-all-data-btn"
              onClick={onOpenClear}
              disabled={isClearing}
              className="w-full flex items-center justify-start gap-2 px-3 py-2 rounded-xl text-xs font-extrabold border border-red-200 hover:border-red-300 hover:bg-red-50/70 transition-all text-[#DC2626] disabled:opacity-55 shadow-sm text-right"
              dir="rtl"
            >
              <Trash2 className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>{isClearing ? 'جاري التفريغ...' : 'حذف كل البيانات (إعادة تعيين)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
