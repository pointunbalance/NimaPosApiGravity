import React from 'react';
import { Customer } from '../../types';
import { ChevronRight, MessageCircle, Phone, ShieldAlert, Banknote, Wallet } from 'lucide-react';

interface CustomersListProps {
  viewMode: 'list' | 'grid';
  filteredCustomers: Customer[];
  selectedProfileId: number | undefined;
  showCreditBalance?: boolean;
  onOpenProfile: (customer: Customer) => void;
  onOpenPaymentModal: (type: 'debt_payment' | 'wallet_deposit', customer: Customer) => void;
  onOpenWhatsApp: (phone: string, name: string) => void;
  getCustomerStatus: (customer: Customer) => { label: string; color: string; icon: any };
  formatCurrency: (amount: number) => string;
}

const CustomersList: React.FC<CustomersListProps> = ({
  viewMode,
  filteredCustomers,
  selectedProfileId,
  showCreditBalance = true,
  onOpenProfile,
  onOpenPaymentModal,
  onOpenWhatsApp,
  getCustomerStatus,
  formatCurrency,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      {viewMode === 'list' ? (
        <div className="space-y-2">
          {filteredCustomers.map((customer) => {
            const status = getCustomerStatus(customer);
            const hasDebt = showCreditBalance && (customer.balance || 0) > 0;
            const isOverLimit =
              customer.creditLimit &&
              customer.creditLimit > 0 &&
              (customer.balance || 0) > customer.creditLimit;

            return (
              <div
                key={customer.id}
                onClick={() => onOpenProfile(customer)}
                className={`bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group ${
                  selectedProfileId === customer.id ? 'ring-2 ring-indigo-500 border-transparent' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-inner relative ${status.color}`}
                  >
                    {customer.name.substring(0, 1)}
                    {hasDebt && (
                      <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800">{customer.name}</h3>
                      <span
                        className={`text-[10px] px-1.5 rounded flex items-center gap-1 ${status.color}`}
                      >
                        {status.label}
                      </span>
                      {isOverLimit && (
                        <div title="تجاوز حد الائتمان">
                          <ShieldAlert className="w-4 h-4 text-red-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span dir="ltr">{customer.phone}</span>
                      {customer.tags && customer.tags.length > 0 && (
                        <div className="flex gap-1">
                          {customer.tags.slice(0, 2).map((tag, i) => (
                            <span key={i} className="bg-gray-100 px-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {(customer.walletBalance || 0) > 0 && (
                        <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-1.5 rounded font-bold">
                          <Wallet className="w-3 h-3" />
                          {formatCurrency(customer.walletBalance!)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {hasDebt && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPaymentModal('debt_payment', customer);
                      }}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors border border-red-100"
                    >
                      سداد {formatCurrency(customer.balance!)}
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenWhatsApp(customer.phone, customer.name);
                    }}
                    className="text-slate-300 hover:text-green-500 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredCustomers.map((customer) => {
            const status = getCustomerStatus(customer);
            const isOverLimit =
              customer.creditLimit &&
              customer.creditLimit > 0 &&
              (customer.balance || 0) > customer.creditLimit;
            return (
              <div
                key={customer.id}
                onClick={() => onOpenProfile(customer)}
                className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer relative group ${
                  selectedProfileId === customer.id ? 'ring-2 ring-indigo-500' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold ${status.color}`}
                  >
                    {customer.name.substring(0, 1)}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${status.color}`}
                    >
                      {status.label}
                    </span>
                    {showCreditBalance && (customer.balance || 0) > 0 && (
                      <span
                        className={`bg-red-50 text-red-600 px-2 py-1 rounded-lg text-xs font-bold border border-red-100 ${
                          isOverLimit ? 'animate-pulse bg-red-100 ring-2 ring-red-300' : ''
                        }`}
                      >
                        {formatCurrency(customer.balance!)}
                      </span>
                    )}
                    {(customer.walletBalance || 0) > 0 && (
                      <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-xs font-bold border border-emerald-100 flex items-center gap-1">
                        <Wallet className="w-3 h-3" />
                        {formatCurrency(customer.walletBalance!)}
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-1 truncate flex items-center gap-1">
                  {customer.name}
                  {isOverLimit && <ShieldAlert className="w-4 h-4 text-red-500" />}
                </h3>
                <p className="text-sm text-slate-500 mb-4 flex items-center gap-1" dir="ltr">
                  <Phone className="w-3 h-3" /> {customer.phone}
                </p>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-4 left-4">
                  {(customer.balance || 0) > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPaymentModal('debt_payment', customer);
                      }}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 shadow-sm"
                      title="سداد سريع"
                    >
                      <Banknote className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenWhatsApp(customer.phone, customer.name);
                    }}
                    className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 shadow-sm"
                    title="واتساب"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-xs">
                  <span className="text-slate-400">مجموع الشراء</span>
                  <span className="font-bold text-slate-700">
                    {formatCurrency(customer.totalSpent)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomersList;
