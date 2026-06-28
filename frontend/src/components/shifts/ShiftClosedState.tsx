import React from 'react';
import { Unlock, LockKeyhole } from 'lucide-react';

interface ShiftClosedStateProps {
  currencyCode: string;
  startCashInput: number;
  setStartCashInput: (val: number) => void;
  handleOpenShift: () => void;
  onCancel?: () => void;
}

const ShiftClosedState: React.FC<ShiftClosedStateProps> = ({
  currencyCode,
  startCashInput,
  setStartCashInput,
  handleOpenShift,
  onCancel
}) => {
  return (
    <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-gray-300 to-gray-400"></div>
            <div className="p-10 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400 border-4 border-white shadow-lg">
                    <Unlock className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-800 mb-2">الصندوق مغلق</h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">لبدء عمليات البيع واستلام النقد، يجب عليك فتح وردية جديدة وتحديد الرصيد الافتتاحي في الدرج.</p>
                
                <div className="bg-gray-50 p-6 rounded-2xl max-w-sm mx-auto border border-gray-200">
                    <label className="block text-sm font-bold text-gray-700 mb-3 text-right">الرصيد الافتتاحي (العهدة)</label>
                    <div className="relative mb-6">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-gray-500 font-bold text-sm">{currencyCode}</span>
                        </div>
                        <input 
                            type="number" onFocus={(e) => e.target.select()}
                            min="0"
                            className="block w-full pl-16 pr-4 py-4 bg-white border border-gray-300 rounded-xl focus:ring-4 focus:ring-brand-100/60 focus:border-brand-500 outline-none text-2xl font-black text-center text-brand-700 transition-all shadow-sm"
                            value={startCashInput}
                            onChange={e => setStartCashInput(Number(e.target.value))}
                            placeholder="0"
                        />
                    </div>
                    <div className="flex gap-3">
                        {onCancel && (
                             <button
                               onClick={onCancel}
                               className="flex-1 bg-white hover:bg-gray-100 text-gray-700 font-bold py-4 rounded-xl border border-gray-200 transition-all"
                             >
                               إلغاء التراجع
                             </button>
                        )}
                        <button 
                            onClick={handleOpenShift}
                            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-200 transition-all flex items-center justify-center gap-2 text-lg active:scale-[0.98]"
                        >
                            <LockKeyhole className="w-5 h-5" />
                            فتح الوردية
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ShiftClosedState;
