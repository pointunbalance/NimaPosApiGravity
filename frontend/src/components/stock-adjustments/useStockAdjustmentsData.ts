import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

export const useStockAdjustmentsData = (isModalOpen: boolean) => {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'increase' | 'decrease'>('all');
  const [filterReason, setFilterReason] = useState<string>('all');
  const [filterWarehouse, setFilterWarehouse] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Batch Form State
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | ''>('');
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');

  const products = useLiveQuery(() => db.products.toArray(), []);
  const warehouses = useLiveQuery(() => db.warehouses.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const currencyCode = settings?.currencyCode || 'EGP';

  // Product Cost Map for main table display
  const productMap = useMemo(() => {
    const map = new Map<number, { cost: number; name: string }>();
    products?.forEach(p => map.set(p.id!, { cost: p.costPrice || 0, name: p.name }));
    return map;
  }, [products]);

  // Set default warehouse
  useEffect(() => {
    if (isModalOpen && warehouses && warehouses.length > 0 && !selectedWarehouseId) {
      const main = warehouses.find(w => w.isMain);
      setSelectedWarehouseId(main ? main.id! : warehouses[0].id!);
    }
  }, [isModalOpen, warehouses, selectedWarehouseId]);

  // Query specific inventory item for live preview in input line
  const currentLineStock = useLiveQuery(async () => {
    if (!selectedProductId || !selectedWarehouseId) return 0;
    const item = await db.inventory.where({ warehouseId: Number(selectedWarehouseId), productId: Number(selectedProductId) }).first();
    return item ? item.quantity : 0;
  }, [selectedProductId, selectedWarehouseId]);

  // Query Adjustments History
  const adjustments = useLiveQuery(async () => {
    const all = await db.stockAdjustments.toArray();
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  // Main Table Filtering
  const filteredAdjustments = useMemo(() => {
    if (!adjustments) return [];
    
    return adjustments.filter(a => {
      const matchesSearch = a.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (a.notes && a.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === 'all' || a.type === filterType;
      const matchesReason = filterReason === 'all' || a.reason === filterReason;
      const matchesWarehouse = filterWarehouse === 'all' || a.warehouseId === Number(filterWarehouse);
      
      const aDate = new Date(a.date).setHours(0,0,0,0);
      const startDate = new Date(dateRange.start).setHours(0,0,0,0);
      const endDate = new Date(dateRange.end).setHours(23,59,59,999);
      const matchesDate = aDate >= startDate && aDate <= endDate;

      return matchesSearch && matchesType && matchesReason && matchesDate && matchesWarehouse;
    });
  }, [adjustments, searchTerm, filterType, filterReason, filterWarehouse, dateRange]);

  const stats = useMemo(() => {
    const totalCount = filteredAdjustments.length;
    const netChange = filteredAdjustments.reduce((acc, curr) => {
      return curr.type === 'increase' ? acc + curr.quantity : acc - curr.quantity;
    }, 0);

    // Value Loss (Cost of items decreased)
    const totalLossValue = filteredAdjustments
      .filter(a => a.type === 'decrease')
      .reduce((acc, curr) => {
        const cost = productMap.get(curr.productId)?.cost || 0;
        return acc + (curr.quantity * cost);
      }, 0);

    return { totalCount, netChange, totalLossValue };
  }, [filteredAdjustments, productMap]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(date));
  };

  return {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filterReason,
    setFilterReason,
    filterWarehouse,
    setFilterWarehouse,
    dateRange,
    setDateRange,
    selectedWarehouseId,
    setSelectedWarehouseId,
    selectedProductId,
    setSelectedProductId,
    products,
    warehouses,
    currencyCode,
    productMap,
    currentLineStock,
    adjustments,
    filteredAdjustments,
    stats,
    formatCurrency,
    formatDate
  };
};
