import React from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { CourtSession } from '../../types';

interface UpcomingSessionsAlertsProps {
  rawSessions: CourtSession[];
  getCaseTitle: (caseId?: number) => string;
}

export const UpcomingSessionsAlerts: React.FC<UpcomingSessionsAlertsProps> = ({
  rawSessions,
  getCaseTitle,
}) => {
  const alertedSessions = rawSessions
    .filter(s => s.status === 'upcoming' && new Date(s.sessionDate).getTime() - new Date().getTime() <= 7 * 24 * 60 * 60 * 1000)
    .sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime());

  if (alertedSessions.length === 0) return null;

  return (
    <div className="mb-8 p-4 bg-amber-50 rounded-2xl border border-amber-200">
      <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-3">
        <AlertCircle className="w-5 h-5" />
        تنبيهات مواعيد الجلسات خلال 7 أيام
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {alertedSessions.map(s => (
          <div key={s.id} className="bg-white p-3 rounded-xl border border-amber-100 flex items-start gap-3 shadow-sm">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">{getCaseTitle(s.caseId)}</h4>
              <p className="text-xs text-slate-500 line-clamp-1">{s.courtName}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-semibold text-amber-600">
                  {new Date(s.sessionDate).toLocaleDateString('ar-EG')}
                </span>
                {s.sessionTime && (
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {s.sessionTime}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
