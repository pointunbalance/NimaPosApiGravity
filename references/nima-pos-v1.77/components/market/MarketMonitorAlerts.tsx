import React from 'react';
import { AlertTriangle, Zap } from 'lucide-react';

interface Alert {
  id: number;
  type: string;
  message: string;
  impact: string;
  category: string;
  source?: string;
}

interface MarketMonitorAlertsProps {
  alerts: Alert[];
}

const MarketMonitorAlerts: React.FC<MarketMonitorAlertsProps> = ({ alerts }) => {
  return (
    <div className="lg:col-span-1 space-y-4">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <Zap className="w-5 h-5 text-yellow-500" />
        تنبيهات الأحداث العالمية
      </h2>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div 
            key={alert.id} 
            className={`p-4 rounded-xl border ${
              alert.type === 'critical' ? 'bg-red-50 border-red-100' :
              alert.type === 'warning' ? 'bg-yellow-50 border-yellow-100' :
              'bg-blue-50 border-blue-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                alert.type === 'critical' ? 'text-red-600' :
                alert.type === 'warning' ? 'text-yellow-600' :
                'text-blue-600'
              }`} />
              <div>
                <h4 className={`font-semibold ${
                  alert.type === 'critical' ? 'text-red-900' :
                  alert.type === 'warning' ? 'text-yellow-900' :
                  'text-blue-900'
                }`}>{alert.message}</h4>
                <p className={`text-sm mt-1 ${
                  alert.type === 'critical' ? 'text-red-700' :
                  alert.type === 'warning' ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>{alert.impact}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                    alert.type === 'critical' ? 'bg-red-100 text-red-800' :
                    alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {alert.category}
                  </span>
                  {alert.source && (
                    <span className="text-xs text-gray-500">
                      المصدر: {alert.source}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketMonitorAlerts;
