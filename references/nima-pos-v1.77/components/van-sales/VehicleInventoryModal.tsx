import React, { useState } from 'react';
import { Vehicle, Product } from '../../types';
import { X, Package, Plus, Minus, Check } from 'lucide-react';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';

interface VehicleInventoryModalProps {
  onClose: () => void;
  vehicles: Vehicle[];
}

const VehicleInventoryModal: React.FC<VehicleInventoryModalProps> = ({ onClose, vehicles }) => {
  const products = useLiveQuery(() => db.products.toArray());
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(0);
  const [transferQuantities, setTransferQuantities] = useState<Record<number, number>>({});

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  const handleQuantityChange = (productId: number, change: number) => {
    setTransferQuantities(prev => {
      const current = prev[productId] || 0;
      return { ...prev, [productId]: current + change };
    });
  };

  const handleSave = async () => {
    if (!selectedVehicle || !selectedVehicle.id) return;

    try {
      const currentInventory = selectedVehicle.inventory || [];
      const newInventory = [...currentInventory];

      for (const [productId, quantity] of Object.entries(transferQuantities)) {
        const pId = parseInt(productId);
        if (quantity === 0) continue;

        const existingItemIndex = newInventory.findIndex(item => item.productId === pId);
        
        if (existingItemIndex >= 0) {
          newInventory[existingItemIndex].quantity += quantity;
          if (newInventory[existingItemIndex].quantity < 0) newInventory[existingItemIndex].quantity = 0;
        } else if (quantity > 0) {
          newInventory.push({ productId: pId, quantity });
        }

        // Update main product stock
        const product = await db.products.get(pId);
        if (product) {
          await db.products.update(pId, { stock: product.stock - quantity });
        }
      }

      await db.vehicles.update(selectedVehicle.id, { inventory: newInventory });
      setTransferQuantities({});
      alert('تم تحديث المخزون بنجاح');
    } catch (error) {
      console.error('Error updating vehicle inventory:', error);
      alert('حدث خطأ أثناء تحديث المخزون');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-600" />
            نقل مخزون السيارات
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">اختر السيارة</label>
            <select
              value={selectedVehicleId}
              onChange={(e) => {
                setSelectedVehicleId(parseInt(e.target.value));
                setTransferQuantities({});
              }}
              className="w-full md:w-1/2 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value={0}>اختر سيارة...</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.plateNumber} - {v.make} {v.model}</option>
              ))}
            </select>
          </div>

          {selectedVehicle && (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600">المنتج</th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600">المخزون الرئيسي</th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600">مخزون السيارة</th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600 w-48 text-center">نقل الكمية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products?.map(product => {
                    const vehicleStock = selectedVehicle.inventory?.find(i => i.productId === product.id)?.quantity || 0;
                    const transferQty = transferQuantities[product.id!] || 0;
                    
                    return (
                      <tr key={product.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">{product.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{product.stock}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{vehicleStock}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleQuantityChange(product.id!, -1)}
                              disabled={vehicleStock + transferQty <= 0}
                              className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className={`w-8 text-center font-medium ${transferQty > 0 ? 'text-emerald-600' : transferQty < 0 ? 'text-red-600' : 'text-slate-700'}`}>
                              {transferQty > 0 ? `+${transferQty}` : transferQty}
                            </span>
                            <button 
                              onClick={() => handleQuantityChange(product.id!, 1)}
                              disabled={product.stock - transferQty <= 0}
                              className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium"
          >
            إغلاق
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedVehicle || Object.values(transferQuantities).every(q => q === 0)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            تأكيد النقل
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleInventoryModal;
