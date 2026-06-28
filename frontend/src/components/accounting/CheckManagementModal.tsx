import React, { useRef } from 'react';
import { X, Save, ArrowDownLeft, AlertTriangle, Upload, Image as ImageIcon } from 'lucide-react';
import { BankCheck, Customer, Supplier } from '../../types';
import { compressImage } from '../../utils/imageCompression';

interface CheckManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingCheck: BankCheck | null;
  activeTab: 'receivable' | 'payable';
  formNumber: string;
  setFormNumber: (v: string) => void;
  formAmount: number | '';
  setFormAmount: (v: number | '') => void;
  formBank: string;
  setFormBank: (v: string) => void;
  formIssueDate: string;
  setFormIssueDate: (v: string) => void;
  formDueDate: string;
  setFormDueDate: (v: string) => void;
  formPayeeId: number | '';
  setFormPayeeId: (v: number | '') => void;
  formStatus: BankCheck['status'];
  setFormStatus: (v: BankCheck['status']) => void;
  formImage: string;
  setFormImage: (v: string) => void;
  customers?: Customer[];
  suppliers?: Supplier[];
}

const CheckManagementModal: React.FC<CheckManagementModalProps> = ({
  isOpen, onClose, onSave, editingCheck, activeTab,
  formNumber, setFormNumber, formAmount, setFormAmount,
  formBank, setFormBank, formIssueDate, setFormIssueDate,
  formDueDate, setFormDueDate, formPayeeId, setFormPayeeId,
  formStatus, setFormStatus, formImage, setFormImage, customers, suppliers
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file).then(result => setFormImage(result));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-slate-50">
          <h3 className="font-bold text-xl text-slate-800">{editingCheck ? 'تعديل شيك' : 'تسجيل شيك جديد'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5 text-gray-500"/></button>
        </div>
        
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">رقم الشيك</label>
              <input className="w-full border-2 border-slate-200 p-3 rounded-xl font-mono text-sm focus:border-indigo-500 outline-none font-bold bg-white " value={formNumber} onChange={e => setFormNumber(e.target.value)} placeholder="000000" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">المبلغ</label>
              <input type="number" onFocus={(e) => e.target.select()} className="w-full border-2 border-slate-200 p-3 rounded-xl font-mono text-sm focus:border-indigo-500 outline-none font-bold bg-white " value={formAmount} onChange={e => setFormAmount(Number(e.target.value))} placeholder="0.00" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">البنك المسحوب عليه</label>
            <input className="w-full border-2 border-slate-200 p-3 rounded-xl text-sm focus:border-indigo-500 outline-none font-bold bg-white " value={formBank} onChange={e => setFormBank(e.target.value)} placeholder="مثال: مصرف الرافدين" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{activeTab === 'receivable' ? 'العميل (المحرر)' : 'المورد (المستفيد)'}</label>
            <div className="relative">
              <select 
                className="w-full border-2 border-slate-200 p-3 rounded-xl text-sm focus:border-indigo-500 outline-none font-bold appearance-none bg-white "
                value={formPayeeId}
                onChange={e => setFormPayeeId(Number(e.target.value))}
              >
                <option value="">اختر...</option>
                {activeTab === 'receivable' 
                  ? customers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                  : suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                }
              </select>
              <ArrowDownLeft className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">تاريخ التحرير</label>
              <input type="date" className="w-full border-2 border-slate-200 p-3 rounded-xl text-sm focus:border-indigo-500 outline-none font-bold text-gray-600 bg-white [color-scheme:light]" value={formIssueDate} onChange={e => setFormIssueDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">تاريخ الاستحقاق</label>
              <input type="date" className="w-full border-2 border-slate-200 p-3 rounded-xl text-sm focus:border-indigo-500 outline-none font-bold text-gray-600 bg-white [color-scheme:light]" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">صورة الشيك (اختياري)</label>
            <div className="flex items-center gap-4">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
              >
                <Upload className="w-4 h-4" />
                رفع صورة
              </button>
              {formImage && (
                <div className="relative w-12 h-12 rounded-lg border border-slate-200 overflow-hidden group">
                  <img src={formImage} alt="Check" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setFormImage('')}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">الحالة الحالية</label>
            <select 
              className="w-full border-2 border-slate-200 p-3 rounded-xl text-sm focus:border-indigo-500 outline-none font-bold cursor-pointer bg-white "
              value={formStatus}
              onChange={e => setFormStatus(e.target.value as any)}
            >
              <option value="pending">تحت التحصيل / الانتظار</option>
              <option value="deposited">مودع في البنك</option>
              <option value="cleared">تم التحصيل / الصرف (مدفوع)</option>
              <option value="bounced">مرتجع (بدون رصيد)</option>
              <option value="returned">مسترد للعميل/المورد</option>
            </select>
            {formStatus === 'cleared' && (
              <div className="mt-2 p-3 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-2 text-xs text-orange-800">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p>تنبيه: عند الحفظ كـ "تم التحصيل"، سيقوم النظام بإنشاء قيد يومية آلي لإثبات العملية المالية.</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-white transition-colors">إلغاء</button>
          <button onClick={onSave} className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors flex items-center justify-center gap-2">
            <Save className="w-5 h-5" />
            حفظ الشيك
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckManagementModal;
