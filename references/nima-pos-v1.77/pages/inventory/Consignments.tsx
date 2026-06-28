import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { PackageSearch, Plus, Search, PackageOpen, LayoutDashboard, Share2, Download } from 'lucide-react';
import { NewConsignmentModal } from '../../components/inventory/NewConsignmentModal';
import { ViewConsignmentModal } from '../../components/inventory/ViewConsignmentModal';

export default function Consignments() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewConsignment, setViewConsignment] = useState<any | null>(null);

  const consignments = useLiveQuery(() => db.consignments.toArray()) || [];
  const [activeTab, setActiveTab] = useState<'inward' | 'outward'>('inward');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConsignments = consignments?.filter(c => c.type === activeTab && 
    (c.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || c.partyName.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(val || 0);
  };

  const totalInwardValue = consignments.filter(c => c.type === 'inward' && c.status === 'active').reduce((sum, c) => sum + c.totalValue, 0);
  const totalOutwardValue = consignments.filter(c => c.type === 'outward' && c.status === 'active').reduce((sum, c) => sum + c.totalValue, 0);

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <PackageSearch className="w-8 h-8 text-indigo-500" />
            إدارة بضاعة الأمانة
          </h2>
          <p className="text-slate-500 mt-1 font-medium">سجلات بضائع الأمانة الواردة (موردين) والمنصرفة (لعملاء)</p>
        </div>
        <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
        >
            <Plus className="w-5 h-5" />
            بضاعة أمانة جديدة
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-emerald-500 rounded-r-3xl"></div>
              <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
                  <Download className="w-7 h-7" />
              </div>
              <div>
                  <p className="text-sm font-bold text-gray-500 mb-1">بضائع الموردين المفتوحة (واردة)</p>
                  <p className="text-2xl font-black text-gray-800">{formatCurrency(totalInwardValue)}</p>
              </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-indigo-500 rounded-r-3xl"></div>
              <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center shrink-0">
                  <Share2 className="w-7 h-7" />
              </div>
              <div>
                  <p className="text-sm font-bold text-gray-500 mb-1">بضائع لدى العملاء (منصرفة)</p>
                  <p className="text-2xl font-black text-gray-800">{formatCurrency(totalOutwardValue)}</p>
              </div>
          </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
          <div className="bg-white p-2 rounded-3xl border border-slate-200 flex gap-2 w-fit shadow-sm">
            <button 
                className={`px-8 py-3 rounded-2xl font-bold transition-all ${activeTab === 'inward' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200/50' : 'text-slate-500 hover:bg-slate-50'}`}
                onClick={() => setActiveTab('inward')}
            >
                أمانة واردة (من الموردين)
            </button>
            <button 
                className={`px-8 py-3 rounded-2xl font-bold transition-all ${activeTab === 'outward' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200/50' : 'text-slate-500 hover:bg-slate-50'}`}
                onClick={() => setActiveTab('outward')}
            >
                أمانة منصرفة (للعملاء)
            </button>
          </div>

          <div className="bg-white flex-1 p-2 rounded-3xl shadow-sm border border-slate-100 flex items-center">
            <div className="relative w-full">
                <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
                <input 
                    type="text"
                    placeholder="ابحث برقم الإيصال أو اسم الجهة..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-12 pl-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                />
            </div>
          </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-right">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th className="p-5 font-bold text-slate-500 whitespace-nowrap">رقم المرجع</th>
                        <th className="p-5 font-bold text-slate-500 whitespace-nowrap">الجهة ({activeTab === 'inward'? 'المورد' : 'العميل'})</th>
                        <th className="p-5 font-bold text-slate-500 whitespace-nowrap">التاريخ</th>
                        <th className="p-5 font-bold text-slate-500 whitespace-nowrap text-center">عدد المنتجات</th>
                        <th className="p-5 font-bold text-slate-500 whitespace-nowrap text-left">إجمالي القيمة التقديرية</th>
                        <th className="p-5 font-bold text-slate-500 whitespace-nowrap text-center">الحالة</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredConsignments?.map((c, i) => (
                        <tr key={i} onClick={() => setViewConsignment(c)} className="hover:bg-slate-50/80 transition-colors cursor-pointer group">
                            <td className="p-5 font-black text-slate-700">{c.referenceNumber}</td>
                            <td className={`p-5 font-black ${activeTab === 'inward' ? 'text-emerald-700' : 'text-indigo-700'}`}>{c.partyName}</td>
                            <td className="p-5 text-slate-600 font-medium">{new Date(c.date).toLocaleDateString('ar-EG')}</td>
                            <td className="p-5 text-slate-600 text-center font-bold">
                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg">{c.items.length} أصناف</span>
                            </td>
                            <td className="p-5 font-black text-slate-800 text-left">{formatCurrency(c.totalValue)}</td>
                            <td className="p-5 text-center">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${c.status === 'active' ? 'bg-amber-50 text-amber-700 border-amber-200' : c.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    {c.status === 'active' ? 'قيد التسوية' : c.status === 'completed' ? 'تمت التسوية' : 'ملغى'}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {filteredConsignments?.length === 0 && (
                        <tr>
                            <td colSpan={6} className="p-20 text-center">
                                <div className="flex flex-col items-center justify-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <PackageOpen className="w-10 h-10 text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-700 mb-2">لا توجد سجلات أمانة</h3>
                                    <p className="text-slate-500 font-medium max-w-sm text-center">
                                        قم بإضافة بضاعة أمانة جديدة لمتابعة البضائع المستلمة من الموردين أو المسلمة للعملاء.
                                    </p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
      
      <NewConsignmentModal 
          isOpen={isModalOpen}
          closeModal={() => setIsModalOpen(false)}
          formatCurrency={formatCurrency}
      />
      
      <ViewConsignmentModal 
          consignment={viewConsignment}
          onClose={() => setViewConsignment(null)}
          formatCurrency={formatCurrency}
      />
    </div>
  );
}
