import React from 'react';
import { AppSettings } from '../../types';
import { Layers } from 'lucide-react';

const DEFAULT_CONFIGS = [
  { table: 'orders', label: 'طلبات نقاط البيع', defaultPrefix: 'POS' },
  { table: 'returns', label: 'المرتجعات', defaultPrefix: 'RET' },
  { table: 'quotations', label: 'عروض الأسعار', defaultPrefix: 'QT' },
  { table: 'b2bInvoices', label: 'فواتير الجملة', defaultPrefix: 'INV' },
  { table: 'consignments', label: 'المتعهدات / الأمانات', defaultPrefix: 'CSG' },
  { table: 'shipments', label: 'الشحنات', defaultPrefix: 'SHP' },
  { table: 'tickets', label: 'تذاكر الدعم الفني', defaultPrefix: 'TKT' },
  { table: 'purchases', label: 'فواتير المشتريات', defaultPrefix: 'PO' },
  { table: 'rfqs', label: 'طلبات عروض الأسعار (موردين)', defaultPrefix: 'RFQ' }
];

interface SequenceSettingsProps {
  formData: AppSettings;
  handleSettingChange: (key: keyof AppSettings, value: any) => void;
}

export const SequenceSettings: React.FC<SequenceSettingsProps> = ({ formData, handleSettingChange }) => {
  const configValues = formData.sequenceConfig || {};

  const handleChange = (table: string, field: string, value: any) => {
    handleSettingChange('sequenceConfig', {
      ...configValues,
      [table]: {
        ...(configValues[table] || { prefix: '', suffix: '', padding: 4, includeYearMonth: true }),
        [field]: value
      }
    });
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-black text-slate-800 text-lg">أرقام الفواتير وتسلسل المستندات</h2>
          <p className="text-slate-500 text-xs font-medium mt-1">تخصيص شكل تسلسل الفواتير والطلبات</p>
        </div>
      </div>

      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-3 text-sm font-semibold text-slate-500">نوع المستند</th>
                <th className="pb-3 text-sm font-semibold text-slate-500">البادئة (Prefix)</th>
                <th className="pb-3 text-sm font-semibold text-slate-500">سنة وشهر؟</th>
                <th className="pb-3 text-sm font-semibold text-slate-500">عدد الخانات (0000)</th>
                <th className="pb-3 text-sm font-semibold text-slate-500">اللاحقة (Suffix)</th>
                <th className="pb-3 text-sm font-semibold text-slate-500">مثال</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DEFAULT_CONFIGS.map(({ table, label, defaultPrefix }) => {
                const conf = configValues[table] || { prefix: defaultPrefix, includeYearMonth: true, padding: 4, suffix: '' };
                
                const pfx = conf.prefix !== undefined ? conf.prefix : defaultPrefix;
                const inclDate = conf.includeYearMonth !== false; // defaults to true
                const zeros = conf.padding || 4;
                const sfx = conf.suffix || '';
                
                // Generate an example string
                let example = pfx;
                if (inclDate) {
                  const d = new Date();
                  example += `-${d.getFullYear().toString().slice(-2)}${String(d.getMonth()+1).padStart(2, '0')}`;
                }
                example += `-${'1'.padStart(zeros, '0')}`;
                if (sfx) {
                  example += `-${sfx}`;
                }

                return (
                  <tr key={table} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-2 font-bold text-slate-700">{label}</td>
                    <td className="py-4 px-2">
                      <input 
                        type="text" 
                        value={pfx}
                        onChange={(e) => handleChange(table, 'prefix', e.target.value)}
                        className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-left focus:ring-2 focus:ring-indigo-100"
                        dir="ltr"
                      />
                    </td>
                    <td className="py-4 px-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={inclDate}
                          onChange={(e) => handleChange(table, 'includeYearMonth', e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-600">تضمين</span>
                      </label>
                    </td>
                    <td className="py-4 px-2">
                      <input 
                        type="number" 
                        min={1} 
                        max={10} 
                        value={zeros}
                        onChange={(e) => handleChange(table, 'padding', parseInt(e.target.value) || 4)}
                        className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100"
                      />
                    </td>
                    <td className="py-4 px-2">
                      <input 
                        type="text" 
                        value={sfx}
                        onChange={(e) => handleChange(table, 'suffix', e.target.value)}
                        placeholder="EX"
                        className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-left focus:ring-2 focus:ring-indigo-100"
                        dir="ltr"
                      />
                    </td>
                    <td className="py-4 px-2">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {example}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
