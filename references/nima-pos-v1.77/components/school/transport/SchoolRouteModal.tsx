import React from 'react';
import { X, Bus } from 'lucide-react';
import { Student, Staff } from '../../../types';

interface SchoolRouteModalProps {
routeModalOpen: boolean;
setRouteModalOpen: (val: boolean) => void;
handleSaveRoute: (e: any) => void;
routeFormData: any;
setRouteFormData: (val: any) => void;
staff: Staff[];
}

export const SchoolRouteModal: React.FC<SchoolRouteModalProps> = (props) => {
   const { routeModalOpen, setRouteModalOpen, handleSaveRoute, routeFormData, setRouteFormData, staff } = props;
   if (!routeModalOpen) return null;
   return (
            <>
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                       <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                          <h3 className="text-xl font-black text-slate-800">{routeFormData.id ? 'تعديل المسار' : 'إضافة خط باص جديد'}</h3>
                          <button onClick={() => setRouteModalOpen(false)} className="text-slate-400 hover:text-rose-500 bg-white p-1 rounded-full"><X className="w-5 h-5"/></button>
                       </div>
                       <form onSubmit={handleSaveRoute} className="p-6 space-y-4 text-sm">
                           <div className="grid grid-cols-2 gap-4">
                               <div className="col-span-2">
                                   <label className="block text-sm font-bold text-slate-700 mb-2">اسم الخط / المنطقة</label>
                                   <input required type="text" value={routeFormData.name} onChange={e => setRouteFormData({...routeFormData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-colors" placeholder="مثال: خط المعادي، خط الهرم المشترك.." />
                               </div>
                               <div>
                                   <label className="block text-sm font-bold text-slate-700 mb-2">رقم المركبة</label>
                                   <input required type="text" value={routeFormData.busNumber} onChange={e => setRouteFormData({...routeFormData, busNumber: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                               </div>
                               <div>
                                   <label className="block text-sm font-bold text-slate-700 mb-2">السعة المقعدية</label>
                                   <input required type="number" min="1" value={routeFormData.capacity} onChange={e => setRouteFormData({...routeFormData, capacity: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                               </div>
                               <div>
                                   <label className="block text-sm font-bold text-slate-700 mb-2">السائق</label>
                                   <select value={routeFormData.driverId} onChange={e => setRouteFormData({...routeFormData, driverId: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none">
                                        <option value={0}>-- غير محدد --</option>
                                        {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                   </select>
                               </div>
                               <div>
                                   <label className="block text-sm font-bold text-slate-700 mb-2">المشرفة</label>
                                   <select value={routeFormData.supervisorId} onChange={e => setRouteFormData({...routeFormData, supervisorId: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none">
                                        <option value={0}>-- غير محدد --</option>
                                        {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                   </select>
                               </div>
                               <div>
                                   <label className="block text-sm font-bold text-slate-700 mb-2">تكلفة الاشتراك (شهرياً)</label>
                                   <input required type="number" min="0" value={routeFormData.monthlyCost} onChange={e => setRouteFormData({...routeFormData, monthlyCost: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none" />
                               </div>
                               <div>
                                   <label className="block text-sm font-bold text-slate-700 mb-2">الحالة</label>
                                   <select value={routeFormData.status} onChange={e => setRouteFormData({...routeFormData, status: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none">
                                        <option value="active">نشط (يعمل)</option>
                                        <option value="inactive">متوقف</option>
                                   </select>
                               </div>
                               <div className="col-span-2 mt-2">
                                   <label className="block text-sm font-bold text-slate-700 mb-2">نقاط التجمع الرئيسية</label>
                                   <textarea rows={2} value={routeFormData.stops} onChange={e => setRouteFormData({...routeFormData, stops: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-colors resizen-none" placeholder="اكتب مسار الركوب، مفصول بفاصلة..." />
                               </div>
                           </div>
                           <div className="pt-4 border-t border-slate-100 flex gap-3">
                               <button type="submit" className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-bold hover:bg-indigo-700">حفظ الخط</button>
                               <button type="button" onClick={() => setRouteModalOpen(false)} className="px-6 bg-slate-100 text-slate-700 p-3 rounded-xl font-bold hover:bg-slate-200">إلغاء</button>
                           </div>
                       </form>
                    </div>
                 </div>
            </>

            );
};
