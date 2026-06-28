import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Project } from '../types';
import { Briefcase, Search, Plus, Edit2, Trash2, CheckCircle, Clock, Save, X, PauseCircle, PlayCircle, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';

export const Projects: React.FC = () => {
  const { success, error: showError } = useToast();
  const projects = useLiveQuery(() => db.projects.toArray(), []);
  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const tasks = useLiveQuery(() => db.tasks.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toCollection().first(), []);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; projectId: number } | null>(null);
  
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    customerId: 0,
    startDate: new Date(),
    status: 'planning',
    budget: 0,
    actualCost: 0,
    progress: 0,
    description: ''
  });

  const currencyCode = settings?.currencyCode || 'IQD';

  const filteredProjects = projects?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customers?.find(c => c.id === p.customerId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showError('الرجاء إدخال اسم المشروع');
      return;
    }

    try {
      if (editingProject && editingProject.id) {
        await db.projects.update(editingProject.id, {
          ...formData,
          updatedAt: new Date()
        });
        success('تم تحديث بيانات المشروع بنجاح');
      } else {
        await db.projects.add({
          ...formData as Project,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        success('تم إنشاء المشروع بنجاح');
      }
      setIsModalOpen(false);
      setEditingProject(null);
      resetForm();
    } catch (e) {
      showError('فشل حفظ المشروع');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      customerId: 0,
      startDate: new Date(),
      status: 'planning',
      budget: 0,
      actualCost: 0,
      progress: 0,
      description: ''
    });
  };

  const confirmDeleteProject = (id: number) => {
    setConfirmConfig({ isOpen: true, projectId: id });
  };

  const handleDelete = async () => {
    if (!confirmConfig) return;
    const id = confirmConfig.projectId;
    try {
      await db.transaction('rw', db.projects, db.tasks, db.feasibilityStudies, async () => {
        await db.projects.delete(id);
        await db.tasks.where('projectId').equals(id).delete();
        await db.feasibilityStudies.where('projectId').equals(id).delete();
      });
      success('تم حذف المشروع وجميع المهام والدراسات التابعة له بنجاح');
    } catch (e) {
      showError('فشل حذف المشروع');
    }
    setConfirmConfig(null);
  };

  const handleStatusChange = async (id: number, status: Project['status']) => {
    await db.projects.update(id, {
      status,
      updatedAt: new Date()
    });
    success('تم تحديث حالة المشروع');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planning': return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200/50 rounded-lg text-xs font-black flex items-center gap-1"><Clock size={12}/> تخطيط</span>;
      case 'active': return <span className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-100 rounded-lg text-xs font-black flex items-center gap-1"><PlayCircle size={12}/> نشط</span>;
      case 'on-hold': return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-xs font-black flex items-center gap-1"><PauseCircle size={12}/> معلق</span>;
      case 'completed': return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-black flex items-center gap-1"><CheckCircle size={12}/> مكتمل</span>;
      default: return <span className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-xs font-bold">غير معروف</span>;
    }
  };

  const getCustomerName = (id?: number) => {
    if (!id) return 'مشروع داخلي تسييري';
    return customers?.find(c => c.id === id)?.name || 'عميل غير مسجل';
  };

  const calculateProjectProgress = (projectId: number) => {
    const projectTasks = tasks?.filter(t => t.projectId === projectId) || [];
    if (projectTasks.length === 0) return 0;
    const completedTasks = projectTasks.filter(t => t.status === 'done').length;
    return Math.round((completedTasks / projectTasks.length) * 100);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 font-['Tajawal'] min-h-screen rounded-2xl" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-sm">
            <Briefcase className="w-8 h-8 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">إدارة المشاريع</h1>
            <p className="text-slate-500 font-bold text-sm mt-1">تتبع المشاريع، نسب الإنجاز، ومقارنة الميزانيات المخططة بالفعلية</p>
          </div>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setEditingProject(null);
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto bg-gradient-to-br from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 font-black transition-all cursor-pointer active:scale-95 text-sm"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>مشروع جديد</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="relative w-full">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 stroke-[2]" size={20} />
        <input
          type="text"
          placeholder="البحث باسم المشروع أو العميل المرتبط..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/85 border border-indigo-100/60 py-2.5 pr-10 pl-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all"
        />
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map(project => {
          const autoProgress = calculateProjectProgress(project.id!);
          const displayProgress = project.progress || autoProgress;
          const budget = project.budget || 0;
          const actualCost = project.actualCost || 0;
          const budgetVariance = budget - actualCost;
          const isOverBudget = budgetVariance < 0;

          const projectTasks = tasks?.filter(t => t.projectId === project.id) || [];
          const totalEstimatedHours = projectTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
          const totalActualHours = projectTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

          return (
            <div key={project.id} className="bg-white/80 backdrop-blur-md rounded-3xl shadow-sm border border-indigo-100/30 overflow-hidden flex flex-col hover:shadow-md transition-all">
              <div className="p-5 border-b border-indigo-50/50 flex justify-between items-start bg-gradient-to-l from-indigo-50/10 to-transparent">
                <div>
                  <h3 className="font-black text-slate-800 text-base leading-snug">{project.name}</h3>
                  <p className="text-xs text-indigo-600 font-bold mt-1">
                    {getCustomerName(project.customerId)}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => {
                      setEditingProject(project);
                      setFormData(project);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 text-indigo-600 rounded-lg border border-slate-200/50 transition-colors"
                  >
                    <Edit2 size={13} className="stroke-[2.5]" />
                  </button>
                  <button 
                    onClick={() => confirmDeleteProject(project.id!)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-100/50 transition-colors"
                  >
                    <Trash2 size={13} className="stroke-[2.5]" />
                  </button>
                </div>
              </div>
              <div className="p-5 flex-1 space-y-4">
                <div className="flex justify-between items-center">
                  {getStatusBadge(project.status)}
                  <div className="flex gap-1">
                    {project.status !== 'active' && (
                      <button onClick={() => handleStatusChange(project.id!, 'active')} className="p-1 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="تنشيط">
                        <PlayCircle size={18} className="stroke-[2]" />
                      </button>
                    )}
                    {project.status === 'active' && (
                      <button onClick={() => handleStatusChange(project.id!, 'on-hold')} className="p-1 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="تعليق">
                        <PauseCircle size={18} className="stroke-[2]" />
                      </button>
                    )}
                    {project.status !== 'completed' && (
                      <button onClick={() => handleStatusChange(project.id!, 'completed')} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="إكمال">
                        <CheckCircle size={18} className="stroke-[2]" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-bold flex items-center gap-1"><BarChart2 size={14}/> الإنجاز</span>
                    <span className="font-black text-slate-800">{displayProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100/80 rounded-full h-2 border border-slate-200/40 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${displayProgress === 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`} 
                      style={{ width: `${displayProgress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-indigo-50/50">
                  <div>
                    <p className="text-slate-400 font-bold">تاريخ البدء</p>
                    <p className="font-black text-slate-700 mt-0.5">{format(new Date(project.startDate), 'yyyy-MM-dd')}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold">تاريخ الانتهاء المتوقع</p>
                    <p className="font-black text-slate-700 mt-0.5">{project.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : 'غير محدد'}</p>
                  </div>
                </div>

                {/* Budget vs Actual */}
                <div className="bg-slate-50/80 rounded-2xl p-3 space-y-2 text-xs border border-indigo-50/20">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-500">الميزانية المقدرة:</span>
                    <span className="text-slate-800">{budget.toLocaleString()} {currencyCode}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-500">التكلفة الفعلية:</span>
                    <span className="text-slate-800">{actualCost.toLocaleString()} {currencyCode}</span>
                  </div>
                  <div className="flex justify-between border-t border-indigo-100/40 pt-2 font-black">
                    <span className="text-slate-600">الفرق المالي:</span>
                    <span className={isOverBudget ? 'text-rose-600' : 'text-emerald-600'}>
                      {isOverBudget ? '-' : '+'}{Math.abs(budgetVariance).toLocaleString()} {currencyCode}
                    </span>
                  </div>
                </div>

                {/* Hours Tracking */}
                <div className="bg-indigo-50/30 rounded-2xl p-3 space-y-2 text-xs border border-indigo-50/10">
                  <div className="flex justify-between font-bold text-slate-600">
                    <span>الساعات المقدرة:</span>
                    <span>{totalEstimatedHours} ساعة</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-600">
                    <span>الساعات الفعلية:</span>
                    <span className={totalActualHours > totalEstimatedHours && totalEstimatedHours > 0 ? 'text-rose-600' : 'text-indigo-700'}>
                      {totalActualHours} ساعة
                    </span>
                  </div>
                </div>

                {project.description && (
                  <div className="pt-1">
                    <p className="text-slate-400 text-xs font-bold">الوصف والتفاصيل</p>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">{project.description}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filteredProjects.length === 0 && (
          <div className="col-span-full bg-white/60 backdrop-blur-md rounded-3xl shadow-sm border border-indigo-100/30 p-12 text-center">
            <Briefcase className="w-16 h-16 text-indigo-200 mx-auto mb-4 stroke-[1.5]" />
            <h3 className="text-lg font-black text-slate-700 mb-2">لا توجد مشاريع مسجلة حالياً</h3>
            <p className="text-slate-500 font-bold text-sm max-w-md mx-auto leading-relaxed">
              ابدأ الآن بإنشاء مشروعك الأول لتتبع المهام، جدول تسليم الأعمال، والميزانية بدقة.
            </p>
          </div>
        )}
      </div>

      {/* Save Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-['Tajawal']">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-indigo-100/50">
            <div className="p-6 border-b border-indigo-50 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-black text-slate-800">
                {editingProject ? 'تعديل تفاصيل المشروع' : 'إنشاء مشروع جديد'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl transition-all">
                <X size={20} className="stroke-[2.5]" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-700 mb-1.5">اسم المشروع *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50/70 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">العميل المرتبط به (اختياري)</label>
                  <select
                    value={formData.customerId || ''}
                    onChange={e => setFormData({...formData, customerId: parseInt(e.target.value) || undefined})}
                    className="w-full bg-slate-50/70 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-700 cursor-pointer"
                  >
                    <option value="">مشروع داخلي تسييري</option>
                    {customers?.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">حالة العمل الحالية</label>
                  <select
                    value={formData.status || 'planning'}
                    onChange={e => setFormData({...formData, status: e.target.value as Project['status']})}
                    className="w-full bg-slate-50/70 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-700 cursor-pointer"
                  >
                    <option value="planning">تخطيط</option>
                    <option value="active">نشط</option>
                    <option value="on-hold">معلق</option>
                    <option value="completed">مكتمل</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">الميزانية المقدرة ({currencyCode})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.budget || ''}
                    onChange={e => setFormData({...formData, budget: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50/70 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">التكلفة الفعلية المصروفة ({currencyCode})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.actualCost || ''}
                    onChange={e => setFormData({...formData, actualCost: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50/70 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">تاريخ بدء الأعمال *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate ? format(new Date(formData.startDate), 'yyyy-MM-dd') : ''}
                    onChange={e => setFormData({...formData, startDate: new Date(e.target.value)})}
                    className="w-full bg-slate-50/70 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">تاريخ الانتهاء المقدر</label>
                  <input
                    type="date"
                    value={formData.endDate ? format(new Date(formData.endDate), 'yyyy-MM-dd') : ''}
                    onChange={e => setFormData({...formData, endDate: e.target.value ? new Date(e.target.value) : undefined})}
                    className="w-full bg-slate-50/70 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-700"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-700 mb-1.5">نسبة الإنجاز اليدوية (%) - اتركها 0 للاحتساب التلقائي من المهام</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress || ''}
                    onChange={e => setFormData({...formData, progress: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-50/70 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">وصف وملاحظات المشروع</label>
                <textarea
                  rows={4}
                  value={formData.description || ''}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-50/70 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-indigo-50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-black text-sm transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-br from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white rounded-xl font-black shadow-md shadow-indigo-500/10 flex items-center gap-2 text-sm transition-all cursor-pointer active:scale-95"
                >
                  <Save size={18} className="stroke-[2.5]" />
                  حفظ المشروع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title="حذف المشروع"
          message="هل أنت متأكد من حذف هذا المشروع نهائياً؟ سيتم حذف جميع المهام المتبقية والمسندة ودراسات الجدوى المرتبطة به فوراً. لا يمكن التراجع عن هذا الإجراء."
          onConfirm={handleDelete}
          onCancel={() => setConfirmConfig(null)}
          confirmText="تأكيد الحذف"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
};

export default Projects;
