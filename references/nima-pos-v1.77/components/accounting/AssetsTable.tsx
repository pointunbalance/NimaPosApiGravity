import React from 'react';
import { Calendar, Wrench, Trash2 } from 'lucide-react';
import { FixedAsset } from '../../types';

interface ExtendedAsset extends FixedAsset {
  category?: string;
  serialNumber?: string;
  location?: string;
  monthly?: number;
  bookValue?: number;
  isFullyDepreciated?: boolean;
}

interface AssetsTableProps {
  filteredAssets: ExtendedAsset[] | undefined;
  getCategoryIcon: (cat?: string) => React.ReactNode;
  getCategoryLabel: (cat?: string) => string;
  formatCurrency: (val: number) => string;
  openModal: (asset: ExtendedAsset) => void;
  handleDelete: (id: number) => void;
}

const AssetsTable: React.FC<AssetsTableProps> = ({
  filteredAssets,
  getCategoryIcon,
  getCategoryLabel,
  formatCurrency,
  openModal,
  handleDelete
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm print:border-black print:shadow-none print:bg-white">
      <table className="w-full text-right text-sm">
        <thead className="bg-slate-50 text-slate-500 font-bold border-b print:bg-white print:text-black print:border-black">
          <tr>
            <th className="p-4">اسم الأصل</th>
            <th className="p-4">الفئة</th>
            <th className="p-4">تاريخ الشراء</th>
            <th className="p-4">التكلفة</th>
            <th className="p-4">إهلاك (شهري)</th>
            <th className="p-4">القيمة الدفترية</th>
            <th className="p-4 text-center">الحالة</th>
            <th className="p-4 print:hidden">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 print:divide-black">
          {filteredAssets?.map(asset => (
            <tr key={asset.id} className="hover:bg-slate-50 group print:bg-white">
              <td className="p-4">
                <div>
                  <p className="font-bold text-slate-800 print:text-black">{asset.name}</p>
                  {asset.serialNumber && <p className="text-[10px] text-slate-400 font-mono print:text-black">SN: {asset.serialNumber}</p>}
                </div>
              </td>
              <td className="p-4">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg w-fit print:bg-white print:text-black print:border print:border-black">
                  {getCategoryIcon(asset.category)}
                  {getCategoryLabel(asset.category)}
                </span>
              </td>
              <td className="p-4 text-slate-500 font-medium print:text-black">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 print:hidden" />
                  {new Date(asset.purchaseDate).toLocaleDateString()}
                </div>
              </td>
              <td className="p-4 font-bold text-slate-800 print:text-black">{formatCurrency(asset.cost)}</td>
              <td className="p-4 text-orange-600 font-bold print:text-black">{formatCurrency(asset.monthly || 0)}</td>
              <td className="p-4">
                <div className="flex flex-col">
                  <span className="font-black text-emerald-600 print:text-black">{formatCurrency(asset.bookValue || 0)}</span>
                  <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden print:hidden">
                    <div className="h-full bg-indigo-500" style={{width: `${((asset.bookValue || 0) / asset.cost) * 100}%`}}></div>
                  </div>
                </div>
              </td>
              <td className="p-4 text-center">
                {asset.isFullyDepreciated ? (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded font-bold border border-gray-200 print:bg-white print:text-black print:border-black">
                    مُهلك بالكامل
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-bold border border-emerald-100 print:bg-white print:text-black print:border-black">
                    نشط
                  </span>
                )}
              </td>
              <td className="p-4 print:hidden">
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(asset)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Wrench className="w-4 h-4"/></button>
                  <button onClick={() => handleDelete(asset.id!)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                </div>
              </td>
            </tr>
          ))}
          {filteredAssets?.length === 0 && (
            <tr><td colSpan={8} className="p-8 text-center text-gray-400">لا توجد أصول مطابقة</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AssetsTable;
