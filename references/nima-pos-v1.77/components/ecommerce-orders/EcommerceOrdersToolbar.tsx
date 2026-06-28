import React from 'react';
import { Search, Filter } from 'lucide-react';

interface EcommerceOrdersToolbarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  platformFilter: string;
  setPlatformFilter: (platform: string) => void;
}

const EcommerceOrdersToolbar: React.FC<EcommerceOrdersToolbarProps> = ({
  searchTerm,
  setSearchTerm,
  platformFilter,
  setPlatformFilter
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="البحث عن طلب، عميل..."
            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">جميع المنصات</option>
            <option value="shopify">Shopify</option>
            <option value="woocommerce">WooCommerce</option>
            <option value="salla">Salla</option>
            <option value="zid">Zid</option>
          </select>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm font-medium transition-colors">
            <Filter className="w-4 h-4" />
            تصفية
          </button>
        </div>
      </div>
    </div>
  );
};

export default EcommerceOrdersToolbar;
