import React from 'react';

import { ArrowRightLeft } from 'lucide-react';

export const ClassTransferModal = ({
  transferModalOpen, setTransferModalOpen, executeTransfer, transferTargetClass, setTransferTargetClass, classesList, selectedClassId, selectedClass, classStudents, selectedStudentsToTransfer, handleSelectAllStudents, toggleStudentSelection, getLevelName, getClassStudentsCount
}: any) => {
  if (!transferModalOpen) return null;
  return (
      <>
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
               <div className="p-6 border-b border-slate-100">
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                     <ArrowRightLeft className="w-5 h-5 text-indigo-600" /> 
                     نقل جماعي للأطفال من {selectedClass?.name}
                  </h3>
               </div>
               <div className="p-6 space-y-4 h-[50vh] overflow-y-auto">
                  <p className="text-sm font-bold text-slate-500">اختر الأطفال المراد نقلهم لفصل آخر:</p>
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                     <input type="checkbox" onChange={handleSelectAllStudents} checked={selectedStudentsToTransfer.length === classStudents.length && classStudents.length > 0} className="w-5 h-5 rounded" id="selAll"/>
                     <label htmlFor="selAll" className="font-bold text-slate-800">تحديد الكل</label>
                  </div>
                  <div className="space-y-2">
                     {classStudents.map(s => (
                        <div key={s.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                           <input type="checkbox" id={`ts_${s.id}`} checked={selectedStudentsToTransfer.includes(s.id!)} onChange={() => toggleStudentSelection(s.id!)} className="w-5 h-5 rounded shadow-sm text-indigo-600" />
                           <label htmlFor={`ts_${s.id}`} className="font-bold cursor-pointer flex-1">{s.name}</label>
                        </div>
                     ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                     <label className="block text-sm font-bold text-slate-700 mb-2">الفصل الوجهة</label>
                     <select value={transferTargetClass} onChange={e => setTransferTargetClass(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none">
                        <option value="">-- اختر الفصل المتلقّي --</option>
                        {classesList.filter(c => c.id !== selectedClassId).map(c => (
                           <option key={c.id} value={c.id}>{c.name} ({getLevelName(c.levelId)}) - سعة {getClassStudentsCount(c.id!)}/{c.capacity}</option>
                        ))}
                     </select>
                  </div>
               </div>
               <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                  <button onClick={() => setTransferModalOpen(false)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold">إلغاء</button>
                  <button onClick={executeTransfer} disabled={selectedStudentsToTransfer.length === 0 || !transferTargetClass} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50">تأكيد النقل</button>
               </div>
            </div>
         </div>
      </>
  );
};
