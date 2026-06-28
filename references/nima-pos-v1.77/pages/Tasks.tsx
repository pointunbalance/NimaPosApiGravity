import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Task } from '../types';
import { addDays, startOfDay, endOfDay, differenceInDays } from 'date-fns';
import { useToast } from '../context/ToastContext';

import { TasksHeader } from '../components/tasks/TasksHeader';
import { TasksToolbar } from '../components/tasks/TasksToolbar';
import { TasksKanban } from '../components/tasks/TasksKanban';
import { TasksGantt } from '../components/tasks/TasksGantt';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import ConfirmModal from '../components/ui/ConfirmModal';

export const Tasks: React.FC = () => {
  const { success, error: showError } = useToast();
  
  const tasks = useLiveQuery(() => db.tasks.toArray(), []);
  const projects = useLiveQuery(() => db.projects.toArray(), []);
  const users = useLiveQuery(() => db.users.toArray(), []);
  const currentUser = JSON.parse(localStorage.getItem('nima_user') || '{}');

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'gantt'>('kanban');
  
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean; title: string; message: string; onConfirm: () => void} | null>(null);

  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    projectId: 0,
    assignedTo: currentUser.id,
    status: 'todo',
    priority: 'medium',
    description: '',
    startDate: new Date(),
    dueDate: addDays(new Date(), 7),
    estimatedHours: 0,
    actualHours: 0
  });

  const filteredTasks = tasks?.filter(t => 
    (selectedProject === 'all' || t.projectId === selectedProject) &&
    (t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     projects?.find(p => p.id === t.projectId)?.name.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const resetForm = () => {
    setFormData({
      title: '',
      projectId: selectedProject !== 'all' ? selectedProject : 0,
      assignedTo: currentUser.id,
      status: 'todo',
      priority: 'medium',
      description: '',
      startDate: new Date(),
      dueDate: addDays(new Date(), 7),
      estimatedHours: 0,
      actualHours: 0
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.projectId) {
      showError('الرجاء إدخال عنوان المهمة واختيار المشروع التابع له');
      return;
    }

    const start = formData.startDate ? new Date(formData.startDate) : new Date();
    const end = formData.dueDate ? new Date(formData.dueDate) : new Date();
    
    const overlappingTasks = tasks?.filter(t => 
      t.assignedTo === formData.assignedTo && 
      t.id !== editingTask?.id &&
      t.startDate && t.dueDate
    ) || [];

    const hasOverlap = overlappingTasks.some(t => {
      const tStart = new Date(t.startDate!);
      const tEnd = new Date(t.dueDate!);
      return start <= tEnd && end >= tStart;
    });

    const proceedSave = async () => {
      if (editingTask && editingTask.id) {
        await db.tasks.update(editingTask.id, {
          ...formData,
          updatedAt: new Date()
        });
        success('تم تحديث المهمة بنجاح');
      } else {
        await db.tasks.add({
          ...formData as Task,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        success('تم إضافة المهمة بنجاح');
      }
      setIsModalOpen(false);
      setEditingTask(null);
      resetForm();
    };

    if (hasOverlap && formData.assignedTo) {
      setConfirmConfig({
        isOpen: true,
        title: 'تنبيه تداخل المهام',
        message: 'يوجد تداخل في جدول مهام هذا الموظف خلال نفس الفترة الزمنية المحددة. هل تود المتابعة وحفظ المهمة على أي حال؟',
        onConfirm: () => {
          setConfirmConfig(null);
          proceedSave();
        }
      });
    } else {
      await proceedSave();
    }
  };

  const handleDelete = (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'حذف المهمة',
      message: 'هل أنت متأكد من حذف هذه المهمة نهائياً من مشروعك؟ لن يمكن التراجع عن هذا الإجراء.',
      onConfirm: async () => {
        await db.tasks.delete(id);
        success('تم حذف المهمة بنجاح');
        setConfirmConfig(null);
      }
    });
  };

  const handleStatusChange = async (id: number, status: Task['status']) => {
    await db.tasks.update(id, {
      status,
      updatedAt: new Date()
    });
    success('تم تحديث حالة المهمة');
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setFormData(task);
    setIsModalOpen(true);
  };

  const handleNewTaskClick = () => {
    resetForm();
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const ganttData = useMemo(() => {
    if (!filteredTasks.length) {
      const start = startOfDay(new Date());
      const end = addDays(start, 14);
      const days = Array.from({ length: 15 }).map((_, i) => addDays(start, i));
      return { start, end, days };
    }
    
    const dates = filteredTasks.flatMap(t => [
      t.startDate ? new Date(t.startDate) : new Date(),
      t.dueDate ? new Date(t.dueDate) : new Date()
    ]);
    
    const minDate = startOfDay(new Date(Math.min(...dates.map(d => d.getTime()))));
    const maxDate = endOfDay(new Date(Math.max(...dates.map(d => d.getTime()))));
    
    const start = addDays(minDate, -2);
    const end = addDays(maxDate, 2);
    
    const daysCount = differenceInDays(end, start) + 1;
    const days = Array.from({ length: daysCount }).map((_, i) => addDays(start, i));
    
    return { start, end, days };
  }, [filteredTasks]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 font-['Tajawal'] rounded-2xl min-h-screen" dir="rtl">
      <TasksHeader onNewTaskClick={handleNewTaskClick} />

      <TasksToolbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        viewMode={viewMode}
        setViewMode={setViewMode}
        projects={projects || []}
      />

      {viewMode === 'kanban' ? (
        <TasksKanban
          filteredTasks={filteredTasks}
          projects={projects || []}
          users={users || []}
          onEdit={handleEditClick}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <TasksGantt
          filteredTasks={filteredTasks}
          projects={projects || []}
          ganttData={ganttData}
          onEdit={handleEditClick}
        />
      )}

      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingTask={editingTask}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSave}
        projects={projects || []}
        users={users || []}
      />

      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
          confirmText="تأكيد ومتابعة"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
};

export default Tasks;
