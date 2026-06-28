import React from 'react';
import { X, RotateCcw } from 'lucide-react';

interface AcademicYearModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedYearId: number | null;
    formData: any;
    setFormData: (data: any) => void;
    handleSave: (e: React.FormEvent) => void;
    daysOfWeek: { id: string; name: string }[];
    handleToggleWorkingDay: (dayId: string) => void;
}

export const AcademicYearModal: React.FC<AcademicYearModalProps> = ({
    isOpen,
    onClose,
    selectedYearId,
    formData,
    setFormData,
    handleSave,
    daysOfWeek,
    handleToggleWorkingDay,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto" dir="rtl">
            <div className="bg-white rounded-3xl w-full max-w-3xl shadow-xl my-8 overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-black text-slate-800">
                        {selectedYearId ? 'تعديل العام الدراسي' : 'إضافة عام دراسي'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div>
                        <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">البيانات الأساسية</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-full">
                                <label className="block text-sm font-bold text-slate-700 mb-2">اسم المسمى الدراسي (مثال: 2025/2026)</label>
                                <input
                                    required
                                    dir="ltr"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full text-right px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ البدء العام</label>
                                <input
                                    required
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ الانتهاء العام</label>
                                <input
                                    required
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isCurrent}
                                    onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                                    className="w-5 h-5 text-indigo-600 rounded"
                                />
                                <span className="font-bold text-indigo-900 text-sm">تعيين كعام دراسي حالي نشط</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">الفصول الدراسية (الأتـرام)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-3">
                                <h4 className="font-bold text-slate-700 text-sm">الترم الأول</h4>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">بداية الترم الأول</label>
                                    <input
                                        type="date"
                                        value={formData.term1Start || ''}
                                        onChange={(e) => setFormData({ ...formData, term1Start: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">نهاية الترم الأول</label>
                                    <input
                                        type="date"
                                        value={formData.term1End || ''}
                                        onChange={(e) => setFormData({ ...formData, term1End: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                    />
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-3">
                                <h4 className="font-bold text-slate-700 text-sm">الترم الثاني</h4>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">بداية الترم الثاني</label>
                                    <input
                                        type="date"
                                        value={formData.term2Start || ''}
                                        onChange={(e) => setFormData({ ...formData, term2Start: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">نهاية الترم الثاني</label>
                                    <input
                                        type="date"
                                        value={formData.term2End || ''}
                                        onChange={(e) => setFormData({ ...formData, term2End: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">أيام العمل والإجازات الأسبوعية</h3>
                        <div className="flex flex-wrap gap-2">
                            {daysOfWeek.map((day) => {
                                const isWorking = formData.workingDays.includes(day.id);
                                return (
                                    <button
                                        key={day.id}
                                        type="button"
                                        onClick={() => handleToggleWorkingDay(day.id)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors border ${
                                            isWorking
                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-50 hover:opacity-100'
                                        }`}
                                    >
                                        {day.name} {isWorking ? '✓' : ''}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md"
                        >
                            حفظ التعديلات
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface PromoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    promoteFromLevel: string;
    setPromoteFromLevel: (levelId: string) => void;
    promoteToLevel: string;
    setPromoteToLevel: (levelId: string) => void;
    levels: any[];
    onPromote: () => void;
}

export const PromoteModal: React.FC<PromoteModalProps> = ({
    isOpen,
    onClose,
    promoteFromLevel,
    setPromoteFromLevel,
    promoteToLevel,
    setPromoteToLevel,
    levels,
    onPromote,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" dir="rtl">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
                    <h2 className="text-xl font-black text-indigo-900 flex items-center gap-2">
                        <RotateCcw className="w-5 h-5" /> ترقية واستمرار الأطفال
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-indigo-100 rounded-full text-indigo-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-slate-600 text-sm font-medium mb-6 leading-relaxed">
                        قم بتحديد المرحلة الحالية التي تود نقل الأطفال منها، والمرحلة الجديدة التي سينتقلون إليها (مثال: من KG1 إلى KG2). هذه العملية ستنقل جميع الأطفال "النشطين" فقط في المرحلة الحالية، وستحتفظ بسجلاتهم السابقة من تقييمات وفواتير كما هي.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">من مرحلة (الحالية)</label>
                            <select
                                value={promoteFromLevel}
                                onChange={(e) => setPromoteFromLevel(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                            >
                                <option value="">-- اختر المرحلة --</option>
                                {levels.map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-center text-slate-300 py-1">
                            <RotateCcw className="w-6 h-6 rotate-90" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">إلى مرحلة (الجديدة)</label>
                            <select
                                value={promoteToLevel}
                                onChange={(e) => setPromoteToLevel(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                            >
                                <option value="">-- اختر المرحلة --</option>
                                {levels.map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            type="button"
                            onClick={onPromote}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md animate-none"
                        >
                            تأكيد الترقية
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
