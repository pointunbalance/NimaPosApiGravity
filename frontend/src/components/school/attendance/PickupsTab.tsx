import React from 'react';
import { Plus, UserCheck, Edit2, Trash2 } from 'lucide-react';

interface PickupsTabProps {
  allPickups: any[];
  setPickupFormData: (data: any) => void;
  setPickupModalOpen: (open: boolean) => void;
  handleDeletePickup: (id: number) => void;
  getStudentName: (id: number) => string;
}

export const PickupsTab: React.FC<PickupsTabProps> = ({
  allPickups,
  setPickupFormData,
  setPickupModalOpen,
  handleDeletePickup,
  getStudentName,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">الأشخاص المفوضين باستلام الأطفال</h2>
        <button
          onClick={() => {
            setPickupFormData({
              studentId: 0,
              name: '',
              relation: '',
              phone: '',
              nationalId: '',
              isAllowed: true,
              notes: '',
            });
            setPickupModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-md"
        >
          <Plus className="w-4 h-4" /> إضافة شخص مفوض
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {allPickups.map((pickup) => (
          <div
            key={pickup.id}
            className="bg-white border text-sm border-slate-200 p-5 rounded-2xl shadow-sm hover:border-indigo-200 transition-colors flex gap-4 items-start relative"
          >
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-6 h-6 text-slate-400" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <h3 className="font-black text-slate-800 text-lg">{pickup.name}</h3>
                {!pickup.isAllowed && (
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded">
                    ممنوع من الاستلام
                  </span>
                )}
              </div>
              <p className="font-bold text-indigo-600 text-xs mt-1">
                الطفل: {getStudentName(pickup.studentId)}
              </p>
              <div className="mt-3 space-y-1 text-slate-600 text-xs font-medium">
                <p>
                  صلة القرابة: <span className="font-bold">{pickup.relation}</span>
                </p>
                <p>
                  رقم الهاتف:{' '}
                  <span className="font-mono" dir="ltr">
                    {pickup.phone}
                  </span>
                </p>
                {pickup.nationalId && (
                  <p>
                    الرقم القومي: <span className="font-mono">{pickup.nationalId}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="absolute top-4 left-4 flex gap-1">
              <button
                onClick={() => {
                  setPickupFormData(pickup);
                  setPickupModalOpen(true);
                }}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleDeletePickup(pickup.id!)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        {allPickups.length === 0 && (
          <div className="col-span-3 text-center p-12 text-slate-500 font-bold border-2 border-dashed border-slate-100 rounded-2xl">
            لم يتم إضافة أي أشخاص مفوضين بالاستلام بعد.
          </div>
        )}
      </div>
    </div>
  );
};
export default PickupsTab;
