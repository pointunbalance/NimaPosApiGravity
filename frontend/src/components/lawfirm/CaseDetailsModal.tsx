import React from 'react';
import { X, Calendar, Gavel, FileText, User, DollarSign } from 'lucide-react';
import { LawCase, CourtSession } from '../../types';

interface CaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: LawCase | null;
  clientName: string;
  sessions: CourtSession[];
}

const CaseDetailsModal: React.FC<CaseDetailsModalProps> = ({ isOpen, onClose, caseData, clientName, sessions }) => {
  if (!isOpen || !caseData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              تفاصيل القضية: {caseData.title}
            </h2>
            <p className="text-slate-500 font-mono mt-1 text-sm">{caseData.caseNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" /> معلومات عامة
              </h3>
              <div className="space-y-3 text-sm">
                <p className="flex justify-between"><span className="text-slate-500">الموكل:</span> <span className="font-bold text-slate-800">{clientName}</span></p>
                <p className="flex justify-between"><span className="text-slate-500">تاريخ الفتح:</span> <span className="font-bold text-slate-800">{new Date(caseData.openedAt).toLocaleDateString('ar-EG')}</span></p>
                <p className="flex justify-between"><span className="text-slate-500">المحكمة:</span> <span className="font-bold text-slate-800">{caseData.courtName}</span></p>
                <p className="flex justify-between"><span className="text-slate-500">الخصم:</span> <span className="font-bold text-slate-800">{caseData.opponentName || '-'}</span></p>
                <p className="flex justify-between"><span className="text-slate-500">محامي الخصم:</span> <span className="font-bold text-slate-800">{caseData.opponentLawyer || '-'}</span></p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-slate-400" /> معلومات مالية وحالة
              </h3>
              <div className="space-y-3 text-sm">
                <p className="flex justify-between"><span className="text-slate-500">الحالة:</span> 
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    caseData.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                    caseData.status === 'suspended' ? 'bg-amber-100 text-amber-700' :
                    caseData.status === 'won' ? 'bg-indigo-100 text-indigo-700' :
                    caseData.status === 'lost' ? 'bg-rose-100 text-rose-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {caseData.status === 'active' ? 'نشطة' : caseData.status === 'suspended' ? 'معلقة' : caseData.status === 'won' ? 'رابحة' : caseData.status === 'lost' ? 'خاسرة' : 'مغلقة'}
                  </span>
                </p>
                <p className="flex justify-between"><span className="text-slate-500">إجمالي الأتعاب:</span> <span className="font-bold text-slate-800">{(caseData.totalFees || 0).toLocaleString()}</span></p>
                <p className="flex justify-between"><span className="text-slate-500">المبلغ المدفوع:</span> <span className="font-bold text-emerald-600">{(caseData.paidAmount || 0).toLocaleString()}</span></p>
                <p className="flex justify-between"><span className="text-slate-500">المتبقي:</span> <span className="font-bold text-rose-600">{((caseData.totalFees || 0) - (caseData.paidAmount || 0)).toLocaleString()}</span></p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Gavel className="w-5 h-5 text-indigo-600" />
              الجلسات المرتبطة
            </h3>
            {sessions.length === 0 ? (
              <p className="text-slate-500 text-sm p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">لا توجد جلسات مسجلة لهذه القضية.</p>
            ) : (
              <div className="space-y-3">
                {sessions.map(s => (
                  <div key={s.id} className="p-4 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors bg-white shadow-sm flex flex-col md:flex-row gap-4 justify-between md:items-center">
                    <div>
                      <p className="font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(s.sessionDate).toLocaleDateString('ar-EG')}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">{s.courtName} - القرار: {s.decision || 'لا يوجد'}</p>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          s.status === 'upcoming' ? 'bg-emerald-100 text-emerald-700' :
                          s.status === 'completed' ? 'bg-slate-100 text-slate-700' :
                          s.status === 'postponed' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {s.status === 'upcoming' ? 'قادمة' : s.status === 'completed' ? 'تمت' : s.status === 'postponed' ? 'مؤجلة' : 'ملغاة'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {caseData.notes && (
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">ملاحظات</h3>
              <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-100 text-sm whitespace-pre-wrap">
                {caseData.notes}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CaseDetailsModal;
