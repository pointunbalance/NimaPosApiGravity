import React, { useState } from 'react';
import { db } from '../../db';
import { PerformanceAppraisal, User } from '../../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { 
  Star, Plus, Search, Filter, User as UserIcon, 
  Target, Award, TrendingUp, X, Save, Edit, Trash2, Printer, Download, Eye, LayoutDashboard
} from 'lucide-react';
import PerformanceMatrix from '../../components/hr/PerformanceMatrix';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useToast } from '../../context/ToastContext';

export default function PerformanceAppraisals() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'manual' | 'matrix'>('matrix');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewAppraisal, setViewAppraisal] = useState<PerformanceAppraisal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [appraisalToDeleteId, setAppraisalToDeleteId] = useState<number | null>(null);
  const [isFinalConfirmOpen, setIsFinalConfirmOpen] = useState(false);
  const [pendingFinalEvent, setPendingFinalEvent] = useState<any>(null);
  
  const printRef = React.useRef<HTMLDivElement>(null);

  const defaultAppraisal: Partial<PerformanceAppraisal> = {
    date: new Date(),
    period: 'Q1 2026',
    kpis: [
      { name: 'جودة العمل', score: 0, maxScore: 5 },
      { name: 'الالتزام بالمواعيد', score: 0, maxScore: 5 },
      { name: 'العمل الجماعي', score: 0, maxScore: 5 }
    ],
    overallScore: 0
  };

  const [newAppraisal, setNewAppraisal] = useState<Partial<PerformanceAppraisal>>(defaultAppraisal);

  const currentUser = useLiveQuery(() => db.users.where('isActive').equals(1).first());
  const appraisals = useLiveQuery(() => db.performanceAppraisals.reverse().sortBy('date'));
  const users = useLiveQuery(() => db.users.toArray());

  const calculateOverall = (kpis: any[]) => {
    if (!kpis || kpis.length === 0) return 0;
    const totalScore = kpis.reduce((sum, kpi) => sum + Number(kpi.score), 0);
    const maxTotal = kpis.reduce((sum, kpi) => sum + Number(kpi.maxScore), 0);
    if (maxTotal === 0) return 0;
    const percentage = Math.round((totalScore / maxTotal) * 100);
    return Math.min(Math.max(percentage, 0), 100);
  };

  const handleSaveAppraisal = async (e: React.FormEvent, isFinal = false) => {
    e.preventDefault();
    if (!currentUser || !newAppraisal.employeeId) return;

    if (newAppraisal.status === 'final') {
        showToast('لا يمكن تعديل التقييم بعد اعتماده بشكل نهائي.', 'error');
        return;
    }

    const overall = calculateOverall(newAppraisal.kpis || []);

    const appraisalData = {
      employeeId: Number(newAppraisal.employeeId),
      evaluatorId: currentUser.id!,
      date: newAppraisal.date || new Date(),
      period: newAppraisal.period || '',
      kpis: newAppraisal.kpis || [],
      overallScore: overall,
      comments: newAppraisal.comments,
      bonusAmount: newAppraisal.bonusAmount ? Number(newAppraisal.bonusAmount) : undefined,
      status: isFinal ? 'final' as const : 'draft' as const
    };

    if (newAppraisal.id) {
      await db.performanceAppraisals.update(newAppraisal.id, appraisalData);
    } else {
      await db.performanceAppraisals.add(appraisalData as PerformanceAppraisal);
    }

    showToast(isFinal ? 'تم اعتماد التقييم نهائياً بنجاح' : 'تم حفظ التقييم كمسودة بنجاح', 'success');
    setIsModalOpen(false);
    setNewAppraisal(defaultAppraisal);
  };

  const handleEdit = (appraisal: PerformanceAppraisal) => {
    if (appraisal.status === 'final') {
      showToast('لا يمكن تعديل هذا التقييم لأنه معتمد نهائياً. يمكنك فقط عرضه.', 'error');
      return;
    }
    setNewAppraisal(appraisal);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const appraisal = await db.performanceAppraisals.get(id);
    if (appraisal && appraisal.status === 'final') {
      showToast('لا يمكن حذف هذا التقييم لأنه معتمد نهائياً.', 'error');
      return;
    }
    setAppraisalToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const executeDeleteAppraisal = async () => {
    if (appraisalToDeleteId) {
      await db.performanceAppraisals.delete(appraisalToDeleteId);
      showToast('تم حذف التقييم بنجاح', 'success');
      setAppraisalToDeleteId(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  const handleFinalSubmitClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const form = document.getElementById('appraisal-form') as HTMLFormElement;
    if (form.checkValidity()) {
      setIsFinalConfirmOpen(true);
    } else {
      form.reportValidity();
    }
  };

  const executeFinalSubmit = async () => {
    await handleSaveAppraisal({ preventDefault: () => {} } as any, true);
    setIsFinalConfirmOpen(false);
  };

  const updateKPI = (index: number, field: string, value: any) => {
    const updatedKpis = [...(newAppraisal.kpis || [])];
    updatedKpis[index] = { ...updatedKpis[index], [field]: value };
    setNewAppraisal({ 
      ...newAppraisal, 
      kpis: updatedKpis,
      overallScore: calculateOverall(updatedKpis)
    });
  };

  const addKPI = () => {
    const updatedKpis = [...(newAppraisal.kpis || []), { name: '', score: 0, maxScore: 5 }];
    setNewAppraisal({
      ...newAppraisal,
      kpis: updatedKpis,
      overallScore: calculateOverall(updatedKpis)
    });
  };

  const removeKPI = (index: number) => {
    const updatedKpis = [...(newAppraisal.kpis || [])];
    updatedKpis.splice(index, 1);
    setNewAppraisal({ 
      ...newAppraisal, 
      kpis: updatedKpis,
      overallScore: calculateOverall(updatedKpis)
    });
  };

  const getUserName = (id?: number) => users?.find(u => u.id === id)?.name || 'غير محدد';

  const filteredAppraisals = appraisals?.filter(app => {
    const empName = getUserName(app.employeeId).toLowerCase();
    return empName.includes(searchTerm.toLowerCase()) || app.period.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-100 ';
    if (score >= 75) return 'text-blue-600 bg-blue-100 ';
    if (score >= 60) return 'text-amber-600 bg-amber-100 ';
    return 'text-red-600 bg-red-100 ';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!filteredAppraisals || filteredAppraisals.length === 0) return;
    
    const headers = ['الموظف', 'الفترة', 'تاريخ التقييم', 'المُقيِّم', 'الدرجة النهائية', 'المكافأة المقترحة', 'ملاحظات'];
    const csvContent = [
      headers.join(','),
      ...filteredAppraisals.map(app => {
        return [
          `"${getUserName(app.employeeId)}"`,
          `"${app.period}"`,
          `"${format(new Date(app.date), 'yyyy-MM-dd')}"`,
          `"${getUserName(app.evaluatorId)}"`,
          `${app.overallScore}%`,
          app.bonusAmount || 0,
          `"${(app.comments || '').replace(/"/g, '""')}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `تقييمات_الأداء_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" ref={printRef}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="text-indigo-600" />
            تقييم الأداء
          </h1>
          <p className="text-slate-500 text-sm mt-1">إدارة تقييمات الموظفين ومؤشرات الأداء (KPIs)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download size={20} />
            تصدير
          </button>
          <button
            onClick={handlePrint}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Printer size={20} />
            طباعة
          </button>
          <button
            onClick={() => {
              setNewAppraisal(defaultAppraisal);
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            تقييم جديد
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-6 print:hidden">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex-1 py-3 font-bold text-center border-b-2 transition-colors flex justify-center items-center gap-2 ${
            activeTab === 'matrix' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <LayoutDashboard size={20} /> مصفوفة الأداء التلقائية
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-3 font-bold text-center border-b-2 transition-colors flex justify-center items-center gap-2 ${
            activeTab === 'manual' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Star size={20} /> التقييمات اليدوية
        </button>
      </div>

      {activeTab === 'matrix' && (
        <PerformanceMatrix />
      )}

      {activeTab === 'manual' && (
        <>
          <div className="hidden print:block mb-6">
            <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">تقرير تقييمات الأداء</h1>
            <p className="text-center text-slate-500">تاريخ الطباعة: {format(new Date(), 'yyyy-MM-dd')}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between print:hidden">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="بحث باسم الموظف أو الفترة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="p-4 font-medium">الموظف</th>
                <th className="p-4 font-medium">الفترة</th>
                <th className="p-4 font-medium">تاريخ التقييم</th>
                <th className="p-4 font-medium">المُقيِّم</th>
                <th className="p-4 font-medium">الدرجة النهائية</th>
                <th className="p-4 font-medium">المكافأة المقترحة</th>
                <th className="p-4 font-medium print:hidden">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAppraisals?.map(app => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 print:hidden">
                        <UserIcon size={16} />
                      </div>
                      {getUserName(app.employeeId)}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    <div className="flex flex-col gap-1">
                      <span>{app.period}</span>
                      <span className={`text-[10px] w-fit px-2 py-0.5 rounded-full font-bold ${app.status === 'final' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
                         {app.status === 'final' ? 'معتمد نهائي' : 'مسودة المقيّم'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-500">
                    {format(new Date(app.date), 'yyyy-MM-dd')}
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {getUserName(app.evaluatorId)}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getScoreColor(app.overallScore)}`}>
                      {app.overallScore}%
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-700">
                    {app.bonusAmount ? (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <Award size={14} /> {app.bonusAmount.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-4 print:hidden">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setViewAppraisal(app)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="عرض التفاصيل"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(app)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(app.id!)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAppraisals?.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    لا توجد تقييمات مسجلة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Appraisal Modal */}
      {viewAppraisal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Target className="text-indigo-600" />
                تفاصيل تقييم الأداء
              </h2>
              <button onClick={() => setViewAppraisal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">الموظف</p>
                  <p className="font-bold text-slate-800">{getUserName(viewAppraisal.employeeId)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">الفترة</p>
                  <p className="font-bold text-slate-800">{viewAppraisal.period}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">تاريخ التقييم</p>
                  <p className="font-bold text-slate-800">{format(new Date(viewAppraisal.date), 'yyyy-MM-dd')}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">الدرجة النهائية</p>
                  <p className={`font-bold ${getScoreColor(viewAppraisal.overallScore)}`}>{viewAppraisal.overallScore}%</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">مؤشرات الأداء (KPIs)</h3>
                <div className="space-y-3">
                  {viewAppraisal.kpis.map((kpi, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium text-slate-800">{kpi.name}</p>
                        {kpi.comments && <p className="text-sm text-slate-500 mt-1">{kpi.comments}</p>}
                      </div>
                      <div className="text-center bg-slate-50 px-4 py-2 rounded-lg">
                        <span className="text-lg font-bold text-indigo-600">{kpi.score}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-slate-500">{kpi.maxScore}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {(viewAppraisal.comments || viewAppraisal.bonusAmount) && (
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  {viewAppraisal.bonusAmount && (
                    <div className="mb-3">
                      <p className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                        <Award size={16} /> المكافأة المقترحة: {viewAppraisal.bonusAmount.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {viewAppraisal.comments && (
                    <div>
                      <p className="text-sm font-bold text-indigo-800 mb-1">ملاحظات وتوصيات:</p>
                      <p className="text-sm text-indigo-700 whitespace-pre-wrap">{viewAppraisal.comments}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end bg-slate-50">
              <button
                onClick={() => setViewAppraisal(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Appraisal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {newAppraisal.id ? 'تعديل تقييم الأداء' : 'تقييم أداء جديد'}
              </h2>
              <button onClick={() => { setIsModalOpen(false); setNewAppraisal(defaultAppraisal); }} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="appraisal-form" onSubmit={handleSaveAppraisal} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الموظف *</label>
                    <select
                      required
                      value={newAppraisal.employeeId || ''}
                      onChange={e => setNewAppraisal({...newAppraisal, employeeId: Number(e.target.value)})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">-- اختر الموظف --</option>
                      {users?.map(u => (
                        <option key={u.id} value={u.id}>{u.name} - {u.jobTitle || 'موظف'}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">فترة التقييم *</label>
                    <input
                      required
                      type="text"
                      placeholder="مثال: الربع الأول 2026"
                      value={newAppraisal.period || ''}
                      onChange={e => setNewAppraisal({...newAppraisal, period: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Target size={16} className="text-indigo-600" />
                      مؤشرات الأداء (KPIs)
                    </label>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-slate-600">
                        النتيجة: <span className={`font-bold ${getScoreColor(newAppraisal.overallScore || 0)} px-2 py-0.5 rounded`}>{newAppraisal.overallScore}%</span>
                      </span>
                      <button 
                        type="button" 
                        onClick={addKPI}
                        className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-1"
                      >
                        <Plus size={16} /> إضافة مؤشر
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {newAppraisal.kpis?.map((kpi, index) => (
                      <div key={index} className="flex gap-3 items-start bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            placeholder="اسم المؤشر"
                            value={kpi.name}
                            onChange={e => updateKPI(index, 'name', e.target.value)}
                            className="w-full px-3 py-1.5 text-sm rounded border border-slate-200 bg-white text-slate-800"
                          />
                          <input
                            type="text"
                            placeholder="ملاحظات (اختياري)"
                            value={kpi.comments || ''}
                            onChange={e => updateKPI(index, 'comments', e.target.value)}
                            className="w-full px-3 py-1.5 text-sm rounded border border-slate-200 bg-white text-slate-800"
                          />
                        </div>
                        <div className="w-24 flex flex-col gap-1">
                          <label className="text-xs text-slate-500 text-center">الدرجة</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max={kpi.maxScore}
                              value={kpi.score}
                              onChange={e => updateKPI(index, 'score', Number(e.target.value))}
                              className="w-full px-2 py-1.5 text-sm text-center rounded border border-slate-200 bg-white text-slate-800"
                            />
                            <span className="text-slate-400">/</span>
                            <input
                              type="number"
                              min="1"
                              value={kpi.maxScore}
                              onChange={e => updateKPI(index, 'maxScore', Number(e.target.value))}
                              className="w-full px-2 py-1.5 text-sm text-center rounded border border-slate-200 bg-slate-100 text-slate-800"
                            />
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeKPI(index)}
                          className="text-red-500 hover:text-red-700 p-2 mt-4"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">المكافأة المقترحة (اختياري)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={newAppraisal.bonusAmount || ''}
                        onChange={e => setNewAppraisal({...newAppraisal, bonusAmount: Number(e.target.value)})}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات عامة وتوصيات</label>
                  <textarea
                    rows={3}
                    value={newAppraisal.comments || ''}
                    onChange={e => setNewAppraisal({...newAppraisal, comments: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  ></textarea>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={(e) => {
                  const form = document.getElementById('appraisal-form') as HTMLFormElement;
                  if (form.checkValidity()) {
                    handleSaveAppraisal(e as any, false);
                  } else {
                    form.reportValidity();
                  }
                }}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg transition-colors flex items-center gap-2 font-bold"
              >
                <Save size={20} />
                حفظ كمسودة
              </button>
              <button
                type="button"
                onClick={handleFinalSubmitClick}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 font-bold"
              >
                <Target size={20} />
                اعتماد نهائي
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={executeDeleteAppraisal}
        title="حذف تقييم الأداء"
        message="هل أنت متأكد من رغبتك في حذف هذا التقييم؟ لا يمكن التراجع عن هذا الإجراء."
      />
      <ConfirmModal
        isOpen={isFinalConfirmOpen}
        onClose={() => setIsFinalConfirmOpen(false)}
        onConfirm={executeFinalSubmit}
        title="الاعتماد النهائي للتقييم"
        message="هل أنت متأكد من الاعتماد النهائي للتقييم؟ لن تتمكن من تعديله بعد هذا الإجراء."
      />
      </>
    )}
    </div>
  );
}
