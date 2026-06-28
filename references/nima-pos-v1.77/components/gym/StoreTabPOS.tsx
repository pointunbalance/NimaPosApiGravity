import React from 'react';
import { Search, Info, ShoppingCart, Trash2, ShoppingBag, X, User, CheckCircle } from 'lucide-react';
import { StoreItemType, CartItemType } from './storeTypes';

interface StoreTabPOSProps {
  filteredProductsPOS: StoreItemType[];
  posSearch: string;
  setPosSearch: (val: string) => void;
  cart: CartItemType[];
  handleAddToCart: (product: StoreItemType) => void;
  updateCartQuantity: (id: number, val: number) => void;
  removeFromCart: (id: number) => void;
  handleClearCart: () => void;
  customerName: string;
  setCustomerName: (val: string) => void;
  showMemberDropdown: boolean;
  setShowMemberDropdown: (val: boolean) => void;
  matchedMembers: any[];
  paymentMethod: 'cash' | 'bank';
  setPaymentMethod: (val: 'cash' | 'bank') => void;
  currency: string;
  onCheckout: (e: React.FormEvent) => void;
}

export const StoreTabPOS: React.FC<StoreTabPOSProps> = ({
  filteredProductsPOS,
  posSearch,
  setPosSearch,
  cart,
  handleAddToCart,
  updateCartQuantity,
  removeFromCart,
  handleClearCart,
  customerName,
  setCustomerName,
  showMemberDropdown,
  setShowMemberDropdown,
  matchedMembers,
  paymentMethod,
  setPaymentMethod,
  currency,
  onCheckout
}) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start text-right font-sans" dir="rtl">
      
      {/* 1. Catalog Grid of Products (col-span-8) */}
      <div className="xl:col-span-8 space-y-4">
        
        {/* POS Search Tools */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between flex-row-reverse">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute right-3 h-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={posSearch}
              onChange={(e) => setPosSearch(e.target.value)}
              placeholder="ابحث بواسطة الباركود، الفئة أو اسم المنتج الرياضي..." 
              className="w-full pr-10 pl-4 py-2.5 text-xs font-bold text-slate-800 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-right"
            />
          </div>
          
          {posSearch && (
            <button 
              onClick={() => setPosSearch('')}
              className="px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
            >
              تصفية واستعادة
            </button>
          )}
        </div>

        {/* Products Grid */}
        {filteredProductsPOS.length === 0 ? (
          <div className="bg-white border border-slate-200 p-12 text-center rounded-3xl flex flex-col items-center justify-center gap-3">
            <Info className="w-12 h-12 text-slate-200" />
            <div>
              <h3 className="text-sm font-black text-slate-705">المخزن فارغ تماماً</h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                لم نجد أي مكملات أو منتجات مسجلة في الفرع تناسب استعلام البحث. تفضل بتسجيل الأصناف بالخزانة.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProductsPOS.map((product) => {
              const isOutOfStock = product.stock <= 0;
              const isLowStock = product.stock > 0 && product.stock <= 5;
              const cartItemQty = cart.find(c => c.id === product.id)?.quantity || 0;

              return (
                <div 
                  key={product.id}
                  className={`bg-white rounded-2xl border p-4 hover:shadow-md hover:border-slate-350 transition-all flex flex-col justify-between space-y-3 relative ${
                    isOutOfStock ? 'opacity-85 bg-slate-50/50' : 'border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start gap-1 flex-row-reverse">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${
                      isOutOfStock 
                        ? 'bg-rose-100 text-rose-800' 
                        : isLowStock 
                        ? 'bg-amber-105 bg-amber-100 text-amber-900 border border-amber-200' 
                        : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      {isOutOfStock ? '⚠️ نفذ المخزون' : isLowStock ? `⚠️ مخزون حرج (${product.stock})` : `مخزون: ${product.stock} قطعة`}
                    </span>
                    
                    <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                      {product.category || 'عام'}
                    </span>
                  </div>

                  <div className="space-y-1 text-right">
                    <h3 className="text-xs font-black text-slate-805 leading-snug">{product.name}</h3>
                    {product.barcode && (
                      <span className="text-[9px] text-slate-400 block font-mono">Barcode: {product.barcode}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-row-reverse">
                    <div className="flex items-baseline gap-0.5 text-right font-sans">
                      <span className="text-sm font-black text-slate-800 font-mono">
                        {(Number(product.price) || 0).toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold">{currency}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {cartItemQty > 0 && (
                        <span className="px-2 py-0.5 bg-indigo-650 bg-indigo-600 text-white font-mono text-[9px] font-black rounded-lg shadow-sm">
                          {cartItemQty} بالسلّة
                        </span>
                      )}
                      
                      <button
                        disabled={isOutOfStock}
                        onClick={() => handleAddToCart(product)}
                        className={`p-1.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                          isOutOfStock 
                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-110 hover:bg-indigo-100'
                        }`}
                        title="إضافة لسلة الشراء"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Interactive Cashier Receipt (col-span-4) */}
      <div className="xl:col-span-4 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-6 space-y-4 flex flex-col justify-between min-h-[500px]">
          
          <div className="space-y-1.5">
            <div className="flex justify-between items-center border-b pb-3 flex-row-reverse text-right">
              <h3 className="font-black text-slate-800 text-xs flex items-center gap-1.5 flex-row-reverse">
                <ShoppingCart className="w-4.5 h-4.5 text-indigo-600" />
                <span>سلة المشتريات والبيع الحالية</span>
              </h3>
              {cart.length > 0 && (
                <button 
                  type="button"
                  onClick={handleClearCart}
                  className="text-[10px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>إفراغ</span>
                </button>
              )}
            </div>
          </div>

          {/* Cart List */}
          <div className="flex-1 overflow-y-auto max-h-[220px] divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-450 text-slate-400 flex flex-col items-center justify-center gap-2">
                <ShoppingBag className="w-10 h-10 text-slate-200" />
                <span className="text-[10px] font-black">عربة الكاشير خالية من المشتريات حالياً</span>
                <p className="text-[9px] text-slate-400 leading-relaxed px-4 text-center">أضف جرعات البروتين أو المياه أو المكملات لبيعها للمشتركين</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs flex-row-reverse">
                  <div className="space-y-0.5 flex-1 min-w-0 text-right">
                    <h4 className="font-extrabold text-slate-850 truncate">{item.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono block text-right">
                      {item.price} x {item.quantity} = {(item.price * item.quantity).toLocaleString()} {currency}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.id, -1)}
                      className="w-5 h-5 bg-slate-50 hover:bg-slate-100 border border-slate-205 rounded-md flex items-center justify-center text-slate-600 font-black cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono font-black text-slate-805 text-xs w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.id, 1)}
                      className="w-5 h-5 bg-slate-50 hover:bg-slate-100 border border-slate-205 rounded-md flex items-center justify-center text-slate-600 font-black cursor-pointer"
                    >
                      +
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 h-5 w-5 text-rose-500 hover:text-rose-700 bg-rose-50 rounded-md border border-rose-100 flex items-center justify-center cursor-pointer"
                      title="إزالة كلياً"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Info block form */}
          <form onSubmit={onCheckout} className="border-t pt-3 space-y-3">
            
            <div className="space-y-1 relative text-right">
              <label className="block text-[10px] font-black text-slate-500">اسم المشتري / العضو (اختياري)</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setShowMemberDropdown(true);
                  }}
                  onFocus={() => setShowMemberDropdown(true)}
                  placeholder="أدخل اسم العميل أو المشتري..."
                  className="w-full pr-8.5 pr-8 pl-3 py-2 text-xs font-bold text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-[11px] text-right"
                />
              </div>

              {showMemberDropdown && matchedMembers.length > 0 && (
                <div className="absolute z-50 right-0 left-0 bottom-full bg-white border border-slate-200 rounded-xl shadow-lg mb-1 p-1 max-h-32 overflow-y-auto divide-y divide-slate-50">
                  {matchedMembers.map(member => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        setCustomerName(member.name);
                        setShowMemberDropdown(false);
                      }}
                      className="w-full text-right px-3 py-2 text-xs hover:bg-indigo-50 text-slate-700 font-black flex justify-between items-center cursor-pointer"
                    >
                      <span>{member.name}</span>
                      <span className="text-[9px] font-mono text-slate-400">#{member.code || member.id}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1 text-right">
              <label className="block text-[10px] font-black text-slate-505">طريقة دفعة وسداد الفاتورة</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-1.5 text-[10px] font-black rounded-lg border transition-all text-center cursor-pointer ${
                    paymentMethod === 'cash' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/10' 
                      : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-202'
                  }`}
                >
                  💵 نقدية / كاش
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  className={`py-1.5 text-[10px] font-black rounded-lg border transition-all text-center cursor-pointer ${
                    paymentMethod === 'bank' 
                      ? 'bg-indigo-50 text-indigo-805 border-indigo-300 ring-2 ring-indigo-500/10' 
                      : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-202'
                  }`}
                >
                  💳 بنكي / شبكة
                </button>
              </div>
            </div>

            <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 text-[10px] space-y-1">
              <div className="flex justify-between font-bold text-slate-500 flex-row-reverse text-right">
                <span>إجمالي عدد الأصناف:</span>
                <span className="font-mono text-slate-800">{cart.reduce((s,i)=>s+i.quantity, 0)} قطعة</span>
              </div>
              <div className="flex justify-between font-bold text-slate-705 text-xs border-t pt-1.5 flex-row-reverse text-right">
                <span className="font-black text-slate-800">المبلغ الإجمالي المستحق:</span>
                <span className="font-sans font-black text-indigo-650">
                  {cart.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()} {currency}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={cart.length === 0}
              className={`w-full py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow ${
                cart.length === 0 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>إصدار الفاتورة وتوليد القيد ⚡</span>
            </button>

          </form>

        </div>
      </div>

    </div>
  );
};
export default StoreTabPOS;
