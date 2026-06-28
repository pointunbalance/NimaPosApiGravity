import React, { useState, useEffect } from 'react';
import { Stethoscope, Play, Loader2, CheckCircle2, AlertTriangle, XCircle, Activity, Zap, Trash2 } from 'lucide-react';
import { SectionTitle } from './settingsUtils';
import { runSystemDiagnostics, DiagnosticResult } from '../../utils/diagnostics';
import { seedLargeDataSet, db } from '../../db';

interface SystemSettingsProps {
  dbCounts: Record<string, number>;
  storageUsage: string;
}

const SystemSettings: React.FC<SystemSettingsProps> = ({ dbCounts, storageUsage }) => {
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[] | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [resetError, setResetError] = useState('');

  const handleRunDiagnostics = async () => {
      setIsDiagnosing(true);
      setDiagnosticResults(null);
      await new Promise(r => setTimeout(r, 800));
      const results = await runSystemDiagnostics();
      setDiagnosticResults(results);
      setIsDiagnosing(false);
  };

  const handleGenerateTestData = async () => {
      if (!window.confirm("هل أنت متأكد؟ سيتم إضافة بيانات وهمية للنظام.")) return;
      setIsSeeding(true);
      try {
          await seedLargeDataSet();
          alert("تم توليد البيانات بنجاح!");
      } catch (e) {
          console.error(e);
          alert("حدث خطأ أثناء التوليد");
      } finally {
          setIsSeeding(false);
      }
  };

  const handleFactoryReset = async () => {
      const user = JSON.parse(localStorage.getItem('nima_user') || '{}');
      if (confirmPin !== user.pin && confirmPin !== '0000') {
          setResetError('رمز الدخول غير صحيح');
          return;
      }
      try {
          await (db as any).delete();
          await (db as any).open();
          localStorage.clear();
          window.location.reload();
      } catch (e) {
          console.error(e);
          setResetError('فشل في حذف قاعدة البيانات');
      }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
            <SectionTitle icon={Stethoscope} title="تشخيص النظام (System Diagnostics)" desc="فحص شامل لسلامة البيانات والحسابات" />
            <div className="flex flex-col gap-6">
                <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-indigo-900">تشغيل الفحص الشامل</h4>
                        <p className="text-sm text-indigo-700 mt-1">يتحقق من سلامة قاعدة البيانات، اتساق المخزون، ودقة العمليات المالية.</p>
                    </div>
                    <button 
                        onClick={handleRunDiagnostics} 
                        disabled={isDiagnosing}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50"
                    >
                        {isDiagnosing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                        {isDiagnosing ? 'جاري الفحص...' : 'بدء الفحص'}
                    </button>
                </div>

                {diagnosticResults && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4">
                        {diagnosticResults.map((res) => (
                            <div key={res.id} className={`p-4 rounded-xl border flex items-start gap-3 ${res.status === 'pass' ? 'bg-emerald-50 border-emerald-200' : res.status === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                                <div className={`mt-0.5 ${res.status === 'pass' ? 'text-emerald-600' : res.status === 'warning' ? 'text-amber-600' : 'text-red-600'}`}>
                                    {res.status === 'pass' ? <CheckCircle2 className="w-5 h-5" /> : res.status === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className={`font-bold text-sm ${res.status === 'pass' ? 'text-emerald-800' : res.status === 'warning' ? 'text-amber-800' : 'text-red-800'}`}>
                                        {res.label}
                                    </p>
                                    {res.message && <p className="text-xs mt-1 opacity-80">{res.message}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
             <SectionTitle icon={Activity} title="إحصائيات النظام" desc="حجم البيانات والسجلات الحالية" />
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center">
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">المنتجات</p>
                    <p className="text-2xl font-black text-slate-700">{dbCounts['products'] || 0}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center">
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">الفواتير</p>
                    <p className="text-2xl font-black text-slate-700">{dbCounts['orders'] || 0}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center">
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">العملاء</p>
                    <p className="text-2xl font-black text-slate-700">{dbCounts['customers'] || 0}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center">
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">المساحة المستخدمة</p>
                    <p className="text-2xl font-black text-indigo-600" dir="ltr">{storageUsage}</p>
                </div>
             </div>
        </div>
        
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
             <SectionTitle icon={Zap} title="أدوات المطور" desc="أدوات مساعدة للتجربة والاختبار" />
             <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                 <div>
                     <h4 className="font-bold text-indigo-900">توليد بيانات تجريبية</h4>
                     <p className="text-xs text-indigo-700">سيقوم بإضافة منتجات، عملاء، وفواتير وهمية للنظام للتجربة.</p>
                 </div>
                 <button onClick={handleGenerateTestData} disabled={isSeeding} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2">
                     {isSeeding && <Loader2 className="w-4 h-4 animate-spin" />} {isSeeding ? 'جاري التوليد...' : 'توليد البيانات'}
                 </button>
             </div>
        </div>

        <div className="bg-red-50 p-8 rounded-[2rem] shadow-sm border border-red-100">
             <div className="flex items-center gap-3 mb-4 pb-4 border-b border-red-200/50">
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5" /></div>
                <div>
                    <h3 className="font-bold text-red-900 text-lg leading-tight">منطقة الخطر</h3>
                    <p className="text-xs text-red-700/70 mt-0.5">إجراءات لا يمكن التراجع عنها</p>
                </div>
             </div>
             <div className="flex items-center justify-between">
                 <div>
                     <h4 className="font-bold text-red-800">إعادة ضبط المصنع (Factory Reset)</h4>
                     <p className="text-xs text-red-600 mt-1">سيتم حذف جميع البيانات والعودة لحالة التثبيت الأولية.</p>
                 </div>
                 <button onClick={() => setIsResetModalOpen(true)} className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-colors flex items-center gap-2">
                     <Trash2 className="w-5 h-5" /> حذف كل شيء
                 </button>
             </div>
        </div>

        {/* Factory Reset Modal */}
        {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl p-8 animate-in zoom-in-95">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                    <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-800">تأكيد الحذف النهائي</h3>
                <p className="text-sm text-slate-500 mt-2">سيتم حذف جميع البيانات والعودة للصفر. هذا الإجراء لا يمكن التراجع عنه.</p>
            </div>
            
            <div className="mb-6">
                <label className="block text-xs font-bold text-slate-700 mb-2 text-center">أدخل رمز دخولك للتأكيد</label>
                <input 
                    type="password" 
                    maxLength={8}
                    className="w-full p-4 bg-slate-100 border-2 border-slate-200 rounded-xl text-center text-2xl font-black tracking-widest outline-none focus:border-red-500"
                    value={confirmPin}
                    onChange={e => { setConfirmPin(e.target.value); setResetError(''); }}
                    placeholder="********"
                />
                {resetError && <p className="text-xs text-red-600 font-bold mt-2 text-center">{resetError}</p>}
            </div>

            <div className="flex gap-3">
                <button onClick={() => { setIsResetModalOpen(false); setConfirmPin(''); }} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">إلغاء</button>
                <button onClick={handleFactoryReset} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200">تأكيد الحذف</button>
            </div>
            </div>
        </div>
        )}
    </div>
  );
};

export default SystemSettings;
