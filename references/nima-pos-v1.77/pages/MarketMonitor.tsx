import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

import MarketMonitorHeader from '../components/market/MarketMonitorHeader';
import MarketMonitorKPIs from '../components/market/MarketMonitorKPIs';
import MarketMonitorAlerts from '../components/market/MarketMonitorAlerts';
import MarketMonitorCharts from '../components/market/MarketMonitorCharts';
import MarketMonitorNews from '../components/market/MarketMonitorNews';
import MarketMonitorSentiment from '../components/market/MarketMonitorSentiment';

// Mock Data for Market Trends (since we don't have real external market data in Dexie)
const marketTrendsData = [
  { name: 'Jan', oil: 75, gold: 1900, wheat: 250, electronics: 100 },
  { name: 'Feb', oil: 78, gold: 1920, wheat: 260, electronics: 102 },
  { name: 'Mar', oil: 82, gold: 1950, wheat: 280, electronics: 105 },
  { name: 'Apr', oil: 85, gold: 1980, wheat: 300, electronics: 108 },
  { name: 'May', oil: 88, gold: 2000, wheat: 320, electronics: 112 },
  { name: 'Jun', oil: 90, gold: 2050, wheat: 340, electronics: 115 },
];

// Mock Alerts
const alerts = [
  { id: 1, type: 'critical', message: 'ارتفاع أسعار الشحن بنسبة 15% بسبب أحداث البحر الأحمر.', impact: 'زيادة متوقعة في تكلفة الواردات.', category: 'اللوجستيات', source: 'رويترز' },
  { id: 2, type: 'warning', message: 'موجة جفاف في الدول المصدرة للقمح.', impact: 'توقع زيادة أسعار المخبوزات والمواد الغذائية الأساسية.', category: 'المواد الغذائية', source: 'بلومبرغ' },
  { id: 3, type: 'info', message: 'إطلاق تقنيات ذكاء اصطناعي جديدة.', impact: 'انخفاض متوقع في أسعار الإلكترونيات القديمة.', category: 'الإلكترونيات', source: 'تك كرانش' },
];

// Mock News
const newsArticles = [
  { id: 1, title: 'توقعات بنمو قطاع التجزئة بنسبة 8% في الربع القادم', source: 'الاقتصادية', time: 'منذ ساعتين', url: '#', category: 'تجزئة' },
  { id: 2, title: 'تأثير التضخم على القوة الشرائية للمستهلكين في الشرق الأوسط', source: 'فوربس الشرق الأوسط', time: 'منذ 5 ساعات', url: '#', category: 'اقتصاد' },
  { id: 3, title: 'طفرة في مبيعات التجارة الإلكترونية خلال موسم التخفيضات', source: 'أرقام', time: 'منذ يوم واحد', url: '#', category: 'تجارة إلكترونية' },
  { id: 4, title: 'تغيرات في سلاسل الإمداد العالمية وتأثيرها على الأسواق المحلية', source: 'CNBC عربية', time: 'منذ يومين', url: '#', category: 'سلاسل الإمداد' },
];

// Mock Sentiment
const marketSentiments = [
  { category: 'المواد الغذائية', score: 85, trend: 'up' as const, description: 'طلب قوي ومستقر' },
  { category: 'الإلكترونيات', score: 65, trend: 'neutral' as const, description: 'ترقب لتقنيات جديدة' },
  { category: 'الملابس والأزياء', score: 45, trend: 'down' as const, description: 'تراجع موسمي متوقع' },
  { category: 'الكماليات والهدايا', score: 75, trend: 'up' as const, description: 'انتعاش مع اقتراب المواسم' },
];

const MarketMonitor: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const orders = useLiveQuery(() => db.orders.toArray()) || [];

  // Calculate real sales correlation based on our actual data
  const [salesCorrelationData, setSalesCorrelationData] = useState<any[]>([]);

  useEffect(() => {
    if (products.length > 0 && orders.length > 0) {
      const categorySales: Record<string, number> = {};
      
      // Calculate our sales per category
      orders.forEach(order => {
        order.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            categorySales[product.category] = (categorySales[product.category] || 0) + item.total;
          }
        });
      });

      // Find max sales to normalize to 0-100 scale
      const maxSales = Math.max(...Object.values(categorySales), 1);

      const correlationData = Object.keys(categorySales).map(category => {
        const ourSalesNormalized = Math.round((categorySales[category] / maxSales) * 100);
        // Mock market demand based on category for demonstration, but our sales are real
        const marketDemand = Math.min(100, ourSalesNormalized + (Math.random() * 40 - 20));
        
        return {
          category,
          marketDemand: Math.round(marketDemand),
          ourSales: ourSalesNormalized
        };
      }).slice(0, 5); // Top 5 categories

      setSalesCorrelationData(correlationData.length > 0 ? correlationData : [
        { category: 'المواد الغذائية', marketDemand: 85, ourSales: 70 },
        { category: 'الإلكترونيات', marketDemand: 60, ourSales: 65 }
      ]);
    } else {
      setSalesCorrelationData([
        { category: 'المواد الغذائية', marketDemand: 85, ourSales: 70 },
        { category: 'الإلكترونيات', marketDemand: 60, ourSales: 65 },
        { category: 'الملابس', marketDemand: 45, ourSales: 50 },
        { category: 'مواد البناء', marketDemand: 90, ourSales: 80 },
      ]);
    }
  }, [products, orders]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      <MarketMonitorHeader />
      <MarketMonitorKPIs />

      <MarketMonitorSentiment sentiments={marketSentiments} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MarketMonitorAlerts alerts={alerts} />
        <MarketMonitorCharts 
          marketTrendsData={marketTrendsData} 
          salesCorrelationData={salesCorrelationData} 
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <MarketMonitorNews news={newsArticles} />
      </div>
    </motion.div>
  );
};

export default MarketMonitor;
