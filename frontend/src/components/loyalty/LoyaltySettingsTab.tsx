import React from 'react';
import { Settings, Award, Plus, Trash2, Save } from 'lucide-react';
import { LoyaltySettings, LoyaltyTier } from '../../types';

interface LoyaltySettingsTabProps {
  loyaltyConfig: LoyaltySettings;
  setLoyaltyConfig: (config: LoyaltySettings) => void;
  currency: string;
  onSave: () => void;
  addTier: () => void;
  updateTier: (id: string, field: keyof LoyaltyTier, value: any) => void;
  removeTier: (id: string) => void;
}

const LoyaltySettingsTab: React.FC<LoyaltySettingsTabProps> = ({
  loyaltyConfig,
  setLoyaltyConfig,
  currency,
  onSave,
  addTier,
  updateTier,
  removeTier,
}) => {
  return (
    <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-sm border border-indigo-100/10 p-6 space-y-8 animate-in fade-in font-['Tajawal']">
      {/* Main Toggle */}
      <div className="flex items-center justify-between border-b border-indigo-50/30 pb-6 bg-white/40 p-4 rounded-2xl">
        <div>
          <h3 className="text-lg font-black text-slate-800">تفعيل برنامج الولاء والنقاط</h3>
          <p className="text-slate-500 font-bold text-xs mt-1">السماح للعملاء باكتساب النقاط عند الشراء واستبدالها بخصومات نقدية.</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={loyaltyConfig.enabled}
            onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, enabled: e.target.checked })}
          />
          <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      <div className={`space-y-8 transition-all duration-300 ${!loyaltyConfig.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
        {/* Basic Settings */}
        <div>
          <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-sm">
            <Settings className="w-5 h-5 text-indigo-400 stroke-[2]" />
            الإعدادات الأساسية واكتساب النقاط
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700">المبلغ المطلوب لنقطة واحدة</label>
              <div className="relative">
                <input
                  type="number"
                  onFocus={(e) => e.target.select()}
                  value={loyaltyConfig.pointsPerCurrency}
                  onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, pointsPerCurrency: Number(e.target.value) })}
                  className="w-full pl-12 pr-4 py-2.5 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-extrabold text-sm"
                  min="1"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{currency}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700">قيمة النقطة عند الاستبدال</label>
              <div className="relative">
                <input
                  type="number"
                  onFocus={(e) => e.target.select()}
                  step="0.01"
                  value={loyaltyConfig.currencyPerPoint}
                  onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, currencyPerPoint: Number(e.target.value) })}
                  className="w-full pl-12 pr-4 py-2.5 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-extrabold text-sm"
                  min="0.01"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{currency}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700">الحد الأدنى للاستبدال</label>
              <input
                type="number"
                onFocus={(e) => e.target.select()}
                value={loyaltyConfig.minPointsToRedeem}
                onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, minPointsToRedeem: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-extrabold text-sm"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700">مكافأة التسجيل (نقاط ترحيبية)</label>
              <input
                type="number"
                onFocus={(e) => e.target.select()}
                value={loyaltyConfig.welcomeBonus}
                onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, welcomeBonus: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-extrabold text-sm"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Tiers Settings */}
        <div className="border-t border-indigo-50/40 pt-8">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-black text-slate-800 flex items-center gap-2 text-sm">
              <Award className="w-5 h-5 text-indigo-400 stroke-[2]" />
              مستويات الولاء والعضويات (Tiers)
            </h4>
            <label className="relative inline-flex items-center cursor-pointer">
              <span className="ml-3 text-xs font-black text-slate-600">تفعيل مستويات العضويات</span>
              <input
                type="checkbox"
                className="sr-only peer"
                checked={loyaltyConfig.enableTiers}
                onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, enableTiers: e.target.checked })}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {loyaltyConfig.enableTiers && (
            <div className="space-y-4">
              {loyaltyConfig.tiers.map((tier) => (
                <div key={tier.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-white/40 p-4 rounded-2xl border border-indigo-100/40 shadow-sm animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex-1">
                    <label className="block text-[10px] font-black text-slate-500 mb-1">اسم مستوى العضوية</label>
                    <input
                      type="text"
                      value={tier.name}
                      onChange={(e) => updateTier(tier.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs font-bold"
                      placeholder="مثال: ذهبي، بلاتيني..."
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <label className="block text-[10px] font-black text-slate-500 mb-1">الحد الأدنى للنقاط</label>
                    <input
                      type="number"
                      onFocus={(e) => e.target.select()}
                      value={tier.minPoints}
                      onChange={(e) => updateTier(tier.id, 'minPoints', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs font-extrabold"
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <label className="block text-[10px] font-black text-slate-500 mb-1">مضاعف نقاط الشراء</label>
                    <div className="relative">
                      <input
                        type="number"
                        onFocus={(e) => e.target.select()}
                        step="0.1"
                        value={tier.multiplier}
                        onChange={(e) => updateTier(tier.id, 'multiplier', Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs font-extrabold"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">x</span>
                    </div>
                  </div>
                  <div className="w-full sm:w-24">
                    <label className="block text-[10px] font-black text-slate-500 mb-1">اللون الدلالي</label>
                    <input
                      type="color"
                      value={tier.color}
                      onChange={(e) => updateTier(tier.id, 'color', e.target.value)}
                      className="w-full h-9 p-1 bg-white border border-indigo-100 rounded-xl cursor-pointer"
                    />
                  </div>
                  <div className="pt-2 sm:pt-4 flex justify-end">
                    <button
                      onClick={() => removeTier(tier.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all cursor-pointer"
                      title="حذف المستوى"
                    >
                      <Trash2 className="w-5 h-5 stroke-[2]" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={addTier}
                className="text-indigo-600 hover:text-indigo-700 font-black text-xs flex items-center gap-1.5 hover:underline transition-colors mt-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                إضافة مستوى جديد
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-indigo-50/40">
        <button
          onClick={onSave}
          className="bg-gradient-to-br from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white px-8 py-3 rounded-2xl font-black shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Save className="w-5 h-5 stroke-[2.5]" />
          حفظ إعدادات برنامج الولاء
        </button>
      </div>
    </div>
  );
};

export default LoyaltySettingsTab;
