import React from 'react';
import { Smile, Meh, Frown, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MarketMonitorSentimentProps {
  sentiments: {
    category: string;
    score: number; // 0 to 100
    trend: 'up' | 'down' | 'neutral';
    description: string;
  }[];
}

const MarketMonitorSentiment: React.FC<MarketMonitorSentimentProps> = ({ sentiments }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-6">مؤشر ثقة المستهلك والسوق</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sentiments.map((sentiment, idx) => {
          let Icon = Meh;
          let colorClass = 'text-gray-500';
          let bgClass = 'bg-gray-50';
          
          if (sentiment.score >= 70) {
            Icon = Smile;
            colorClass = 'text-green-500';
            bgClass = 'bg-green-50';
          } else if (sentiment.score <= 40) {
            Icon = Frown;
            colorClass = 'text-red-500';
            bgClass = 'bg-red-50';
          } else {
            Icon = Meh;
            colorClass = 'text-yellow-500';
            bgClass = 'bg-yellow-50';
          }

          return (
            <div key={idx} className="p-4 rounded-xl border border-gray-100 flex flex-col items-center text-center">
              <div className={`p-3 rounded-full ${bgClass} ${colorClass} mb-3`}>
                <Icon className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-gray-900">{sentiment.category}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-2xl font-extrabold text-gray-800">{sentiment.score}</span>
                <span className="text-sm text-gray-500">/ 100</span>
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm">
                {sentiment.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                {sentiment.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                {sentiment.trend === 'neutral' && <Minus className="w-4 h-4 text-gray-500" />}
                <span className={
                  sentiment.trend === 'up' ? 'text-green-600' :
                  sentiment.trend === 'down' ? 'text-red-600' :
                  'text-gray-600'
                }>
                  {sentiment.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketMonitorSentiment;
