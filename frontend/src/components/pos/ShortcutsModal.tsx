import React from 'react';
import { X, Keyboard, Search, HandCoins, DollarSign, RotateCcw, AlertCircle, ShoppingCart, Banknote } from 'lucide-react';

interface ShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const shortcuts = [
        { key: 'F2', label: 'إتمام الدفع', description: 'يفتح نافذة الدفع عندما يكون هناك منتجات في السلة', icon: <DollarSign className="w-5 h-5 text-green-500"/> },
        { key: 'F3', label: 'دفع سريع كاش', description: 'يتمم الدفع مباشرة كنقدي (كاش) دون فتح النوافذ الإضافية', icon: <Banknote className="w-5 h-5 text-emerald-500"/> },
        { key: 'F4', label: 'بحث سريع', description: 'ينقل المؤشر إلى خانة البحث أو الباركود', icon: <Search className="w-5 h-5 text-blue-500"/> },
        { key: 'F8', label: 'تعليق الطلب', description: 'يحتفظ بالطلب الحالي مؤقتاً لخدمة زبون آخر', icon: <ShoppingCart className="w-5 h-5 text-orange-500"/> },
        { key: 'F9', label: 'وضع المرتجع', description: 'يبدل بين وضع المبيعات العادي ووضع المرتجعات', icon: <RotateCcw className="w-5 h-5 text-red-500"/> },
        { key: 'ESC', label: 'إلغاء / خروج', description: 'يغلق أي نافذة مفتوحة أو يمسح نص البحث', icon: <AlertCircle className="w-5 h-5 text-slate-500"/> },
        { key: 'F10', label: 'فحص السعر', description: 'يفتح نافذة فحص سعر المنتجات السريع (جديد)', icon: <HandCoins className="w-5 h-5 text-purple-500"/> },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 fade-in-up">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-100 p-2 rounded-xl text-brand-600">
                           <Keyboard className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-black text-slate-800">اختصارات لوحة المفاتيح</h2>
                    </div>
                    <button onClick={onClose} className="bg-white p-2 rounded-full shadow-sm text-gray-400 hover:text-red-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    <div className="space-y-3">
                        {shortcuts.map((shortcut, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition-all">
                                <div className="mt-1">{shortcut.icon}</div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-800">{shortcut.label}</h3>
                                    <p className="text-sm text-slate-500 mt-1">{shortcut.description}</p>
                                </div>
                                <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 font-black text-sm tracking-widest min-w-[3rem] text-center shadow-inner">
                                    {shortcut.key}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-6 bg-blue-50 text-blue-800 p-4 rounded-xl text-sm font-bold flex items-start gap-3">
                        <div className="text-xl">💡</div>
                        <p>استخدام اختصارات لوحة المفاتيح يسرّع عملية البيع بشكل كبير لاسيما عند استخدام قارئ الباركود، حيث لا يحتاج المستخدم للماوس إلا نادراً.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
