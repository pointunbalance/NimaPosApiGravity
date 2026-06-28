import React, { useState } from "react";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { useCostCentersData } from "../../components/accounting/useCostCentersData";
import { useCostCentersActions } from "../../components/accounting/useCostCentersActions";
import CostCentersHeader from "../../components/accounting/CostCentersHeader";
import CostCentersFilters from "../../components/accounting/CostCentersFilters";
import CostCentersDashboard from "../../components/accounting/CostCentersDashboard";
import CostCentersGrid from "../../components/accounting/CostCentersGrid";
import CostCenterModal from "../../components/accounting/CostCenterModal";
import CostCenterTransactionsModal from "../../components/accounting/CostCenterTransactionsModal";
import { CostCenter } from "../../types";

const CostCenters: React.FC = () => {
  const { success, error: showError } = useToast();
  const data = useCostCentersData();
  const actions = useCostCentersActions(
    data.formData,
    data.editingCenter,
    data.setFormData,
    data.setIsModalOpen,
    data.setEditingCenter,
    data.analytics,
    data.dateRange,
    success,
    showError
  );

  const [deleteCenterId, setDeleteCenterId] = useState<number | null>(null);

  const openModal = (center?: CostCenter) => {
    if (center) {
      data.setEditingCenter(center);
      data.setFormData(center);
    } else {
      data.setEditingCenter(null);
      data.setFormData({ name: "", code: "", description: "", budget: 0 });
    }
    data.setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteCenterId(id);
  };

  const handleConfirmDelete = async () => {
    if (deleteCenterId !== null) {
      await actions.executeDeleteCenter(deleteCenterId);
      setDeleteCenterId(null);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("ar-IQ", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50/50 font-['Tajawal'] print:p-0 print:bg-white">
      {/* Header */}
      <CostCentersHeader
        onExport={actions.handleExport}
        onPrint={actions.handlePrint}
        onOpenModal={() => openModal()}
      />

      {/* Print Header */}
      <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-6">
        <h2 className="text-3xl font-bold mb-2 print:text-black">
          تقرير مراكز التكلفة
        </h2>
        <div className="flex justify-between items-end mt-4 text-sm font-bold print:text-black">
          <div className="text-right">
            <p>
              الفترة: من {data.dateRange.start} إلى {data.dateRange.end}
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <CostCentersFilters
        searchTerm={data.searchTerm}
        setSearchTerm={data.setSearchTerm}
        dateRange={data.dateRange}
        setDateRange={data.setDateRange}
        setQuickFilter={data.setQuickFilter}
      />

      {/* Dashboard Charts */}
      <CostCentersDashboard
        analytics={data.analytics}
        formatCurrency={formatCurrency}
      />

      {/* Cost Centers Grid */}
      <CostCentersGrid
        analytics={data.analytics}
        formatCurrency={formatCurrency}
        onSelectCenter={data.setSelectedCenterId}
        onEdit={openModal}
        onDeleteClick={handleDeleteClick}
      />

      {/* Add/Edit Modal */}
      <CostCenterModal
        isOpen={data.isModalOpen}
        onClose={() => data.setIsModalOpen(false)}
        editingCenter={data.editingCenter}
        formData={data.formData}
        setFormData={data.setFormData}
        onSave={actions.handleSave}
      />

      {/* Drill-down Transactions Modal */}
      <CostCenterTransactionsModal
        selectedCenterId={data.selectedCenterId}
        onClose={() => data.setSelectedCenterId(null)}
        costCenters={data.costCenters}
        dateRange={data.dateRange}
        analytics={data.analytics}
        formatCurrency={formatCurrency}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteCenterId !== null}
        title="حذف مركز التكلفة"
        message="هل أنت متأكد من حذف مركز التكلفة؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteCenterId(null)}
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  );
};

export default CostCenters;
