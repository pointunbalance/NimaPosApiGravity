import React from 'react';
import { Store, Plus, MapPin, Edit, Trash2 } from 'lucide-react';
import { Warehouse as IWarehouse } from '../../types';

interface WarehouseSidebarProps {
  warehouses: IWarehouse[] | undefined;
  selectedWarehouseId: number | null;
  setSelectedWarehouseId: (id: number) => void;
  handleOpenWarehouseModal: (wh?: IWarehouse) => void;
  handleDeleteWarehouse: (id: number) => void;
}

const WarehouseSidebar: React.FC<WarehouseSidebarProps> = ({
  warehouses,
  selectedWarehouseId,
  setSelectedWarehouseId,
  handleOpenWarehouseModal,
  handleDeleteWarehouse,
}) => {
  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full z-10 shadow-sm shrink-0">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
        <h2 className="font-black text-xl text-slate-800 flex items-center gap-3">
          <Store className="w-6 h-6 text-indigo-600" />
          المخازن
        </h2>
        <button
          onClick={() => handleOpenWarehouseModal()}
          className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
          title="إضافة مخزن جديد"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {warehouses?.map((wh) => (
          <button
            key={wh.id}
            onClick={() => setSelectedWarehouseId(wh.id!)}
            className={`w-full text-right p-4 rounded-2xl transition-all border-2 flex flex-col gap-2 group relative overflow-hidden ${
              selectedWarehouseId === wh.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]'
                : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/30'
            }`}
          >
            <div className="flex justify-between items-center w-full relative z-10">
              <span className="font-bold text-base">{wh.name}</span>
              {wh.isMain && (
                <span
                  className={`text-[10px] px-2 py-1 rounded-lg font-bold tracking-wide ${
                    selectedWarehouseId === wh.id
                      ? 'bg-white/20 text-white'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  رئيسي
                </span>
              )}
            </div>
            {wh.address && (
              <div
                className={`flex items-center gap-1.5 text-xs relative z-10 ${
                  selectedWarehouseId === wh.id ? 'text-indigo-100' : 'text-slate-400'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate">{wh.address}</span>
              </div>
            )}
            {selectedWarehouseId === wh.id && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-1">
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenWarehouseModal(wh);
                  }}
                  className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg cursor-pointer"
                  title="تعديل"
                >
                  <Edit className="w-4 h-4 text-white" />
                </span>
                {!wh.isMain && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteWarehouse(wh.id!);
                    }}
                    className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </span>
                )}
              </div>
            )}
          </button>
        ))}
        {warehouses?.length === 0 && (
          <div className="text-center p-8 text-slate-400">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">لا توجد مخازن مضافة</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseSidebar;
