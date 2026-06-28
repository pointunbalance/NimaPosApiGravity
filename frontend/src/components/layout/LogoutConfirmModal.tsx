import React from 'react';
import { Power } from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  isBackingUp: boolean;
  autoBackupOnClose: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  isBackingUp,
  autoBackupOnClose,
  onCancel,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="layout-logout-modal fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
            <Power className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">خروج آمن</h3>
          <p className="text-slate-500 mb-6 font-semibold">
            {autoBackupOnClose 
              ? 'سيتم إجراء نسخ احتياطي تلقائي للبيانات قبل الخروج.' 
              : 'هل أنت متأكد من رغبتك في تسجيل الخروج؟'
            }
          </p>
          
          <div className="flex gap-3 w-full">
            <button 
              onClick={onCancel}
              disabled={isBackingUp}
              className="flex-1 py-2.5 bg-gray-100 text-gray-705 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
              إلغاء
            </button>
            <button 
              onClick={onConfirm}
              disabled={isBackingUp}
              className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              {isBackingUp ? (
                <>جاري الحفظ...</>
              ) : (
                <>خروج وحفظ</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
