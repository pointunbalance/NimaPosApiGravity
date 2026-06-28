import { useState, useMemo, useDeferredValue } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Product } from '../../types';

export const useProductsData = () => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [limit, setLimit] = useState(50);
  const [totalProducts, setTotalProducts] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');

  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const pricingRules = useLiveQuery(async () => {
    const rules = await db.pricingRules.toArray();
    return rules.filter(r => r.isActive);
  }, []) || [];
  const currencyCode = settings?.currencyCode || 'IQD';

  const getFilteredProducts = async (
    term = deferredSearchTerm, 
    cat = filterCategory, 
    stock = filterStock
  ) => {
    let filtered = await db.products.orderBy('id').reverse().toArray();

    if (cat !== 'all') {
      filtered = filtered.filter(p => p.category === cat);
    }
    
    if (term) {
      const lowerFilter = term.toLowerCase();
      filtered = filtered.filter(p => 
        (p.name && p.name.toLowerCase().includes(lowerFilter)) || 
        (p.barcode && p.barcode.includes(term))
      );
    }
    
    if (stock !== 'all') {
      if (stock === 'low') {
        filtered = filtered.filter(p => p.type !== 'composite' && p.stock > 0 && p.stock <= (p.alertThreshold || 5));
      } else if (stock === 'out') {
        filtered = filtered.filter(p => p.type !== 'composite' && p.stock <= 0);
      }
    }
    return filtered;
  };

  const queryResult = useLiveQuery(async () => {
    const allFiltered = await getFilteredProducts(deferredSearchTerm, filterCategory, filterStock);

    // Calculate aggregate stats across all matched products
    let totalItems = 0;
    let totalCostValue = 0;
    let totalRetailValue = 0;
    let lowStock = 0;

    allFiltered.forEach((p) => {
      if (p.type !== 'composite') {
        totalItems++;
        totalCostValue += (p.costPrice || 0) * (p.stock || 0);
        totalRetailValue += (p.price || 0) * (p.stock || 0);

        if ((p.stock || 0) <= (p.alertThreshold || 5)) {
          lowStock++;
        }
      } else {
        totalItems++; 
      }
    });

    setTotalProducts(allFiltered.length);
    return {
      paginated: allFiltered.slice(0, limit),
      stats: { totalItems, totalCostValue, totalRetailValue, lowStock }
    };
  }, [limit, deferredSearchTerm, filterCategory, filterStock]) || { paginated: [], stats: { totalItems: 0, totalCostValue: 0, totalRetailValue: 0, lowStock: 0 } };

  const productsQuery = queryResult.paginated;
  const productsStats = queryResult.stats;

  const loadMore = () => {
    if (productsQuery && productsQuery.length < totalProducts) {
      setLimit(prev => prev + 50);
    }
  };

  const allCategories = useLiveQuery(async () => {
    const cats = await db.categories.toArray();
    const uniqueNames = new Set(cats.map(c => c.name.trim()));
    return Array.from(uniqueNames);
  }, []);
  
  const uniqueCategories = useMemo(() => {
    return allCategories || [];
  }, [allCategories]);

  const simpleProducts = useLiveQuery(() => db.products.filter(p => p.type === 'simple').toArray(), []) || [];

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('ar-EG', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(amount);

  return {
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    filterStock,
    setFilterStock,
    currencyCode,
    pricingRules,
    settings,
    productsQuery,
    productsStats,
    uniqueCategories,
    simpleProducts,
    totalProducts,
    loadMore,
    formatCurrency,
    getFilteredProducts
  };
};
