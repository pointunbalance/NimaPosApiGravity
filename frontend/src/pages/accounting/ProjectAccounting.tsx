import React from "react";
import { useProjectAccountingData } from "../../components/accounting/useProjectAccountingData";
import ProjectAccountingHeader from "../../components/accounting/ProjectAccountingHeader";
import ProjectAccountingOverview from "../../components/accounting/ProjectAccountingOverview";
import ProjectAccountingTable from "../../components/accounting/ProjectAccountingTable";
import WorkInProgressTab from "../../components/accounting/WorkInProgressTab";
import ProjectAccountingModal from "../../components/accounting/ProjectAccountingModal";
import ConfirmModal from "../../components/ui/ConfirmModal";

export const ProjectAccounting: React.FC = () => {
  const data = useProjectAccountingData();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-['Tajawal']" dir="rtl">
      {/* Header Panel */}
      <ProjectAccountingHeader
        onNewProject={() => {
          data.setEditingId(null);
          data.setFormData({
            projectCode: "",
            projectName: "",
            client: "",
            budget: 0,
            actual: 0,
            revenue: 0,
            completion: 0,
            status: "جاري العمل",
          });
          data.setIsModalOpen(true);
        }}
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => data.setActiveTab("overview")}
          className={`pb-3 px-4 text-sm font-bold transition-colors relative ${
            data.activeTab === "overview" ? "text-emerald-600" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          نظرة عامة
          {data.activeTab === "overview" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => data.setActiveTab("projects")}
          className={`pb-3 px-4 text-sm font-bold transition-colors relative ${
            data.activeTab === "projects" ? "text-emerald-600" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          سجل المشاريع والمستخلصات
          {data.activeTab === "projects" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => data.setActiveTab("wip")}
          className={`pb-3 px-4 text-sm font-bold transition-colors relative ${
            data.activeTab === "wip" ? "text-emerald-600" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          أعمال تحت التنفيذ (WIP)
          {data.activeTab === "wip" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Dynamic Tab Contents */}
      {data.activeTab === "overview" && (
        <ProjectAccountingOverview
          totalActive={data.totalActive}
          totalRevenue={data.totalRevenue}
          totalActual={data.totalActual}
          defaultProjects={data.defaultProjects}
        />
      )}

      {data.activeTab === "projects" && (
        <ProjectAccountingTable
          filteredList={data.filteredList}
          searchTerm={data.searchTerm}
          setSearchTerm={data.setSearchTerm}
          onEdit={data.handleEdit}
          onDelete={data.triggerDelete}
        />
      )}

      {data.activeTab === "wip" && <WorkInProgressTab filteredList={data.filteredList} />}

      {/* Modal dialog form for Create / Update */}
      {data.isModalOpen && (
        <ProjectAccountingModal
          editingId={data.editingId}
          formData={data.formData}
          setFormData={data.setFormData}
          onClose={() => {
            data.setIsModalOpen(false);
            data.setEditingId(null);
            data.setFormData({
              projectCode: "",
              projectName: "",
              client: "",
              budget: 0,
              actual: 0,
              revenue: 0,
              completion: 0,
              status: "جاري العمل",
            });
          }}
          onSubmit={data.handleCreate}
        />
      )}

      {/* Deletion verification dialog */}
      <ConfirmModal
        isOpen={data.isDeleteConfirmOpen}
        title="تأكيد الحذف"
        message="هل أنت متأكد من رغبتك في حذف هذا المشروع نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={data.confirmDelete}
        onCancel={() => data.setIsDeleteConfirmOpen(false)}
        confirmText="حذف"
        cancelText="تراجع"
      />
    </div>
  );
};

export default ProjectAccounting;
