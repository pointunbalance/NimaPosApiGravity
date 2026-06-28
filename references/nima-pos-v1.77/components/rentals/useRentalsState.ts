import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Rental, Product, RentalStatus } from '../../types';
import { compressImage } from '../../utils/imageCompression';
import { generateBarcode } from '../../utils/generateBarcode';
import { useRentalsTransactions } from './useRentalsTransactions';
import { printContract } from './rentalUtils';

export const useRentalsState = (success: (msg: string) => void, showError: (msg: string) => void) => {
  const { saveRental, confirmReturn } = useRentalsTransactions();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [returningRental, setReturningRental] = useState<Rental | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'items'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'reserved' | 'active' | 'late' | 'returned'>('all');

  // Forms
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  const [rentalForm, setRentalForm] = useState<Partial<Rental>>({
    customerId: 0,
    customerName: '',
    customerPhone: '',
    customerIDFront: '',
    customerIDBack: '',
    productId: 0,
    productName: '',
    bookingDate: new Date(),
    pickupDate: new Date(),
    returnDate: new Date(new Date().setDate(new Date().getDate() + 3)),
    status: 'reserved',
    price: 0,
    deposit: 0,
    isDepositReturned: false,
    notes: '',
    size: '',
  });

  const [itemForm, setItemForm] = useState({
    name: '',
    price: 0,
    costPrice: 0,
    category: 'بدل رجالي',
    stock: 1,
    image: '',
    images: [] as string[],
    parts: [] as string[],
    barcode: '',
    size: '',
    color: '',
    description: '',
  });

  const [partInput, setPartInput] = useState('');
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  // Queries
  const rentals = useLiveQuery(() => db.rentals.toArray(), []);
  const rentalItems = useLiveQuery(async () => {
    return await db.products
      .where('category')
      .equals('rental')
      .or('category')
      .startsWith('rental_')
      .toArray();
  }, []);
  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const currencyCode = settings?.currencyCode || 'EGP';

  // Stats
  const stats = useMemo(() => {
    if (!rentals) return { active: 0, upcoming: 0, late: 0, depositsHeld: 0 };
    const today = new Date().setHours(0, 0, 0, 0);
    return {
      active: rentals.filter((r) => r.status === 'active').length,
      upcoming: rentals.filter((r) => r.status === 'reserved').length,
      late: rentals.filter((r) => r.status === 'active' && new Date(r.returnDate).getTime() < today).length,
      depositsHeld: rentals
        .filter((r) => (r.status === 'active' || r.status === 'reserved') && !r.isDepositReturned)
        .reduce((sum, r) => sum + r.deposit, 0),
    };
  }, [rentals]);

  // Calendar
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentDate]);

  const monthName = useMemo(() => {
    return currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const getRentalsForDay = (date: Date) => {
    const targetTime = date.getTime();
    return (
      rentals?.filter((r) => {
        const start = new Date(r.pickupDate).setHours(0, 0, 0, 0);
        const end = new Date(r.returnDate).setHours(23, 59, 59, 999);
        return targetTime >= start && targetTime <= end && r.status !== 'cancelled' && r.status !== 'returned';
      }) || []
    );
  };

  // Filter
  const filteredRentalsList = useMemo(() => {
    if (!rentals) return [];
    const today = new Date().setHours(0, 0, 0, 0);

    return rentals
      .filter((r) => {
        const matchesSearch =
          r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.id?.toString().includes(searchTerm);

        let matchesStatus = true;
        if (filterStatus === 'late') {
          matchesStatus = r.status === 'active' && new Date(r.returnDate).getTime() < today;
        } else if (filterStatus !== 'all') {
          matchesStatus = r.status === filterStatus;
        }

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.pickupDate).getTime() - new Date(a.pickupDate).getTime());
  }, [rentals, searchTerm, filterStatus]);

  const handleDayClick = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const pickupStr = targetDate.toISOString().split('T')[0];
    const returnObj = new Date(targetDate);
    returnObj.setDate(returnObj.getDate() + 2);

    setEditingRental(null);
    setRentalForm({
      customerId: 0,
      customerName: '',
      productId: 0,
      productName: '',
      customerIDFront: '',
      customerIDBack: '',
      bookingDate: new Date(),
      pickupDate: new Date(pickupStr),
      returnDate: new Date(returnObj),
      status: 'reserved',
      price: 0,
      deposit: 0,
      size: '',
      notes: '',
    });
    setIsBookingModalOpen(true);
  };

  const handleEditRental = (rental: Rental) => {
    setEditingRental(rental);
    setRentalForm(rental);
    setIsBookingModalOpen(true);
  };

  const handleEditItem = (item: Product) => {
    setEditingItemId(item.id!);
    setItemForm({
      name: item.name,
      price: item.price,
      costPrice: item.costPrice || 0,
      category: item.category,
      stock: item.stock || 1,
      image: item.image || '',
      images: item.images || [],
      parts: item.parts || [],
      barcode: item.barcode || '',
      size: '',
      color: '',
      description: '',
    });
    setIsItemModalOpen(true);
  };

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file).then((result) => setItemForm((prev) => ({ ...prev, image: result })));
    }
  };

  const handleGalleryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file).then((result) =>
        setItemForm((prev) => ({ ...prev, images: [...prev.images, result] }))
      );
    }
  };

  const removeGalleryImage = (idx: number) => {
    setItemForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const addPart = () => {
    if (partInput.trim()) {
      setItemForm((prev) => ({ ...prev, parts: [...prev.parts, partInput.trim()] }));
      setPartInput('');
    }
  };

  const removePart = (idx: number) => {
    setItemForm((prev) => ({ ...prev, parts: prev.parts.filter((_, i) => i !== idx) }));
  };

  const handleIDUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file).then((result) => {
        if (side === 'front') setRentalForm((prev) => ({ ...prev, customerIDFront: result }));
        else setRentalForm((prev) => ({ ...prev, customerIDBack: result }));
      });
    }
  };

  const handleGenerateBarcode = async () => {
    const barcode = await generateBarcode('1', itemForm.price, itemForm.costPrice);
    setItemForm((prev) => ({ ...prev, barcode }));
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount);

  const getStatusColor = (status: RentalStatus) => {
    switch (status) {
      case 'reserved':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_laundry':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'returned':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'late':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100';
    }
  };

  const getStatusLabel = (status: RentalStatus) => {
    switch (status) {
      case 'reserved':
        return 'محجوز';
      case 'active':
        return 'في الخارج';
      case 'in_laundry':
        return 'في المغسلة';
      case 'returned':
        return 'تم الإرجاع (بالرف)';
      case 'late':
        return 'متأخر';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };

  const handleGenerateSamples = async () => {
    try {
      const sampleItems = [
        {
          name: 'بدلة عريس سوداء إيطالي',
          price: 900,
          costPrice: 3500,
          category: 'rental',
          stock: 2,
          size: '42, 44',
          parts: ['جاكيت', 'بنطلون', 'قميص', 'فيونكة'],
          barcode: 'S-1001',
          type: 'simple' as const,
          image: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2394a3b8'%3Eصورة%3C/text%3E%3C/svg%3E`,
        },
      ];
      for (const item of sampleItems) {
        await db.products.add(item as any);
      }
      success('تم توليد العينات بنجاح');
    } catch (e) {
      console.error(e);
      showError('حدث خطأ أثناء توليد العينات');
    }
  };

  const handleSaveRental = async () => {
    const isSuccess = await saveRental({
      rentalForm,
      editingRental,
      rentalItems,
      rentals,
      customers,
      success,
      showError,
    });
    if (isSuccess) {
      setIsBookingModalOpen(false);
    }
  };

  const changeStatus = async (rental: Rental, newStatus: RentalStatus) => {
    if (newStatus === 'returned' || newStatus === 'in_laundry') {
      if (rental.status === 'in_laundry' && newStatus === 'returned') {
        await db.rentals.update(rental.id!, { status: 'returned' });
        success('تم تحديث حالة الصنف بالرف بنجاح');
        return;
      }
      setReturningRental(rental);
      return;
    }
    await db.rentals.update(rental.id!, { status: newStatus });
    success('تم تحديث الحالة بنجاح');
  };

  const handleConfirmReturn = async (
    rentalId: number,
    lateFee: number,
    damageFee: number,
    depositReturned: number,
    notes?: string,
    returnedParts?: string[],
    returnStatus: 'returned' | 'in_laundry' = 'returned'
  ) => {
    const isSuccess = await confirmReturn({
      rentalId,
      lateFee,
      damageFee,
      depositReturned,
      notes,
      returnedParts,
      returnStatus,
      success,
      showError,
    });
    if (isSuccess) {
      setReturningRental(null);
    }
  };

  const handleDeleteRental = async (id: number) => {
    try {
      await db.rentals.delete(id);
      success('تم الحذف بنجاح');
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء الحذف');
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await db.products.delete(id);
      success('تم الحذف بنجاح');
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء الحذف');
    }
  };

  const handleSaveItem = async () => {
    if (!itemForm.name || !itemForm.price) {
      showError('يرجى إدخال اسم الصنف وسعر التأجير');
      return;
    }
    try {
      let finalName = itemForm.name;
      if (itemForm.size && !finalName.includes(itemForm.size)) finalName += ` (مقاس ${itemForm.size})`;
      if (itemForm.color && !finalName.includes(itemForm.color)) finalName += ` - ${itemForm.color}`;

      const itemData = {
        name: finalName,
        price: itemForm.price,
        costPrice: itemForm.costPrice,
        category: itemForm.category || 'rental',
        stock: itemForm.stock,
        image: itemForm.image,
        images: itemForm.images,
        parts: itemForm.parts,
        barcode: itemForm.barcode || Math.floor(Math.random() * 1000000000).toString(),
        type: 'simple' as const,
        alertThreshold: 0,
      };

      if (editingItemId) {
        await db.products.update(editingItemId, itemData);
      } else {
        await db.products.add(itemData as Product);
      }

      setIsItemModalOpen(false);
      setEditingItemId(null);
      setItemForm({
        name: '',
        price: 0,
        costPrice: 0,
        category: 'بدل رجالي',
        stock: 1,
        image: '',
        images: [],
        parts: [],
        barcode: '',
        size: '',
        color: '',
        description: '',
      });
      success('تم حفظ الصنف بنجاح');
    } catch (e) {
      showError('حدث خطأ أثناء حفظ الصنف');
      console.error(e);
    }
  };

  const handlePrintContract = (rental: Rental) => {
    printContract(rental, rentalItems || [], settings, formatCurrency);
  };

  return {
    currentDate,
    isBookingModalOpen,
    setIsBookingModalOpen,
    isItemModalOpen,
    setIsItemModalOpen,
    returningRental,
    setReturningRental,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    editingRental,
    setEditingRental,
    rentalForm,
    setRentalForm,
    itemForm,
    setItemForm,
    partInput,
    setPartInput,
    editingItemId,
    setEditingItemId,
    rentals,
    rentalItems,
    customers,
    settings,
    currencyCode,
    stats,
    daysInMonth,
    monthName,
    changeMonth,
    getRentalsForDay,
    filteredRentalsList,
    handleDayClick,
    handleEditRental,
    handleEditItem,
    handleMainImageUpload,
    handleGalleryImageUpload,
    removeGalleryImage,
    addPart,
    removePart,
    handleIDUpload,
    handleGenerateBarcode,
    formatCurrency,
    getStatusColor,
    getStatusLabel,
    handleGenerateSamples,
    handleSaveRental,
    changeStatus,
    handleConfirmReturn,
    handleDeleteRental,
    handleDeleteItem,
    handleSaveItem,
    handlePrintContract,
  };
};
export default useRentalsState;
