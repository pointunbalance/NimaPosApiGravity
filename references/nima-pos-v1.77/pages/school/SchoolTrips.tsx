import React from 'react';
import { Plus, Search, Train } from 'lucide-react';
import { useSchoolTrips } from '../../components/school/trips/useSchoolTrips';
import { TripCard } from '../../components/school/trips/TripCard';
import { SchoolTripModal } from '../../components/school/trips/SchoolTripModal';
import { TripFinancialReportModal } from '../../components/school/trips/TripFinancialReportModal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

export const SchoolTrips = () => {
  const {
    isModalOpen,
    setIsModalOpen,
    isEdit,
    isReportOpen,
    setIsReportOpen,
    reportTripId,
    setReportTripId,
    confirmAction,
    setConfirmAction,
    trips,
    students,
    employees,
    formData,
    setFormData,
    searchQuery,
    setSearchQuery,
    handleOpenModal,
    handleSave,
    triggerDeleteTrip,
    triggerSendBulkMessage,
    executeConfirmAction,
    generateFinancialReport,
    filteredTrips,
  } = useSchoolTrips();

  const selectedReportTrip = trips.find((t) => t.id === reportTripId);

  return (
    <div className="p-6 bg-slate-50 min-h-screen" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-2xl">
            <Train className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">نظام الرحلات</h1>
            <p className="text-slate-500 font-medium">
              إدارة الرحلات المدرسية، المشرفين، الحضور والماليات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث عن رحلة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-md transition-colors shrink-0 cursor-pointer text-sm"
          >
            <Plus className="w-5 h-5" /> بناء رحلة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrips.map((trip) => {
          const stats = generateFinancialReport(trip);
          return (
            <TripCard
              key={trip.id}
              trip={trip}
              stats={stats}
              onEdit={() => handleOpenModal(true, trip)}
              onDelete={() => triggerDeleteTrip(trip.id!)}
              onOpenReport={() => {
                setReportTripId(trip.id!);
                setIsReportOpen(true);
              }}
              onSendMessage={() => triggerSendBulkMessage(trip.id!)}
            />
          );
        })}
        {filteredTrips.length === 0 && (
          <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
            <Train className="w-12 h-12 mx-auto mb-3 text-slate-300 animate-bounce" />
            <p className="font-bold text-slate-500">لا توجد رحلات مطابقة للبحث حالياً.</p>
          </div>
        )}
      </div>

      <SchoolTripModal
        isOpen={isModalOpen}
        isEdit={isEdit}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        formData={formData}
        setFormData={setFormData}
        employees={employees}
      />

      <TripFinancialReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        trip={selectedReportTrip}
        students={students}
        generateFinancialReport={generateFinancialReport}
      />

      <ConfirmModal
        isOpen={confirmAction !== null}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        onConfirm={executeConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};

export default SchoolTrips;
