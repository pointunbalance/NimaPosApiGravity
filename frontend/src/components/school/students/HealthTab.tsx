import React from 'react';
import { Activity } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';

interface HealthTabProps {
  medicalForm: any;
  setMedicalForm: React.Dispatch<React.SetStateAction<any>>;
  handleSaveMedical: (e: React.FormEvent) => void;
  selectedChildId: number;
}

export const HealthTab: React.FC<HealthTabProps> = ({ medicalForm, setMedicalForm, handleSaveMedical, selectedChildId }) => {
  const healthLogs = useLiveQuery(() => db.healthLogs.where('studentId').equals(selectedChildId || 0).toArray()) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
       <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-rose-50 border-b border-slate-200 p-4 shrink-0 flex gap-3 items-center">
             <Activity className="w-6 h-6 text-rose-600" />
             <h3 className="text-xl font-black text-rose-800">الملف الطبي المتقدم</h3>
          </div>
          <div className="p-6">
             <form onSubmit={handleSaveMedical} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   <div className="col-span-full md:col-span-1 lg:col-span-1">
                      <label className="block text-sm font-bold text-slate-700 mb-2">فصيلة الدم</label>
                      <select value={medicalForm.bloodType} onChange={e => setMedicalForm({...medicalForm, bloodType: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-rose-500 outline-none font-bold text-slate-800">
                         <option value="">غير معروف</option>
                         <option value="A+">A+</option>
                         <option value="A-">A-</option>
                         <option value="B+">B+</option>
                         <option value="B-">B-</option>
                         <option value="O+">O+</option>
                         <option value="O-">O-</option>
                         <option value="AB+">AB+</option>
                         <option value="AB-">AB-</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">هل مسموح للحضانة بإعطاء دواء عند اللزوم؟</label>
                      <select value={medicalForm.allowNurseryToGiveMeds ? 'yes' : 'no'} onChange={e => setMedicalForm({...medicalForm, allowNurseryToGiveMeds: e.target.value === 'yes'})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-rose-500 outline-none font-bold text-slate-800">
                         <option value="no">لا، يمنع إعطاء دواء بدون إذن مباشر</option>
                         <option value="yes">نعم، مسموح</option>
                      </select>
                   </div>
                   <div className="col-span-1 border-r border-slate-100 pr-4 hidden lg:block"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">الحساسية من أكل معين</label>
                      <textarea value={medicalForm.foodAllergies} onChange={e => setMedicalForm({...medicalForm, foodAllergies: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-rose-500 outline-none font-medium resize-none text-slate-800 h-24" placeholder="مثال: الفول السوداني، الفراولة..." />
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">الحساسية من أدوية</label>
                      <textarea value={medicalForm.medicineAllergies} onChange={e => setMedicalForm({...medicalForm, medicineAllergies: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-rose-500 outline-none font-medium resize-none text-slate-800 h-24" placeholder="مثال: البنسلين..." />
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">أمراض مزمنة أو إصابات</label>
                      <textarea value={medicalForm.chronicDiseases} onChange={e => setMedicalForm({...medicalForm, chronicDiseases: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-rose-500 outline-none font-medium resize-none text-slate-800 h-24" placeholder="مثال: ربو (حساسية صدر)..." />
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">أدوية يومية يتناولها الطفل</label>
                      <textarea value={medicalForm.dailyMedications} onChange={e => setMedicalForm({...medicalForm, dailyMedications: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-rose-500 outline-none font-medium resize-none text-slate-800 h-24" placeholder="اسم الدواء ومواعيده إن وجدت..." />
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   <div className="lg:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات غذائية</label>
                      <input type="text" value={medicalForm.dietaryNotes} onChange={e => setMedicalForm({...medicalForm, dietaryNotes: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-rose-500 outline-none font-medium text-slate-800" placeholder="مثال: لا يشرب اللبن البقري..." />
                   </div>
                   <div className="lg:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-2">حالة نفسية أو سلوكية تحتاج ملاحظة/متابعة</label>
                      <input type="text" value={medicalForm.psychologicalOrBehavioralNotes} onChange={e => setMedicalForm({...medicalForm, psychologicalOrBehavioralNotes: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-rose-500 outline-none font-medium text-slate-800" placeholder="تأخر نطق، فرط حركة..." />
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">اسم الطبيب المتابع</label>
                      <input type="text" value={medicalForm.doctorName} onChange={e => setMedicalForm({...medicalForm, doctorName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-rose-500 outline-none font-bold text-slate-800" />
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">رقم الطبيب</label>
                      <input type="text" value={medicalForm.doctorPhone} onChange={e => setMedicalForm({...medicalForm, doctorPhone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-rose-500 outline-none font-mono text-slate-800" />
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">أقرب مستشفى مفضلة</label>
                      <input type="text" value={medicalForm.preferredHospital} onChange={e => setMedicalForm({...medicalForm, preferredHospital: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-rose-500 outline-none font-medium text-slate-800" />
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">رقم طوارئ إضافي</label>
                      <input type="text" value={medicalForm.extraEmergencyPhone} onChange={e => setMedicalForm({...medicalForm, extraEmergencyPhone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-rose-500 outline-none font-mono text-slate-800" />
                   </div>
                </div>
                <div className="border-t border-slate-100 pt-6 flex justify-end">
                   <button type="submit" className="bg-rose-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-rose-700 shadow-sm transition flex gap-2 items-center">
                      <Activity className="w-5 h-5" />
                      حفظ الملف الطبي
                   </button>
                </div>
             </form>
          </div>
       </div>

       <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mt-8">
          <Activity className="w-6 h-6 text-slate-400" />
          <h3 className="text-xl font-black text-slate-800">السجل الصحي وتنبيهات زيارات العيادة</h3>
       </div>
       <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-right text-sm">
             <thead className="bg-slate-50 border-b border-slate-200">
               <tr>
                  <th className="p-4 font-bold text-slate-600">التاريخ</th>
                  <th className="p-4 font-bold text-slate-600">التشخيص / الأعراض</th>
                  <th className="p-4 font-bold text-slate-600">الحرارة</th>
                  <th className="p-4 font-bold text-slate-600">الإجراء المتخذ</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {healthLogs.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-medium">لا توجد زيارات مسجلة للعيادة</td></tr>
               ) : (
                  healthLogs.map(log => (
                     <tr key={log.id} className="hover:bg-slate-50">
                       <td className="p-4 font-bold text-slate-800">{log.date}</td>
                       <td className="p-4 text-slate-700 font-medium">{log.reason}</td>
                       <td className="p-4 font-mono font-bold text-rose-500">{log.temperature || '-'}</td>
                       <td className="p-4 text-slate-600 font-medium">{log.action || '-'}</td>
                     </tr>
                  ))
               )}
             </tbody>
          </table>
       </div>
    </div>
  );
};
