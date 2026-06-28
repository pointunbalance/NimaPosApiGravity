import React from 'react';
import { Camera } from '../../types';
import { X, Trash2 } from 'lucide-react';
import { db } from '../../db';

interface StudioCameraModalProps {
  cameraForm: Partial<Camera>;
  setCameraForm: React.Dispatch<React.SetStateAction<Partial<Camera>>>;
  handleAddCamera: () => void;
  onClose: () => void;
}

const StudioCameraModal: React.FC<StudioCameraModalProps> = ({
  cameraForm,
  setCameraForm,
  handleAddCamera,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 p-6">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h3 className="font-bold text-xl text-slate-800">إدارة الكاميرات</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4 mb-6">
          <input
            className="w-full border border-slate-200 bg-white text-slate-800 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="اسم الكاميرا والموديل"
            value={cameraForm.name}
            onChange={e => setCameraForm({ ...cameraForm, name: e.target.value })}
          />

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="text-sm font-bold text-slate-600 mb-3">خيارات التسعير (الافتراضية)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">سعر اليوم</label>
                <input
                  type="number" onFocus={(e) => e.target.select()}
                  className="w-full border border-slate-200 bg-white text-slate-800 p-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                  value={cameraForm.dailyRate || ''}
                  onChange={e => setCameraForm({ ...cameraForm, dailyRate: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">سعر الساعة</label>
                <input
                  type="number" onFocus={(e) => e.target.select()}
                  className="w-full border border-slate-200 bg-white text-slate-800 p-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                  value={cameraForm.hourlyRate || ''}
                  onChange={e => setCameraForm({ ...cameraForm, hourlyRate: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">سعر الجلسة (مقطوعية)</label>
                <input
                  type="number" onFocus={(e) => e.target.select()}
                  className="w-full border border-slate-200 bg-white text-slate-800 p-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                  value={cameraForm.sessionRate || ''}
                  onChange={e => setCameraForm({ ...cameraForm, sessionRate: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">سعر الصورة</label>
                <input
                  type="number" onFocus={(e) => e.target.select()}
                  className="w-full border border-slate-200 bg-white text-slate-800 p-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                  value={cameraForm.photoRate || ''}
                  onChange={e => setCameraForm({ ...cameraForm, photoRate: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <button onClick={handleAddCamera} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
            {cameraForm.id ? 'حفظ التعديلات' : 'إضافة'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudioCameraModal;
