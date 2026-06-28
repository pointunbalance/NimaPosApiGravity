import React from "react";
import {
  UserPlus,
  Search,
  Plus,
  Filter,
  Phone,
  Calendar,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { SchoolAdmissionCreateModal } from "../../components/school/admissions/SchoolAdmissionCreateModal";
import { SchoolAdmissionFollowupModal } from "../../components/school/admissions/SchoolAdmissionFollowupModal";
import { AdmissionRequestCard } from "../../components/school/admissions/AdmissionRequestCard";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { useSchoolAdmissions, LEAD_SOURCES } from "../../components/school/admissions/useSchoolAdmissions";

const STATUSES = {
  new: {
    label: "جديد",
    icon: AlertCircle,
    color: "text-indigo-600",
    bg: "bg-indigo-100",
    border: "border-indigo-200",
  },
  contacted: {
    label: "تم التواصل",
    icon: Phone,
    color: "text-sky-600",
    bg: "bg-sky-100",
    border: "border-sky-200",
  },
  no_answer: {
    label: "لم يرد",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-100",
    border: "border-amber-200",
  },
  visit_scheduled: {
    label: "زيارة محددة",
    icon: Calendar,
    color: "text-purple-600",
    bg: "bg-purple-100",
    border: "border-purple-200",
  },
  accepted: {
    label: "تم القبول",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    border: "border-emerald-200",
  },
  rejected: {
    label: "مرفوض/ملغي",
    icon: XCircle,
    color: "text-rose-600",
    bg: "bg-rose-100",
    border: "border-rose-200",
  },
  registered: {
    label: "تم التسجيل",
    icon: ClipboardList,
    color: "text-slate-600",
    bg: "bg-slate-100",
    border: "border-slate-200",
  },
};

export const SchoolAdmissions = () => {
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    isFollowupModalOpen,
    setIsFollowupModalOpen,
    selectedRequest,
    setSelectedRequest,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    confirmOpen,
    setConfirmOpen,
    confirmParams,
    levels,
    employees,
    crmLogs,
    form,
    setForm,
    followupForm,
    setFollowupForm,
    resetForm,
    handleCreate,
    handleAddFollowup,
    updateStatus,
    convertToStudent,
    updateRejection,
    handleDelete,
    filteredRequests,
  } = useSchoolAdmissions();

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-2xl">
            <UserPlus className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">
              إدارة علاقات العملاء (CRM) والالتحاق
            </h1>
            <p className="text-slate-500 font-medium">
              متابعة طلبات التسجيل، المكالمات، والمقابلات لزيادة التسجيلات
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-sm shadow-indigo-200"
        >
          <Plus className="w-5 h-5" /> إضافة طلب جديد
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center mb-8">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="w-5 h-5 text-slate-400 absolute right-4 top-3" />
          <input
            type="text"
            placeholder="ابحث باسم الطفل، ولي الأمر، رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-12 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium outline-none"
          />
        </div>
        <div className="flex items-center gap-2 text-slate-500 font-bold bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
          <Filter className="w-4 h-4" /> الحالة:
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-w-[150px] text-slate-700"
        >
          <option value="all">جميع الطلبات</option>
          {Object.entries(STATUSES).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRequests.map((request) => (
          <AdmissionRequestCard
            key={request.id}
            request={request}
            STATUSES={STATUSES}
            levels={levels}
            employees={employees}
            crmLogs={crmLogs}
            setSelectedRequest={setSelectedRequest}
            setIsFollowupModalOpen={setIsFollowupModalOpen}
            convertToStudent={convertToStudent}
            updateRejection={updateRejection}
            updateStatus={updateStatus}
            handleDelete={handleDelete}
          />
        ))}

        {filteredRequests.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
            <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-50 text-indigo-500" />
            <p className="font-bold text-lg text-slate-600">
              لا توجد طلبات متطابقة
            </p>
          </div>
        )}
      </div>

      <SchoolAdmissionCreateModal
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        form={form}
        setForm={setForm}
        handleCreate={handleCreate}
        LEAD_SOURCES={LEAD_SOURCES}
        levels={levels}
        employees={employees}
      />

      <SchoolAdmissionFollowupModal
        isFollowupModalOpen={isFollowupModalOpen}
        setIsFollowupModalOpen={setIsFollowupModalOpen}
        selectedRequest={selectedRequest}
        crmLogs={crmLogs}
        employees={employees}
        followupForm={followupForm}
        setFollowupForm={setFollowupForm}
        handleAddFollowup={handleAddFollowup}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        title={confirmParams?.title || ""}
        message={confirmParams?.message || ""}
        onConfirm={confirmParams?.onConfirm || (() => {})}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default SchoolAdmissions;
