import React from 'react';
import { Package, Search, Calendar, Hash, Plus } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useWMSState } from '../components/wms/useWMSState';
import { BatchModal } from '../components/wms/BatchModal';
import { SerialModal } from '../components/wms/SerialModal';
import { TransferModal } from '../components/wms/TransferModal';
import { BatchesTable } from '../components/wms/BatchesTable';
import { SerialsTable } from '../components/wms/SerialsTable';
import ConfirmModal from '../components/ui/ConfirmModal';

const AdvancedWMS: React.FC = () => {
    const { success, error } = useToast();

    const {
        activeTab,
        setActiveTab,
        products,
        warehouses,
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
    } = useWMSState(success, error);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 font-['Tajawal']">
                        <Package className="w-8 h-8 text-indigo-600" />
                        إدارة المخازن المتقدمة (WMS)
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">تتبع التشغيلات، تواريخ الصلاحية، والأرقام التسلسلية</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('batches')}
                    className={`pb-4 px-4 font-bold text-sm transition-colors relative cursor-pointer ${activeTab === 'batches' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        التشغيلات وتواريخ الصلاحية
                    </div>
                    {activeTab === 'batches' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
                </button>
                <button
                    onClick={() => setActiveTab('serials')}
                    className={`pb-4 px-4 font-bold text-sm transition-colors relative cursor-pointer ${activeTab === 'serials' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <div className="flex items-center gap-2">
                        <Hash className="w-5 h-5" />
                        تتبع الأرقام التسلسلية
                    </div>
                    {activeTab === 'serials' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
                </button>
            </div>

            {/* Batches Tab */}
            {activeTab === 'batches' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex flex-wrap gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 items-center">
                        <div className="flex-1 min-w-[250px] relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="بحث باسم المنتج أو رقم التشغيلة..."
                                value={batchSearch}
                                onChange={(e) => setBatchSearch(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <select
                            value={selectedWarehouseId}
                            onChange={(e) => setSelectedWarehouseId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        >
                            <option value="all">جميع المستودعات</option>
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => {
                                setEditingBatch(null);
                                setBatchForm({ receivedDate: new Date().toISOString().split('T')[0] as any });
                                setShowBatchModal(true);
                            }}
                            className="px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-100"
                        >
                            <Plus className="w-5 h-5" />
                            إضافة تشغيلة
                        </button>
                    </div>

                    <BatchesTable
                        batches={filteredBatches}
                        getWarehouseName={getWarehouseName}
                        onTransferClick={(batch) => {
                            setTransferItem({ type: 'batch', item: batch });
                            setTransferForm({ destinationWarehouseId: 0 });
                            setShowTransferModal(true);
                        }}
                        onEditClick={(batch) => {
                            setEditingBatch(batch);
                            setBatchForm({
                                ...batch,
                                receivedDate: new Date(batch.receivedDate).toISOString().split('T')[0] as any,
                                expiryDate: batch.expiryDate ? new Date(batch.expiryDate).toISOString().split('T')[0] as any : undefined
                            });
                            setShowBatchModal(true);
                        }}
                        onDeleteClick={handleDeleteBatch}
                    />
                </div>
            )}

            {/* Serials Tab */}
            {activeTab === 'serials' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex flex-wrap gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 items-center">
                        <div className="flex-1 min-w-[250px] relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="بحث بالرقم التسلسلي أو اسم المنتج..."
                                value={serialSearch}
                                onChange={(e) => setSerialSearch(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <select
                            value={serialStatusFilter}
                            onChange={(e) => setSerialStatusFilter(e.target.value)}
                            className="bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        >
                            <option value="all">جميع الحالات</option>
                            <option value="available">متاح</option>
                            <option value="sold">مباع</option>
                            <option value="returned">مرتجع</option>
                            <option value="damaged">تالف</option>
                        </select>
                        <button
                            onClick={() => {
                                setEditingSerial(null);
                                setSerialForm({ status: 'available' });
                                setShowSerialModal(true);
                            }}
                            className="px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-100"
                        >
                            <Plus className="w-5 h-5" />
                            إضافة رقم تسلسلي
                        </button>
                    </div>

                    <SerialsTable
                        serials={filteredSerials}
                        getWarehouseName={getWarehouseName}
                        getProductName={getProductName}
                        onTransferClick={(serial) => {
                            setTransferItem({ type: 'serial', item: serial });
                            setTransferForm({ destinationWarehouseId: 0 });
                            setShowTransferModal(true);
                        }}
                        onEditClick={(serial) => {
                            setEditingSerial(serial);
                            setSerialForm(serial);
                            setShowSerialModal(true);
                        }}
                        onDeleteClick={handleDeleteSerial}
                    />
                </div>
            )}

            {/* Batch Modal */}
            <BatchModal
                isOpen={showBatchModal}
                onClose={() => setShowBatchModal(false)}
                editingBatch={editingBatch}
                batchForm={batchForm}
                setBatchForm={setBatchForm}
                products={products}
                warehouses={warehouses}
                onSubmit={handleSaveBatch}
            />

            {/* Serial Modal */}
            <SerialModal
                isOpen={showSerialModal}
                onClose={() => setShowSerialModal(false)}
                editingSerial={editingSerial}
                serialForm={serialForm}
                setSerialForm={setSerialForm}
                products={products}
                warehouses={warehouses}
                onSubmit={handleSaveSerial}
            />

            {/* Transfer Modal */}
            <TransferModal
                isOpen={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                transferItem={transferItem}
                transferForm={transferForm}
                setTransferForm={setTransferForm}
                warehouses={warehouses}
                getWarehouseName={getWarehouseName}
                getProductName={getProductName}
                onSubmit={handleTransfer}
            />

            {/* Custom Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                confirmText="حذف"
                cancelText="إلغاء"
            />
        </div>
    );
};

export default AdvancedWMS;
