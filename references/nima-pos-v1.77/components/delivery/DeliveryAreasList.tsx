import React, { useState } from 'react';
import { DeliveryArea } from '../../types';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useToast } from '../../context/ToastContext';
import { Plus, Edit2, Trash2, MapPin, Search } from 'lucide-react';
import DeliveryAreaModal from './DeliveryAreaModal';

export default function DeliveryAreasList({ searchQuery }: { searchQuery: string }) {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<DeliveryArea | undefined>(undefined);

  const areas = useLiveQuery(() => db.deliveryAreas.toArray()) || [];
  
  const filteredAreas = areas.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المنطقة؟')) {
      try {
        await db.deliveryAreas.delete(id);
        showToast('تم حذف المنطقة بنجاح', 'success');
      } catch (err) {
        showToast('حدث خطأ أثناء الحذف', 'error');
      }
    }
  };

  const handleEdit = (area: DeliveryArea) => {
    setSelectedArea(area);
    setIsModalOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
  };

  return (
    <div className="p-4 sm:p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">مناطق التوصيل</h2>
          <p className="text-sm text-slate-500">إدارة مناطق وقيم التوصيل وربطها مع العملاء</p>
        </div>
        <button 
          onClick={() => { setSelectedArea(undefined); setIsModalOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-md shadow-indigo-200 transition-all"
        >
          <Plus className="w-5 h-5" />
          إضافة منطقة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAreas.map(area => (
          <div key={area.id} className="bg-white border text-right border-slate-200 rounded-2xl p-5 hover:border-indigo-300 transition-all shadow-sm flex flex-col justify-between">
            <div>
               <div className="flex justify-between items-start mb-3">
                 <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
                    <MapPin className="w-6 h-6" />
                 </div>
                 <span className={`px-2 py-1 rounded-lg text-xs font-bold ${area.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                    {area.isActive ? 'نشط' : 'متوقف'}
                 </span>
               </div>
               <h3 className="font-bold text-slate-800 text-lg mb-1">{area.name}</h3>
               {area.notes && <p className="text-xs text-slate-500 line-clamp-2">{area.notes}</p>}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">رسوم التوصيل</span>
                <span className="font-black text-slate-800 tracking-tight">{formatCurrency(area.deliveryFee)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <button onClick={() => handleEdit(area)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(area.id!)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAreas.length === 0 && (
         <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mb-4 border border-slate-100">
              <MapPin className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">لا توجد مناطق</h3>
            <p className="text-slate-500">قم بإضافة منطقة توصيل للبدء في استخدامها مع طلبات العملاء</p>
         </div>
      )}

      {isModalOpen && (
        <DeliveryAreaModal area={selectedArea} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
