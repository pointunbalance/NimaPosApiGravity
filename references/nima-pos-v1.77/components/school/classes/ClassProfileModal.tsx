import React from 'react';
import { X, BookOpen, User, Phone, MapPin, Printer, Star, Users, Calendar, AlertTriangle, ArrowRightLeft } from 'lucide-react';

export const ClassProfileModal = ({
  isClassProfileOpen, setIsClassProfileOpen, selectedClass, classStudents, selectedLevel,
  setTransferModalOpen, profileTab, setProfileTab
}: any) => {
  if (!isClassProfileOpen || !selectedClass) return null;

  return (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-3xl shadow-xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center">
                     <BookOpen className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">{selectedClass.name}</h2>
                    <p className="text-slate-500 font-medium">مستوى {selectedLevel?.name} • إشغال {classStudents.length}/{selectedClass.capacity}</p>
                  </div>
               </div>
               <button 
                 type="button"
                 onClick={() => setIsClassProfileOpen(false)} 
                 className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
               >
                 <X className="w-6 h-6" />
               </button>
             </div>
             
             <div className="flex flex-col md:flex-row flex-1 overflow-hidden h-[calc(100%-90px)]">
               {/* Sidebar Tabs */}
               <div className="w-full md:w-64 bg-slate-50 border-l border-slate-200 p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto shrink-0">
                  <button onClick={() => setProfileTab('info')} className={`whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${profileTab === 'info' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}>
                    <Star className="w-5 h-5" />بيانات الفصل
                  </button>
                  <button onClick={() => setProfileTab('students')} className={`whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${profileTab === 'students' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}>
                    <Users className="w-5 h-5" />قائمة الأطفال <span className="bg-black/10 px-2 rounded-full text-xs">{classStudents.length}</span>
                  </button>
                  <button onClick={() => setProfileTab('schedule')} className={`whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${profileTab === 'schedule' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}>
                    <Calendar className="w-5 h-5" />جدول الفصل
                  </button>
               </div>

               {/* Tab Content */}
               <div className="flex-1 p-6 overflow-y-auto bg-white custom-scrollbar">
                  {profileTab === 'info' && (
                     <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-2">
                              <h3 className="font-bold text-slate-500 mb-2">الطاقم المشرف</h3>
                              <div className="font-medium text-slate-800 text-lg"><strong>المعلمة (Teacher):</strong> {selectedClass.teacherName || 'غير محدد'}</div>
                              <div className="font-medium text-slate-800 text-lg"><strong>مساعدة (Nanny):</strong> {selectedClass.assistantName || 'غير محدد'}</div>
                           </div>
                           <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-2">
                              <h3 className="font-bold text-slate-500 mb-2">كثافة الفصل</h3>
                              <div className="font-medium text-slate-800 text-lg"><strong>العدد الحالي:</strong> {classStudents.length} أطفال</div>
                              <div className="font-medium text-slate-800 text-lg"><strong>السعة القصوى:</strong> {selectedClass.capacity} طفل</div>
                              {classStudents.length >= selectedClass.capacity && (
                                 <div className="mt-2 text-rose-600 font-bold flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> الفصل ممتلئ</div>
                              )}
                           </div>
                        </div>
                     </div>
                  )}

                  {profileTab === 'students' && (
                     <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                           <h3 className="text-xl font-black text-slate-800">قائمة الأطفال المسجلين بالفصل</h3>
                           <button 
                             onClick={() => {
                                 if(classStudents.length === 0) return alert('لا يوجد أطفال في هذا الفصل لنقلهم');
                                 setTransferModalOpen(true);
                             }}
                             className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl flex items-center gap-2 hover:bg-indigo-100"
                           >
                              <ArrowRightLeft className="w-4 h-4" /> نقل جماعي
                           </button>
                        </div>
                        {classStudents.length === 0 ? (
                           <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                             الفصل فارغ من الأطفال
                           </div>
                        ) : (
                           <div className="bg-white border text-sm border-slate-200 rounded-2xl overflow-hidden">
                              <table className="w-full text-right">
                                 <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                       <th className="p-4 font-bold text-slate-600">الكود</th>
                                       <th className="p-4 font-bold text-slate-600">الاسم</th>
                                       <th className="p-4 font-bold text-slate-600">الحالة</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100">
                                    {classStudents.map(stud => (
                                       <tr key={stud.id} className="hover:bg-slate-50">
                                          <td className="p-4 font-mono text-slate-600 font-bold">{stud.code}</td>
                                          <td className="p-4 font-bold text-slate-800">{stud.name}</td>
                                          <td className="p-4">
                                             <span className={`px-2 py-1 rounded text-xs font-bold ${stud.status === 'نشط' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                                {stud.status}
                                             </span>
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        )}
                     </div>
                  )}

                  {profileTab === 'schedule' && (
                     <div className="space-y-4 flex flex-col items-center justify-center p-8 text-slate-400">
                        <Calendar className="w-16 h-16 mb-4 text-slate-200" />
                        <h4 className="text-xl font-black text-slate-600">جدول الحصص والأنشطة</h4>
                        <p className="text-center font-medium max-w-md">إعداد جدول أسبوعي للفصل لتحديد فترات التعليم، الأنشطة، والوجبات. هذه الميزة قيد التطوير.</p>
                     </div>
                  )}

               </div>
               
             </div>
           </div>
         </div>
  );
};
