import React, { useRef } from 'react';
import { FolderOpen, X, CheckCircle, Upload, Trash2, Save } from 'lucide-react';
import { LegalDocument } from '../../types';
import { format } from 'date-fns';
import { compressImage } from '../../utils/imageCompression';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDoc: Partial<LegalDocument> | null;
  setEditingDoc: React.Dispatch<React.SetStateAction<Partial<LegalDocument> | null>>;
  onSave: (e: React.FormEvent) => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  editingDoc,
  setEditingDoc,
  onSave,
  success,
  error
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !editingDoc) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingDoc) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        error('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت.');
        return;
      }

      compressImage(file).then((result) => {
        setEditingDoc({
          ...editingDoc,
          fileData: result,
          fileName: file.name,
          fileType: file.type,
          fileSize: (file.size / 1024).toFixed(2) + ' KB'
        });
        success('تم رفع الملف في الذاكرة بنجاح');
      }).catch(err => {
        console.error(err);
        error('حدث خطأ أثناء معالجة الملف');
      });
    }
  };

  const clearFile = () => {
    if (editingDoc) {
      setEditingDoc({
        ...editingDoc,
        fileData: undefined,
        fileName: undefined,
        fileType: undefined,
        fileSize: undefined
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-indigo-600" />
            {editingDoc.id ? 'تعديل المستند' : 'أرشفة مستند جديد'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="document-form" onSubmit={onSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">اسم المستند *</label>
                <input
                  required
                  type="text"
                  value={editingDoc.title || ''}
                  onChange={e => setEditingDoc({ ...editingDoc, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="مثال: السجل التجاري للشركة"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">نوع المستند *</label>
                <select
                  value={editingDoc.type || 'other'}
                  onChange={e => setEditingDoc({ ...editingDoc, type: e.target.value as any })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                >
                  <option value="commercial_register">سجل تجاري</option>
                  <option value="tax_card">بطاقة ضريبية</option>
                  <option value="license">ترخيص</option>
                  <option value="id_card">هوية شخصية</option>
                  <option value="contract">عقد</option>
                  <option value="insurance font-medium">وثيقة تأمين</option>
                  <option value="other">أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">يخص (الكيان) *</label>
                <select
                  value={editingDoc.entityType || 'company'}
                  onChange={e => setEditingDoc({ ...editingDoc, entityType: e.target.value as any })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                >
                  <option value="company">الشركة</option>
                  <option value="employee">موظف</option>
                  <option value="supplier">مورد</option>
                  <option value="customer">عميل</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">اسم الجهة / الشخص *</label>
                <input
                  required
                  type="text"
                  value={editingDoc.entityName || ''}
                  onChange={e => setEditingDoc({ ...editingDoc, entityName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="اسم الموظف، العميل، أو 'الشركة الرئيسية'"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">تاريخ الإصدار / الرفع *</label>
                <input
                  required
                  type="date"
                  value={editingDoc.uploadDate ? format(new Date(editingDoc.uploadDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')}
                  onChange={e => setEditingDoc({ ...editingDoc, uploadDate: new Date(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">تاريخ الانتهاء (اختياري)</label>
                <input
                  type="date"
                  value={editingDoc.expiryDate ? format(new Date(editingDoc.expiryDate), 'yyyy-MM-dd') : ''}
                  onChange={e => setEditingDoc({ ...editingDoc, expiryDate: e.target.value ? new Date(e.target.value) : undefined })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <p className="text-xs text-slate-500 mt-1">اتركه فارغاً إذا كان المستند صالحاً دائماً</p>
              </div>

              <div className="md:col-span-2 pt-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">تحميل أو إرفاق المستند</label>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex-1">
                    <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${editingDoc.fileData ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {editingDoc.fileData ? (
                          <div className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle size={20} />
                            <span className="text-sm font-medium">تم إرفاق الملف: {editingDoc.fileName} ({editingDoc.fileSize})</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 mb-2 text-indigo-500" />
                            <p className="mb-1 text-sm text-slate-500"><span className="font-semibold text-indigo-600">اضغط لرفع الملف</span></p>
                            <p className="text-xs text-slate-400">PDF, JPG, PNG (بحد أقصى 5MB)</p>
                          </>
                        )}
                      </div>
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                  
                  {editingDoc.fileData && (
                    <button
                      type="button"
                      onClick={clearFile}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors rounded-lg font-medium whitespace-nowrap"
                    >
                      <Trash2 size={16} />
                      إزالة
                    </button>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">رابط إضافي أو خارجي للملف (URL)</label>
                <input
                  type="url"
                  value={editingDoc.fileUrl || ''}
                  onChange={e => setEditingDoc({ ...editingDoc, fileUrl: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="https://... (اختياري إذا تم رفع الملف مباشرة)"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">ملاحظات</label>
                <textarea
                  value={editingDoc.notes || ''}
                  onChange={e => setEditingDoc({ ...editingDoc, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                  placeholder="أي ملاحظات إضافية حول المستند..."
                  rows={3}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors font-medium"
          >
            إلغاء
          </button>
          <button
            type="submit"
            form="document-form"
            className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors font-medium flex items-center gap-2 shadow-sm"
          >
            <Save size={20} />
            حفظ المستند
          </button>
        </div>
      </div>
    </div>
  );
};
