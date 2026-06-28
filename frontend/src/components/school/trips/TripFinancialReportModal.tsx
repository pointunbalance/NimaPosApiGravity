import React, { useState } from 'react';
import { X } from 'lucide-react';
import { db } from '../../../db';
import { TripSummaryTab } from './TripSummaryTab';
import { TripParticipantsTab } from './TripParticipantsTab';
import { TripExpensesTab } from './TripExpensesTab';

interface TripFinancialReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: any;
  students: any[];
  generateFinancialReport: (trip: any) => any;
}

export const TripFinancialReportModal: React.FC<TripFinancialReportModalProps> = ({
  isOpen,
  onClose,
  trip,
  students,
  generateFinancialReport,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'participants' | 'expenses'>('summary');
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState<number | null>(null);
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  if (!isOpen || !trip) return null;

  const stats = generateFinancialReport(trip);
  const tripParticipants = trip.participants || [];

  const handleAddStudent = async () => {
    if (!selectedStudentToAdd) return;
    const exists = tripParticipants.some((p: any) => p.studentId === selectedStudentToAdd);
    if (exists) return;

    const updatedParticipants = [
      ...tripParticipants,
      { studentId: selectedStudentToAdd, parentApproved: true, paidAmount: trip.childCost || 0, attended: false },
    ];

    await db.schoolTrips.update(trip.id, { participants: updatedParticipants });
    setSelectedStudentToAdd(null);
  };

  const handleRemoveStudent = async (studentId: number) => {
    const updatedParticipants = tripParticipants.filter((p: any) => p.studentId !== studentId);
    await db.schoolTrips.update(trip.id, { participants: updatedParticipants });
  };

  const handleUpdateStudent = async (studentId: number, field: string, value: any) => {
    const updatedParticipants = tripParticipants.map((p: any) =>
      p.studentId === studentId ? { ...p, [field]: value } : p
    );
    await db.schoolTrips.update(trip.id, { participants: updatedParticipants });
  };

  const handleAddExpense = async () => {
    if (!newExpenseDesc || !newExpenseAmount) return;
    const updatedExpenses = [
      ...(trip.additionalExpenses || []),
      { description: newExpenseDesc, amount: Number(newExpenseAmount) },
    ];

    await db.schoolTrips.update(trip.id, { additionalExpenses: updatedExpenses });
    setNewExpenseDesc('');
    setNewExpenseAmount('');
  };

  const handleRemoveExpense = async (index: number) => {
    const updatedExpenses = [...(trip.additionalExpenses || [])];
    updatedExpenses.splice(index, 1);
    await db.schoolTrips.update(trip.id, { additionalExpenses: updatedExpenses });
  };

  const handleUpdateTransportCost = async (amount: number) => {
    await db.schoolTrips.update(trip.id, { transportCost: amount });
  };

  // Get students not registered yet
  const availableStudents = students.filter(
    (s) => !tripParticipants.some((p: any) => p.studentId === s.id)
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl my-8 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              تقرير ومتابعة رحلة: {trip.name}
            </h2>
            <p className="text-xs font-bold text-emerald-600 mt-0.5">
              الوجهة: {trip.destination} • {trip.date}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 px-6 bg-slate-50 gap-2 text-sm">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-3 px-4 font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'summary'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            الخلاصة المالية
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`py-3 px-4 font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'participants'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            الحضور والاشتراكات ({tripParticipants.length})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`py-3 px-4 font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'expenses'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            تكاليف ونفقات الرحلة
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
          {activeTab === 'summary' && (
            <TripSummaryTab stats={stats} tripParticipants={tripParticipants} />
          )}

          {activeTab === 'participants' && (
            <TripParticipantsTab
              selectedStudentToAdd={selectedStudentToAdd}
              setSelectedStudentToAdd={setSelectedStudentToAdd}
              availableStudents={availableStudents}
              handleAddStudent={handleAddStudent}
              tripParticipants={tripParticipants}
              students={students}
              handleUpdateStudent={handleUpdateStudent}
              handleRemoveStudent={handleRemoveStudent}
            />
          )}

          {activeTab === 'expenses' && (
            <TripExpensesTab
              trip={trip}
              handleUpdateTransportCost={handleUpdateTransportCost}
              newExpenseDesc={newExpenseDesc}
              setNewExpenseDesc={setNewExpenseDesc}
              newExpenseAmount={newExpenseAmount}
              setNewExpenseAmount={setNewExpenseAmount}
              handleAddExpense={handleAddExpense}
              handleRemoveExpense={handleRemoveExpense}
            />
          )}
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold text-sm transition cursor-pointer"
          >
            إغلاق التقرير
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripFinancialReportModal;
