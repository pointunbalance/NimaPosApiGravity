import React from 'react';
import { 
  Award, 
  Briefcase, 
  DollarSign, 
  PieChart, 
  FileSpreadsheet, 
  Users2, 
  Plus, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  X 
} from 'lucide-react';

import ConfirmModal from '../../components/ui/ConfirmModal';

// Modular Imports
import { useTrainersState } from '../../components/gym/useTrainersState';
import { TrainersMetrics } from '../../components/gym/TrainersMetrics';
import { TrainersTabDirectory } from '../../components/gym/TrainersTabDirectory';
import { TrainersTabMaster } from '../../components/gym/TrainersTabMaster';
import { TrainersTabPerformance } from '../../components/gym/TrainersTabPerformance';
import { TrainersTabPayroll } from '../../components/gym/TrainersTabPayroll';
import { TrainersFormModal } from '../../components/gym/TrainersFormModal';
import { TrainersDisbursalModal } from '../../components/gym/TrainersDisbursalModal';
import { SPECIALIZATION_OPTIONS } from '../../components/gym/trainersTypes';

export const Trainers = () => {
  const {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    specFilter,
    setSpecFilter,
    statusFilter,
    setStatusFilter,
    isModalOpen,
    setIsModalOpen,
    isEdit,
    toastNotification,
    isDeleteOpen,
    setIsDeleteOpen,
    selectedTrainerId,
    setSelectedTrainerId,
    extraBonus,
    setExtraBonus,
    extraDeduction,
    setExtraDeduction,
    payrollMethod,
    setPayrollMethod,
    payrollNotes,
    setPayrollNotes,
    isPayoutConfirmOpen,
    setIsPayoutConfirmOpen,
    currency,
    trainers,
    classes,
    handleSeedMockData,
    filteredTrainers,
    statsMetrics,
    trainerPayrollData,
    formData,
    setFormData,
    handleOpenModal,
    handleSave,
    askDelete,
    confirmDelete,
    handleDisbursePayroll,
    chartPerformanceData
  } = useTrainersState();

  return (
    <div className="p-6 space-y-7 bg-slate-50/50 min-h-screen font-sans text-right" dir="rtl">
      
      {/* Toast Alert Notice */}
      {toastNotification && (
        <div className={`fixed top-4 left-4 z-[999] p-4 rounded-xl shadow-lg border flex items-center gap-3 animate-in fade-in slide-in-from-left duration-300 max-w-sm ${
          toastNotification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {toastNotification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-xs font-black leading-relaxed">{toastNotification.text}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-row-reverse text-right">
        {/* Dynamic Action Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full xl:w-auto text-xs font-bold flex-row-reverse">
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex-1 xl:flex-none px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'directory' ? 'bg-white text-indigo-600 shadow font-black' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4 text-indigo-505" />
            <span>دليل الكباتن ({trainers.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('payroll');
              if (selectedTrainerId === null && trainers.length > 0) {
                setSelectedTrainerId(trainers[0].id!);
              }
            }}
            className={`flex-1 xl:flex-none px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'payroll' ? 'bg-indigo-600 text-white shadow font-black' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span>تسوية الرواتب دفترياً</span>
          </button>

          <button
            onClick={() => setActiveTab('performance')}
            className={`flex-1 xl:flex-none px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'performance' ? 'bg-white text-indigo-600 shadow font-black' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <PieChart className="w-4 h-4 text-amber-500" />
            <span>التحليلات ومخططات الأداء</span>
          </button>

          <button
            onClick={() => setActiveTab('master')}
            className={`flex-1 xl:flex-none px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'master' ? 'bg-white text-indigo-600 shadow font-black' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            <span>السجل التفصيلي</span>
          </button>
        </div>

        <div>
          <div className="flex items-center gap-2 justify-end flex-row-reverse text-right">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Award className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">إدارة شؤون وماليات المدربين</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            متابعة السجلات التعاقدية، الفترات والورديات، حفر أرقام التكليف، ومقاصة رواتب وعمولات الحصص المسجلة بمحاسبة القيد المزدوج الموحد.
          </p>
        </div>
      </div>

      {/* Metrics Section */}
      <TrainersMetrics statsMetrics={statsMetrics} currency={currency} />

      {/* Seed Mock Callout if empty */}
      {trainers.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-indigo-200 p-8 text-center flex flex-col items-center justify-center space-y-3.5 max-w-2xl mx-auto shadow-sm">
          <Users2 className="w-12 h-12 text-indigo-400" />
          <h2 className="text-base font-black text-slate-800">تأسيس سجلات كباتن التدريب بصالة الجيم</h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md">
            يبدو أن قاعدة البيانات المحلية خالية من المدربين حالياً. انقر على التأسيس السريع بالأسفل لملئه تلقائياً برواتب وتخصصات متنوعة.
          </p>
          <button
            onClick={handleSeedMockData}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all shadow flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تعبئة قاعدة البيانات بنماذج المدربين المقترحة</span>
          </button>
        </div>
      )}

      {/* Control Filter Bar */}
      {(activeTab === 'directory' || activeTab === 'master') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between flex-row-reverse text-right">
          <div className="flex flex-wrap items-center gap-2 text-xs flex-row-reverse justify-end">
            <select
              value={specFilter}
              onChange={(e) => setSpecFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white font-bold text-right"
            >
              <option value="all">📁 جميع التخصصات</option>
              {SPECIALIZATION_OPTIONS.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white font-bold text-right"
            >
              <option value="all">🛡️ جميع الحالات</option>
              <option value="متاح">🟢 متاح للتدريب</option>
              <option value="في إجازة">🟡 في إجازة سنوية</option>
              <option value="موقوف">🔴 موقوف مؤقتاً</option>
            </select>

            <button 
              onClick={() => handleOpenModal(false)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow cursor-pointer text-right"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>إضافة مدرب جديد</span>
            </button>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث باسم المدرب، التخصص، الهاتف..." 
              className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-xs font-semibold text-right"
            />
          </div>
        </div>
      )}

      {/* Tabs Content Switching */}
      {activeTab === 'directory' && (
        <TrainersTabDirectory
          filteredTrainers={filteredTrainers}
          classes={classes}
          currency={currency}
          onSelectPayroll={(id) => {
            setSelectedTrainerId(id);
            setActiveTab('payroll');
          }}
          onEdit={(item) => handleOpenModal(true, item)}
          onDelete={askDelete}
        />
      )}

      {activeTab === 'payroll' && (
        <TrainersTabPayroll
          trainers={trainers}
          classes={classes}
          selectedTrainerId={selectedTrainerId}
          setSelectedTrainerId={setSelectedTrainerId}
          trainerPayrollData={trainerPayrollData}
          extraBonus={extraBonus}
          setExtraBonus={setExtraBonus}
          extraDeduction={extraDeduction}
          setExtraDeduction={setExtraDeduction}
          payrollMethod={payrollMethod}
          setPayrollMethod={setPayrollMethod}
          payrollNotes={payrollNotes}
          setPayrollNotes={setPayrollNotes}
          onOpenPayoutConfirm={() => setIsPayoutConfirmOpen(true)}
          currency={currency}
        />
      )}

      {activeTab === 'performance' && (
        <TrainersTabPerformance
          chartPerformanceData={chartPerformanceData}
          trainers={trainers}
        />
      )}

      {activeTab === 'master' && (
        <TrainersTabMaster
          filteredTrainers={filteredTrainers}
          currency={currency}
          onEdit={(item) => handleOpenModal(true, item)}
          onDelete={askDelete}
        />
      )}

      {/* Form Modal */}
      <TrainersFormModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        isEdit={isEdit}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        currency={currency}
      />

      {/* Disbursal Confirmation Modal overlay */}
      <TrainersDisbursalModal
        isOpen={isPayoutConfirmOpen}
        trainerPayrollData={trainerPayrollData}
        extraBonus={extraBonus}
        extraDeduction={extraDeduction}
        payrollMethod={payrollMethod}
        currency={currency}
        onConfirm={handleDisbursePayroll}
        onCancel={() => setIsPayoutConfirmOpen(false)}
      />

      {/* Confirm deletion alert */}
      <ConfirmModal 
        isOpen={isDeleteOpen}
        title="تأكيد شطب وحذف المدرب"
        message="هل أنت متأكد تماماً من حذف هذا المدرب؟ سيتم شطب ملفه ولا يمكن التراجع عن تلك الخطوة في ذاكرة المتصفح."
        confirmText="شطب وحذف نهائي"
        cancelText="تراجع وإبقاء بالدليل"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />

    </div>
  );
};

export default Trainers;
