import React, { useState, useEffect } from 'react';
import { X, Ship, Save, Plus, Trash2 } from 'lucide-react';
import { Shipment, ShipmentItem, Container } from '../../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { generateReferenceNumber } from '../../utils/generateReference';

interface ShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shipment: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: Shipment | null;
}

const ShipmentModal: React.FC<ShipmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) || [];
  const products = useLiveQuery(() => db.products.toArray()) || [];

  const [shipmentNumber, setShipmentNumber] = useState('');
  const [supplierId, setSupplierId] = useState<number>(0);
  const [billOfLading, setBillOfLading] = useState('');
  const [originPort, setOriginPort] = useState('');
  const [destinationPort, setDestinationPort] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [expectedArrivalDate, setExpectedArrivalDate] = useState('');
  const [actualArrivalDate, setActualArrivalDate] = useState('');
  const [status, setStatus] = useState<Shipment['status']>('pending');
  const [notes, setNotes] = useState('');

  // Import configuration
  const [incoterm, setIncoterm] = useState('CIF');
  const [currency, setCurrency] = useState('SAR');
  const [exchangeRate, setExchangeRate] = useState(1);

  // Costs
  const [shippingCost, setShippingCost] = useState(0);
  const [insuranceCost, setInsuranceCost] = useState(0);
  const [customsDuties, setCustomsDuties] = useState(0);
  const [clearanceFees, setClearanceFees] = useState(0);
  const [otherCosts, setOtherCosts] = useState(0);

  const [containers, setContainers] = useState<Container[]>([]);
  const [items, setItems] = useState<ShipmentItem[]>([]);

  useEffect(() => {
    if (initialData) {
      setShipmentNumber(initialData.shipmentNumber);
      setSupplierId(initialData.supplierId);
      setBillOfLading(initialData.billOfLading);
      setOriginPort(initialData.originPort);
      setDestinationPort(initialData.destinationPort);
      setDepartureDate(initialData.departureDate ? new Date(initialData.departureDate).toISOString().split('T')[0] : '');
      setExpectedArrivalDate(initialData.expectedArrivalDate ? new Date(initialData.expectedArrivalDate).toISOString().split('T')[0] : '');
      setActualArrivalDate(initialData.actualArrivalDate ? new Date(initialData.actualArrivalDate).toISOString().split('T')[0] : '');
      setStatus(initialData.status);
      setNotes(initialData.notes || '');
      setIncoterm(initialData.incoterm || 'CIF');
      setCurrency(initialData.currency || 'SAR');
      setExchangeRate(initialData.exchangeRate || 1);
      setShippingCost(initialData.shippingCost);
      setInsuranceCost(initialData.insuranceCost);
      setCustomsDuties(initialData.customsDuties);
      setClearanceFees(initialData.clearanceFees);
      setOtherCosts(initialData.otherCosts);
      setContainers(initialData.containers || []);
      setItems(initialData.items || []);
    } else {
      const initForm = async () => {
        const generatedRef = await generateReferenceNumber('shipments', 'SHP');
        setShipmentNumber(generatedRef);
      };
      initForm();
      setSupplierId(0);
      setBillOfLading('');
      setOriginPort('');
      setDestinationPort('');
      setDepartureDate('');
      setExpectedArrivalDate('');
      setActualArrivalDate('');
      setStatus('pending');
      setNotes('');
      setIncoterm('CIF');
      setCurrency('SAR');
      setExchangeRate(1);
      setShippingCost(0);
      setInsuranceCost(0);
      setCustomsDuties(0);
      setClearanceFees(0);
      setOtherCosts(0);
      setContainers([]);
      setItems([]);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddContainer = () => {
    setContainers([...containers, { containerNumber: '', type: '20ft' }]);
  };

  const handleUpdateContainer = (index: number, field: keyof Container, value: any) => {
    const newContainers = [...containers];
    newContainers[index] = { ...newContainers[index], [field]: value };
    setContainers(newContainers);
  };

  const handleRemoveContainer = (index: number) => {
    setContainers(containers.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    setItems([...items, { productId: 0, productName: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  };

  const handleUpdateItem = (index: number, field: keyof ShipmentItem, value: any) => {
    const newItems = [...items];
    if (field === 'productId') {
      const product = products.find(p => p.id === Number(value));
      if (product) {
        newItems[index].productId = product.id!;
        newItems[index].productName = product.name;
        newItems[index].unitPrice = product.costPrice;
        newItems[index].totalPrice = product.costPrice * newItems[index].quantity;
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
      }
    }
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const goodsValueForeign = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const goodsValue = goodsValueForeign * exchangeRate;
  const totalLandedCost = goodsValue + shippingCost + insuranceCost + customsDuties + clearanceFees + otherCosts;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !billOfLading || !originPort || !destinationPort) {
      alert('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    const supplier = suppliers.find(s => s.id === supplierId);

    await onSave({
      shipmentNumber,
      supplierId,
      supplierName: supplier?.name || '',
      billOfLading,
      originPort,
      destinationPort,
      departureDate: departureDate ? new Date(departureDate) : undefined,
      expectedArrivalDate: expectedArrivalDate ? new Date(expectedArrivalDate) : undefined,
      actualArrivalDate: actualArrivalDate ? new Date(actualArrivalDate) : undefined,
      status,
      incoterm,
      currency,
      exchangeRate,
      containers,
      items,
      goodsValueForeign,
      goodsValue,
      shippingCost,
      insuranceCost,
      customsDuties,
      clearanceFees,
      otherCosts,
      totalLandedCost,
      notes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
          <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
            <Ship className="w-6 h-6 text-cyan-500" />
            {initialData ? 'تعديل الشحنة' : 'إضافة شحنة جديدة'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="shipment-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">رقم الشحنة</label>
                <input
                  type="text"
                  value={shipmentNumber}
                  onChange={(e) => setShipmentNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none font-bold text-slate-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">المورد</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none font-bold text-slate-700"
                  required
                >
                  <option value={0}>-- اختر المورد --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">بوليصة الشحن (B/L)</label>
                <input
                  type="text"
                  value={billOfLading}
                  onChange={(e) => setBillOfLading(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none font-bold text-slate-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">ميناء المغادرة</label>
                <input
                  type="text"
                  value={originPort}
                  onChange={(e) => setOriginPort(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none font-bold text-slate-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">ميناء الوصول</label>
                <input
                  type="text"
                  value={destinationPort}
                  onChange={(e) => setDestinationPort(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none font-bold text-slate-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">الحالة</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Shipment['status'])}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none font-bold text-slate-700"
                >
                  <option value="pending">قيد الانتظار</option>
                  <option value="in_transit">في الطريق</option>
                  <option value="arrived">وصلت الميناء</option>
                  <option value="customs">في الجمارك</option>
                  <option value="cleared">مخلصة جمركياً</option>
                  <option value="delivered">تم التسليم</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">مصطلحات التجارة (Incoterms)</label>
                <select
                  value={incoterm}
                  onChange={(e) => setIncoterm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none font-bold text-slate-700"
                >
                  <option value="EXW">EXW (تسليم المصنع)</option>
                  <option value="FOB">FOB (تسليم على ظهر السفينة)</option>
                  <option value="CIF">CIF (التكلفة والتأمين والشحن)</option>
                  <option value="DDP">DDP (تسليم خالص الرسوم)</option>
                  <option value="DAP">DAP (تسليم في المكان)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ المغادرة</label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none font-bold text-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ الوصول المتوقع</label>
                <input
                  type="date"
                  value={expectedArrivalDate}
                  onChange={(e) => setExpectedArrivalDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none font-bold text-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ الوصول الفعلي</label>
                <input
                  type="date"
                  value={actualArrivalDate}
                  onChange={(e) => setActualArrivalDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none font-bold text-slate-700"
                />
              </div>
            </div>

            {/* Containers */}
            <div className="border border-slate-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-slate-800">الحاويات</h4>
                <button
                  type="button"
                  onClick={handleAddContainer}
                  className="text-cyan-600 hover:text-cyan-700 text-sm font-bold flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> إضافة حاوية
                </button>
              </div>
              <div className="space-y-3">
                {containers.map((container, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <input
                      type="text"
                      placeholder="رقم الحاوية"
                      value={container.containerNumber}
                      onChange={(e) => handleUpdateContainer(index, 'containerNumber', e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-500/20 outline-none text-slate-700"
                    />
                    <select
                      value={container.type}
                      onChange={(e) => handleUpdateContainer(index, 'type', e.target.value)}
                      className="w-32 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-500/20 outline-none text-slate-700"
                    >
                      <option value="20ft">20 قدم</option>
                      <option value="40ft">40 قدم</option>
                      <option value="40ft HC">40 قدم HC</option>
                      <option value="LCL">LCL (جزئي)</option>
                    </select>
                    <input
                      type="text"
                      placeholder="رقم الختم"
                      value={container.sealNumber || ''}
                      onChange={(e) => handleUpdateContainer(index, 'sealNumber', e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-500/20 outline-none text-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveContainer(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                {containers.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-2">لم يتم إضافة حاويات</p>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="border border-slate-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-slate-800">المنتجات</h4>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-bold text-slate-700">العملة:</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg focus:ring-2 focus:ring-cyan-500/20 outline-none text-slate-700"
                    >
                      <option value="SAR">ريال سعودي (SAR)</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                      <option value="EUR">يورو (EUR)</option>
                      <option value="AED">درهم إماراتي (AED)</option>
                      <option value="CNY">يوان صيني (CNY)</option>
                    </select>
                  </div>
                  {currency !== 'SAR' && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-bold text-slate-700">سعر الصرف:</label>
                      <input
                        type="number"
                        min="0.0001"
                        step="0.0001"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(Number(e.target.value))}
                        className="w-24 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg focus:ring-2 focus:ring-cyan-500/20 outline-none text-slate-700"
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-cyan-600 hover:text-cyan-700 text-sm font-bold flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> إضافة منتج
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <select
                      value={item.productId}
                      onChange={(e) => handleUpdateItem(index, 'productId', e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-500/20 outline-none text-slate-700"
                    >
                      <option value={0}>اختر المنتج</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="الكمية"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(index, 'quantity', Number(e.target.value))}
                      className="w-24 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-500/20 outline-none text-slate-700"
                    />
                    <input
                      type="number"
                      placeholder="سعر الوحدة"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleUpdateItem(index, 'unitPrice', Number(e.target.value))}
                      className="w-32 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-500/20 outline-none text-slate-700"
                    />
                    <div className="w-32 text-center font-bold text-slate-700">
                      {item.totalPrice.toFixed(2)}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-2">لم يتم إضافة منتجات</p>
                )}
              </div>
            </div>

            {/* Costs */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <h4 className="font-bold text-slate-800 mb-4">التكاليف (لحساب تكلفة الهبوط Landed Cost بالريال السعودي)</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    قيمة البضاعة {currency !== 'SAR' ? `(${exchangeRate} SAR)` : ''}
                  </label>
                  <div className="px-3 py-2 bg-slate-100 rounded-lg font-bold text-slate-700">
                    {goodsValue.toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">تكلفة الشحن</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-500/20 outline-none text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">التأمين</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={insuranceCost}
                    onChange={(e) => setInsuranceCost(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-500/20 outline-none text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الرسوم الجمركية</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customsDuties}
                    onChange={(e) => setCustomsDuties(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-500/20 outline-none text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">رسوم التخليص</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={clearanceFees}
                    onChange={(e) => setClearanceFees(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-500/20 outline-none text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">تكاليف أخرى</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={otherCosts}
                    onChange={(e) => setOtherCosts(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-500/20 outline-none text-slate-700"
                  />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-700">إجمالي التكلفة (Landed Cost):</span>
                <span className="text-xl font-black text-cyan-600">{totalLandedCost.toFixed(2)} ر.س</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none text-slate-700 min-h-[100px]"
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all"
          >
            إلغاء
          </button>
          <button
            type="submit"
            form="shipment-form"
            className="flex-1 py-3 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 shadow-lg shadow-cyan-200 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            حفظ الشحنة
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShipmentModal;
