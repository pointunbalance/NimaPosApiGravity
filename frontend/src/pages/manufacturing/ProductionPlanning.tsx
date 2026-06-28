import React, { useState, useMemo } from 'react';
import { db } from '../../db';
import { ProductionPlan, WorkOrder, User } from '../../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { 
  Calendar as CalendarIcon, Plus, ChevronRight, ChevronLeft, 
  Settings, Clock, CheckCircle, AlertTriangle, PlayCircle, X
} from 'lucide-react';

export default function ProductionPlanning() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newPlan, setNewPlan] = useState<Partial<ProductionPlan>>({
    status: 'scheduled',
    startDate: new Date(),
    endDate: addDays(new Date(), 1)
  });

  const currentUser = useLiveQuery(() => db.users.where('isActive').equals(1).first());
  const plans = useLiveQuery(() => db.productionPlans.toArray());
  const workOrders = useLiveQuery(() => db.workOrders.toArray());

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.workOrderId || !newPlan.startDate || !newPlan.endDate) return;

    await db.productionPlans.add({
      workOrderId: Number(newPlan.workOrderId),
      startDate: newPlan.startDate,
      endDate: newPlan.endDate,
      status: newPlan.status as any,
      assignedMachineId: newPlan.assignedMachineId ? Number(newPlan.assignedMachineId) : undefined,
      notes: newPlan.notes
    });

    setIsModalOpen(false);
    setNewPlan({
      status: 'scheduled',
      startDate: new Date(),
      endDate: addDays(new Date(), 1)
    });
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 6 }); // Start on Saturday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 6 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const prevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const today = () => setCurrentDate(new Date());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-300 ';
      case 'in_progress': return 'bg-amber-100 text-amber-800 border-amber-300 ';
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-300 ';
      case 'delayed': return 'bg-red-100 text-red-800 border-red-300 ';
      default: return 'bg-slate-100 text-slate-800 border-slate-300 ';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock size={14} className="mr-1" />;
      case 'in_progress': return <PlayCircle size={14} className="mr-1" />;
      case 'completed': return <CheckCircle size={14} className="mr-1" />;
      case 'delayed': return <AlertTriangle size={14} className="mr-1" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'مجدول';
      case 'in_progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتمل';
      case 'delayed': return 'متأخر';
      default: return status;
    }
  };

  const getWorkOrderName = (id: number) => {
    const wo = workOrders?.find(w => w.id === id);
    return wo ? wo.workOrderNumber : 'غير معروف';
  };

  // Filter plans that overlap with the current week
  const visiblePlans = useMemo(() => {
    if (!plans) return [];
    return plans.filter(plan => {
      const start = new Date(plan.startDate);
      const end = new Date(plan.endDate);
      return (start <= weekEnd && end >= weekStart);
    });
  }, [plans, weekStart, weekEnd]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="text-indigo-600" />
            تخطيط الإنتاج
          </h1>
          <p className="text-slate-500 text-sm mt-1">جدولة ومتابعة أوامر التصنيع</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          خطة جديدة
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-slate-200 text-slate-600">
              <ChevronRight size={20} />
            </button>
            <button onClick={today} className="px-3 py-1.5 text-sm font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">
              اليوم
            </button>
            <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-slate-200 text-slate-600">
              <ChevronLeft size={20} />
            </button>
            <span className="mr-4 font-bold text-slate-800">
              {format(weekStart, 'yyyy/MM/dd')} - {format(weekEnd, 'yyyy/MM/dd')}
            </span>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-400"></div> مجدول</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-400"></div> قيد التنفيذ</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-400"></div> مكتمل</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-400"></div> متأخر</div>
          </div>
        </div>

        {/* Gantt Chart Area */}
        <div className="flex-1 overflow-auto relative">
          <div className="min-w-[800px]">
            {/* Header Row (Days) */}
            <div className="flex border-b border-slate-200 sticky top-0 bg-white z-10">
              <div className="w-48 flex-shrink-0 border-l border-slate-200 p-3 font-bold text-slate-700 bg-slate-50">
                أمر التصنيع
              </div>
              {daysInWeek.map((day, i) => (
                <div key={i} className={`flex-1 min-w-[100px] border-l border-slate-200 p-2 text-center ${isSameDay(day, new Date()) ? 'bg-indigo-50' : ''}`}>
                  <div className="text-xs text-slate-500 font-medium">{format(day, 'EEEE')}</div>
                  <div className={`text-lg font-bold ${isSameDay(day, new Date()) ? 'text-indigo-600' : 'text-slate-800'}`}>
                    {format(day, 'dd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Plan Rows */}
            <div className="relative">
              {/* Background Grid */}
              <div className="absolute inset-0 flex pointer-events-none">
                <div className="w-48 flex-shrink-0 border-l border-slate-200"></div>
                {daysInWeek.map((day, i) => (
                  <div key={i} className={`flex-1 min-w-[100px] border-l border-slate-200 ${isSameDay(day, new Date()) ? 'bg-indigo-50/30' : ''}`}></div>
                ))}
              </div>

              {/* Data Rows */}
              {visiblePlans.length === 0 ? (
                <div className="p-8 text-center text-slate-500 relative z-10">
                  لا توجد خطط إنتاج في هذا الأسبوع
                </div>
              ) : (
                visiblePlans.map((plan, index) => {
                  const start = new Date(plan.startDate);
                  const end = new Date(plan.endDate);
                  
                  // Calculate position and width based on week bounds
                  const startOffset = Math.max(0, (start.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
                  const duration = (Math.min(end.getTime(), weekEnd.getTime()) - Math.max(start.getTime(), weekStart.getTime())) / (1000 * 60 * 60 * 24) + 1; // +1 to include end day
                  
                  // Ensure it doesn't overflow the week view
                  const leftPercent = (startOffset / 7) * 100;
                  const widthPercent = (duration / 7) * 100;

                  return (
                    <div key={plan.id} className="flex border-b border-slate-100 relative z-10 group hover:bg-slate-50 transition-colors">
                      <div className="w-48 flex-shrink-0 p-3 flex items-center border-l border-slate-200 bg-white group-hover:bg-slate-50">
                        <div className="font-medium text-slate-800 truncate" title={getWorkOrderName(plan.workOrderId)}>
                          {getWorkOrderName(plan.workOrderId)}
                        </div>
                      </div>
                      <div className="flex-1 relative min-h-[60px] py-2">
                        {/* The Gantt Bar */}
                        <div 
                          className={`absolute top-2 bottom-2 rounded-md border shadow-sm flex items-center px-2 overflow-hidden text-xs font-medium ${getStatusColor(plan.status)}`}
                          style={{ 
                            right: `${leftPercent}%`, // RTL layout
                            width: `calc(${widthPercent}% - 8px)`,
                            marginRight: '4px'
                          }}
                          title={`${getWorkOrderName(plan.workOrderId)} - ${getStatusLabel(plan.status)}`}
                        >
                          <div className="flex items-center truncate w-full">
                            {getStatusIcon(plan.status)}
                            <span className="truncate">{getStatusLabel(plan.status)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">جدولة إنتاج جديدة</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">أمر التصنيع *</label>
                <select
                  required
                  value={newPlan.workOrderId || ''}
                  onChange={e => setNewPlan({...newPlan, workOrderId: Number(e.target.value)})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- اختر أمر تصنيع --</option>
                  {workOrders?.filter(wo => wo.status !== 'completed' && wo.status !== 'cancelled').map(wo => (
                    <option key={wo.id} value={wo.id}>{wo.workOrderNumber}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ البدء *</label>
                  <input
                    required
                    type="date"
                    value={format(newPlan.startDate || new Date(), 'yyyy-MM-dd')}
                    onChange={e => setNewPlan({...newPlan, startDate: new Date(e.target.value)})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الانتهاء *</label>
                  <input
                    required
                    type="date"
                    value={format(newPlan.endDate || new Date(), 'yyyy-MM-dd')}
                    onChange={e => setNewPlan({...newPlan, endDate: new Date(e.target.value)})}
                    min={format(newPlan.startDate || new Date(), 'yyyy-MM-dd')}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
                <select
                  value={newPlan.status}
                  onChange={e => setNewPlan({...newPlan, status: e.target.value as any})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="scheduled">مجدول</option>
                  <option value="in_progress">قيد التنفيذ</option>
                  <option value="completed">مكتمل</option>
                  <option value="delayed">متأخر</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات</label>
                <textarea
                  rows={3}
                  value={newPlan.notes || ''}
                  onChange={e => setNewPlan({...newPlan, notes: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  حفظ الخطة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
