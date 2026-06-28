import React from 'react';
import { Monitor, Plus, Trash2 } from 'lucide-react';
import { FixedAsset } from '../../types';

interface FixedAssetsListProps {
  assets: FixedAsset[] | undefined;
  totalFixedAssets: number;
  formatCurrency: (amount: number) => string;
  setIsAssetModalOpen: (val: boolean) => void;
  handleDeleteAsset: (id: number) => void;
}

const FixedAssetsList: React.FC<FixedAssetsListProps> = ({
  assets,
  totalFixedAssets,
  formatCurrency,
  setIsAssetModalOpen,
  handleDeleteAsset
}) => {
  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col print:border-none print:shadow-none">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-violet-500" />
          الأصول الثابتة (معدات، ديكور...)
        </h3>
        <button onClick={() => setIsAssetModalOpen(true)} className="p-2 bg-violet-50 text-violet-600 rounded-lg hover:bg-violet-100 print:hidden">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 flex-1 overflow-y-auto max-h-[300px]">
        {assets && assets.length > 0 ? (
          <div className="space-y-3">
            {assets.map(asset => (
              <div key={asset.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="font-bold text-gray-800 text-sm">{asset.name}</p>
                  <p className="text-[10px] text-gray-400">{new Date(asset.purchaseDate).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-violet-700">{formatCurrency(asset.value)}</span>
                  <button onClick={() => handleDeleteAsset(asset.id!)} className="text-red-400 hover:text-red-600 print:hidden"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t mt-2 flex justify-between text-sm font-bold text-slate-800">
              <span>الإجمالي</span>
              <span>{formatCurrency(totalFixedAssets)}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400 text-sm">
            لا توجد أصول ثابتة مسجلة. اضغط + للإضافة.
          </div>
        )}
      </div>
    </div>
  );
};

export default FixedAssetsList;
