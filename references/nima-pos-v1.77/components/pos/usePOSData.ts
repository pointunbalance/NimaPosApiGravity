import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Product, ProductSerial, Warehouse, Customer, User, Shift, Promotion } from '../../types';
import { hardwareService } from '../../utils/hardware';
import { logActivity } from '../../utils/logger';

export const usePOSData = (
  isWholesale: boolean,
  isPriceCheckerOpen: boolean,
  checkerSearch: string,
  debouncedSearch: string,
  selectedCategory: string,
  selectedWarehouseId: number | null,
  setSelectedWarehouseId: (id: number | null) => void,
  selectedUser: number | null,
  setSelectedUser: (id: number | null) => void,
  success: (msg: string) => void,
  showError: (msg: string) => void
) => {
  const [gridScale, setGridScale] = useState(() => Number(localStorage.getItem('pos_grid_scale')) || 1);
  const [cartScale, setCartScale] = useState(() => Number(localStorage.getItem('pos_cart_scale')) || 1);
  const [overallScale, setOverallScale] = useState(() => Number(localStorage.getItem('pos_overall_scale')) || 1);

  useEffect(() => {
    localStorage.setItem('pos_grid_scale', gridScale.toString());
  }, [gridScale]);

  useEffect(() => {
    localStorage.setItem('pos_cart_scale', cartScale.toString());
  }, [cartScale]);

  useEffect(() => {
    localStorage.setItem('pos_overall_scale', overallScale.toString());
  }, [overallScale]);

  // Live Queries
  const settings = useLiveQuery(() => db.settings.toCollection().first(), []);
  
  const products = useLiveQuery(async () => {
    if (isPriceCheckerOpen && checkerSearch) {
      return await db.products.where('barcode').equals(checkerSearch).toArray();
    }
    if (debouncedSearch) {
      const byBarcode = await db.products.where('barcode').equals(debouncedSearch).toArray();
      if (byBarcode.length > 0) return byBarcode;
      
      const nameMatches = await db.products
        .filter(p => p.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
        .limit(50)
        .toArray();

      const unitMatches = await db.products
        .filter(p => p.units?.some(u => u.barcode === debouncedSearch) || false)
        .toArray();

      const serialMatch = await db.productSerials.where('serialNumber').equals(debouncedSearch).first();
      if (serialMatch && serialMatch.status === 'available') {
        const product = await db.products.get(serialMatch.productId);
        if (product) return [product]; 
      }
          
      if (unitMatches.length === 1 && unitMatches[0].units?.some(u => u.barcode === debouncedSearch)) {
        return unitMatches; 
      }

      const merged = [...nameMatches];
      unitMatches.forEach(u => {
        if (!merged.find(m => m.id === u.id)) merged.push(u);
      });

      return merged;
    }
    if (selectedCategory === 'الكل') {
      return await db.products.limit(60).toArray(); 
    } else if (selectedCategory === 'المفضلة') {
      return await db.products.where('isFavorite').anyOf(1, 'true', '1').limit(100).toArray(); 
    } else {
      const targetCat = selectedCategory.trim();
      return await db.products.filter(p => (p.category || '').trim() === targetCat).limit(60).toArray();
    }
  }, [debouncedSearch, selectedCategory, isPriceCheckerOpen, checkerSearch]);

  const dbCategories = useLiveQuery(() => db.categories.toArray(), []); 
  const warehouses = useLiveQuery(() => db.warehouses.toArray(), []);
  
  const currentInventory = useLiveQuery(async () => {
    if (!selectedWarehouseId) return [];
    return await db.inventory.where('warehouseId').equals(selectedWarehouseId).toArray();
  }, [selectedWarehouseId]);

  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const users = useLiveQuery(async () => (await db.users.toArray()).filter(u => u.isActive), []);
  const heldOrders = useLiveQuery(() => db.heldOrders.toArray(), []);
  const promotions = useLiveQuery(() => db.promotions.toArray(), []);
  const activeShifts = useLiveQuery(() => db.shifts.where('status').equals('open').toArray(), []);

  // Set default salesperson or logged in User
  useEffect(() => {
    if (users && users.length > 0 && !selectedUser) {
      try {
        const loggedInStr = localStorage.getItem('nima_user');
        if (loggedInStr) {
          const loggedInUser = JSON.parse(loggedInStr);
          const match = users.find(u => u.id === loggedInUser.id);
          if (match) {
            setSelectedUser(match.id!);
            return;
          }
        }
      } catch (e) {
        console.error('Failed to parse logged in user', e);
      }
      setSelectedUser(users[0].id!);
    }
  }, [users, selectedUser, setSelectedUser]);

  useEffect(() => {
    if (warehouses && warehouses.length > 0 && !selectedWarehouseId) {
      const main = warehouses.find(w => w.isMain);
      setSelectedWarehouseId(main ? main.id! : warehouses[0].id!);
    }
  }, [warehouses, selectedWarehouseId, setSelectedWarehouseId]);

  const stockMap = useMemo(() => {
    const map = new Map<number, number>();
    if (currentInventory) currentInventory.forEach(item => map.set(item.productId, item.quantity));
    return map;
  }, [currentInventory]);

  const categories = useMemo(() => {
    if (dbCategories && dbCategories.length > 0) {
      const catNames = [...new Set(dbCategories.map(c => c.name.trim()))];
      return ['الكل', 'المفضلة', ...catNames];
    }
    return ['الكل', 'المفضلة'];
  }, [dbCategories]);

  return {
    gridScale,
    setGridScale,
    cartScale,
    setCartScale,
    overallScale,
    setOverallScale,
    settings,
    products,
    dbCategories,
    warehouses,
    customers,
    users,
    heldOrders,
    promotions,
    activeShifts,
    stockMap,
    categories
  };
};
