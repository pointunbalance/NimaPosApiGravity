import React, { useState, useEffect } from 'react';
import { DatabaseBackup, RefreshCw, AlertTriangle } from 'lucide-react';
import { exportFullDatabase, downloadBackup, restoreFullDatabase, clearAllData } from '../../db';
import { BackupCard } from '../../components/admin/SystemBackups/BackupCard';
import { RestoreCard } from '../../components/admin/SystemBackups/RestoreCard';
import { AutoBackupCard } from '../../components/admin/SystemBackups/AutoBackupCard';
import { DangerZoneCard } from '../../components/admin/SystemBackups/DangerZoneCard';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useToast } from '../../context/ToastContext';

const SystemBackups: React.FC = () => {
  const { success, error: showError } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [dbSize, setDbSize] = useState<string>('جاري الحساب...');
  const [lastBackup, setLastBackup] = useState<string>('غير متوفر');
  
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupFrequency, setAutoBackupFrequency] = useState('daily');

  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean; title: string; message: string; onConfirm: () => void} | null>(null);
  
  // Factory reset text confirm state
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [confirmTextInput, setConfirmTextInput] = useState('');

  // Selected file for restore
  const [selectedRestoreFile, setSelectedRestoreFile] = useState<File | null>(null);

  useEffect(() => {
    const calculateSize = async () => {
      if (navigator.storage && navigator.storage.estimate) {
        try {
          const estimate = await navigator.storage.estimate();
          if (estimate.usage) {
            const sizeInMB = (estimate.usage / (1024 * 1024)).toFixed(2);
            setDbSize(`${sizeInMB} MB`);
          } else {
            setDbSize('غير معروف');
          }
        } catch (error) {
          setDbSize('غير معروف');
        }
      } else {
        setDbSize('غير مدعوم');
      }
    };

    calculateSize();

    const savedLastBackup = localStorage.getItem('lastBackupDate');
    if (savedLastBackup) {
      setLastBackup(new Date(savedLastBackup).toLocaleString('ar-SA'));
    }

    const savedAutoBackup = localStorage.getItem('autoBackupEnabled');
    if (savedAutoBackup) {
      setAutoBackupEnabled(savedAutoBackup === 'true');
    }
    const savedFrequency = localStorage.getItem('autoBackupFrequency');
    if (savedFrequency) {
      setAutoBackupFrequency(savedFrequency);
    }
  }, []);

  const handleManualBackup = async () => {
    try {
      setIsExporting(true);
      const blob = await exportFullDatabase();
      const now = new Date();
      downloadBackup(blob, `NimaPos_ManualBackup_${now.toISOString().split('T')[0]}.json`);
      
      localStorage.setItem('lastBackupDate', now.toISOString());
      setLastBackup(now.toLocaleString('ar-SA'));
      success('تم إنشاء وتحميل النسخة الاحتياطية بنجاح');
    } catch (error) {
      console.error('Backup failed:', error);
      showError('فشل إنشاء النسخة الاحتياطية');
    } finally {
      setIsExporting(false);
    }
  };

  const executeRestore = async (file: File) => {
    try {
      setIsRestoring(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string);
          const result = await restoreFullDatabase(jsonData);
          if (result) {
            success('تم استعادة البيانات بنجاح. سيتم إعادة تحميل الصفحة خلال ثوانٍ...');
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            showError('فشل استعادة البيانات. تأكد من صحة الملف.');
          }
        } catch (err) {
          console.error('Error parsing JSON:', err);
          showError('ملف النسخة الاحتياطية غير صالح.');
        } finally {
          setIsRestoring(false);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Restore failed:', error);
      showError('حدث خطأ أثناء استعادة البيانات');
      setIsRestoring(false);
    }
  };

  const handleRestoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedRestoreFile(file);
    setConfirmConfig({
      isOpen: true,
      title: 'استعادة البيانات',
      message: 'تحذير: هذه العملية ستمسح جميع البيانات الحالية وتستبدلها ببيانات النسخة الاحتياطية بالكامل. هل أنت متأكد من الاستمرار؟',
      onConfirm: () => {
        setConfirmConfig(null);
        executeRestore(file);
      }
    });
    e.target.value = '';
  };

  const handleClearDataClick = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'تحذير أمني خطير جداً',
      message: 'هل أنت متأكد تماماً من رغبتك في مسح كافة بيانات النظام؟ سيؤدي ذلك لإعادة ضبط المصنع نهائياً وحذف جميع المبيعات والعمليات والموظفين والمخازن.',
      onConfirm: () => {
        setConfirmConfig(null);
        setConfirmTextInput('');
        setIsResetConfirmOpen(true);
      }
    });
  };

  const handleExecuteClearAll = async () => {
    if (confirmTextInput !== 'مسح جميع البيانات') {
      showError('الرجاء كتابة العبارة التأكيدية بشكل صحيح');
      return;
    }

    try {
      setIsClearing(true);
      setIsResetConfirmOpen(false);
      const result = await clearAllData();
      if (result) {
        success('تم تهيئة النظام بالكامل بنجاح. سيتم إعادة التشغيل...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        showError('فشل مسح البيانات.');
      }
    } catch (error) {
      console.error('Clear data failed:', error);
      showError('حدث خطأ أثناء مسح البيانات');
    } finally {
      setIsClearing(false);
    }
  };

  const saveAutoBackupSettings = (enabled: boolean, frequency: string) => {
    setAutoBackupEnabled(enabled);
    setAutoBackupFrequency(frequency);
    localStorage.setItem('autoBackupEnabled', enabled.toString());
    localStorage.setItem('autoBackupFrequency', frequency);
    success('تم تحديث إعدادات النسخ التلقائي');
  };

  const isBtnDisabled = isExporting || isRestoring || isClearing;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 font-['Tajawal'] rounded-2xl min-h-screen" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-sm">
              <DatabaseBackup className="w-8 h-8 stroke-[2]" />
            </div>
            النسخ الاحتياطي وإدارة البيانات
          </h1>
          <p className="text-slate-500 font-bold text-sm mt-1">إدارة النسخ الاحتياطية لقاعدة البيانات المحلية، استعادتها، وإعدادات الحفظ التلقائي</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BackupCard
          lastBackup={lastBackup}
          dbSize={dbSize}
          isExporting={isExporting}
          disabled={isBtnDisabled}
          onBackup={handleManualBackup}
        />

        <RestoreCard
          isRestoring={isRestoring}
          disabled={isBtnDisabled}
          onRestore={handleRestoreChange}
        />

        <AutoBackupCard
          autoBackupEnabled={autoBackupEnabled}
          autoBackupFrequency={autoBackupFrequency}
          onSettingsChange={saveAutoBackupSettings}
        />

        <DangerZoneCard
          isClearing={isClearing}
          disabled={isBtnDisabled}
          onClear={handleClearDataClick}
        />
      </div>

      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
          confirmText="تأكيد ومتابعة"
          cancelText="إلغاء"
        />
      )}

      {/* Custom Prompt Modal for Factory Reset */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-100/50">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2 bg-red-50 rounded-xl">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-lg font-black">تأكيد نهائي وحاسم</h3>
            </div>
            <p className="text-slate-600 text-sm font-bold leading-relaxed mb-4">
              هذه الخطوة ستقوم بحذف جميع بيانات الفواتير والزبائن والقيود المحاسبية نهائياً.
              <br />
              لتأكيد هذا الإجراء، يرجى كتابة العبارة التالية في الحقل أدناه:
              <span className="block text-red-600 font-black mt-2 select-all text-center p-2 bg-red-50/50 rounded-xl border border-red-100">
                مسح جميع البيانات
              </span>
            </p>
            <input
              type="text"
              value={confirmTextInput}
              onChange={(e) => setConfirmTextInput(e.target.value)}
              placeholder="اكتب العبارة هنا..."
              className="w-full bg-slate-50 border border-slate-200 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm font-bold text-slate-800 mb-6 transition-all text-center"
            />
            <div className="flex gap-3">
              <button
                onClick={handleExecuteClearAll}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black shadow-lg shadow-red-500/10 text-sm transition-all cursor-pointer"
              >
                تأكيد مسح البيانات
              </button>
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-sm transition-all cursor-pointer"
              >
                تراجع وإلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemBackups;
