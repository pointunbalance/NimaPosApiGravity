import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, FileSignature, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const SchoolContracts = () => {
   const { success, error: toastError } = useToast();
   const [search, setSearch] = useState('');
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
   const [activeTab, setActiveTab] = useState<'all' | 'signed' | 'unsigned' | 'expired'>('all');

   const [isConfirmOpen, setIsConfirmOpen] = useState(false);
   const [confirmConfig, setConfirmConfig] = useState<{
     title: string;
     message: string;
     onConfirm: () => void;
   }>({ title: '', message: '', onConfirm: () => {} });

   const triggerConfirmation = (title: string, message: string, onConfirm: () => void) => {
     setConfirmConfig({ title, message, onConfirm });
     setIsConfirmOpen(true);
   };

   const [formData, setFormData] = useState({
       studentId: '',
       guardianId: '',
       type: 'التحاق الطفل',
       signedDate: '',
       status: 'unsigned',
       notes: '',
       attachment: ''
   });

   const contractTypes = [
       "عقد التحاق الطفل",
       "موافقة التصوير",
       "موافقة الرحلات",
       "موافقة إعطاء الدواء",
       "موافقة استلام شخص بديل",
       "موافقة استخدام الباص",
       "تعهد ولي الأمر بسداد المصروفات",
       "سياسة الانسحاب والاسترداد",
       "سياسة الغياب والتأخير"
   ];

   const contracts = useLiveQuery(() => db.schoolContracts.toArray()) || [];
   const students = useLiveQuery(() => db.schoolStudents.toArray()) || [];
   const guardians = useLiveQuery(() => db.guardians.toArray()) || [];

   const filteredContracts = contracts.filter((c: any) => {
       const student = students.find(s => s.id === c.studentId)?.name || '';
       const matchSearch = student.includes(search) || c.type.includes(search);
       if (activeTab === 'all') return matchSearch;
       return matchSearch && c.status === activeTab;
   });

   const handleOpenModal = (c: any = null) => {
       if (c) {
           setSelectedContractId(c.id);
           setFormData({
               studentId: String(c.studentId || ''),
               guardianId: String(c.guardianId || ''),
               type: c.type || 'عقد التحاق الطفل',
               signedDate: c.signedDate || '',
               status: c.status || 'unsigned',
               notes: c.notes || '',
               attachment: c.attachment || ''
           });
       } else {
           setSelectedContractId(null);
           setFormData({
               studentId: '',
               guardianId: '',
               type: 'عقد التحاق الطفل',
               signedDate: '',
               status: 'unsigned',
               notes: '',
               attachment: ''
           });
       }
       setIsModalOpen(true);
   };

   const handleSave = async (e: React.FormEvent) => {
       e.preventDefault();
       try {
           const payload = {
               studentId: Number(formData.studentId),
               guardianId: Number(formData.guardianId),
               type: formData.type,
               signedDate: formData.signedDate,
               status: formData.status,
               notes: formData.notes,
               attachment: formData.attachment
           };

           if (selectedContractId) {
               await db.schoolContracts.update(selectedContractId, payload);
               success("تم تحديث بيانات التعاقد بنجاح");
           } else {
               await db.schoolContracts.add(payload);
               success("تم إضافة العقد بنجاح");
           }
           setIsModalOpen(false);
       } catch (err) {
           console.error(err);
           toastError("حدث خطأ أثناء حفظ العقد");
       }
   };

   const handleDelete = (id: number) => {
       triggerConfirmation("تأكيد الحذف", "هل أنت متأكد من حذف هذا العقد/الموافقة؟", async () => {
           try {
               await db.schoolContracts.delete(id);
               success("تم حذف العقد بنجاح");
           } catch (err) {
               toastError("فشل حذف العقد");
           }
       });
   };

   return (
       <div className="p-6">
           <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-3">
                   <div className="bg-indigo-100 p-2 rounded-lg">
                       <FileSignature className="w-6 h-6 text-indigo-600" />
                   </div>
                   <h1 className="text-2xl font-black text-slate-800">العقود والموافقات</h1>
               </div>
               <button onClick={() => handleOpenModal()} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 font-bold transition-colors">
                   <Plus className="w-4 h-4" /> إضافة عقد / موافقة
               </button>
           </div>

           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center">
                   <div className="relative w-full md:w-96">
                       <Search className="absolute right-3 top-2.5 text-slate-400 w-5 h-5"/>
                       <input 
                           type="text"
                           placeholder="ابحث باسم الطالب أو نوع العقد..."
                           value={search}
                           onChange={(e) => setSearch(e.target.value)}
                           className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                       />
                   </div>
                   <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                       <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${activeTab === 'all' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>الكل</button>
                       <button onClick={() => setActiveTab('signed')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${activeTab === 'signed' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>موقعة</button>
                       <button onClick={() => setActiveTab('unsigned')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${activeTab === 'unsigned' ? 'bg-amber-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>غير موقعة</button>
                       <button onClick={() => setActiveTab('expired')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${activeTab === 'expired' ? 'bg-rose-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>منتهية</button>
                   </div>
               </div>

               <div className="overflow-x-auto">
                   <table className="w-full text-right">
                       <thead className="bg-slate-50 border-b border-slate-200">
                           <tr className="text-slate-500 text-sm">
                               <th className="p-4 font-bold">الطفل</th>
                               <th className="p-4 font-bold">ولي الأمر</th>
                               <th className="p-4 font-bold">النوع</th>
                               <th className="p-4 font-bold">تاريخ التوقيع</th>
                               <th className="p-4 font-bold">الحالة</th>
                               <th className="p-4 font-bold">إجراءات</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                           {filteredContracts.length === 0 ? (
                               <tr><td colSpan={6} className="text-center p-8 text-slate-500 font-bold">لا توجد عقود</td></tr>
                           ) : (
                               filteredContracts.map((c: any) => (
                                   <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                       <td className="p-4 font-bold text-slate-800">{students.find(s=>s.id === c.studentId)?.name || 'غير محدد'}</td>
                                       <td className="p-4 font-bold text-slate-600">{guardians.find(g=>g.id === c.guardianId)?.name || 'غير محدد'}</td>
                                       <td className="p-4 font-bold text-indigo-700">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4" /> {c.type}
                                            </div>
                                       </td>
                                       <td className="p-4 font-mono text-sm text-slate-500">{c.signedDate || '-'}</td>
                                       <td className="p-4">
                                           {c.status === 'signed' ? <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3" /> موقعة</span> :
                                            c.status === 'expired' ? <span className="bg-rose-50 text-rose-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-max"><XCircle className="w-3 h-3" /> منتهية</span> :
                                            <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-max"><Clock className="w-3 h-3" /> غير موقعة</span>}
                                       </td>
                                       <td className="p-4">
                                           <div className="flex gap-2">
                                               <button onClick={() => handleOpenModal(c)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                               <button onClick={() => handleDelete(c.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                           </div>
                                       </td>
                                   </tr>
                               ))
                           )}
                       </tbody>
                   </table>
               </div>
           </div>

           {isModalOpen && (
               <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                   <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
                       <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                           <h2 className="text-xl font-black text-slate-800">{selectedContractId ? 'تعديل عقد / موافقة' : 'إضافة عقد / موافقة'}</h2>
                           <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                               <X className="w-5 h-5" />
                           </button>
                       </div>
                       
                       <form onSubmit={handleSave} className="p-6">
                           <div className="space-y-4">
                               <div>
                                   <label className="block text-sm font-bold text-slate-700 mb-2">نوع الموافقة</label>
                                   <select required value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50">
                                       {contractTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                       <option value="other">أخرى...</option>
                                   </select>
                               </div>

                               <div>
                                   <label className="block text-sm font-bold text-slate-700 mb-2">الطالب</label>
                                   <select required value={formData.studentId} onChange={(e) => {
                                        const sid = e.target.value;
                                        const s = students.find(s=>s.id === Number(sid));
                                        setFormData({...formData, studentId: sid, guardianId: s?.guardianId ? String(s.guardianId) : ''});
                                   }} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50">
                                       <option value="">اختر الطالب...</option>
                                       {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                   </select>
                               </div>

                               <div>
                                   <label className="block text-sm font-bold text-slate-700 mb-2">ولي الأمر (الموقع)</label>
                                   <select value={formData.guardianId} onChange={(e) => setFormData({...formData, guardianId: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50">
                                       <option value="">اختر ولي الأمر...</option>
                                       {guardians.map(g => <option key={g.id} value={g.id}>{g.name} - {g.relation}</option>)}
                                   </select>
                               </div>

                               <div className="grid grid-cols-2 gap-4">
                                   <div>
                                       <label className="block text-sm font-bold text-slate-700 mb-2">الحالة</label>
                                       <select required value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-bold">
                                           <option value="unsigned">غير موقعة ⏳</option>
                                           <option value="signed">موقعة ✅</option>
                                           <option value="expired">منتهية ❌</option>
                                       </select>
                                   </div>
                                   <div>
                                       <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ التوقيع</label>
                                       <input type="date" value={formData.signedDate} onChange={(e) => setFormData({...formData, signedDate: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" />
                                   </div>
                               </div>

                               <div>
                                   <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات / شروط إضافية</label>
                                   <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 resize-none font-medium text-sm" placeholder="أي ملاحظات حول هذا التعاقد..."></textarea>
                               </div>
                           </div>

                           <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-slate-100">
                               <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors">إلغاء</button>
                               <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md">{selectedContractId ? 'حفظ التعديلات' : 'إضافة العقد'}</button>
                           </div>
                       </form>
                   </div>
               </div>
           )}

           <ConfirmModal
               isOpen={isConfirmOpen}
               title={confirmConfig.title}
               message={confirmConfig.message}
               onConfirm={confirmConfig.onConfirm}
               onCancel={() => setIsConfirmOpen(false)}
           />
       </div>
   );
};

export default SchoolContracts;
