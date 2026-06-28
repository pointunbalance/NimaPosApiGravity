import React, { useState } from "react";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { useAssetsData } from "../../components/accounting/useAssetsData";
import { useAssetsActions } from "../../components/accounting/useAssetsActions";
import { ExtendedAsset } from "../../components/accounting/AssetModal";
import {
  Calculator,
  Monitor,
  Car,
  Armchair,
  Building2,
  Wrench,
} from "lucide-react";

import AssetsHeader from "../../components/accounting/AssetsHeader";
import AssetsKPIs from "../../components/accounting/AssetsKPIs";
import AssetsCharts from "../../components/accounting/AssetsCharts";
import AssetsFilters from "../../components/accounting/AssetsFilters";
import AssetsTable from "../../components/accounting/AssetsTable";
import AssetModal from "../../components/accounting/AssetModal";

const AssetManagement: React.FC = () => {
  const { success, error: showError } = useToast();
  const data = useAssetsData();
  const actions = useAssetsActions(
    data.editingAsset,
    () => closeModal(),
    data.analytics,
    success,
    showError
  );

  // Modals / Confirmation state
  const [deleteAssetId, setDeleteAssetId] = useState<number | null>(null);
  const [isDepreciationConfirmOpen, setIsDepreciationConfirmOpen] = useState(false);

  const openModal = (asset?: ExtendedAsset) => {
    if (asset) {
      data.setEditingAsset(asset);
    } else {
      data.setEditingAsset(null);
    }
    data.setIsModalOpen(true);
  };

  const closeModal = () => {
    data.setIsModalOpen(false);
    data.setEditingAsset(null);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteAssetId(id);
  };

  const handleConfirmDelete = async () => {
    if (deleteAssetId !== null) {
      await actions.handleDeleteAsset(deleteAssetId);
      setDeleteAssetId(null);
    }
  };

  const handleRunDepreciationClick = () => {
    setIsDepreciationConfirmOpen(true);
  };

  const handleConfirmDepreciation = async () => {
    setIsDepreciationConfirmOpen(false);
    await actions.executeDepreciation();
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US").format(val);

  const getCategoryIcon = (cat?: string) => {
    switch (cat) {
      case "electronics":
        return <Monitor className="w-4 h-4" />;
      case "furniture":
        return <Armchair className="w-4 h-4" />;
      case "vehicles":
        return <Car className="w-4 h-4" />;
      case "buildings":
        return <Building2 className="w-4 h-4" />;
      case "tools":
        return <Wrench className="w-4 h-4" />;
      default:
        return <Calculator className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (cat?: string) => {
    switch (cat) {
      case "electronics":
        return "أجهزة إلكترونية";
      case "furniture":
        return "أثاث ومفروشات";
      case "vehicles":
        return "سيارات ونقل";
      case "buildings":
        return "مباني وإنشاءات";
      case "tools":
        return "عدد وأدوات";
      default:
        return "معدات أخرى";
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50/50 font-['Tajawal'] print:p-0 print:bg-white">
      <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
        <h2 className="text-2xl font-bold print:text-black">
          تقرير الأصول الثابتة والإهلاك
        </h2>
        <p className="text-sm mt-2 print:text-black">
          تاريخ التقرير: {new Date().toLocaleDateString("ar-EG")}
        </p>
      </div>

      <AssetsHeader
        onOpenModal={() => openModal()}
        onPrint={handlePrint}
        onExport={actions.handleExport}
        onRunDepreciation={handleRunDepreciationClick}
      />

      <AssetsKPIs analytics={data.analytics} formatCurrency={formatCurrency} />

      <div className="print:hidden">
        <AssetsCharts
          analytics={data.analytics}
          formatCurrency={formatCurrency}
          getCategoryLabel={getCategoryLabel}
        />

        <AssetsFilters
          searchTerm={data.searchTerm}
          setSearchTerm={data.setSearchTerm}
          filterCategory={data.filterCategory}
          setFilterCategory={data.setFilterCategory}
        />
      </div>

      <AssetsTable
        filteredAssets={data.filteredAssets}
        getCategoryIcon={getCategoryIcon}
        getCategoryLabel={getCategoryLabel}
        formatCurrency={formatCurrency}
        openModal={openModal}
        handleDelete={handleDeleteClick}
      />

      <AssetModal
        isOpen={data.isModalOpen}
        closeModal={closeModal}
        editingAsset={data.editingAsset}
        handleSave={actions.handleSave}
      />

      <ConfirmModal
        isOpen={deleteAssetId !== null}
        title="حذف الأصل الثابت"
        message="هل أنت متأكد من حذف هذا الأصل الثابت؟ لا يمكن التراجع عن هذا القرار بعد اتخاذه."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteAssetId(null)}
        confirmText="حذف الأصل"
        cancelText="إلغاء"
      />

      <ConfirmModal
        isOpen={isDepreciationConfirmOpen}
        title="ترحيل إهلاك الأصول"
        message="هل أنت متأكد من ترحيل إهلاك الشهر الحالي لجميع الأصول الثابتة النشطة لإنشاء قيد الإهلاك وتحديث مجمعات الإهلاك؟"
        onConfirm={handleConfirmDepreciation}
        onCancel={() => setIsDepreciationConfirmOpen(false)}
        confirmText="ترحيل الإهلاك"
        cancelText="تراجع"
      />
    </div>
  );
};

export default AssetManagement;
