import React from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Wrench, 
  Plus, 
  Search, 
  ClipboardList, 
  Clock, 
  DollarSign, 
  ChevronRight 
} from 'lucide-react';

import ConfirmModal from '../../components/ui/ConfirmModal';

// Modular Imports
import { useEquipmentState } from '../../components/gym/useEquipmentState';
import { EquipmentMetrics } from '../../components/gym/EquipmentMetrics';
import { EquipmentTabDirectory } from '../../components/gym/EquipmentTabDirectory';
import { EquipmentTabScheduler } from '../../components/gym/EquipmentTabScheduler';
import { EquipmentTabFinance } from '../../components/gym/EquipmentTabFinance';
import { EquipmentMaintenancePanel } from '../../components/gym/EquipmentMaintenancePanel';
import { EquipmentFormModal } from '../../components/gym/EquipmentFormModal';

export const Equipment = () => {
  const {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    isModalOpen,
    setIsModalOpen,
    isEdit,
    toast,
    confirmDialog,
    setConfirmDialog,
    selectedEquipId,
    isMaintenancePanelOpen,
    setIsMaintenancePanelOpen,
    showAddLogForm,
    setShowAddLogForm,
    logFormData,
    setLogFormData,
    formData,
    setFormData,
    currency,
    records,
    trainers,
    uniqueTypes,
    filteredRecords,
    statsCore,
    chartDataByClass,
    allLedgerLogs,
    handleOpenModal,
    handleSave,
    askDelete,
    handleOpenMaintenancePanel,
    handleAddMaintenanceLogSubmit,
    selectedEquipForHistory
  } = useEquipmentState();

  return (
    <div className="p-6 space-y-6 text-right font-sans min-h-screen bg-slate-50/50" dir="rtl">
      
      {/* Toast Notification System */}
      {toast && (
        <div className={`fixed top-4 left-4 z-[999] p-4 rounded-xl shadow-lg border flex items-center gap-3 animate-in fade-in slide-in-from-left duration-300 max-w-sm ${
          toast.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : toast.type === 'warning' 
            ? 'bg-amber-50 text-amber-800 border-amber-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
          {toast.type === 'error' && <X className="w-5 h-5 text-rose-600 shrink-0" />}
          <span className="text-xs font-black leading-relaxed">{toast.message}</span>
        </div>
      )}

      {/* Header Deck Area */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-row-reverse">
        {/* Navigation Action Area */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto text-xs font-bold flex-row-reverse">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 w-full sm:w-auto flex-row-reverse">
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'directory' 
                  ? 'bg-white text-indigo-600 shadow font-black' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-indigo-505" />
              <span>جرد وتصنيف الأصول</span>
            </button>
            <button
              onClick={() => setActiveTab('scheduler')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'scheduler' 
                  ? 'bg-white text-indigo-600 shadow font-black' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-500" />
              <span>الجدولة والإنذارات الوقائية</span>
              {statsCore.warning > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-sans font-black animate-pulse">
                  {statsCore.warning}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'finance' 
                  ? 'bg-white text-indigo-600 shadow font-black' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>اليومية وسندات الصرف مالي</span>
            </button>
          </div>

          <button 
            onClick={() => handleOpenModal(false)}
            className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل أصل أو جهاز جديد</span>
          </button>
        </div>

        <div>
          <div className="flex items-center gap-2 justify-start flex-row-reverse text-right">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Wrench className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-lg font-black text-slate-805 tracking-tight">صيانة الأجهزة والأصول والعهد</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                التتبع الفني الوقائي للأدوات الرياضية وحساب استحقاقات الصيانة محاسبياً بالتكامل مع اليومية العامة.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Panel Grid */}
      <EquipmentMetrics statsCore={statsCore} currency={currency} />

      {/* Main Workspace Frame */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* LEFT/RIGHT SIDE: Sliding drawer maintenance logs panel details */}
        <EquipmentMaintenancePanel
          isOpen={isMaintenancePanelOpen}
          onClose={() => setIsMaintenancePanelOpen(false)}
          selectedEquipForHistory={selectedEquipForHistory}
          showAddLogForm={showAddLogForm}
          setShowAddLogForm={setShowAddLogForm}
          logFormData={logFormData}
          setLogFormData={setLogFormData}
          onAddLog={handleAddMaintenanceLogSubmit}
          currency={currency}
        />

        {/* RIGHT SIDE Workspace Area */}
        <div className="xl:col-span-12 space-y-6">
          
          {/* Controls Bar for Directory tab */}
          {activeTab === 'directory' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between flex-row-reverse">
              
              {/* Advanced Type Select Filter */}
              <div className="flex items-center gap-2.5 w-full md:w-auto text-xs flex-row-reverse">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none flex-1 md:flex-none text-right"
                >
                  <option value="all">كل الفئات والتصنيفات (الكل)</option>
                  {uniqueTypes.map((t: string) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                {/* Status Selector */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none flex-1 md:flex-none text-right"
                >
                  <option value="all">كل حالات النشاط</option>
                  <option value="يعمل">🟢 يعمل بشكل ممتاز</option>
                  <option value="بحاجة لصيانة">🟡 بحاجة لصيانة/فحص</option>
                  <option value="تحت الصيانة">⚙️ قيد الصيانة والإصلاح</option>
                  <option value="معطل">🔴 معطل / خارج الخدمة</option>
                </select>
              </div>

              {/* Search Element */}
              <div className="relative flex-1 w-full max-w-md">
                <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث باسم الجهاز، رقم الباركود، أو السيريال..." 
                  className="w-full pr-10 pl-4 py-2.5 text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-505 transition-all outline-none text-right"
                />
              </div>

            </div>
          )}

          {/* TAB 1: DEVICE DIRECTORY CARD LIST */}
          {activeTab === 'directory' && (
            <EquipmentTabDirectory
              filteredRecords={filteredRecords}
              trainers={trainers}
              selectedEquipId={selectedEquipId}
              onOpenMaintenancePanel={handleOpenMaintenancePanel}
              onEdit={(item) => handleOpenModal(true, item)}
              onDelete={askDelete}
              currency={currency}
            />
          )}

          {/* TAB 2: PREVENTIVE SCRIPT SCHEDULER */}
          {activeTab === 'scheduler' && (
            <EquipmentTabScheduler
              records={records}
              onOpenMaintenancePanel={handleOpenMaintenancePanel}
            />
          )}

          {/* TAB 3: FINANCIAL DAILY JOURNAL & RECHARTS */}
          {activeTab === 'finance' && (
            <EquipmentTabFinance
              chartDataByClass={chartDataByClass}
              allLedgerLogs={allLedgerLogs}
              currency={currency}
            />
          )}

        </div>

      </div>

      {/* Main Asset Form Modal */}
      <EquipmentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isEdit={isEdit}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        trainers={trainers}
        currency={currency}
      />

      {/* confirm remove item modal alert dialog overlay */}
      {confirmDialog && confirmDialog.isOpen && (
        <ConfirmModal 
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText="استبعاد وحذف نهائي"
          cancelText="إلغاء وتراجع"
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

    </div>
  );
};
export default Equipment;
