import React, { useState, useMemo } from 'react';
import { Scale, Gavel, Briefcase } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { LawCase, CourtSession } from '../types';
import { useToast } from '../context/ToastContext';

// Components
import CaseFormModal from '../components/lawfirm/CaseFormModal';
import SessionFormModal from '../components/lawfirm/SessionFormModal';
import CaseDetailsModal from '../components/lawfirm/CaseDetailsModal';
import { CasesTable } from '../components/lawfirm/CasesTable';
import { SessionsTable } from '../components/lawfirm/SessionsTable';
import ConfirmModal from '../components/ui/ConfirmModal';
import { LawFirmStats } from '../components/lawfirm/LawFirmStats';
import { UpcomingSessionsAlerts } from '../components/lawfirm/UpcomingSessionsAlerts';
import { FilterBar } from '../components/lawfirm/FilterBar';

const LawFirm: React.FC = () => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'cases' | 'sessions'>('cases');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [isCaseDetailsOpen, setIsCaseDetailsOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<LawCase | null>(null);

  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<CourtSession | null>(null);

  // Deletion confirm state
  const [deleteCaseId, setDeleteCaseId] = useState<number | null>(null);
  const [deleteSessionId, setDeleteSessionId] = useState<number | null>(null);

  // Queries
  const clients = useLiveQuery(() => db.customers.toArray()) || [];
  const opponents = useLiveQuery(() => db.legalOpponents.toArray()) || [];
  
  const cases = useLiveQuery(async () => {
    let allCases = await db.lawCases.reverse().toArray();
    if (search) {
      allCases = allCases.filter(c => c.caseNumber.includes(search) || c.title.includes(search));
    }
    if (statusFilter !== 'all') {
      allCases = allCases.filter(c => c.status === statusFilter);
    }
    return allCases;
  }, [search, statusFilter]) || [];

  const sessions = useLiveQuery(async () => {
    let allSessions = await db.courtSessions.reverse().toArray();
    if (search) {
      const matchedCases = await db.lawCases.filter(c => c.caseNumber.includes(search) || c.title.includes(search)).toArray();
      const matchedCaseIds = matchedCases.map(c => c.id);
      
      allSessions = allSessions.filter(s => s.courtName.includes(search) || (s.caseId && matchedCaseIds.includes(s.caseId)));
    }
    if (statusFilter !== 'all') {
      allSessions = allSessions.filter(s => s.status === statusFilter);
    }
    return allSessions;
  }, [search, statusFilter]) || [];

  const rawCases = useLiveQuery(() => db.lawCases.toArray()) || [];
  const rawSessions = useLiveQuery(() => db.courtSessions.toArray()) || [];
  const rawBillings = useLiveQuery(() => db.legalBillings?.toArray() || []) || [];

  const stats = useMemo(() => {
    const activeCases = rawCases.filter(c => c.status === 'active').length;
    const wonCases = rawCases.filter(c => c.status === 'won').length;
    const upcomingSessions = rawSessions.filter(s => s.status === 'upcoming').length;
    const totalFees = rawCases.reduce((sum, c) => sum + (c.totalFees || 0), 0);
    const billedPayments = rawBillings.filter(b => b.status === 'paid' && b.type !== 'expense').reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const legacyCollected = rawCases.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
    const collectedFees = billedPayments > 0 ? billedPayments : legacyCollected;

    return { activeCases, wonCases, upcomingSessions, totalFees, collectedFees };
  }, [rawCases, rawSessions, rawBillings]);

  const handleSaveCase = async (caseData: LawCase) => {
    try {
      if (caseData.id) {
        await db.lawCases.update(caseData.id, caseData);
        success('تم تحديث القضية بنجاح');
      } else {
        await db.lawCases.add(caseData);
        success('تم إضافة القضية بنجاح');
      }
      setIsCaseModalOpen(false);
    } catch (e) {
      error('حدث خطأ أثناء حفظ القضية');
    }
  };

  const handleSaveSession = async (sessionData: CourtSession) => {
    try {
      if (sessionData.id) {
        await db.courtSessions.update(sessionData.id, sessionData);
        success('تم تحديث الجلسة بنجاح');
      } else {
        await db.courtSessions.add(sessionData);
        success('تم إضافة الجلسة بنجاح');
      }
      setIsSessionModalOpen(false);
    } catch (e) {
      error('حدث خطأ أثناء حفظ الجلسة');
    }
  };

  const getClientName = (id: number) => clients.find(c => c.id === id)?.name || 'غير معروف';
  const getCaseTitle = (id: number) => cases.find(c => c.id === id)?.title || 'غير معروف';

  const renderPaidAmount = (caseId: number, legacyPaid: number) => {
    const casePayments = rawBillings.filter(b => b.caseId === caseId && b.status === 'paid' && b.type !== 'expense').reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const amt = casePayments > 0 ? casePayments : (legacyPaid || 0);
    if (amt > 0) {
      return <span className="text-emerald-600 font-bold">مدفوع: {amt.toLocaleString()}</span>;
    }
    return null;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <Scale className="w-8 h-8 text-indigo-600" />
            إدارة المكاتب والمحاماة
          </h1>
          <p className="text-slate-500 mt-2">إدارة القضايا، الجلسات، والموكلين</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => { setActiveTab('cases'); setStatusFilter('all'); }}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'cases' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            القضايا
          </button>
          <button
            onClick={() => { setActiveTab('sessions'); setStatusFilter('all'); }}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'sessions' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Gavel className="w-4 h-4" />
            الجلسات
          </button>
        </div>
      </div>

      <LawFirmStats
        totalCasesCount={rawCases.length}
        activeCasesCount={stats.activeCases}
        upcomingSessionsCount={stats.upcomingSessions}
        collectedFeesCount={stats.collectedFees}
        totalFeesCount={stats.totalFees}
      />

      <UpcomingSessionsAlerts
        rawSessions={rawSessions}
        getCaseTitle={getCaseTitle}
      />

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <FilterBar
          activeTab={activeTab}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onAdd={() => {
            if (activeTab === 'cases') {
              setEditingCase(null);
              setIsCaseModalOpen(true);
            } else {
              setEditingSession(null);
              setIsSessionModalOpen(true);
            }
          }}
        />

        {activeTab === 'cases' ? (
          <CasesTable 
            cases={cases}
            getClientName={getClientName}
            renderPaidAmount={renderPaidAmount}
            onViewDetails={(c) => {
              setEditingCase(c);
              setIsCaseDetailsOpen(true);
            }}
            onAddSession={(c) => {
              setEditingSession({
                caseId: c.id as number,
                sessionDate: new Date().toISOString().split('T')[0],
                courtName: c.courtName,
                status: 'upcoming'
              } as CourtSession);
              setIsSessionModalOpen(true);
            }}
            onEdit={(c) => {
              setEditingCase(c);
              setIsCaseModalOpen(true);
            }}
            onDelete={(id) => setDeleteCaseId(id)}
          />
        ) : (
          <SessionsTable 
            sessions={sessions}
            getCaseTitle={getCaseTitle}
            onEdit={(s) => {
              setEditingSession(s);
              setIsSessionModalOpen(true);
            }}
            onDelete={(id) => setDeleteSessionId(id)}
          />
        )}
      </div>

      {isCaseDetailsOpen && editingCase && (
        <CaseDetailsModal 
          isOpen={isCaseDetailsOpen} 
          onClose={() => setIsCaseDetailsOpen(false)}
          caseData={editingCase}
          clientName={getClientName(editingCase.clientId)}
          sessions={rawSessions.filter(s => s.caseId === editingCase.id)}
        />
      )}

      {isCaseModalOpen && (
        <CaseFormModal 
          isOpen={isCaseModalOpen} 
          onClose={() => setIsCaseModalOpen(false)}
          onSave={handleSaveCase}
          initialData={editingCase}
          clients={clients}
          opponents={opponents}
         />
      )}

      {isSessionModalOpen && (
        <SessionFormModal 
          isOpen={isSessionModalOpen} 
          onClose={() => setIsSessionModalOpen(false)}
          onSave={handleSaveSession}
          initialData={editingSession}
          cases={cases}
          existingSessions={rawSessions}
        />
      )}

      <ConfirmModal
        isOpen={deleteCaseId !== null}
        title="تأكيد حذف القضية"
        message="هل أنت متأكد من حذف هذه القضية؟ سيتم إزالة كافة السجلات المرتبطة بها ولا يمكن التراجع عن ذلك."
        onConfirm={async () => {
          if (deleteCaseId !== null) {
            try {
              await db.lawCases.delete(deleteCaseId);
              success('تم حذف القضية بنجاح');
            } catch (e) {
              error('حدث خطأ أثناء حذف القضية');
            } finally {
              setDeleteCaseId(null);
            }
          }
        }}
        onCancel={() => setDeleteCaseId(null)}
      />

      <ConfirmModal
        isOpen={deleteSessionId !== null}
        title="تأكيد حذف الجلسة"
        message="هل أنت متأكد من حذف هذه الجلسة القضائية؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={async () => {
          if (deleteSessionId !== null) {
            try {
              await db.courtSessions.delete(deleteSessionId);
              success('تم حذف الجلسة بنجاح');
            } catch (e) {
              error('حدث خطأ أثناء حذف الجلسة');
            } finally {
              setDeleteSessionId(null);
            }
          }
        }}
        onCancel={() => setDeleteSessionId(null)}
      />
    </div>
  );
};

export default LawFirm;
