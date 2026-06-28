import React from 'react';
import { PackageX, ChevronLeft, ChevronRight } from 'lucide-react';
import { Order } from '../../types';

interface ReturnsListProps {
  returns: Order[];
  selectedReturn: Order | null;
  setSelectedReturn: (order: Order | null) => void;
  customerMap: Map<number, string>;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string) => string;
  currentPage: number;
  totalPages: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalFiltered: number;
}

const ReturnsList: React.FC<ReturnsListProps> = ({
  returns,
  selectedReturn,
  setSelectedReturn,
  customerMap,
  formatCurrency,
  formatDate,
  currentPage,
  totalPages,
  setCurrentPage,
  totalFiltered
}) => {
  if (totalFiltered === 0 && returns.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-16 text-center max-w-2xl mx-auto mt-10">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <PackageX className="w-12 h-12 text-slate-300" />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-3">لا توجد مرتجعات مسجلة</h3>
        <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
          لم يتم تسجيل أي عمليات استرجاع حتى الآن. يمكنك تسجيل مرتجع جديد للبدء في تتبع المبالغ المستردة وتحديث المخزون.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th className="px-6 py-5">رقم المرتجع</th>
              <th className="px-6 py-5">التاريخ</th>
              <th className="px-6 py-5">الفاتورة الأصلية</th>
              <th className="px-6 py-5">العميل</th>
              <th className="px-6 py-5">قيمة المرتجع</th>
              <th className="px-6 py-5 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {returns.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400 font-medium">لا توجد نتائج مطابقة للبحث</td></tr>
            ) : (
              returns.map(order => {
                const customerName = order.customerId ? customerMap.get(order.customerId) : 'عميل عام';
                const isSelected = selectedReturn?.id === order.id;
                return (
                  <tr 
                    key={order.id} 
                    onClick={() => setSelectedReturn(order)}
                    className={`cursor-pointer transition-all duration-200 ${isSelected ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-6 py-5 font-mono font-bold text-slate-800">#{order.referenceNumber || order.id}</td>
                    <td className="px-6 py-5 text-slate-500 font-medium">{formatDate(order.date)}</td>
                    <td className="px-6 py-5">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl font-mono text-xs font-bold">
                        #{order.parentOrderId}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-bold text-slate-700">{customerName}</td>
                    <td className="px-6 py-5 font-black text-red-600 text-base" dir="ltr">
                      {formatCurrency(Math.abs(order.totalAmount))}
                    </td>
                    <td className="px-6 py-5 text-left">
                      <ChevronLeft className={`w-5 h-5 transition-colors ${isSelected ? 'text-red-500' : 'text-slate-300'}`} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 text-sm font-bold text-slate-500 px-2">
          <span>عرض {returns.length} من {totalFiltered}</span>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"><ChevronRight className="w-4 h-4" /></button>
            <span className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl min-w-[4rem] text-center">{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </>
  );
};

export default ReturnsList;
