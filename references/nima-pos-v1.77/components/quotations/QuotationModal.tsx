import React from 'react';
import { Customer, Product, OrderItem } from '../../types';
import { 
  Save, User, ShoppingCart, Search, Trash2, TrendingUp, Percent, Plus
} from 'lucide-react';

interface QuotationModalProps {
  isOpen: boolean;
  closeModal: () => void;
  editingId: number | null;
  formCustomerName: string;
  setFormCustomerName: (name: string) => void;
  formCustomerId: number | '';
  setFormCustomerId: (id: number | '') => void;
  customers: Customer[] | undefined;
  formDate: string;
  setFormDate: (date: string) => void;
  formExpiryDate: string;
  setFormExpiryDate: (date: string) => void;
  productSearch: string;
  setProductSearch: (search: string) => void;
  filteredProducts: Product[] | undefined;
  addProductToForm: (product: Product) => void;
  addCustomItemToForm: () => void;
  formItems: OrderItem[];
  updateItem: (index: number, field: keyof OrderItem, value: any) => void;
  removeItem: (index: number) => void;
  termsTemplates: { label: string, text: string }[];
  formNotes: string;
  setFormNotes: (notes: string) => void;
  formTotals: { subtotal: number, taxAmount: number, total: number, totalCost: number, profit: number, margin: number };
  formatCurrency: (amount: number) => string;
  formDiscount: number;
  setFormDiscount: (discount: number) => void;
  formTaxRate: number;
  setFormTaxRate: (rate: number) => void;
  handleSaveQuotation: () => void;
}

const QuotationModal: React.FC<QuotationModalProps> = ({
  isOpen,
  closeModal,
  editingId,
  formCustomerName,
  setFormCustomerName,
  formCustomerId,
  setFormCustomerId,
  customers,
  formDate,
  setFormDate,
  formExpiryDate,
  setFormExpiryDate,
  productSearch,
  setProductSearch,
  filteredProducts,
  addProductToForm,
  addCustomItemToForm,
  formItems,
  updateItem,
  removeItem,
  termsTemplates,
  formNotes,
  setFormNotes,
  formTotals,
  formatCurrency,
  formDiscount,
  setFormDiscount,
  formTaxRate,
  setFormTaxRate,
  handleSaveQuotation
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-6xl shadow-2xl flex flex-col h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-8 py-5 border-b bg-slate-50 shrink-0">
          <div>
            <h3 className="font-extrabold text-xl text-slate-800">{editingId ? `تعديل العرض #${editingId}` : 'إنشاء عرض سعر جديد'}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">تعبئة بيانات العميل والأصناف</p>
          </div>
          <div className="flex gap-3">
            <button onClick={closeModal} className="px-6 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-white">إلغاء</button>
            <button onClick={handleSaveQuotation} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2">
              <Save className="w-5 h-5" /> حفظ العرض
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Input Form */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
            
            {/* Customer & Dates Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-4">
                <label className="block text-sm font-bold text-slate-700">بيانات العميل <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                    placeholder="اسم العميل / الشركة"
                    value={formCustomerName}
                    onChange={e => setFormCustomerName(e.target.value)}
                    list="customers-list"
                  />
                  <datalist id="customers-list">
                    {customers?.map(c => <option key={c.id} value={c.name} />)}
                  </datalist>
                </div>
                <select 
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none"
                  value={formCustomerId}
                  onChange={e => {
                    const cid = Number(e.target.value);
                    setFormCustomerId(cid);
                    const c = customers?.find(cust => cust.id === cid);
                    if(c) setFormCustomerName(c.name);
                  }}
                >
                  <option value="">(اختياري) ربط بعميل مسجل...</option>
                  {customers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="md:col-span-2 grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ الإصدار</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ الانتهاء</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    value={formExpiryDate}
                    onChange={e => setFormExpiryDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Items Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-indigo-500" />
                  الأصناف والخدمات
                </h4>
              </div>

              {/* Item Search Bar */}
              <div className="flex gap-2 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="ابحث لإضافة منتج..."
                    className="w-full pl-4 pr-12 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-500 outline-none text-lg font-bold shadow-sm transition-all"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                  />
                  {/* Dropdown Results */}
                  {filteredProducts && filteredProducts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                      {filteredProducts.map(p => (
                        <div 
                          key={p.id}
                          onClick={() => addProductToForm(p)}
                          className="flex justify-between p-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0"
                        >
                          <span className="font-bold text-slate-800">{p.name}</span>
                          <span className="text-indigo-600 font-mono">{p.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  onClick={addCustomItemToForm}
                  className="px-6 py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 flex items-center gap-2 whitespace-nowrap transition-colors"
                >
                  <Plus className="w-5 h-5" /> صنف مخصص
                </button>
              </div>

              {/* Items Table Editor */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 text-slate-500 font-bold text-sm">
                    <tr>
                      <th className="p-4">الصنف</th>
                      <th className="p-4 w-32">السعر</th>
                      <th className="p-4 w-24">الكمية</th>
                      <th className="p-4 w-32">المجموع</th>
                      <th className="p-4 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">
                          <input 
                            type="text"
                            className="w-full bg-transparent border-none outline-none font-bold text-slate-800"
                            value={item.name}
                            onChange={e => updateItem(idx, 'name', e.target.value)}
                          />
                        </td>
                        <td className="p-4">
                          <input 
                            type="number" onFocus={(e) => e.target.select()} 
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-center font-mono focus:border-indigo-500 outline-none"
                            value={item.price}
                            onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                          />
                        </td>
                        <td className="p-4">
                          <input 
                            type="number" onFocus={(e) => e.target.select()} 
                            min="1"
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-center font-bold focus:border-indigo-500 outline-none"
                            value={item.quantity}
                            onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                          />
                        </td>
                        <td className="p-4 font-bold text-slate-800">
                          {(item.price * item.quantity).toLocaleString()}
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 bg-white hover:bg-red-50 p-2 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {formItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-10 text-center text-gray-400 font-medium">لم يتم إضافة أصناف بعد</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات / شروط العرض</label>
                
                {/* Terms Templates */}
                <div className="flex gap-2 mb-2 flex-wrap">
                  {termsTemplates.map((t, i) => (
                    <button 
                      key={i} 
                      onClick={() => setFormNotes(t.text)}
                      className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-1 rounded hover:bg-slate-200 font-bold"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <textarea 
                  className="w-full h-32 p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="اكتب الشروط، مدة التسليم، طريقة الدفع..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                />
              </div>
              <div className="space-y-4">
                {/* Profit Analysis (Internal) */}
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> تحليل الربحية (داخلي)
                    </span>
                    <span className="text-xs font-bold bg-white px-2 py-0.5 rounded text-emerald-600">{formTotals.margin.toFixed(1)}% هامش</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-700">التكلفة التقديرية:</span>
                    <span className="font-bold">{formatCurrency(formTotals.totalCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-700">الربح المتوقع:</span>
                    <span className="font-bold">{formatCurrency(formTotals.profit)}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right: Financial Summary */}
          <div className="w-96 bg-slate-50 border-r border-slate-200 p-8 flex flex-col">
            <h4 className="font-bold text-lg text-slate-800 mb-6">الملخص المالي</h4>
            
            <div className="space-y-6 flex-1">
              <div className="flex justify-between items-center text-slate-600">
                <span>المجموع الفرعي</span>
                <span className="font-bold text-lg">{formatCurrency(formTotals.subtotal)}</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex justify-between">
                  <span>الخصم (مبلغ)</span>
                  <span className="text-red-500">-{formatCurrency(formDiscount)}</span>
                </label>
                <div className="relative">
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" onFocus={(e) => e.target.select()} 
                    className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-left"
                    value={formDiscount}
                    onChange={e => setFormDiscount(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex justify-between">
                  <span>الضريبة (%)</span>
                  <span className="text-slate-500">{formatCurrency(formTotals.taxAmount)}</span>
                </label>
                <div className="relative">
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" onFocus={(e) => e.target.select()} 
                    className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-left"
                    value={formTaxRate}
                    onChange={e => setFormTaxRate(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-200">
              <div className="flex justify-between items-end">
                <span className="text-slate-500 font-bold">الإجمالي النهائي</span>
                <span className="text-4xl font-black text-indigo-700">{formatCurrency(formTotals.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationModal;
