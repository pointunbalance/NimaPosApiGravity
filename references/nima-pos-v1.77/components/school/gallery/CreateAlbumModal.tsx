import React from 'react';
import { X } from 'lucide-react';

interface CreateAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  albumForm: any;
  setAlbumForm: React.Dispatch<React.SetStateAction<any>>;
  handleCreateAlbum: (e: React.FormEvent) => void;
  classes: any[];
}

export const CreateAlbumModal: React.FC<CreateAlbumModalProps> = ({
  isOpen,
  onClose,
  albumForm,
  setAlbumForm,
  handleCreateAlbum,
  classes,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
          <h2 className="text-xl font-black text-slate-800">إنشاء ألبوم جديد</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleCreateAlbum} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">اسم الألبوم</label>
            <input
              required
              type="text"
              value={albumForm.title}
              onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 font-medium"
              placeholder="مثال: رحلة حديقة الحيوان"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">التاريخ</label>
              <input
                required
                type="date"
                value={albumForm.date}
                onChange={(e) => setAlbumForm({ ...albumForm, date: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">النوع</label>
              <select
                value={albumForm.type}
                onChange={(e) => setAlbumForm({ ...albumForm, type: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 font-medium"
              >
                <option value="عام">عام</option>
                <option value="نشاط">نشاط صفي</option>
                <option value="رحلة">رحلة</option>
                <option value="حفلة">حفلة</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">ارتباط بفصل محدد (اختياري)</label>
            <select
              value={albumForm.classroomId}
              onChange={(e) => setAlbumForm({ ...albumForm, classroomId: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 font-medium"
            >
              <option value="">جميع الفصول (ألبوم عام)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3.5 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors cursor-pointer"
            >
              إنشاء وإضافة صور
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CreateAlbumModal;
