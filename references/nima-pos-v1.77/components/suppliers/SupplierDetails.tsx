import React from 'react';
import { Supplier } from '../../types';
import { 
  ChevronLeft, MapPin, Edit2, Trash2, Phone, Wallet, ArrowDownLeft, 
  TrendingUp, Landmark, Mail, Building2, FileSpreadsheet, Package, 
  MessageCircle, CheckSquare, Calendar 
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface SupplierDetailsProps {
  selectedSupplier: Supplier;
  setSelectedSupplier: (supplier: Supplier | null) => void;
  selectedSupplierData: any;
  activeDetailTab: 'overview' | 'history' | 'products' | 'statement';
  setActiveDetailTab: (tab: 'overview' | 'history' | 'products' | 'statement') => void;
  openModal: (supplier: Supplier) => void;
  handleDelete: (id: number) => void;
  setIsPaymentModalOpen: (isOpen: boolean) => void;
  setIsRefundModalOpen: (isOpen: boolean) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
  selectedForOrder: Set<string>;
  toggleProductSelection: (name: string) => void;
  sendWhatsAppOrder: () => void;
}

const SupplierDetails: React.FC<SupplierDetailsProps> = ({
  selectedSupplier,
  setSelectedSupplier,
  selectedSupplierData,
  activeDetailTab,
  setActiveDetailTab,
  openModal,
  handleDelete,
  setIsPaymentModalOpen,
  setIsRefundModalOpen,
  formatCurrency,
  formatDate,
  selectedForOrder,
  toggleProductSelection,
  sendWhatsAppOrder
}) => {
  if (!selectedSupplierData) return null;

  return (
    <div className="w-full lg:w-[60%] bg-white border-r border-slate-200 shadow-xl flex flex-col h-full animate-in slide-in-from-left duration-300 relative z-10">
      {/* Header Profile */}
      <div className="bg-slate-50 border-b border-slate-200 p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedSupplier(null)} className="lg:hidden mr-2 p-2 bg-white rounded-full shadow-sm"><ChevronLeft/></button>
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-2xl font-bold text-indigo-600">
              {selectedSupplier.name.substring(0, 1)}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800">{selectedSupplier.name}</h2>
              <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                <MapPin className="w-3 h-3" />
                <span>{selectedSupplier.address || 'العنوان غير مسجل'}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => openModal(selectedSupplier)} className="p-2 bg-white border border-slate-200 rounded-lg hover:text-blue-600 hover:border-blue-200 transition-colors"><Edit2 className="w-4 h-4" /></button>
            <button onClick={() => handleDelete(selectedSupplier.id!)} className="p-2 bg-white border border-slate-200 rounded-lg hover:text-red-600 hover:border-red-200 transition-colors"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex gap-3 mb-6">
          <a href={`tel:${selectedSupplier.phone}`} className="flex-1 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors">
            <Phone className="w-4 h-4 text-indigo-500" /> اتصال
          </a>
          <button onClick={() => setIsPaymentModalOpen(true)} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 transition-colors shadow-sm">
            <Wallet className="w-4 h-4" /> سداد دفعة
          </button>
          <button onClick={() => setIsRefundModalOpen(true)} className="flex-1 py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-xl text-xs font-bold hover:bg-orange-100 flex items-center justify-center gap-2 transition-colors shadow-sm">
            <ArrowDownLeft className="w-4 h-4" /> تسجيل مرتجع
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-slate-200 -mb-6">
          <button 
            onClick={() => setActiveDetailTab('overview')}
            className={`pb-4 text-sm font-bold border-b-2 transition-colors ${activeDetailTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            نظرة عامة
          </button>
          <button 
            onClick={() => setActiveDetailTab('statement')}
            className={`pb-4 text-sm font-bold border-b-2 transition-colors ${activeDetailTab === 'statement' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            كشف حساب
          </button>
          <button 
            onClick={() => setActiveDetailTab('history')}
            className={`pb-4 text-sm font-bold border-b-2 transition-colors ${activeDetailTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            سجل الفواتير
          </button>
          <button 
            onClick={() => setActiveDetailTab('products')}
            className={`pb-4 text-sm font-bold border-b-2 transition-colors ${activeDetailTab === 'products' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            المنتجات والطلبات
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
        
        {activeDetailTab === 'overview' && (
          <div className="space-y-6">
            {/* Financial Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">الرصيد المستحق (الدين)</p>
                <h3 className={`text-2xl font-black ${selectedSupplier.balance && selectedSupplier.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {formatCurrency(selectedSupplier.balance || 0)}
                </h3>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">إجمالي التعاملات</p>
                <h3 className="text-2xl font-black text-indigo-600">
                  {formatCurrency(selectedSupplierData.purchases.reduce((a: number,b: any)=>a+b.totalAmount,0))}
                </h3>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                حركة الشراء (آخر 6 أشهر)
              </h4>
              <div className="h-48 w-full">
                {selectedSupplierData.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={selectedSupplierData.chartData}>
                      <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                      <Tooltip 
                        formatter={(val: number) => formatCurrency(val)} 
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                      />
                      <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">لا توجد بيانات كافية</div>
                )}
              </div>
            </div>

            {/* Bank Info */}
            {(selectedSupplier.bankName || selectedSupplier.bankAccount) && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-emerald-600" />
                  البيانات البنكية
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedSupplier.bankName && (
                    <div>
                      <p className="text-xs text-slate-400 font-bold mb-1">اسم البنك</p>
                      <p className="text-sm font-medium">{selectedSupplier.bankName}</p>
                    </div>
                  )}
                  {selectedSupplier.bankAccount && (
                    <div>
                      <p className="text-xs text-slate-400 font-bold mb-1">رقم الحساب</p>
                      <p className="text-sm font-medium font-mono">{selectedSupplier.bankAccount}</p>
                    </div>
                  )}
                  {selectedSupplier.iban && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-400 font-bold mb-1">IBAN</p>
                      <p className="text-sm font-medium font-mono bg-slate-50 p-2 rounded border border-slate-100">{selectedSupplier.iban}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-800 text-sm mb-2">بيانات الاتصال</h4>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center"><Phone className="w-4 h-4" /></div>
                <span dir="ltr">{selectedSupplier.phone}</span>
              </div>
              {selectedSupplier.email && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center"><Mail className="w-4 h-4" /></div>
                  <span>{selectedSupplier.email}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center"><Building2 className="w-4 h-4" /></div>
                <span>{selectedSupplier.contactPerson || 'غير محدد'}</span>
              </div>
            </div>
          </div>
        )}

        {activeDetailTab === 'statement' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                  كشف حساب تفصيلي
                </h4>
                <span className="text-sm font-bold text-slate-600">الرصيد الحالي: <span className={selectedSupplier.balance && selectedSupplier.balance > 0 ? 'text-red-600' : 'text-emerald-600'}>{formatCurrency(selectedSupplier.balance || 0)}</span></span>
              </div>
              {selectedSupplierData.statement.length === 0 ? (
                <div className="text-center py-10 text-slate-400">لا توجد حركات مالية مسجلة</div>
              ) : (
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-bold">التاريخ</th>
                      <th className="px-4 py-3 font-bold">البيان</th>
                      <th className="px-4 py-3 font-bold text-center">مشتريات (عليه)</th>
                      <th className="px-4 py-3 font-bold text-center">دفعات (له)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSupplierData.statement.map((item: any, idx: number) => (
                      <tr key={`${item.type}-${item.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-500">{formatDate(item.date)}</td>
                        <td className="px-4 py-3 font-medium text-slate-800 flex items-center gap-2">
                          {item.type === 'purchase' && <Package className="w-4 h-4 text-indigo-500" />}
                          {item.type === 'payment' && <Wallet className="w-4 h-4 text-emerald-500" />}
                          {item.type === 'refund' && <ArrowDownLeft className="w-4 h-4 text-orange-500" />}
                          {item.description}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-red-600">
                          {item.type === 'purchase' ? formatCurrency(item.amount) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-600">
                          {item.type === 'payment' || item.type === 'refund' ? formatCurrency(item.amount) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* جدول السداد للمورد */}
            {selectedSupplier.balance && selectedSupplier.balance > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-4">
                <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    جدول السداد والأقساط المستحقة للمورد (باقي المديونية)
                  </h4>
                  <span className="text-xs text-slate-500 font-mono">طريقة الجدولة: 50% شهرياً</span>
                </div>
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-bold">الاستحقاق</th>
                      <th className="px-4 py-3 font-bold">الوصف</th>
                      <th className="px-4 py-3 font-bold text-center">المبلغ المستحق</th>
                      <th className="px-4 py-3 font-bold text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-500">
                        {(() => {
                          const date = new Date();
                          date.setDate(15);
                          return formatDate(date);
                        })()}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">أقساط بضاعة المشتريات الآجلة - الدفعة الأولى مجدولة</td>
                      <td className="px-4 py-3 text-center font-bold text-amber-600">
                        {formatCurrency((selectedSupplier.balance * 0.5))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">قيد الانتظار</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-500">
                        {(() => {
                          const date = new Date();
                          date.setMonth(date.getMonth() + 1);
                          date.setDate(1);
                          return formatDate(date);
                        })()}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">أقساط بضاعة المشتريات الآجلة - الدفعة الثانية مجدولة</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-600">
                        {formatCurrency((selectedSupplier.balance * 0.5))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">مستقبلي</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        )}

        {activeDetailTab === 'history' && (
          <div className="space-y-3">
            {selectedSupplierData.purchases.length === 0 ? (
              <div className="text-center py-10 text-slate-400">لا يوجد سجل مشتريات</div>
            ) : (
              selectedSupplierData.purchases.map((purchase: any) => (
                <div key={purchase.id} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">#{purchase.invoiceNumber || purchase.id}</span>
                    <span className="text-xs text-slate-500">{formatDate(purchase.date)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      <Package className="w-3 h-3" /> {purchase.items.length} أصناف
                    </span>
                    <span className="font-bold text-slate-800">{formatCurrency(purchase.totalAmount)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeDetailTab === 'products' && (
          <div className="h-full flex flex-col">
            {/* Order Action Bar */}
            <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl mb-4 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                  {selectedForOrder.size}
                </div>
                <span className="text-sm font-bold text-indigo-900">أصناف محددة للطلب</span>
              </div>
              <button 
                onClick={sendWhatsAppOrder}
                disabled={selectedForOrder.size === 0}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageCircle className="w-3 h-3" />
                إرسال واتساب
              </button>
            </div>

            <div className="space-y-2">
              {selectedSupplierData.productsList.map((prod: any, idx: number) => {
                const isSelected = selectedForOrder.has(prod.name);
                return (
                  <div 
                    key={idx} 
                    onClick={() => toggleProductSelection(prod.name)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200 hover:border-indigo-200'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                        {isSelected && <CheckSquare className="w-3 h-3" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{prod.name}</p>
                        <p className="text-[10px] text-slate-500">تم شراء {prod.count} قطعة سابقاً</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                      آخر سعر: {formatCurrency(prod.lastPrice)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SupplierDetails;
