import React from 'react';
import { AppSettings } from '../../types';
import { Barcode, HelpCircle } from 'lucide-react';

interface BarcodeSettingsProps {
  formData: AppSettings;
  handleSettingChange: (key: keyof AppSettings, value: any) => void;
}

export const BarcodeSettings: React.FC<BarcodeSettingsProps> = ({ formData, handleSettingChange }) => {
  const config = formData.barcodeConfig || {
    mode: 'random',
    customPadding: 5,
    advancedFormat: '{C}-{SEQ}',
    includePrice: false,
    includeCost: false,
    includeExpiry: false
  };

  const handleChange = (field: string, value: any) => {
    handleSettingChange('barcodeConfig', {
      ...config,
      [field]: value
    });
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
          <Barcode className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-black text-slate-800 text-lg">إعدادات الباركود المولد</h2>
          <p className="text-slate-500 text-xs font-medium mt-1">التحكم في كيفية توليد باركود المنتجات الجديدة أو الأصناف المؤقتة</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-4">نظام التوليد</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className={`border-2 p-4 rounded-xl cursor-pointer transition-all ${config.mode === 'random' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
              <div className="flex gap-2 mb-1">
                <input 
                  type="radio" 
                  name="barcodeMode" 
                  value="random" 
                  checked={config.mode === 'random'}
                  onChange={() => handleChange('mode', 'random')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-bold text-slate-800 text-sm">عشوائي (12 رقم)</span>
              </div>
              <p className="text-xs text-slate-500 mr-6">توليد أرقام عشوائية تماماً (افتراضي)</p>
            </label>

            <label className={`border-2 p-4 rounded-xl cursor-pointer transition-all ${config.mode === 'sequential' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
              <div className="flex gap-2 mb-1">
                <input 
                  type="radio" 
                  name="barcodeMode" 
                  value="sequential" 
                  checked={config.mode === 'sequential'}
                  onChange={() => handleChange('mode', 'sequential')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-bold text-slate-800 text-sm">تسلسلي منظم</span>
              </div>
              <p className="text-xs text-slate-500 mr-6">ترتيب تصاعدي (1001, 1002...)</p>
            </label>

            <label className={`border-2 p-4 rounded-xl cursor-pointer transition-all ${config.mode === 'advanced' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
              <div className="flex gap-2 mb-1">
                <input 
                  type="radio" 
                  name="barcodeMode" 
                  value="advanced" 
                  checked={config.mode === 'advanced'}
                  onChange={() => handleChange('mode', 'advanced')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-bold text-slate-800 text-sm">متقدم (أقسام/بيانات)</span>
              </div>
              <p className="text-xs text-slate-500 mr-6">تضمين القسم، السعر، والتاريخ</p>
            </label>
          </div>
        </div>

        {config.mode !== 'random' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">عدد الخانات للتسلسل (أصفار)</label>
              <input 
                type="number" 
                min={2}
                max={10}
                value={config.customPadding || 5}
                onChange={(e) => handleChange('customPadding', parseInt(e.target.value) || 5)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100"
              />
              <p className="text-xs text-slate-500 mt-2">مثال: إذا كانت الخانات 5، سيكون الرقم (00001)</p>
            </div>
            
            {config.mode === 'advanced' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">صيغة الباركود المتقدمة</label>
                <input 
                   type="text"
                   value={config.advancedFormat || '{C}-{SEQ}'}
                   onChange={(e) => handleChange('advancedFormat', e.target.value)}
                   className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 text-left"
                   dir="ltr"
                />
                <div className="flex gap-1 flex-wrap mt-2">
                  <span className="text-[10px] bg-white border px-1.5 py-0.5 rounded text-indigo-600 font-mono">{'{C}'}</span>
                  <span className="text-[10px] text-slate-500 leading-tight block">معرف القسم/الصنف</span>
                  <span className="text-[10px] bg-white border px-1.5 py-0.5 rounded text-indigo-600 font-mono">{'{SEQ}'}</span>
                  <span className="text-[10px] text-slate-500 leading-tight block">التسلسل</span>
                  <span className="text-[10px] bg-white border px-1.5 py-0.5 rounded text-indigo-600 font-mono">{'{P}'}</span>
                  <span className="text-[10px] text-slate-500 leading-tight block">السعر</span>
                </div>
              </div>
            )}
          </div>
        )}

        {config.mode === 'advanced' && (
          <div className="space-y-4 border-t border-slate-100 pt-6">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              تضمين بيانات إضافية تلقائياً 
              <span className="group relative">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-800 text-white text-xs p-3 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  سيتم دمج القيمة في نهاية الباركود للتعرف عليها بواسطة قارئ موازين الباركود. مثال للسعر: 00150 تعني 1.50
                </div>
              </span>
            </h3>

            <label className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer">
              <input 
                type="checkbox"
                checked={config.includePrice || false}
                onChange={(e) => handleChange('includePrice', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded-md border-slate-300"
              />
              <div>
                <p className="font-bold text-slate-700 text-sm">دمج سعر البيع (للموازين)</p>
                <p className="text-xs text-slate-500">يضيف 5 خانات للسعر في نهاية الباركود</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer">
              <input 
                type="checkbox"
                checked={config.includeCost || false}
                onChange={(e) => handleChange('includeCost', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded-md border-slate-300"
              />
              <div>
                <p className="font-bold text-slate-700 text-sm">دمج سعر التكلفة المرمز</p>
                <p className="text-xs text-slate-500">للمراجعة السريعة أثناء الجرد</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer">
              <input 
                type="checkbox"
                checked={config.includeExpiry || false}
                onChange={(e) => handleChange('includeExpiry', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded-md border-slate-300"
              />
              <div>
                <p className="font-bold text-slate-700 text-sm">دمج تاريخ الصلاحية</p>
                <p className="text-xs text-slate-500">يضيف 4 خانات (MMYY) للباركود</p>
              </div>
            </label>
          </div>
        )}

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">تسلسلات مخصصة للأقسام والمنتجات</h3>
              <p className="text-xs text-slate-500">تخصيص بادئة وبداية تسلسل لمنتجات أو أقسام معينة</p>
            </div>
            <button 
              onClick={() => {
                const updated = [...(config.productSequences || []), { targetId: '', targetType: 'category' as const, prefix: '', currentSequence: 1 }];
                handleChange('productSequences', updated);
              }}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors"
            >
              + إضافة تسلسل مخصص
            </button>
          </div>

          {(config.productSequences || []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-2 text-xs font-semibold text-slate-500">النوع</th>
                    <th className="pb-2 text-xs font-semibold text-slate-500">معرف القسم/المنتج ID</th>
                    <th className="pb-2 text-xs font-semibold text-slate-500">البادئة (Prefix)</th>
                    <th className="pb-2 text-xs font-semibold text-slate-500">تُحتسب كالتالي</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {config.productSequences?.map((seq, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="py-3 px-2">
                        <select
                          value={seq.targetType}
                          onChange={(e) => {
                            const updated = [...config.productSequences!];
                            updated[index].targetType = e.target.value as any;
                            handleChange('productSequences', updated);
                          }}
                          className="px-2 py-1 border border-slate-200 rounded text-sm w-24"
                        >
                          <option value="category">قسم</option>
                          <option value="product">منتج مميز</option>
                        </select>
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          value={seq.targetId}
                          onChange={(e) => {
                            const updated = [...config.productSequences!];
                            updated[index].targetId = e.target.value;
                            handleChange('productSequences', updated);
                          }}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                          placeholder="مثلاً: CAT-1 أو PROD-99"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          value={seq.prefix}
                          onChange={(e) => {
                            const updated = [...config.productSequences!];
                            updated[index].prefix = e.target.value;
                            handleChange('productSequences', updated);
                          }}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-sm text-left"
                          dir="ltr"
                          placeholder="مثلاً: X- or Y-"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500">ترقيم تلقائي يبدأ بـ:</span>
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-mono">{seq.prefix}00001</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => {
                            const updated = [...config.productSequences!];
                            updated.splice(index, 1);
                            handleChange('productSequences', updated);
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              <p className="text-slate-500 text-sm">ليس هناك تسلسلات مخصصة.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
