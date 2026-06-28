import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { StoreItemType, StoreSaleType, CartItemType } from './storeTypes';

export const useStoreState = () => {
  const [activeTab, setActiveTab] = useState<'pos' | 'history' | 'inventory'>('pos');
  
  const [posSearch, setPosSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');

  const [cart, setCart] = useState<CartItemType[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank'>('cash');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    barcode: '',
    category: ''
  });

  const [selectedSaleDetail, setSelectedSaleDetail] = useState<any | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const currency = 'EGP';

  const products: StoreItemType[] = useLiveQuery(() => db.gymStoreItems.toArray()) || [];
  const sales: StoreSaleType[] = useLiveQuery(() => db.gymStoreSales.toArray()) || [];
  const customersList = useLiveQuery(() => db.customers.toArray()) || [];

  const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const postSaleJournalEntry = async (
    saleId: number, 
    customer: string, 
    amount: number, 
    paymentType: 'cash' | 'bank',
    refCode: string
  ) => {
    try {
      const cashAcc = await db.accounts.where('code').equals('1010').first();
      const bankAcc = await db.accounts.where('code').equals('1020').first();
      const revenueAcc = await db.accounts.where('code').equals('4010').first() || 
                         await db.accounts.where('type').equals('revenue').first();

      const creditAccount = revenueAcc;
      let debitAccount = cashAcc;

      if (paymentType === 'bank') debitAccount = bankAcc;

      if (debitAccount && creditAccount) {
        await db.journalEntries.add({
          date: new Date(),
          reference: refCode,
          description: `إيرادات مبيعات الجيم لمنتجات للمشتري: ${customer || 'عميل نقدي'}`,
          lines: [
            { 
              accountId: debitAccount.id!, 
              accountName: debitAccount.name, 
              debit: amount, 
              credit: 0, 
              description: `مبيعات الكافيتريا ومتجر الجيم فاتورة #${saleId}` 
            },
            { 
              accountId: creditAccount.id!, 
              accountName: creditAccount.name, 
              debit: 0, 
              credit: amount, 
              description: `تسجيل مبيعات الجيم - طريقة الدفع: ${paymentType === 'cash' ? 'نقدية/خزينة' : 'حساب البنك'}` 
            }
          ],
          totalAmount: amount,
          status: 'posted'
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleAddToCart = (product: StoreItemType) => {
    if (product.stock <= 0) {
      showToast('خطأ المخزن: هذا المنتج نفذ تماماً ولا يمكن بيعه حالياً', 'warning');
      return;
    }

    const exist = cart.find(item => item.id === product.id);
    if (exist) {
      if (exist.quantity >= product.stock) {
        showToast(`أقصى كمية متاحة لهذا المنتج هي ${product.stock} قطع بالمستودع`, 'warning');
        return;
      }
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { 
        id: product.id!, 
        name: product.name, 
        price: Number(product.price) || 0, 
        quantity: 1, 
        maxStock: product.stock 
      }]);
    }
  };

  const updateCartQuantity = (id: number, val: number) => {
    const item = cart.find(c => c.id === id);
    if (!item) return;

    const newQty = item.quantity + val;
    if (newQty <= 0) {
      setCart(cart.filter(c => c.id !== id));
      return;
    }

    if (newQty > item.maxStock) {
      showToast(`عذراً، أقصى مخزون متاح للمنتج هو ${item.maxStock} قطع`, 'warning');
      return;
    }

    setCart(cart.map(c => c.id === id ? { ...c, quantity: newQty } : c));
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    showToast('تم إفراغ محتويات سلة البيع', 'warning');
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('برجاء إضافة منتج واحد على الأقل لإتمام البيع', 'warning');
      return;
    }

    try {
      const orderTotal = cart.reduce((s, item) => s + (item.price * item.quantity), 0);
      const totalUnits = cart.reduce((s, item) => s + item.quantity, 0);
      const refCode = `GYM-SL-${Math.floor(1000 + Math.random() * 9000)}`;

      for (const cartItem of cart) {
        const freshProduct = products.find(p => p.id === cartItem.id);
        if (!freshProduct || freshProduct.stock < cartItem.quantity) {
          showToast(`عذرًا، التعديل الفوري لمستودع المنتج ${cartItem.name} لا يسمح ببيع هذه الكمية.`, 'error');
          return;
        }
      }

      const salesDetails = {
        date: new Date(),
        customerName: customerName.trim() || 'عميل افتراضي / نقدي',
        items: cart.map(item => ({
          itemId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity
        })),
        totalAmount: orderTotal,
        totalItemsSold: totalUnits,
        paymentMethod: paymentMethod,
        journalRef: refCode
      };

      for (const cartItem of cart) {
        const freshProduct = products.find(p => p.id === cartItem.id);
        if (freshProduct) {
          const updatedStock = Math.max(0, freshProduct.stock - cartItem.quantity);
          await db.gymStoreItems.update(cartItem.id, { stock: updatedStock });
        }
      }

      const savedSaleId = await db.gymStoreSales.add(salesDetails);
      await postSaleJournalEntry(savedSaleId, salesDetails.customerName, orderTotal, paymentMethod, refCode);

      showToast(`تم إصدار الفاتورة #${savedSaleId} بنجاح بقيمة ${orderTotal.toLocaleString()} ${currency}`, 'success');
      setCart([]);
      setCustomerName('');
      setPaymentMethod('cash');
    } catch (err) {
      console.error(err);
      showToast('خطأ محاسبي أثناء ترحيل بيانات الفاتورة', 'error');
    }
  };

  const handleVoidSale = (sale: any) => {
    setConfirmDialog({
      isOpen: true,
      title: 'تأكيد تراجع وإلغاء/شطب الفاتورة الكلية',
      message: `هل أنت متأكد من إلغاء الفاتورة #${sale.id} للمشتري: "${sale.customerName}" بقيمة ${sale.totalAmount} EGP؟ سيؤدي ذلك لإرجاع قطع المنتجات للمستودع وإلغاء كافة قيودها المالية باليومية العامة لضمان اتساق الدفاتر المحاسبية.`,
      onConfirm: async () => {
        try {
          for (const item of (sale.items || [])) {
            const prod = products.find(p => p.id === item.itemId);
            if (prod) {
              const returnedStock = prod.stock + item.quantity;
              await db.gymStoreItems.update(item.itemId, { stock: returnedStock });
            }
          }

          if (sale.journalRef) {
            const entry = await db.journalEntries.where('reference').equals(sale.journalRef).first();
            if (entry && entry.id) await db.journalEntries.delete(entry.id);
          }

          await db.gymStoreSales.delete(sale.id);
          setConfirmDialog(null);
          showToast(`تم شطب الفاتورة #${sale.id} بنجاح وإعادة البضائع للمخازن.`, 'success');
        } catch (err) {
          console.error(err);
          showToast('فشل في إبطال الفاتورة', 'error');
        }
      }
    });
  };

  const handleOpenProductModal = (editMode = false, item: any = null) => {
    setIsEdit(editMode);
    if (editMode && item) {
      setCurrentId(item.id!);
      setFormData({
        name: item.name || '',
        price: String(item.price || ''),
        stock: String(item.stock || ''),
        barcode: item.barcode || '',
        category: item.category || ''
      });
    } else {
      setCurrentId(null);
      setFormData({ name: '', price: '', stock: '', barcode: '', category: '' });
    }
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        name: formData.name.trim(),
        price: formData.price ? Number(formData.price) : 0,
        stock: formData.stock ? Number(formData.stock) : 0,
        barcode: formData.barcode.trim(),
        category: formData.category.trim() || 'عام'
      };

      if (!dataToSave.name) {
        showToast('يجب إدخال اسم المنتج بدقة', 'warning');
        return;
      }

      if (isEdit && currentId) {
        await db.gymStoreItems.update(currentId, dataToSave);
        showToast('تم تحديث تفاصيل المنتج ومخزونه بنجاح بالمتجر', 'success');
      } else {
        await db.gymStoreItems.add(dataToSave);
        showToast('تم إدراج منتج جديد بمخزون المتجر الرياضي بنجاح', 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ فني أثناء المعالجة', 'error');
    }
  };

  const askDeleteProduct = (id: number, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'تأكيد إزالة صنف المنتج',
      message: `هل أنت متأكد من شطب المنتج: "${name}" بصفة نهائية من متجر الجيم؟ لن يؤدي هذا إلى مسح سجلات الفواتير السابقة لسلامة التاريخ المالي للمخازن والتدفقات النقدية.`,
      onConfirm: async () => {
        await db.gymStoreItems.delete(id);
        showToast(`تم حذف المنتج "${name}" بنجاح`, 'success');
        setConfirmDialog(null);
      }
    });
  };

  const filteredProductsPOS = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(posSearch.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(posSearch.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(posSearch.toLowerCase()))
    );
  }, [products, posSearch]);

  const filteredInvoices = useMemo(() => {
    return sales.filter(s => 
      s.customerName.toLowerCase().includes(historySearch.toLowerCase()) ||
      String(s.id).includes(historySearch) ||
      (s.journalRef && s.journalRef.toLowerCase().includes(historySearch.toLowerCase()))
    ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, historySearch]);

  const filteredProductsInventory = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(inventorySearch.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(inventorySearch.toLowerCase()))
    );
  }, [products, inventorySearch]);

  const statsCore = useMemo(() => {
    const activeProductsCount = products.length;
    const lowStockCount = products.filter(p => p.stock <= 5).length;
    const totalSalesRevenue = sales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
    const totalItemsSold = sales.reduce((sum, s) => sum + (Number(s.totalItemsSold) || 0), 0);
    return {
      activeProductsCount,
      lowStockCount,
      totalSalesRevenue,
      totalItemsSold
    };
  }, [products, sales]);

  const chartData = useMemo(() => {
    const salesByDateMap: { [key: string]: number } = {};
    sales.forEach(sale => {
      const dStr = new Date(sale.date).toISOString().split('T')[0];
      salesByDateMap[dStr] = (salesByDateMap[dStr] || 0) + sale.totalAmount;
    });

    return Object.keys(salesByDateMap).sort().map(date => {
      const parts = date.split('-');
      const label = `${parts[1]}/${parts[2]}`;
      return { dateLabel: label, dateRaw: date, amount: salesByDateMap[date] };
    }).slice(-7);
  }, [sales]);

  const topProductsChartData = useMemo(() => {
    const itemSalesCount: { [key: string]: { name: string; qty: number; value: number } } = {};
    sales.forEach(sale => {
      (sale.items || []).forEach((item) => {
        if (!itemSalesCount[item.itemId]) {
          itemSalesCount[item.itemId] = { name: item.name, qty: 0, value: 0 };
        }
        itemSalesCount[item.itemId].qty += item.quantity;
        itemSalesCount[item.itemId].value += item.total;
      });
    });

    return Object.values(itemSalesCount)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [sales]);

  const matchedMembers = useMemo(() => {
    return customerName.trim()
      ? customersList.filter(c => c.name.toLowerCase().includes(customerName.toLowerCase())).slice(0, 5)
      : [];
  }, [customerName, customersList]);

  return {
    activeTab,
    setActiveTab,
    posSearch,
    setPosSearch,
    historySearch,
    setHistorySearch,
    inventorySearch,
    setInventorySearch,
    cart,
    setCart,
    customerName,
    setCustomerName,
    paymentMethod,
    setPaymentMethod,
    showMemberDropdown,
    setShowMemberDropdown,
    isModalOpen,
    setIsModalOpen,
    isEdit,
    currentId,
    formData,
    setFormData,
    selectedSaleDetail,
    setSelectedSaleDetail,
    toast,
    confirmDialog,
    setConfirmDialog,
    currency,
    products,
    sales,
    customersList,
    filteredProductsPOS,
    filteredInvoices,
    filteredProductsInventory,
    statsCore,
    chartData,
    topProductsChartData,
    matchedMembers,
    handleAddToCart,
    updateCartQuantity,
    removeFromCart,
    handleClearCart,
    handleCheckout,
    handleVoidSale,
    handleOpenProductModal,
    handleSaveProduct,
    askDeleteProduct,
    showToast
  };
};
export default useStoreState;
