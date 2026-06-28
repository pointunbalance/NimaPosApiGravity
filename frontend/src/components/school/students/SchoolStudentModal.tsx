import React from "react";
import { X, Activity } from "lucide-react";
import { LogsTab } from "./LogsTab";
import { ChecklistTab } from "./ChecklistTab";
import { BehavioralTab } from "./BehavioralTab";
import { HealthTab } from "./HealthTab";
import { AttendanceTab } from "./AttendanceTab";
import { NotesTab } from "./NotesTab";
import { InfoTab } from "./InfoTab";
import { GuardianTab } from "./GuardianTab";
import { ParentsTab } from "./ParentsTab";
import { PickupsTab } from "./PickupsTab";
import { AttachmentsTab } from "./AttachmentsTab";
import { SubscriptionsTab } from "./SubscriptionsTab";
import { PaymentsTab } from "./PaymentsTab";
import { EvaluationsTab } from "./EvaluationsTab";
import { TABS, SchoolStudentModalProps } from "./types";

export const SchoolStudentModal: React.FC<SchoolStudentModalProps> = (props) => {
  const {
    isModalOpen,
    studentFormData: formData,
    levels,
    filteredClassesForSelect: classesList,
    handleClose,
    activeTab,
    setActiveTab,
    handleSaveInfo,
    guardianId,
    setGuardianId,
    guardians,
    handleLinkGuardian,
    parentsForm,
    setParentsForm,
    handleSaveParents,
    newPickup,
    setNewPickup,
    handleAddPickup,
    handleRemovePickup,
    selectedChildId,
    medicalForm,
    setMedicalForm,
    handleSaveMedical,
    behavioralForm,
    setBehavioralForm,
    handleSaveBehavioral,
    checklistForm,
    setChecklistForm,
    handleSaveChecklist,
    childNotes,
    setChildNotes,
    handleSaveNotes,
    handleAddSubscription,
    subForm,
    setSubForm,
    paymentForm,
    setPaymentForm,
    handleAddPayment,
    evalForm,
    setEvalForm,
    handleAddEvaluation,
  } = props;

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-slate-800">
              {selectedChildId ? "ملف الطفل الشامل" : "تسجيل طفل جديد"}
            </h2>
            {selectedChildId && (
              <span className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full font-bold text-sm tracking-widest">
                {formData.code}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors outline-none shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden h-[calc(100%-80px)]">
          {/* Sidebar Tabs */}
          <div className="w-64 bg-slate-50 border-l border-slate-200 p-4 space-y-1 overflow-y-auto hidden md:block shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-brand-600 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                } ${!selectedChildId && tab.id !== "info" ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={!selectedChildId && tab.id !== "info"}
                title={
                  !selectedChildId && tab.id !== "info"
                    ? "الرجاء حفظ البيانات الأساسية أولاً"
                    : ""
                }
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-y-auto bg-white">
            {/* Mobile Tab Selector */}
            <div className="md:hidden mb-6 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <label className="block text-xs font-black text-slate-500 mb-1.5 mr-1">تصفح أقسام ملف الطفل:</label>
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {TABS.map((tab) => (
                  <option 
                    key={tab.id} 
                    value={tab.id}
                    disabled={!selectedChildId && tab.id !== "info"}
                  >
                    {tab.label} {!selectedChildId && tab.id !== "info" ? " (يجب الحفظ أولاً)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {activeTab === "info" && (
              <InfoTab
                formData={formData}
                setFormData={setFormData}
                handleSaveInfo={handleSaveInfo}
                levels={levels}
                classesList={classesList}
                handleClose={handleClose}
              />
            )}

            {activeTab === "parents" && (
              <ParentsTab
                parentsForm={parentsForm}
                setParentsForm={setParentsForm}
                handleSaveParents={handleSaveParents}
              />
            )}

            {activeTab === "guardian" && (
              <GuardianTab
                guardianId={guardianId}
                setGuardianId={setGuardianId}
                guardians={guardians}
                handleLinkGuardian={handleLinkGuardian}
              />
            )}

            {activeTab === "pickups" && (
              <PickupsTab
                selectedChildId={selectedChildId!}
                newPickup={newPickup}
                setNewPickup={setNewPickup}
                handleAddPickup={handleAddPickup}
                handleRemovePickup={handleRemovePickup}
              />
            )}

            {activeTab === "logs" && (
              <LogsTab selectedChildId={selectedChildId!} />
            )}

            {![
              "info",
              "parents",
              "guardian",
              "pickups",
              "health",
              "attendance",
              "notes",
              "attachments",
              "subscriptions",
              "payments",
              "evaluations",
              "logs",
              "behavioral",
              "checklist",
            ].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 animate-in fade-in duration-500 mt-20">
                <Activity className="w-20 h-20 text-slate-200" />
                <h4 className="text-2xl font-black text-slate-700">
                  هذا القسم قيد التطوير...
                </h4>
                <p className="text-lg text-slate-500">
                  سيتم تفعيل هذه الشاشات الإضافية لتعزيز ملف الطفل الشامل تباعاً.
                </p>
              </div>
            )}

            {activeTab === "health" && (
              <HealthTab
                medicalForm={medicalForm}
                setMedicalForm={setMedicalForm}
                handleSaveMedical={handleSaveMedical}
                selectedChildId={selectedChildId!}
              />
            )}

            {activeTab === "attendance" && (
              <AttendanceTab selectedChildId={selectedChildId!} />
            )}

            {activeTab === "behavioral" && (
              <BehavioralTab
                behavioralForm={behavioralForm}
                setBehavioralForm={setBehavioralForm}
                handleSaveBehavioral={handleSaveBehavioral}
              />
            )}

            {activeTab === "checklist" && (
              <ChecklistTab
                checklistForm={checklistForm}
                setChecklistForm={setChecklistForm}
                handleSaveChecklist={handleSaveChecklist}
              />
            )}

            {activeTab === "notes" && (
              <NotesTab
                childNotes={childNotes}
                setChildNotes={setChildNotes}
                handleSaveNotes={handleSaveNotes}
              />
            )}

            {activeTab === "attachments" && <AttachmentsTab />}

            {activeTab === "subscriptions" && (
              <SubscriptionsTab
                selectedChildId={selectedChildId!}
                subForm={subForm}
                setSubForm={setSubForm}
                handleAddSubscription={handleAddSubscription}
              />
            )}

            {activeTab === "payments" && (
              <PaymentsTab
                selectedChildId={selectedChildId!}
                paymentForm={paymentForm}
                setPaymentForm={setPaymentForm}
                handleAddPayment={handleAddPayment}
              />
            )}

            {activeTab === "evaluations" && (
              <EvaluationsTab
                selectedChildId={selectedChildId!}
                evalForm={evalForm}
                setEvalForm={setEvalForm}
                handleAddEvaluation={handleAddEvaluation}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
