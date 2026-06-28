import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { ProductBatch, ProductSerial, Product, Warehouse } from '../../types';

export const useWMSState = (success: (msg: string) => void, showError: (msg: string) => void) => {
    const [activeTab, setActiveTab] = useState<'batches' | 'serials'>('batches');

    // Data Fetching
    const products = useLiveQuery(() => db.products.toArray()) || [];
    const warehouses = useLiveQuery(() => db.warehouses.toArray()) || [];
    const batches = useLiveQuery(() => db.batches.toArray()) || [];
    const serials = useLiveQuery(() => db.productSerials.toArray()) || [];

    // Batches State
    const [batchSearch, setBatchSearch] = useState('');
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | 'all'>('all');

    // Serials State
    const [serialSearch, setSerialSearch] = useState('');
    const [serialStatusFilter, setSerialStatusFilter] = useState<string>('all');

    // Modals State
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [editingBatch, setEditingBatch] = useState<ProductBatch | null>(null);
    const [showSerialModal, setShowSerialModal] = useState(false);
    const [editingSerial, setEditingSerial] = useState<ProductSerial | null>(null);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferItem, setTransferItem] = useState<{ type: 'batch' | 'serial', item: any } | null>(null);

    // Form States
    const [batchForm, setBatchForm] = useState<Partial<ProductBatch>>({});
    const [serialForm, setSerialForm] = useState<Partial<ProductSerial>>({});
    const [transferForm, setTransferForm] = useState<{ destinationWarehouseId: number, quantity?: number }>({ destinationWarehouseId: 0 });

    // Custom Confirm Modal state to avoid window.confirm
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });

    // Filtered Batches
    const filteredBatches = batches.filter(batch => {
        const matchesSearch = batch.productName.toLowerCase().includes(batchSearch.toLowerCase()) || 
                              (batch.batchNumber && batch.batchNumber.toLowerCase().includes(batchSearch.toLowerCase()));
        const matchesWarehouse = selectedWarehouseId === 'all' || batch.warehouseId === selectedWarehouseId;
        return matchesSearch && matchesWarehouse;
    });

    // Filtered Serials
    const filteredSerials = serials.filter(serial => {
        const product = products.find(p => p.id === serial.productId);
        const matchesSearch = serial.serialNumber.toLowerCase().includes(serialSearch.toLowerCase()) || 
                              (product && product.name.toLowerCase().includes(serialSearch.toLowerCase()));
        const matchesStatus = serialStatusFilter === 'all' || serial.status === serialStatusFilter;
        return matchesSearch && matchesStatus;
    });

    const getWarehouseName = (id: number) => warehouses.find(w => w.id === id)?.name || 'مستودع غير معروف';
    const getProductName = (id: number) => products.find(p => p.id === id)?.name || 'منتج غير معروف';

    const handleSaveBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!batchForm.productId || !batchForm.warehouseId || !batchForm.quantity || !batchForm.receivedDate) {
                showError('يرجى تعبئة جميع الحقول المطلوبة');
                return;
            }
            const product = products.find(p => p.id === batchForm.productId);
            if (!product) return;

            const batchData: ProductBatch = {
                productId: batchForm.productId,
                productName: product.name,
                warehouseId: batchForm.warehouseId,
                quantity: Number(batchForm.quantity),
                batchNumber: batchForm.batchNumber,
                costPrice: Number(batchForm.costPrice) || 0,
                receivedDate: new Date(batchForm.receivedDate),
                expiryDate: batchForm.expiryDate ? new Date(batchForm.expiryDate) : undefined,
            };

            if (editingBatch && editingBatch.id) {
                await db.batches.update(editingBatch.id, batchData);
                success('تم تحديث التشغيلة بنجاح');
            } else {
                await db.batches.add(batchData);
                success('تم إضافة التشغيلة بنجاح');
            }
            setShowBatchModal(false);
            setEditingBatch(null);
            setBatchForm({});
        } catch (err) {
            showError('حدث خطأ أثناء حفظ التشغيلة');
        }
    };

    const handleDeleteBatch = (id: number) => {
        setConfirmState({
            isOpen: true,
            title: 'حذف التشغيلة',
            message: 'هل أنت متأكد من حذف هذه التشغيلة؟ لا يمكن التراجع عن هذا الإجراء.',
            onConfirm: async () => {
                try {
                    await db.batches.delete(id);
                    success('تم حذف التشغيلة بنجاح');
                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                } catch (err) {
                    showError('حدث خطأ أثناء الحذف');
                }
            }
        });
    };

    const handleSaveSerial = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!serialForm.productId || !serialForm.warehouseId || !serialForm.serialNumber || !serialForm.status) {
                showError('يرجى تعبئة جميع الحقول المطلوبة');
                return;
            }
            const serialData: ProductSerial = {
                productId: serialForm.productId,
                warehouseId: serialForm.warehouseId,
                serialNumber: serialForm.serialNumber,
                status: serialForm.status as any,
                dateAdded: editingSerial ? editingSerial.dateAdded : new Date(),
            };

            if (editingSerial && editingSerial.id) {
                await db.productSerials.update(editingSerial.id, serialData);
                success('تم تحديث الرقم التسلسلي بنجاح');
            } else {
                await db.productSerials.add(serialData);
                success('تم إضافة الرقم التسلسلي بنجاح');
            }
            setShowSerialModal(false);
            setEditingSerial(null);
            setSerialForm({});
        } catch (err) {
            showError('حدث خطأ أثناء حفظ الرقم التسلسلي');
        }
    };

    const handleDeleteSerial = (id: number) => {
        setConfirmState({
            isOpen: true,
            title: 'حذف الرقم التسلسلي',
            message: 'هل أنت متأكد من حذف هذا الرقم التسلسلي؟ لا يمكن التراجع عن هذا الإجراء.',
            onConfirm: async () => {
                try {
                    await db.productSerials.delete(id);
                    success('تم حذف الرقم التسلسلي بنجاح');
                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                } catch (err) {
                    showError('حدث خطأ أثناء الحذف');
                }
            }
        });
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transferItem || !transferForm.destinationWarehouseId) return;

        try {
            if (transferItem.type === 'serial') {
                const serial = transferItem.item as ProductSerial;
                if (serial.warehouseId === transferForm.destinationWarehouseId) {
                    showError('الرقم التسلسلي موجود بالفعل في هذا المستودع');
                    return;
                }
                await db.productSerials.update(serial.id!, { warehouseId: transferForm.destinationWarehouseId });
                success('تم نقل الرقم التسلسلي بنجاح');
            } else if (transferItem.type === 'batch') {
                const batch = transferItem.item as ProductBatch;
                const transferQty = Number(transferForm.quantity);
                if (!transferQty || transferQty <= 0 || transferQty > batch.quantity) {
                    showError('كمية النقل غير صحيحة');
                    return;
                }
                if (batch.warehouseId === transferForm.destinationWarehouseId) {
                    showError('التشغيلة موجودة بالفعل في هذا المستودع');
                    return;
                }

                // Deduct from current batch
                await db.batches.update(batch.id!, { quantity: batch.quantity - transferQty });

                // Check if batch exists in destination
                const existingBatches = await db.batches.where({
                    productId: batch.productId,
                    warehouseId: transferForm.destinationWarehouseId
                }).toArray();
                const existingBatch = existingBatches.find(b => b.batchNumber === batch.batchNumber);

                if (existingBatch) {
                    await db.batches.update(existingBatch.id!, { quantity: existingBatch.quantity + transferQty });
                } else {
                    await db.batches.add({
                        ...batch,
                        id: undefined,
                        warehouseId: transferForm.destinationWarehouseId,
                        quantity: transferQty
                    });
                }
                success('تم نقل الكمية بنجاح');
            }
            setShowTransferModal(false);
            setTransferItem(null);
            setTransferForm({ destinationWarehouseId: 0 });
        } catch (err) {
            showError('حدث خطأ أثناء النقل');
        }
    };

    return {
        activeTab,
        setActiveTab,
        products,
        warehouses,
        batches,
        serials,
        batchSearch,
        setBatchSearch,
        selectedWarehouseId,
        setSelectedWarehouseId,
        serialSearch,
        setSerialSearch,
        serialStatusFilter,
        setSerialStatusFilter,
        showBatchModal,
        setShowBatchModal,
        editingBatch,
        setEditingBatch,
        showSerialModal,
        setShowSerialModal,
        editingSerial,
        setEditingSerial,
        showTransferModal,
        setShowTransferModal,
        transferItem,
        setTransferItem,
        batchForm,
        setBatchForm,
        serialForm,
        setSerialForm,
        transferForm,
        setTransferForm,
        confirmState,
        setConfirmState,
        filteredBatches,
        filteredSerials,
        getWarehouseName,
        getProductName,
        handleSaveBatch,
        handleDeleteBatch,
        handleSaveSerial,
        handleDeleteSerial,
        handleTransfer
    };
};
