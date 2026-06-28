import React from 'react';
import { Users, Trash2, Plus } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';

interface PickupsTabProps {
  selectedChildId: number;
  newPickup: any;
  setNewPickup: React.Dispatch<React.SetStateAction<any>>;
  handleAddPickup: (e: React.FormEvent) => void;
  handleRemovePickup: (id: number) => void;
}

export const PickupsTab: React.FC<PickupsTabProps> = ({ selectedChildId, newPickup, setNewPickup, handleAddPickup, handleRemovePickup }) => {
  const myPickups = useLiveQuery(() => {
    if (!selectedChildId) return [];
    return db.authorizedPickups.where('studentId').equals(selectedChildId).toArray();
  }, [selectedChildId]) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
       <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <Users className="w-6 h-6 text-brand-600" />
          <h3 className="text-xl font-black text-slate-800">الأشخاص المصرّح لهم بالاستلام</h3>
       </div>
       <p className="text-slate-500">قائمة بالأشخاص الذين يحق لهم استلام الطفل من الحضانة بخلاف ولي الأمر الأساسي.</p>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myPickups.map(p => (
             <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex justify-between items-center group hover:border-brand-300 transition-colors">
                <div>
                   <p className="font-bold text-slate-800">{p.name}</p>
                   <p className="font-mono text-slate-500 mt-1 text-sm">{p.phone}</p>
                </div>
                <button onClick={() => handleRemovePickup(p.id!)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                   <Trash2 className="w-5 h-5" />
                </button>
             </div>
          ))}

          {myPickups.length === 0 && (
             <div className="col-span-full p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <p className="text-slate-500 font-bold">لا يوجد أشخاص مصرح لهم. ولي الأمر فقط من يحق له الاستلام.</p>
             </div>
          )}
       </div>

       <form onSubmit={handleAddPickup} className="bg-white border-2 border-brand-50 p-6 rounded-2xl mt-8 shadow-sm">
          <h4 className="font-black text-slate-800 mb-4">إضافة شخص مصرح له بالاستلام</h4>
          <div className="flex flex-col md:flex-row gap-4">
             <input required type="text" value={newPickup.name} onChange={e => setNewPickup({...newPickup, name: e.target.value})} placeholder="الاسم بالكامل (مثال: عم الطفل - ميكولا لسينكو)" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-bold"/>
             <input required type="text" value={newPickup.phone} onChange={e => setNewPickup({...newPickup, phone: e.target.value})} placeholder="رقم الجوال الخاص به" className="md:w-64 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-mono" dir="ltr" />
             <button type="submit" className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-700 shadow-sm shrink-0">
                <Plus className="w-5 h-5"/>
                إضافة
             </button>
          </div>
       </form>
    </div>
  );
};
