import React from 'react';
import { Database } from 'lucide-react';
import { getSqlSchema } from '../../db';

interface SchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchemaModal: React.FC<SchemaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" dir="rtl">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600" />
            <span>هيكل جداول قاعدة البيانات (Schema)</span>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 cursor-pointer">✕</button>
        </div>
        <div className="p-4 flex-1 overflow-auto bg-slate-50 font-mono text-xs whitespace-pre text-left" dir="ltr">
          {getSqlSchema().join('\n\n')}
        </div>
      </div>
    </div>
  );
};
