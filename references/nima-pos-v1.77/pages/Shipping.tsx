import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Shipment, ShipmentItem, Container } from '../types';
import { Ship, Plus, Search, Edit, Trash2, Package, Calculator, DollarSign, Calendar } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';

export const Shipping: React.FC = () => {
  const { success, error: showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; id: number } | null>(null);

  const shipments = useLiveQuery(() => db.shipments.toArray());
  const suppliers = useLiveQuery(() => db.suppliers.toArray());
  const products = useLiveQuery(() => db.products.toArray());

  const [formData, setFormData] = useState<Partial<Shipment>>({
    shipmentNumber: '',
    supplierId: 0,
    supplierName: '',
    billOfLading: '',
    originPort: '',
    destinationPort: '',
    status: 'pending',
    containers: [],
    items: [],
    goodsValue: 0,
    shippingCost: 0,
    insuranceCost: 0,
    customsDuties: 0,
    clearanceFees: 0,
    otherCosts: 0,
    totalLandedCost: 0,
    notes: ''
  });

  const calculateTotalLandedCost = (data: Partial<Shipment>) => {
    return (
      (data.goodsValue || 0) +
      (data.shippingCost || 0) +
      (data.insuranceCost || 0) +
      (data.customsDuties || 0) +
      (data.clearanceFees || 0) +
      (data.otherCosts || 0)
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'supplierId') {
      const supplier = suppliers?.find(s => s.id === Number(value));
      setFormData(prev => ({
        ...prev,
        supplierId: Number(value),
        supplierName: supplier ? supplier.name : ''
      }));
      return;
    }

    const numericFields = ['goodsValue', 'shippingCost', 'insuranceCost', 'customsDuties', 'clearanceFees', 'otherCosts'];
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: numericFields.includes(name) ? Number(value) : value
      };
      
      if (numericFields.includes(name)) {
        updated.totalLandedCost = calculateTotalLandedCost(updated);
      }
      
      return updated;
    });
  };

  const handleDateChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value ? new Date(value) : undefined
    }));
  };

  const handleAddContainer = () => {
    setFormData(prev => ({
      ...prev,
      containers: [...(prev.containers || []), { containerNumber: '', type: '20ft' }]
    }));
  };

  const handleContainerChange = (index: number, field: keyof Container, value: string | number) => {
    setFormData(prev => {
      const newContainers = [...(prev.containers || [])];
      newContainers[index] = { ...newContainers[index], [field]: value };
      return { ...prev, containers: newContainers };
    });
  };

  const handleRemoveContainer = (index: number) => {
    setFormData(prev => {
      const newContainers = [...(prev.containers || [])];
      newContainers.splice(index, 1);
      return { ...prev, containers: newContainers };
    });
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), { productId: 0, productName: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]
    }));
  };

  const handleItemChange = (index: number, field: keyof ShipmentItem, value: string | number) => {
    setFormData(prev => {
      const newItems = [...(prev.items || [])];
      
      if (field === 'productId') {
        const product = products?.find(p => p.id === Number(value));
        newItems[index] = {
          ...newItems[index],
          productId: Number(value),
          productName: product ? product.name : '',
          unitPrice: product ? product.costPrice || 0 : 0,
          totalPrice: (product ? product.costPrice || 0 : 0) * newItems[index].quantity
        };
      } else {
        newItems[index] = { ...newItems[index], [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
           newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
        }
      }
      
      const goodsValue = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const updated = { ...prev, items: newItems, goodsValue };
      updated.totalLandedCost = calculateTotalLandedCost(updated);
      
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => {
      const newItems = [...(prev.items || [])];
      newItems.splice(index, 1);
      const goodsValue = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const updated = { ...prev, items: newItems, goodsValue };
      updated.totalLandedCost = calculateTotalLandedCost(updated);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const shipmentData: Shipment = {
        ...(formData as Shipment),
        createdAt: editingShipment ? editingShipment.createdAt : new Date(),
        updatedAt: new Date()
      };

      if (editingShipment && editingShipment.id) {
        const { id, ...updateData } = shipmentData;
        await db.shipments.update(editingShipment.id, updateData);
        success('تم تحديث بيانات الشحنة بنجاح');
      } else {
        await db.shipments.add(shipmentData);
        success('تم تسجيل الشحنة الجديدة بنجاح');
      }
      closeModal();
    } catch (error) {
      console.error('Error saving shipment:', error);
      showError('حدث خطأ أثناء حفظ الشحنة');
    }
  };

  const handleEdit = (shipment: Shipment) => {
    setEditingShipment(shipment);
    setFormData({ ...shipment });
    setIsModalOpen(true);
  };

  const confirmDelete = (id: number) => {
    setConfirmConfig({ isOpen: true, id });
  };

  const handleDelete = async () => {
    if (!confirmConfig) return;
    try {
      await db.shipments.delete(confirmConfig.id);
      success('تم حذف الشحنة بنجاح');
    } catch (err) {
      console.error(err);
      showError('فشل في حذف الشحنة');
    }
    setConfirmConfig(null);
  };


  const closeModal = () => {
    setIsModalOpen(false);
    setEditingShipment(null);
    setFormData({
      shipmentNumber: '',
      supplierId: 0,
      supplierName: '',
      billOfLading: '',
      originPort: '',
      destinationPort: '',
      status: 'pending',
      containers: [],
      items: [],
      goodsValue: 0,
      shippingCost: 0,
      insuranceCost: 0,
      customsDuties: 0,
      clearanceFees: 0,
      otherCosts: 0,
      totalLandedCost: 0,
      notes: ''
    });
  };

  const filteredShipments = shipments?.filter(s => 
    s.shipmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.billOfLading.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string, color: string }> = {
      pending: { label: 'قيد الانتظار', color: 'bg-gray-100 text-gray-800' },
      in_transit: { label: 'في الطريق', color: 'bg-blue-100 text-blue-800' },
      arrived: { label: 'وصلت', color: 'bg-indigo-100 text-indigo-800' },
      customs: { label: 'في الجمارك', color: 'bg-yellow-100 text-yellow-800' },
      cleared: { label: 'مخلصة جمركياً', color: 'bg-green-100 text-green-800' },
      delivered: { label: 'تم الاستلام', color: 'bg-emerald-100 text-emerald-800' }
    };
    const mapped = statusMap[status] || statusMap.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${mapped.color}`}>{mapped.label}</span>;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Ship className="w-6 h-6 text-indigo-600" />
          إدارة الشحن والتخليص الجمركي
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          شحنة جديدة
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="بحث برقم الشحنة، بوليصة الشحن، أو المورد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">رقم الشحنة</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">المورد</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">بوليصة الشحن</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">الوصول المتوقع</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">الحالة</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">التكلفة الإجمالية</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredShipments?.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{shipment.shipmentNumber}</div>
                    <div className="text-xs text-gray-500">{shipment.originPort} ➔ {shipment.destinationPort}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-800">{shipment.supplierName}</td>
                  <td className="px-6 py-4 text-gray-600">{shipment.billOfLading}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {shipment.expectedArrivalDate ? new Date(shipment.expectedArrivalDate).toLocaleDateString('ar-EG') : '-'}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(shipment.status)}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {shipment.totalLandedCost.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(shipment)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => shipment.id && confirmDelete(shipment.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredShipments?.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    لا توجد شحنات مطابقة للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">
                {editingShipment ? 'تعديل شحنة' : 'إضافة شحنة جديدة'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Basic Info */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-500" />
                  البيانات الأساسية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">رقم الشحنة</label>
                    <input
                      type="text"
                      name="shipmentNumber"
                      required
                      value={formData.shipmentNumber}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المورد</label>
                    <select
                      name="supplierId"
                      required
                      value={formData.supplierId}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">اختر المورد...</option>
                      {suppliers?.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">بوليصة الشحن (B/L)</label>
                    <input
                      type="text"
                      name="billOfLading"
                      required
                      value={formData.billOfLading}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ميناء الشحن</label>
                    <input
                      type="text"
                      name="originPort"
                      value={formData.originPort}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ميناء الوصول</label>
                    <input
                      type="text"
                      name="destinationPort"
                      value={formData.destinationPort}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="pending">قيد الانتظار</option>
                      <option value="in_transit">في الطريق</option>
                      <option value="arrived">وصلت الميناء</option>
                      <option value="customs">في الجمارك</option>
                      <option value="cleared">مخلصة جمركياً</option>
                      <option value="delivered">تم الاستلام</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ المغادرة</label>
                    <input
                      type="date"
                      value={formData.departureDate ? new Date(formData.departureDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleDateChange('departureDate', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الوصول المتوقع</label>
                    <input
                      type="date"
                      value={formData.expectedArrivalDate ? new Date(formData.expectedArrivalDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleDateChange('expectedArrivalDate', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الوصول الفعلي</label>
                    <input
                      type="date"
                      value={formData.actualArrivalDate ? new Date(formData.actualArrivalDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleDateChange('actualArrivalDate', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </section>

              {/* Containers */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Ship className="w-5 h-5 text-indigo-500" />
                    الحاويات
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddContainer}
                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> إضافة حاوية
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.containers?.map((container, index) => (
                    <div key={index} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="رقم الحاوية"
                          value={container.containerNumber}
                          onChange={(e) => handleContainerChange(index, 'containerNumber', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="w-32">
                        <select
                          value={container.type}
                          onChange={(e) => handleContainerChange(index, 'type', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        >
                          <option value="20ft">20 قدم</option>
                          <option value="40ft">40 قدم</option>
                          <option value="40ft HC">40 قدم HC</option>
                          <option value="LCL">تجميع (LCL)</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="رقم الختم (Seal)"
                          value={container.sealNumber || ''}
                          onChange={(e) => handleContainerChange(index, 'sealNumber', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveContainer(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  {formData.containers?.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-2">لم يتم إضافة حاويات</p>
                  )}
                </div>
              </section>

              {/* Items */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Package className="w-5 h-5 text-indigo-500" />
                    الأصناف
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> إضافة صنف
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.items?.map((item, index) => (
                    <div key={index} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex-2 min-w-[200px]">
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        >
                          <option value="0">اختر الصنف...</option>
                          {products?.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          placeholder="الكمية"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="سعر الوحدة"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="w-32 font-bold text-gray-700 text-center">
                        {item.totalPrice.toLocaleString()}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  {formData.items?.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-2">لم يتم إضافة أصناف</p>
                  )}
                </div>
              </section>

              {/* Costs & Landed Cost */}
              <section className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  حساب تكلفة الشحن (Landed Cost)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-indigo-800 mb-1">قيمة البضاعة (FOB)</label>
                    <input
                      type="number"
                      name="goodsValue"
                      readOnly
                      value={formData.goodsValue}
                      className="w-full p-2 border border-indigo-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-indigo-800 mb-1">تكلفة الشحن (Freight)</label>
                    <input
                      type="number"
                      name="shippingCost"
                      min="0"
                      value={formData.shippingCost}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-indigo-800 mb-1">التأمين</label>
                    <input
                      type="number"
                      name="insuranceCost"
                      min="0"
                      value={formData.insuranceCost}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-indigo-800 mb-1">الرسوم الجمركية</label>
                    <input
                      type="number"
                      name="customsDuties"
                      min="0"
                      value={formData.customsDuties}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-indigo-800 mb-1">مصاريف التخليص</label>
                    <input
                      type="number"
                      name="clearanceFees"
                      min="0"
                      value={formData.clearanceFees}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-indigo-800 mb-1">مصاريف أخرى</label>
                    <input
                      type="number"
                      name="otherCosts"
                      min="0"
                      value={formData.otherCosts}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-indigo-200">
                  <span className="text-lg font-bold text-indigo-900">إجمالي التكلفة (Total Landed Cost):</span>
                  <span className="text-2xl font-black text-indigo-700 flex items-center gap-1">
                    {formData.totalLandedCost?.toLocaleString()}
                  </span>
                </div>
              </section>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  حفظ الشحنة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title="حذف الشحنة"
          message="هل أنت متأكد من حذف هذه الشحنة نهائياً من سجلات الشحن والتخليص الجمركي؟ لا يمكن التراجع عن هذا الإجراء."
          onConfirm={handleDelete}
          onCancel={() => setConfirmConfig(null)}
          confirmText="تأكيد الحذف"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
};

export default Shipping;
