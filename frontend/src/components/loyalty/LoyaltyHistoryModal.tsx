import React from 'react';
import { History, X, Star, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Customer, LoyaltyTransaction } from '../../types';

interface LoyaltyHistoryModalProps {
  showHistoryModal: boolean;
  setShowHistoryModal: (show: boolean) => void;
  selectedCustomer: Customer | null;
  customerHistory: LoyaltyTransaction[];
}

const LoyaltyHistoryModal: React.FC<LoyaltyHistoryModalProps> = ({
  showHistoryModal,
  setShowHistoryModal,
  selectedCustomer,
  customerHistory,
}) => {
  if (!showHistoryModal || !selectedCustomer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <History className="w-6 h-6 text-brand-500" />
              سجل نقاط العميل: {selectedCustomer.name}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              الرصيد الحالي: {selectedCustomer.loyaltyPoints || 0} نقطة
            </p>
          </div>
          <button
            onClick={() => setShowHistoryModal(false)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {customerHistory.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">لا يوجد سجل نقاط لهذا العميل</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customerHistory.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.points > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {tx.points > 0 ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">
                        {tx.type === 'earn' && 'اكتساب من مشتريات'}
                        {tx.type === 'redeem' && 'استبدال في مشتريات'}
                        {tx.type === 'manual_add' && 'إضافة يدوية'}
                        {tx.type === 'manual_deduct' && 'خصم يدوي'}
                        {tx.type === 'welcome' && 'مكافأة ترحيبية'}
                        {tx.type === 'refund' && 'مرتجع مشتريات'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>{new Date(tx.date).toLocaleString('ar-EG')}</span>
                        {tx.orderId && <span>• طلب #{tx.orderId}</span>}
                      </div>
                      {tx.note && <p className="text-xs text-slate-400 mt-1">{tx.note}</p>}
                    </div>
                  </div>
                  <div
                    className={`font-bold text-lg ${
                      tx.points > 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {tx.points > 0 ? '+' : ''}
                    {tx.points}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoyaltyHistoryModal;
