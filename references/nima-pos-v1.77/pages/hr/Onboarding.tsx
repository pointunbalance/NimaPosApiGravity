import React, { useState, useRef } from 'react';
import { UserPlus, Plus, Search, CheckCircle2, Circle, Clock, Edit, Trash2, Save, X, Eye, Download, Printer, AlertTriangle, User } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { OnboardingProgram, OnboardingTask } from '../../types';
import { format } from 'date-fns';
import { useToast } from '../../context/ToastContext';

const Onboarding: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OnboardingProgram['status']>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<number | null>(null);
  
  const [editingProgram, setEditingProgram] = useState<Partial<OnboardingProgram> | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<OnboardingProgram | null>(null);

  const printRef = useRef<HTMLDivElement>(null);
  const { success, error } = useToast();

  const currentUser = JSON.parse(localStorage.getItem('nima_user') || '{}');
  const users = useLiveQuery(() => db.users.toArray()) || [];
  
  const programs = useLiveQuery(async () => {
    const allPrograms = await db.onboardingPrograms.toArray();
    return allPrograms.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, []);

  const visiblePrograms = currentUser.role === 'admin' 
    ? programs 
    : programs?.filter(p => p.employeeId === currentUser.id);

  const filteredPrograms = visiblePrograms?.filter(program => {
    const employeeName = users.find(u => u.id === program.employeeId)?.name || '';
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          program.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || program.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgram?.title || !editingProgram?.employeeId) return;

    const programData: any = {
      title: editingProgram.title,
      role: editingProgram.role || '',
      description: editingProgram.description || '',
      tasks: editingProgram.tasks || [],
      employeeId: editingProgram.employeeId,
      status: editingProgram.status || 'pending',
      startDate: editingProgram.startDate || new Date(),
    };

    if (editingProgram.id) {
      await db.onboardingPrograms.update(editingProgram.id, programData);
    } else {
      await db.onboardingPrograms.add(programData);
    }

    setIsModalOpen(false);
    setEditingProgram(null);
  };

  const confirmDelete = async () => {
    if (programToDelete) {
      await db.onboardingPrograms.delete(programToDelete);
      setProgramToDelete(null);
    }
  };

  const handleStatusChange = async (id: number, status: OnboardingProgram['status']) => {
    await db.onboardingPrograms.update(id, { status });
  };

  const handleAutoAction = async (programId: number, task: OnboardingTask) => {
    try {
      const title = task.title.toLowerCase();
      // Logic for Account Creation
      if (title.includes('حساب') || title.includes('تفعيل') || title.includes('account')) {
        const program = programs?.find(p => p.id === programId);
        if (program) {
            const user = users.find(u => u.id === program.employeeId);
            if (user) {
                await db.users.update(user.id!, { isActive: true });
                success(`تم تفعيل حساب الموظف ${user.name} بنجاح`);
                toggleTaskCompletion(programId, task.id, true);
            }
        }
      }
      // Logic for Policy Signing
      else if (title.includes('توقيع') || title.includes('سياسة') || title.includes('sign') || title.includes('policy')) {
         success('تم التوقيع الإلكتروني على السياسات آلياً وتسجيل الدخول.');
         toggleTaskCompletion(programId, task.id, true);
      }
    } catch (e) {
      error('حدث خطأ أثناء إجراء المهمة الآلية');
    }
  };

  const toggleTaskCompletion = async (programId: number, taskId: string, isCompleted: boolean) => {
    const program = programs?.find(p => p.id === programId);
    if (!program) return;

    // Optional: Ensure tasks are done sequentially by dayOffset
    if (isCompleted) {
        const currentTask = program.tasks.find(t => t.id === taskId);
        if (currentTask) {
            const incompletePriorTasks = program.tasks.filter(
                t => t.dayOffset! < currentTask.dayOffset! && !t.isCompleted && t.isRequired
            );
            if (incompletePriorTasks.length > 0) {
                alert('عذراً، يجب إكمال المهام الإلزامية للأيام السابقة أولاً لضمان تسلسل التهيئة.');
                return;
            }

            // Simulate automatic policy signing / account activation
            if (currentTask.title.includes('سياسة') || currentTask.title.includes('توقيع')) {
                alert('تم توقيع السياسة وحفظ سجل الموافقة برمجياً بنجاح.');
            }
            if (currentTask.title.includes('حساب') || currentTask.title.includes('إيميل') || currentTask.title.includes('تفعيل')) {
                alert('تم إرسال طلب تفعيل الحسابات لقسم تقنية المعلومات تلقائياً.');
            }
        }
    }

    const updatedTasks = program.tasks.map(t => 
      t.id === taskId ? { ...t, isCompleted } : t
    );

    // Auto-update program status based on tasks
    const allCompleted = updatedTasks.every(t => t.isCompleted);
    const someCompleted = updatedTasks.some(t => t.isCompleted);
    
    let newStatus = program.status;
    if (allCompleted) newStatus = 'completed';
    else if (someCompleted) newStatus = 'in_progress';
    else newStatus = 'pending';

    await db.onboardingPrograms.update(programId, { 
      tasks: updatedTasks,
      status: newStatus,
      completedAt: allCompleted ? new Date() : undefined
    });
  };

  const openModal = (program?: OnboardingProgram) => {
    if (program) {
      setEditingProgram(program);
    } else {
      setEditingProgram({
        title: '',
        role: '',
        description: '',
        employeeId: 0,
        status: 'pending',
        startDate: new Date(),
        tasks: []
      });
    }
    setIsModalOpen(true);
  };

  const addTask = () => {
    if (!editingProgram) return;
    const newTask: OnboardingTask = {
      id: Date.now().toString(),
      title: '',
      description: '',
      dayOffset: 1,
      isRequired: true,
      isCompleted: false
    };
    setEditingProgram({
      ...editingProgram,
      tasks: [...(editingProgram.tasks || []), newTask]
    });
  };

  const updateTask = (taskId: string, field: keyof OnboardingTask, value: any) => {
    if (!editingProgram) return;
    const updatedTasks = editingProgram.tasks?.map(task => 
      task.id === taskId ? { ...task, [field]: value } : task
    );
    setEditingProgram({ ...editingProgram, tasks: updatedTasks });
  };

  const removeTask = (taskId: string) => {
    if (!editingProgram) return;
    const updatedTasks = editingProgram.tasks?.filter(task => task.id !== taskId);
    setEditingProgram({ ...editingProgram, tasks: updatedTasks });
  };

  const handleExportCSV = () => {
    if (!filteredPrograms || filteredPrograms.length === 0) return;
    
    const headers = ['عنوان البرنامج', 'الموظف', 'الدور الوظيفي', 'تاريخ البدء', 'الحالة', 'عدد المهام', 'المهام المنجزة'];
    const csvContent = [
      headers.join(','),
      ...filteredPrograms.map(program => {
        const employeeName = users.find(u => u.id === program.employeeId)?.name || 'غير معروف';
        const completedTasks = program.tasks.filter(t => t.isCompleted).length;
        return [
          `"${program.title}"`,
          `"${employeeName}"`,
          `"${program.role || ''}"`,
          `"${format(new Date(program.startDate), 'yyyy-MM-dd')}"`,
          `"${getStatusLabel(program.status)}"`,
          program.tasks.length,
          completedTasks
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `برامج_التهيئة_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1 w-fit"><CheckCircle2 size={12}/> مكتمل</span>;
      case 'in_progress': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center gap-1 w-fit"><Clock size={12}/> قيد التنفيذ</span>;
      default: return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center gap-1 w-fit"><Circle size={12}/> قيد الانتظار</span>;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'in_progress': return 'قيد التنفيذ';
      default: return 'قيد الانتظار';
    }
  };

  if (!currentUser || !currentUser.id) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto" ref={printRef}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <UserPlus className="w-8 h-8 text-indigo-600" />
            تهيئة الموظفين الجدد (Onboarding)
          </h1>
          <p className="text-slate-500 mt-1">إدارة برامج التوجيه والتهيئة للموظفين الجدد</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Download size={20} />
            تصدير
          </button>
          <button
            onClick={handlePrint}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Printer size={20} />
            طباعة
          </button>
          {currentUser.role === 'admin' && (
            <button 
              onClick={() => openModal()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              برنامج تهيئة جديد
            </button>
          )}
        </div>
      </div>

      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">تقرير برامج تهيئة الموظفين</h1>
        <p className="text-center text-slate-500">تاريخ الطباعة: {format(new Date(), 'yyyy-MM-dd')}</p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 print:hidden">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="البحث في برامج التهيئة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="all">جميع الحالات</option>
          <option value="pending">قيد الانتظار</option>
          <option value="in_progress">قيد التنفيذ</option>
          <option value="completed">مكتمل</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPrograms?.map(program => {
          const employee = users.find(u => u.id === program.employeeId);
          const completedTasks = program.tasks.filter(t => t.isCompleted).length;
          const progress = program.tasks.length > 0 ? Math.round((completedTasks / program.tasks.length) * 100) : 0;

          return (
            <div key={program.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col print:border-slate-300 print:shadow-none break-inside-avoid">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{program.title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{employee?.name || 'غير محدد'}</span>
                    {program.role && <span className="text-indigo-600">({program.role})</span>}
                  </div>
                  {program.description && (
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">{program.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(program.status)}
                  <div className="flex gap-1 print:hidden mt-2">
                    <button 
                      onClick={() => {
                        setSelectedProgram(program);
                        setIsViewModalOpen(true);
                      }}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="عرض التفاصيل"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {currentUser.role === 'admin' && (
                      <>
                        <button 
                          onClick={() => openModal(program)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setProgramToDelete(program.id!)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>التقدم</span>
                  <span>{progress}% ({completedTasks}/{program.tasks.length})</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-indigo-600'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="mt-2 pt-4 border-t border-slate-100 flex-1">
                <h4 className="text-sm font-bold text-slate-700 mb-3">المهام القادمة</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {program.tasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="mt-0.5 print:hidden">
                        <button 
                          onClick={() => toggleTaskCompletion(program.id!, task.id, !task.isCompleted)}
                          disabled={currentUser.role !== 'admin' && currentUser.id !== program.employeeId}
                          className="focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {task.isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                      </div>
                      <div className="hidden print:block mt-0.5">
                        {task.isCompleted ? '[X]' : '[ ]'}
                      </div>
                      <div className={task.isCompleted ? 'opacity-60 line-through' : ''}>
                        <div className="text-sm font-medium text-slate-800">{task.title}</div>
                        <div className="text-xs text-slate-500 mt-1 flex gap-2">
                          <span>اليوم {task.dayOffset}</span>
                          {task.isRequired && <span className="text-red-500">*</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {program.tasks.length > 3 && (
                    <div className="text-center text-sm text-indigo-600 mt-2 cursor-pointer" onClick={() => {
                      setSelectedProgram(program);
                      setIsViewModalOpen(true);
                    }}>
                      عرض جميع المهام ({program.tasks.length})
                    </div>
                  )}
                  {program.tasks.length === 0 && (
                    <div className="text-sm text-slate-500 text-center py-4">
                      لا توجد مهام مضافة لهذا البرنامج
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {(!filteredPrograms || filteredPrograms.length === 0) && (
          <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-2xl border border-slate-100 print:hidden">
            <UserPlus className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            لا توجد برامج مطابقة للبحث
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {isViewModalOpen && selectedProgram && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="text-indigo-600" />
                تفاصيل برنامج التهيئة
              </h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">عنوان البرنامج</h3>
                  <p className="font-bold text-slate-800 text-lg">{selectedProgram.title}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">الموظف المعني</h3>
                  <p className="font-bold text-indigo-600 text-lg">
                    {users.find(u => u.id === selectedProgram.employeeId)?.name || 'غير محدد'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">الدور الوظيفي</h3>
                  <p className="text-slate-800">{selectedProgram.role || '-'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">تاريخ البدء</h3>
                  <p className="text-slate-800">{format(new Date(selectedProgram.startDate), 'yyyy-MM-dd')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">الحالة</h3>
                  <div className="mt-1">{getStatusBadge(selectedProgram.status)}</div>
                </div>
              </div>

              {selectedProgram.description && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">الوصف</h3>
                  <div className="bg-slate-50 p-4 rounded-lg text-slate-800 whitespace-pre-wrap">
                    {selectedProgram.description}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">قائمة المهام ({selectedProgram.tasks.length})</h3>
                <div className="space-y-3">
                  {selectedProgram.tasks.map((task) => (
                    <div key={task.id} className={`flex items-start gap-3 p-4 rounded-xl border ${task.isCompleted ? 'bg-green-50 border-green-100 ' : 'bg-white border-slate-200 '}`}>
                      <div className="mt-0.5">
                        <button 
                          onClick={() => toggleTaskCompletion(selectedProgram.id!, task.id, !task.isCompleted)}
                          disabled={currentUser.role !== 'admin' && currentUser.id !== selectedProgram.employeeId}
                          className="focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {task.isCompleted ? (
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                          ) : (
                            <Circle className="w-6 h-6 text-slate-300" />
                          )}
                        </button>
                      </div>
                      <div className={`flex-1 ${task.isCompleted ? 'opacity-70' : ''}`}>
                        <div className="flex justify-between items-start">
                          <div className={`font-medium ${task.isCompleted ? 'text-green-800 line-through' : 'text-slate-800'}`}>
                            {task.title}
                          </div>
                          <div className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">
                            اليوم {task.dayOffset}
                          </div>
                        </div>
                        {task.description && (
                          <div className="text-sm text-slate-500 mt-2">
                            {task.description}
                          </div>
                        )}
                        {task.isRequired && (
                          <div className="text-xs text-red-500 font-medium whitespace-nowrap">
                            * مهمة إلزامية
                          </div>
                        )}
                        {!task.isCompleted && (
                          (task.title.toLowerCase().includes('حساب') || task.title.toLowerCase().includes('تفعيل')) ? (
                             <button onClick={() => handleAutoAction(selectedProgram.id!, task)} className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg font-bold transition-colors">
                                تنفيذ وتفعيل آلي
                             </button>
                          ) : (task.title.toLowerCase().includes('توقيع') || task.title.toLowerCase().includes('سياسة')) ? (
                             <button onClick={() => handleAutoAction(selectedProgram.id!, task)} className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg font-bold transition-colors">
                                توقيع إلكتروني سريع
                             </button>
                          ) : null
                        )
                        }
                      </div>
                    </div>
                  ))}
                  {selectedProgram.tasks.length === 0 && (
                    <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                      لا توجد مهام في هذا البرنامج
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl transition-colors font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && editingProgram && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingProgram.id ? 'تعديل البرنامج' : 'إضافة برنامج جديد'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="program-form" onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">عنوان البرنامج *</label>
                    <input
                      type="text"
                      required
                      value={editingProgram.title || ''}
                      onChange={e => setEditingProgram({...editingProgram, title: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="مثال: تهيئة مهندس برمجيات"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">الموظف المعني *</label>
                    <select
                      required
                      value={editingProgram.employeeId || ''}
                      onChange={e => setEditingProgram({...editingProgram, employeeId: Number(e.target.value)})}
                      className="w-full px-4 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">اختر الموظف...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">الدور الوظيفي المستهدف</label>
                    <input
                      type="text"
                      value={editingProgram.role || ''}
                      onChange={e => setEditingProgram({...editingProgram, role: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="مثال: مهندس برمجيات"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">تاريخ البدء</label>
                    <input
                      type="date"
                      required
                      value={editingProgram.startDate ? format(new Date(editingProgram.startDate), 'yyyy-MM-dd') : ''}
                      onChange={e => setEditingProgram({...editingProgram, startDate: new Date(e.target.value)})}
                      className="w-full px-4 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">وصف البرنامج</label>
                  <textarea
                    rows={2}
                    value={editingProgram.description || ''}
                    onChange={e => setEditingProgram({...editingProgram, description: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  ></textarea>
                </div>
                
                <div className="border-t border-slate-100 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">المهام</h3>
                    <button
                      type="button"
                      onClick={addTask}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة مهمة
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {editingProgram.tasks?.map((task, index) => (
                      <div key={task.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative">
                        <button
                          type="button"
                          onClick={() => removeTask(task.id)}
                          className="absolute top-4 left-4 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-7">
                            <label className="block text-xs font-medium text-slate-700 mb-1">عنوان المهمة *</label>
                            <input
                              type="text"
                              required
                              value={task.title}
                              onChange={e => updateTask(task.id, 'title', e.target.value)}
                              className="w-full px-3 py-1.5 text-sm border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-slate-700 mb-1">اليوم (من بداية العمل)</label>
                            <input
                              type="number"
                              min="1"
                              required
                              value={task.dayOffset}
                              onChange={e => updateTask(task.id, 'dayOffset', Number(e.target.value))}
                              className="w-full px-3 py-1.5 text-sm border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div className="md:col-span-2 flex items-end pb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={task.isRequired}
                                onChange={e => updateTask(task.id, 'isRequired', e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                              />
                              <span className="text-xs font-medium text-slate-700">إلزامية</span>
                            </label>
                          </div>
                          <div className="md:col-span-12">
                            <label className="block text-xs font-medium text-slate-700 mb-1">التفاصيل (اختياري)</label>
                            <input
                              type="text"
                              value={task.description || ''}
                              onChange={e => updateTask(task.id, 'description', e.target.value)}
                              className="w-full px-3 py-1.5 text-sm border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {(!editingProgram.tasks || editingProgram.tasks.length === 0) && (
                      <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                        لا توجد مهام مضافة. انقر على "إضافة مهمة" للبدء.
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors font-medium"
              >
                إلغاء
              </button>
              <button
                type="submit"
                form="program-form"
                className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors font-medium flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {programToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">تأكيد الحذف</h2>
              <p className="text-slate-600 mb-6">
                هل أنت متأكد من حذف برنامج التهيئة هذا؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setProgramToDelete(null)}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors font-medium"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium"
                >
                  نعم، احذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
