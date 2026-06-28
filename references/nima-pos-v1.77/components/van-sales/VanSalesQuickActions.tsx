import React from 'react';
import { Truck, Users, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VanSalesQuickActionsProps {
  onManageVehicles?: () => void;
  onManageInventory?: () => void;
}

const VanSalesQuickActions: React.FC<VanSalesQuickActionsProps> = ({ onManageVehicles, onManageInventory }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-900 mb-4">إجراءات سريعة</h3>
      <div className="space-y-2">
        <button 
          onClick={onManageVehicles}
          className="w-full text-right px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-2"
        >
          <Truck className="w-4 h-4 text-slate-400" /> إدارة السيارات
        </button>
        <button 
          onClick={() => navigate('/employees')}
          className="w-full text-right px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-2"
        >
          <Users className="w-4 h-4 text-slate-400" /> إدارة السائقين
        </button>
        <button 
          onClick={onManageInventory}
          className="w-full text-right px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-2"
        >
          <Package className="w-4 h-4 text-slate-400" /> نقل مخزون السيارات
        </button>
      </div>
    </div>
  );
};

export default VanSalesQuickActions;
