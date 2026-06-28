import React, { useState } from 'react';
import { Ship, Plus, Search, Edit, Trash2, Download, Printer, Eye } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useToast } from '../../context/ToastContext';
import ShipmentModal from '../../components/logistics/ShipmentModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { Shipment } from '../../types';

export const ImportExport: React.FC = () => {
  const { success, error: showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [shipmentToDelete, setShipmentToDelete] = useState<number | null>(null);

  const shipments = useLiveQuery(() => db.shipments.toArray()) || [];

  const handleSaveShipment = async (shipmentData: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingShipment?.id) {
        await db.shipments.update(editingShipment.id, {
          ...shipmentData,
          updatedAt: new Date()
        });
        success('تم تحديث الشحنة بنجاح');
      } else {
        await db.shipments.add({
          ...shipmentData,
          createdAt: new Date(),
          updatedAt: new Date()
        } as Shipment);
        success('تم إضافة الشحنة بنجاح');
      }
    } catch (err) {
      console.error('Error saving shipment:', err);
      showError('حدث خطأ أثناء حفظ الشحنة');
    }
  };

  const handleDeleteShipment = (id: number) => {
    setShipmentToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (shipmentToDelete !== null) {
      try {
        await db.shipments.delete(shipmentToDelete);
        success('تم حذف الشحنة بنجاح');
      } catch (err) {
        console.error('Error deleting shipment:', err);
        showError('حدث خطأ أثناء حذف الشحنة');
      } finally {
        setShipmentToDelete(null);
      }
    }
  };

  const openNewModal = () => {
    setEditingShipment(null);
    setIsModalOpen(true);
  };

  const openEditModal = (shipment: Shipment) => {
    setEditingShipment(shipment);
    setIsModalOpen(true);
  };

  const filteredShipments = shipments.filter(s => 
    s.shipmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.billOfLading.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-bold">قيد الانتظار</span>;
      case 'in_transit': return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">في الطريق</span>;
      case 'arrived': return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold">وصلت الميناء</span>;
      case 'customs': return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-bold">في الجمارك</span>;
      case 'cleared': return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">مخلصة جمركياً</span>;
      case 'delivered': return <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">تم التسليم</span>;
      default: return null;
    }
  };

  const handleExportCSV = () => {
    const headers = ['رقم الشحنة', 'المورد', 'بوليصة الشحن', 'ميناء المغادرة', 'ميناء الوصول', 'تاريخ الوصول المتوقع', 'الحالة', 'التكلفة الإجمالية'];
    const csvContent = [
      headers.join(','),
      ...filteredShipments.map(s => [
        `"${s.shipmentNumber}"`,
        `"${s.supplierName}"`,
        `"${s.billOfLading}"`,
        `"${s.originPort}"`,
        `"${s.destinationPort}"`,
        s.expectedArrivalDate ? new Date(s.expectedArrivalDate).toLocaleDateString('ar-EG') : '-',
        s.status,
        s.totalLandedCost.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shipments_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen transition-colors">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl">
            <Ship className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">إدارة الاستيراد والتصدير</h1>
            <p className="text-slate-500">تتبع الشحنات الدولية، الاعتمادات المستندية، والتخليص الجمركي</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button 
            onClick={handleExportCSV}
            className="flex-1 md:flex-none bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 font-bold"
          >
            <Download className="w-5 h-5" />
            <span>تصدير</span>
          </button>
          <button 
            onClick={() => window.print()}
            className="flex-1 md:flex-none bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 font-bold"
          >
            <Printer className="w-5 h-5" />
            <span>طباعة</span>
          </button>
          <button 
            onClick={openNewModal}
            className="flex-1 md:flex-none bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 shadow-lg shadow-cyan-200 transition-colors flex items-center justify-center gap-2 font-bold"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة شحنة</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث برقم الشحنة، المورد، بوليصة الشحن..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all text-slate-900 placeholder-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-slate-600 font-semibold">رقم الشحنة</th>
                <th className="p-4 text-slate-600 font-semibold">المورد</th>
                <th className="p-4 text-slate-600 font-semibold">بوليصة الشحن</th>
                <th className="p-4 text-slate-600 font-semibold">الوصول المتوقع</th>
                <th className="p-4 text-slate-600 font-semibold">التكلفة (Landed)</th>
                <th className="p-4 text-slate-600 font-semibold">الحالة</th>
                <th className="p-4 text-slate-600 font-semibold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShipments.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-800">{shipment.shipmentNumber}</td>
                  <td className="p-4 text-slate-600 font-medium">{shipment.supplierName}</td>
                  <td className="p-4 text-slate-600">{shipment.billOfLading}</td>
                  <td className="p-4 text-slate-600">
                    {shipment.expectedArrivalDate ? new Date(shipment.expectedArrivalDate).toLocaleDateString('ar-EG') : '-'}
                  </td>
                  <td className="p-4 text-slate-800 font-black">
                    {shipment.totalLandedCost.toFixed(2)} ر.س
                  </td>
                  <td className="p-4">{getStatusBadge(shipment.status)}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(shipment)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteShipment(shipment.id!)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredShipments.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Ship className="w-12 h-12 text-slate-300 mb-4" />
                      <p className="text-lg font-bold">لا توجد شحنات مسجلة.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ShipmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveShipment}
        initialData={editingShipment}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذه الشحنة؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsConfirmModalOpen(false);
          setShipmentToDelete(null);
        }}
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  );
};

export default ImportExport;
