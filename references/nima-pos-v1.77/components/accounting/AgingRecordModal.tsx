import React from "react";
import { X } from "lucide-react";
import { AgingRecord } from "./useAgingReportsData";

interface AgingRecordModalProps {
  selectedEntity: AgingRecord;
  onClose: () => void;
  activeTab: "receivable" | "payable";
  formatCurrency: (amount: number) => string;
}

const AgingRecordModal: React.FC<AgingRecordModalProps> = ({
  selectedEntity,
  onClose,
  activeTab,
  formatCurrency,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:hidden">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
        <div className="p-6 border-b border-gray-100 bg-slate-50 flex justify-between items-center font-bold">
          <div>
            <h3 className="font-bold text-xl text-slate-800">{selectedEntity.name}</h3>
            <p className="text-sm text-slate-500">تفاصيل الفواتير غير المسددة</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white rounded-full text-slate-400 hover:text-red-500 shadow-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-white flex-1">
          <div className="space-y-3 font-bold">
            {selectedEntity.relatedInvoices?.map((inv, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-4 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors bg-gray-50/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center font-black text-xs ${
                      inv.daysOld > 90
                        ? "bg-red-100 text-red-700"
                        : inv.daysOld > 60
                        ? "bg-orange-100 text-orange-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {inv.daysOld} يوم
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">
                      {activeTab === "receivable"
                        ? `فاتورة #${inv.id}`
                        : `مشتريات #${inv.invoiceNumber || inv.id}`}
                    </p>
                    <p className="text-xs text-slate-500 font-normal">
                      {new Date(inv.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">
                    {formatCurrency(inv.allocatedAmount)}
                  </p>
                  <p className="text-[10px] text-slate-400 font-normal">
                    متبقى من أصل {formatCurrency(inv.totalAmount)}
                  </p>
                </div>
              </div>
            ))}
            {(!selectedEntity.relatedInvoices || selectedEntity.relatedInvoices.length === 0) && (
              <p className="text-center text-slate-400 py-4 font-medium">
                رصيد مدور (قديم) غير مرتبط بفواتير حديثة
              </p>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-gray-200 flex justify-between items-center font-bold">
          <span className="text-sm font-bold text-slate-600">الإجمالي المستحق</span>
          <span className="text-xl font-black text-indigo-700">
            {formatCurrency(selectedEntity.totalBalance)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AgingRecordModal;
