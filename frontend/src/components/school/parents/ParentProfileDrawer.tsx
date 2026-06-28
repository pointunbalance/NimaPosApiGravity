import React from 'react';
import { User, Users, CreditCard, MessageCircle, AlertTriangle, CalendarDays, FileText, Phone, MapPin, Briefcase, Plus, X } from 'lucide-react';
import { SchoolStudent } from '../../../types';

interface ParentProfileDrawerProps {
  selectedParent: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onClose: () => void;
  parentChildren: any[];
  parentPayments: any[];
  students: SchoolStudent[];
}

export const ParentProfileDrawer: React.FC<ParentProfileDrawerProps> = ({
  selectedParent, activeTab, setActiveTab, onClose, parentChildren, parentPayments, students
}) => {
  if (!selectedParent) return null;

  return (
    <>
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xl">
                    {selectedParent.name?.charAt(0) || <User />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">{selectedParent.name}</h2>
                    <span className="text-slate-500 text-sm font-medium">{selectedParent.relation || 'ولي الأمر'}</span>
                  </div>
               </div>
               <button onClick={() => onClose()} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors outline-none shrink-0">
                 <X className="w-6 h-6" />
               </button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden h-[calc(100%-80px)]">
                {/* Sidebar Tabs */}
               <div className="w-full md:w-64 bg-slate-50 border-l border-slate-200 p-4 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto shrink-0 custom-scrollbar">
                  <button onClick={() => setActiveTab('info')} className={`whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'info' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}>
                    <User className="w-5 h-5" />البيانات الأساسية
                  </button>
                  <button onClick={() => setActiveTab('children')} className={`whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'children' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}>
                    <Users className="w-5 h-5" />الأبناء المرتبطين
                  </button>
                  <button onClick={() => setActiveTab('payments')} className={`whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'payments' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}>
                    <CreditCard className="w-5 h-5" />مدفوعات الأسرة
                  </button>
                  <button onClick={() => setActiveTab('messages')} className={`whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'messages' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}>
                    <MessageCircle className="w-5 h-5" />سجل التواصل
                  </button>
                  <button onClick={() => setActiveTab('complaints')} className={`whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'complaints' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-600 hover:bg-rose-50 hover:text-rose-700'}`}>
                    <AlertTriangle className="w-5 h-5" />سجل الشكاوى
                  </button>
                  <button onClick={() => setActiveTab('meetings')} className={`whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'meetings' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'}`}>
                    <CalendarDays className="w-5 h-5" />سجل الاجتماعات
                  </button>
                  <button onClick={() => setActiveTab('notes')} className={`whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'notes' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}>
                    <FileText className="w-5 h-5" />ملاحظات خاصة
                  </button>
               </div>

               {/* Content Area */}
               <div className="flex-1 p-6 overflow-y-auto bg-white custom-scrollbar">
                  
                  {activeTab === 'info' && (
                     <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-4">
                              <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2">التواصل الأساسي</h3>
                              <div className="flex items-start gap-3 text-slate-700"><Phone className="w-5 h-5 text-brand-500 mt-0.5"/> <div><p className="text-sm text-slate-500">الجوال المعتمد</p><p className="font-mono font-bold" dir="ltr">{selectedParent.primaryPhone || '-'}</p></div></div>
                              <div className="flex items-start gap-3 text-slate-700"><MessageCircle className="w-5 h-5 text-emerald-500 mt-0.5"/> <div><p className="text-sm text-slate-500">واتساب</p><p className="font-mono font-bold" dir="ltr">{selectedParent.whatsappPhone || '-'}</p></div></div>
                              {selectedParent.whatsappPhone2 && <div className="flex items-start gap-3 text-slate-700"><MessageCircle className="w-5 h-5 text-emerald-500 mt-0.5"/> <div><p className="text-sm text-slate-500">واتساب بديل</p><p className="font-mono font-bold" dir="ltr">{selectedParent.whatsappPhone2}</p></div></div>}
                              <div className="flex items-start gap-3 text-slate-700"><Phone className="w-5 h-5 text-slate-400 mt-0.5"/> <div><p className="text-sm text-slate-500">رقم احتياطي للمكالمات</p><p className="font-mono font-bold" dir="ltr">{selectedParent.secondaryPhone || '-'}</p></div></div>
                              <div className="mt-2 text-sm">
                                  <span className={`px-2 py-1 rounded-md font-bold ${selectedParent.communicationStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : selectedParent.communicationStatus === 'no-reply' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                     حالة التواصل: {selectedParent.communicationStatus === 'active' ? 'فعال ويرد سريعاً' : selectedParent.communicationStatus === 'no-reply' ? 'يتأخر في الرد / لا يرد غالباً' : 'رقم غير صحيح أو مغلق'}
                                  </span>
                              </div>
                           </div>

                           <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-4">
                              <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2">بيانات عامة</h3>
                              <div className="flex items-start gap-3 text-slate-700"><MapPin className="w-5 h-5 text-brand-500 mt-0.5"/> <div><p className="text-sm text-slate-500">العنوان</p><p className="font-medium">{selectedParent.address || 'غير محدد'}</p></div></div>
                              <div className="flex items-start gap-3 text-slate-700"><Briefcase className="w-5 h-5 text-brand-500 mt-0.5"/> <div><p className="text-sm text-slate-500">جهة العمل / الوظيفة</p><p className="font-medium">{selectedParent.job || 'غير محدد'}</p></div></div>
                              <div className="flex items-start gap-3 text-slate-700"><User className="w-5 h-5 text-brand-500 mt-0.5"/> <div><p className="text-sm text-slate-500">الرقم القومي</p><p className="font-mono font-bold">{selectedParent.nationalId || '-'}</p></div></div>
                           </div>
                        </div>
                        
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mt-6">
                           <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">صلاحيات وأدوار ولي الأمر</h3>
                           <div className="flex flex-wrap gap-2 text-sm font-bold">
                              <span className={`px-3 py-1.5 rounded-full border ${selectedParent.isPrimary ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-slate-50 border-slate-200 text-slate-400 line-through'}`}>ولي الأمر الأساسي</span>
                              <span className={`px-3 py-1.5 rounded-full border ${selectedParent.isFinancialResponsible ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-400 line-through'}`}>مسؤول الدفع المالي</span>
                              <span className={`px-3 py-1.5 rounded-full border ${selectedParent.isPickupResponsible ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400 line-through'}`}>مسؤول الاستلام المنتظم</span>
                              <span className={`px-3 py-1.5 rounded-full border ${selectedParent.isAllowedToPickup !== false ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-rose-50 border-rose-200 text-rose-700 line-through'}`}>مصرح له بالاستلام</span>
                              <span className={`px-3 py-1.5 rounded-full border ${selectedParent.isAllowedToSeeFinancials ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-400 line-through'}`}>رؤية الحسابات</span>
                              <span className={`px-3 py-1.5 rounded-full border ${selectedParent.isAllowedToReceiveNotifications !== false ? 'bg-violet-50 border-violet-200 text-violet-700' : 'bg-slate-50 border-slate-200 text-slate-400 line-through'}`}>استقبال الإشعارات</span>
                           </div>
                        </div>

                        {selectedParent.adminNotes && (
                           <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 mt-6">
                              <h3 className="flex items-center gap-2 font-bold text-rose-800 border-b border-rose-100 pb-2 mb-3"><AlertTriangle className="w-5 h-5"/> ملاحظات الإدارة الجوهرية</h3>
                              <p className="text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">{selectedParent.adminNotes}</p>
                           </div>
                        )}
                     </div>
                  )}

                  {activeTab === 'children' && (
                     <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
                           <Users className="w-6 h-6 text-brand-600" />
                           <h3 className="text-xl font-black text-slate-800">الأبناء المسجلين باسم ولي الأمر</h3>
                        </div>
                        {parentChildren.length === 0 ? (
                           <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-bold">لا يوجد أبناء مرتبطين بولي الأمر حالياً. يمكنك ربط هذا الولي من صفحة (إدارة الأطفال).</div>
                        ) : (
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {parentChildren.map((child: any) => (
                                 <div key={child.id} className="bg-white border text-center border-slate-200 p-4 rounded-2xl shadow-sm">
                                    <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-lg mb-2">{child.name?.charAt(0) || '?'}</div>
                                    <h4 className="font-bold text-slate-800">{child.name}</h4>
                                    <p className="text-sm text-slate-500 font-mono mt-1 mb-3">{child.code || 'بدون كود'}</p>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${child.status === 'نشط' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{child.status}</span>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  )}

                  {activeTab === 'payments' && (
                     <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
                           <CreditCard className="w-6 h-6 text-brand-600" />
                           <h3 className="text-xl font-black text-slate-800">سجل المدفوعات المتعلقة بجميع أبناء الأسرة</h3>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                           <table className="w-full text-right text-sm">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                                 <tr>
                                    <th className="px-4 py-3">التاريخ</th>
                                    <th className="px-4 py-3">الطفل</th>
                                    <th className="px-4 py-3">البند</th>
                                    <th className="px-4 py-3">المبلغ</th>
                                    <th className="px-4 py-3">الحالة</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                 {parentPayments.length === 0 ? (
                                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">لا توجد مدفوعات مسجلة</td></tr>
                                 ) : (
                                    parentPayments.map((p: any) => (
                                       <tr key={p.id}>
                                          <td className="px-4 py-3 font-mono text-slate-600">{p.date}</td>
                                          <td className="px-4 py-3 font-bold text-slate-800">{students.find(s => s.id === p.studentId)?.name || 'غير معروف'}</td>
                                          <td className="px-4 py-3 text-slate-700 font-medium">{p.type}</td>
                                          <td className="px-4 py-3 font-mono font-bold text-emerald-600">{p.amount} ج.م</td>
                                          <td className="px-4 py-3"><span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-bold whitespace-nowrap">مسدد</span></td>
                                       </tr>
                                    ))
                                 )}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  )}

                  {activeTab === 'messages' && (
                     <div className="space-y-4 animate-in fade-in duration-300 flex flex-col items-center justify-center h-full text-slate-400">
                         <MessageCircle className="w-20 h-20 text-slate-200 mb-4" />
                         <h4 className="text-xl font-bold text-slate-600">سجل إشعارات ولي الأمر</h4>
                         <p className="text-center max-w-md">أداة المراسلة والإشعارات لولي الأمر قيد التطوير وسيتم ربطها بـ WhatsApp و SMS لاحقاً.</p>
                     </div>
                  )}

                  {activeTab === 'complaints' && (
                     <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                           <div className="flex items-center gap-3">
                              <AlertTriangle className="w-6 h-6 text-rose-600" />
                              <h3 className="text-xl font-black text-slate-800">سجل شكاوى وملاحظات ولي الأمر</h3>
                           </div>
                           <button onClick={() => alert('إضافة شكوى (قيد التطوير)')} className="flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-rose-100 transition-colors">
                              <Plus className="w-4 h-4" /> إضافة شكوى
                           </button>
                        </div>
                        
                        {(selectedParent.complaints && selectedParent.complaints.length > 0) ? (
                           <div className="space-y-3">
                              {selectedParent.complaints.map((c: any, index: number) => (
                                 <div key={index} className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col gap-2 relative">
                                    <div className="flex justify-between items-start">
                                       <h4 className="font-bold text-lg text-slate-800">{c.title}</h4>
                                       <span className={`px-2 py-1 rounded text-xs font-bold ${c.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                          {c.status === 'resolved' ? 'تم الحل' : 'قيد المتابعة'}
                                       </span>
                                    </div>
                                    <div className="text-sm font-mono text-slate-500">{c.date}</div>
                                    <p className="text-slate-700 font-medium">{c.notes}</p>
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-slate-400">
                               <AlertTriangle className="w-12 h-12 text-slate-300 mb-3" />
                               <p className="font-bold">لا توجد شكاوى مسجلة لولي الأمر في النظام.</p>
                           </div>
                        )}
                     </div>
                  )}

                  {activeTab === 'meetings' && (
                     <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                           <div className="flex items-center gap-3">
                              <CalendarDays className="w-6 h-6 text-indigo-600" />
                              <h3 className="text-xl font-black text-slate-800">سجل اجتماعات ولي الأمر</h3>
                           </div>
                           <button onClick={() => alert('جدولة اجتماع (قيد التطوير)')} className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors">
                              <Plus className="w-4 h-4" /> جدولة اجتماع
                           </button>
                        </div>
                        
                        {(selectedParent.meetings && selectedParent.meetings.length > 0) ? (
                           <div className="space-y-3">
                              {selectedParent.meetings.map((m: any, index: number) => (
                                 <div key={index} className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col gap-2 relative">
                                    <div className="flex justify-between items-start">
                                       <h4 className="font-bold text-lg text-slate-800">{m.title}</h4>
                                       <span className={`px-2 py-1 rounded text-xs font-bold ${m.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : m.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                                          {m.status === 'completed' ? 'منعقد' : m.status === 'cancelled' ? 'ملغي' : 'مجدول'}
                                       </span>
                                    </div>
                                    <div className="text-sm font-mono text-slate-500">{m.date}</div>
                                    <p className="text-slate-700 font-medium">{m.notes}</p>
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-slate-400">
                               <CalendarDays className="w-12 h-12 text-slate-300 mb-3" />
                               <p className="font-bold">لا توجد اجتماعات مجدولة أو سابقة مع ولي الأمر.</p>
                           </div>
                        )}
                     </div>
                  )}

                  {activeTab === 'notes' && (
                     <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
                           <FileText className="w-6 h-6 text-brand-600" />
                           <h3 className="text-xl font-black text-slate-800">ملاحظات الإدارة حول ولي الأمر</h3>
                        </div>
                        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                           <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                              {selectedParent.notes || 'لا توجد ملاحظات خاصة مسجلة لهذا الولي.'}
                           </p>
                        </div>
                     </div>
                  )}

               </div>
            </div>

          </div>
        </div>
    </>
  );
};
