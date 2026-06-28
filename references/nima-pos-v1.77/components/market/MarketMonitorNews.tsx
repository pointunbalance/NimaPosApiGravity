import React from 'react';
import { Newspaper, ExternalLink, Clock } from 'lucide-react';

interface NewsArticle {
  id: number;
  title: string;
  source: string;
  time: string;
  url: string;
  category: string;
}

interface MarketMonitorNewsProps {
  news: NewsArticle[];
}

const MarketMonitorNews: React.FC<MarketMonitorNewsProps> = ({ news }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-indigo-500" />
          أخبار السوق والمجلات الاقتصادية
        </h2>
        <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          عرض الكل
        </button>
      </div>
      
      <div className="space-y-4">
        {news.map((article) => (
          <div key={article.id} className="group flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                  {article.category}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {article.time}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors line-clamp-2">
                {article.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                المصدر: <span className="font-medium">{article.source}</span>
              </p>
            </div>
            <div className="sm:self-center mt-2 sm:mt-0">
              <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-2 rounded-lg transition-colors"
              >
                قراءة المزيد
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketMonitorNews;
