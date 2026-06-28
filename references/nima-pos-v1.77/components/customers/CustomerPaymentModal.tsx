import React from 'react';
import { Customer } from '../../types';

interface CustomerPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentType: 'debt_payment' | 'wallet_deposit';
  targetCustomer: Customer | null;
  paymentAmount: string;
  setPaymentAmount: (val: string) => void;
  paymentNote: string;
  setPaymentNote: (val: string) => void;
  onProcessPayment: () => void;
}

const CustomerPaymentModal: React.FC<CustomerPaymentModalProps> = ({
  isOpen,
  onClose,
  paymentType,
  targetCustomer,
  paymentAmount,
  setPaymentAmount,
  paymentNote,
  setPaymentNote,
  onProcessPayment,
}) => {
  if (!isOpen || !targetCustomer) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in-95">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            {paymentType === 'debt_payment' ? 'سداد دفعة (دين)' : 'شحن محفظة'}
          </h3>
          <p className="text-sm text-gray-500">{targetCustomer.name}</p>
        </div>

        <div className="mb-6">
          <input
            type="number"
            onFocus={(e) => e.target.select()}
            autoFocus
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            className="w-full px-4 py-4 bg-slate-50 border-2 border-indigo-100 rounded-2xl text-center text-3xl font-black text-indigo-700 outline-none focus:border-indigo-500"
            placeholder="0"
          />
        </div>

        <div className="mb-6">
          <textarea
            rows={2}
            value={paymentNote}
            onChange={(e) => setPaymentNote(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm outline-none resize-none"
            placeholder="ملاحظات العملية..."
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            onClick={onProcessPayment}
            className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200"
          >
            تأكيد
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerPaymentModal;
