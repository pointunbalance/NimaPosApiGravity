import React from 'react';
import { Settings, Edit, Trash2, Printer, MessageCircle, ChevronDown } from 'lucide-react';
import { MaintenanceOrder, MaintenanceStatus } from '../../types';

interface MaintenanceListProps {
  orders: MaintenanceOrder[];
  statusMap: Record<MaintenanceStatus, { label: string; color: string; icon: React.ReactNode }>;
  onEdit: (order: MaintenanceOrder) => void;
  onDelete: (id: number) => void;
  onPrint: (order: MaintenanceOrder) => void;
  onStatusChange: (id: number, newStatus: MaintenanceStatus) => void;
}

const MaintenanceList: React.FC<MaintenanceListProps> = ({
  orders,
  statusMap,
  onEdit,
  onDelete,
  onPrint,
  onStatusChange
}) => {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
        <Settings className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-700 mb-2">لا توجد أوامر صيانة</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          لم يتم العثور على أوامر صيانة تطابق بحثك، أو لم تقم بإضافة أي أوامر بعد.
        </p>
      </div>
    );
  }

  const handleWhatsApp = (phone: string, order: MaintenanceOrder) => {
    const deviceDetails = [order.deviceBrand, order.deviceType, order.deviceModel].filter(Boolean).join(' - ');
    const message = `مرحباً ${order.customerName}،\nبخصوص جهازك (${deviceDetails}) الموجود لدينا للصيانة.\nحالة الطلب الحالية: ${statusMap[order.status].label}\nرقم الطلب: #${order.id}\nشكراً لتعاملكم معنا.`;
    const whatsappUrl = `https://wa.me/${phone.replace(/^0+/, '20')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {orders.map(order => (
        <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">{order.customerName}</h3>
              <p className="text-slate-500 text-sm">{order.customerPhone}</p>
            </div>
            <div className="relative group">
              <button className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${statusMap[order.status].color} hover:opacity-80 transition-opacity`}>
                {statusMap[order.status].icon}
                {statusMap[order.status].label}
                <ChevronDown className="w-3 h-3 ml-1" />
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <div className="py-2">
                  {(Object.keys(statusMap) as MaintenanceStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => onStatusChange(order.id!, status)}
                      className={`w-full text-right px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 ${order.status === status ? 'bg-slate-50 font-bold' : ''}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${statusMap[status].color.split(' ')[0]}`}></span>
                      {statusMap[status].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">الجهاز:</span>
              <span className="font-medium text-slate-700">
                {[order.deviceBrand, order.deviceType, order.deviceModel].filter(Boolean).join(' - ')}
              </span>
            </div>
            {order.maintenanceType && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">نوع الصيانة:</span>
                <span className="font-medium text-slate-700">{order.maintenanceType}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">العطل:</span>
              <span className="font-medium text-slate-700 truncate max-w-[150px]" title={order.issueDescription}>{order.issueDescription}</span>
            </div>
            {order.technicianName && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">الفني:</span>
                <span className="font-medium text-slate-700">{order.technicianName}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">التكلفة المتوقعة:</span>
              <span className="font-medium text-brand-600">{order.expectedCost} ج.م</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">التاريخ:</span>
              <span className="font-medium text-slate-700">{new Date(order.date).toLocaleDateString('ar-EG')}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button 
              onClick={() => handleWhatsApp(order.customerPhone, order)}
              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="مراسلة عبر واتساب"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button 
              onClick={() => onPrint(order)}
              className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              title="طباعة إيصال"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button 
              onClick={() => onEdit(order)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="تعديل"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button 
              onClick={() => onDelete(order.id!)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="حذف"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MaintenanceList;
