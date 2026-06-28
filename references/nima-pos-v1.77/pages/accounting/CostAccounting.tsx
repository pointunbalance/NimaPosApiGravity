import React from "react";
import { LayoutGrid, Target } from "lucide-react";
import { useCostAccountingData } from "../../components/accounting/useCostAccountingData";
import CostAccountingHeader from "../../components/accounting/CostAccountingHeader";
import CostAccountingDashboard from "../../components/accounting/CostAccountingDashboard";
import CostElementsTable from "../../components/accounting/CostElementsTable";
import CostAllocationTab from "../../components/accounting/CostAllocationTab";
import CostElementModal from "../../components/accounting/CostElementModal";
import ConfirmModal from "../../components/ui/ConfirmModal";

export const CostAccounting: React.FC = () => {
  const data = useCostAccountingData();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-['Tajawal'] bg-slate-50/20" dir="rtl">
      {/* Header Panel */}
      <CostAccountingHeader
        onSwitchTab={data.setActiveTab}
        onOpenNewModal={() => {
          data.setEditingId(null);
          data.setFormData({
            code: "",
            name: "",
            type: "مباشرة",
            behavior: "متغيرة",
            defaultCenter: "",
          });
          data.setIsModalOpen(true);
        }}
      />

      {/* Tabs list navigation */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => data.setActiveTab("dashboard")}
          className={`pb-3 px-4 text-sm font-bold transition-colors relative ${
            data.activeTab === "dashboard" ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" />
            تحليل التكاليف
          </div>
          {data.activeTab === "dashboard" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => data.setActiveTab("elements")}
          className={`pb-3 px-4 text-sm font-bold transition-colors relative ${
            data.activeTab === "elements" ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            عناصر التكلفة
          </div>
          {data.activeTab === "elements" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Dynamic contents */}
      {data.activeTab === "dashboard" && (
        <CostAccountingDashboard
          mockCostData={data.mockCostData}
          pieData={data.pieData}
          colors={data.COLORS}
        />
      )}

      {data.activeTab === "elements" && (
        <CostElementsTable
          filteredElements={data.filteredElements}
          searchQuery={data.searchQuery}
          setSearchQuery={data.setSearchQuery}
          onEdit={data.handleEdit}
          onDelete={data.triggerDelete}
        />
      )}

      {data.activeTab === "allocation" && <CostAllocationTab />}

      {/* Edit or Add Modal Form */}
      {data.isModalOpen && (
        <CostElementModal
          editingId={data.editingId}
          formData={data.formData}
          setFormData={data.setFormData}
          onClose={() => {
            data.setIsModalOpen(false);
            data.setEditingId(null);
            data.setFormData({
              code: "",
              name: "",
              type: "مباشرة",
              behavior: "متغيرة",
              defaultCenter: "",
            });
          }}
          onSubmit={data.handleCreate}
        />
      )}

      {/* Confirm deletion popup */}
      <ConfirmModal
        isOpen={data.isDeleteConfirmOpen}
        title="موافق على الحذف؟"
        message="هل أنت متأكد من رغبتك في حذف عنصر التكلفة هذا؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={data.confirmDelete}
        onCancel={() => data.setIsDeleteConfirmOpen(false)}
        confirmText="حذف"
        cancelText="تراجع"
      />
    </div>
  );
};

export default CostAccounting;
