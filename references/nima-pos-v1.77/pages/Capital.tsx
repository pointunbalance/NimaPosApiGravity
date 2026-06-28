import React from 'react';
import CapitalHeader from '../components/capital/CapitalHeader';
import CapitalKPIs from '../components/capital/CapitalKPIs';
import CashFlowChart from '../components/capital/CashFlowChart';
import AssetAllocationChart from '../components/capital/AssetAllocationChart';
import FixedAssetsList from '../components/capital/FixedAssetsList';
import WarehouseAssetsList from '../components/capital/WarehouseAssetsList';
import AddAssetModal from '../components/capital/AddAssetModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useCapitalState } from '../components/capital/useCapitalState';

const Capital: React.FC = () => {
  const {
    capitalInput,
    setCapitalInput,
    isSaved,
    isAssetModalOpen,
    setIsAssetModalOpen,
    deleteAssetId,
    setDeleteAssetId,
    assets,
    warehouses,
    formatCurrency,
    handleSaveCapital,
    handleAddAsset,
    handleDeleteAsset,
    executeDeleteAsset,
    financialData,
    trendData,
    assetAllocationData,
    handleExportCSV,
    handlePrint
  } = useCapitalState();

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50/50 font-['Tajawal'] min-h-screen" dir="rtl">
      <div className="hidden print:block mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-800">تقرير المركز المالي</h1>
        <p className="text-slate-500 text-sm mt-1">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
      </div>

      <CapitalHeader 
        capitalInput={capitalInput}
        setCapitalInput={setCapitalInput}
        handleSaveCapital={handleSaveCapital}
        isSaved={isSaved}
        onPrint={handlePrint}
        onExportCSV={handleExportCSV}
      />

      <CapitalKPIs 
        financialData={financialData}
        formatCurrency={formatCurrency}
      />

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <CashFlowChart 
          trendData={trendData}
          formatCurrency={formatCurrency}
        />
        <AssetAllocationChart 
          assetAllocationData={assetAllocationData}
          formatCurrency={formatCurrency}
          totalAssets={financialData.totalAssets}
        />
      </div>

      {/* Bottom Section: Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FixedAssetsList 
          assets={assets}
          totalFixedAssets={financialData.totalFixedAssets}
          formatCurrency={formatCurrency}
          setIsAssetModalOpen={setIsAssetModalOpen}
          handleDeleteAsset={handleDeleteAsset}
        />
        <WarehouseAssetsList 
          warehouses={warehouses}
          warehouseAssets={financialData.warehouseAssets}
          totalInventoryValue={financialData.totalInventoryValue}
          formatCurrency={formatCurrency}
        />
      </div>

      <AddAssetModal 
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        onAddAsset={handleAddAsset}
      />

      {deleteAssetId && (
        <ConfirmModal
          isOpen={!!deleteAssetId}
          title="حذف الأصل المالي"
          message="هل أنت متأكد من رغبتك في حذف هذا الأصل نهائياً من سجلات رأس المال والأصول؟"
          onConfirm={executeDeleteAsset}
          onCancel={() => setDeleteAssetId(null)}
          confirmText="تأكيد الحذف"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
};

export default Capital;
