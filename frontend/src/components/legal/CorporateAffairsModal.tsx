import React, { useState } from 'react';
import { X, Save, Trash2, Plus, CheckSquare } from 'lucide-react';

interface CorporateAffairsModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any;
  setEditingItem: (item: any) => void;
  onSave: (e: React.FormEvent) => void;
}

export const CorporateAffairsModal: React.FC<CorporateAffairsModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  setEditingItem,
  onSave,
}) => {
  const [newRes, setNewRes] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">
            {editingItem?.id ? 'تعديل محضر الاجتماع / القرار' : 'إضافة اجتماع أو قرار إداري مقترح'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSave} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">العنوان / مسودة الموضوع *</label>
              <input
                required
                type="text"
                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="مثال: اجتماع مجلس الإدارة الربع سنوي الأول، قرار اعتماد الهيكل التنظيمي..."
                value={editingItem?.title || ''}
                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">نوع ومستوى الحدث</label>
              <select
                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                value={editingItem?.type || 'board_meeting'}
                onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value })}
              >
                <option value="board_meeting">اجتماع مجلس الإدارة</option>
                <option value="general_assembly">الجمعية العمومية</option>
                <option value="management_meeting">اجتماع الإدارة التنفيذية</option>
                <option value="resolution">قرار إداري / تشريعي (تعميم)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ الانعقاد / الإصدار *</label>
              <input
                required
                type="date"
                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                value={editingItem?.date ? new Date(editingItem.date).toISOString().split('T')[0] : ''}
                onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">حالة الانعقاد / الاعتماد</label>
              <div className="flex gap-4">
                {['scheduled', 'completed', 'canceled'].map((status) => (
                  <label
                    key={status}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition ${
                      editingItem?.status === status
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      className="hidden"
                      name="status"
                      value={status}
                      checked={editingItem?.status === status}
                      onChange={() => setEditingItem({ ...editingItem, status })}
                    />
                    <span className="font-bold text-sm">
                      {status === 'scheduled'
                        ? 'مجدول (مسودة)'
                        : status === 'completed'
                        ? 'تـم الاعتماد (مكتمل)'
                        : 'مُلغـى / مؤجـل'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                أسماء المشاركين / أعضاء المجلس (مفصولين بفاصلة)
              </label>
              <input
                type="text"
                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="مثال: ميكولا لسينكو (رئيس)، أولغا بافليوك (أمين سر)، ..."
                value={
                  Array.isArray(editingItem?.participants)
                    ? editingItem.participants.join(', ')
                    : editingItem?.participants || ''
                }
                onChange={(e) => setEditingItem({ ...editingItem, participants: e.target.value })}
              />
            </div>
          </div>

          {/* Resolutions Block */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-600" />
              القرارات الرسمية والتوصيات
            </label>
            <div className="space-y-2 mb-3">
              {(editingItem?.resolutions || []).map((res: string, idx: number) => (
                <div key={idx} className="flex gap-2 items-center bg-white border border-slate-200 p-2 rounded-lg">
                  <span className="font-bold text-slate-400 bg-slate-100 w-6 h-6 flex items-center justify-center rounded-md shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    className="flex-1 outline-none text-sm font-medium"
                    value={res}
                    onChange={(e) => {
                      const newArray = [...editingItem.resolutions];
                      newArray[idx] = e.target.value;
                      setEditingItem({ ...editingItem, resolutions: newArray });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newArray = [...editingItem.resolutions];
                      newArray.splice(idx, 1);
                      setEditingItem({ ...editingItem, resolutions: newArray });
                    }}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 p-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="أضف قراراً جديداً..."
                value={newRes}
                onChange={(e) => setNewRes(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newRes.trim()) {
                      setEditingItem({
                        ...editingItem,
                        resolutions: [...(editingItem?.resolutions || []), newRes.trim()],
                      });
                      setNewRes('');
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (newRes.trim()) {
                    setEditingItem({
                      ...editingItem,
                      resolutions: [...(editingItem?.resolutions || []), newRes.trim()],
                    });
                    setNewRes('');
                  }
                }}
                className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-4 h-4" /> إدراج
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold shadow-md transition flex items-center gap-2"
            >
              <Save className="w-5 h-5" /> حفظ محضر الاجتماع
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
