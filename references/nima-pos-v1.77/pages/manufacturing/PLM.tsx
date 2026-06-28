import React, { useState } from 'react';
import { Cpu, Plus, Search, Edit, Trash2, Calendar, User as UserIcon, DollarSign } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { PLMProject } from '../../types';
import PLMProjectModal from '../../components/manufacturing/PLMProjectModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useToast } from '../../context/ToastContext';

export const PLM: React.FC = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [projectToDeleteId, setProjectToDeleteId] = useState<number | null>(null);
  const [editingProject, setEditingProject] = useState<PLMProject | null>(null);

  const plmProjects = useLiveQuery(() => db.plmProjects.toArray()) || [];
  const users = useLiveQuery(() => db.users.toArray()) || [];

  const handleSave = async (project: Partial<PLMProject>) => {
    try {
      if (editingProject?.id) {
        await db.plmProjects.put({ ...project, id: editingProject.id } as PLMProject);
      } else {
        await db.plmProjects.add(project as PLMProject);
      }
      showToast('تم حفظ المشروع بنجاح', 'success');
      setIsModalOpen(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Error saving PLM project:', error);
      showToast('حدث خطأ أثناء حفظ المشروع', 'error');
    }
  };

  const handleEdit = (project: PLMProject) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setProjectToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (projectToDeleteId) {
      await db.plmProjects.delete(projectToDeleteId);
      showToast('تم حذف المشروع بنجاح', 'success');
      setProjectToDeleteId(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  const getManagerName = (id?: number) => {
    if (!id) return 'غير محدد';
    return users.find(u => u.id === id)?.name || 'غير معروف';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concept':
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">مفهوم</span>;
      case 'design':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">تصميم</span>;
      case 'prototyping':
        return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">نمذجة</span>;
      case 'testing':
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">اختبار</span>;
      case 'production':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">إنتاج</span>;
      case 'retired':
        return <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm">متقاعد</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">{status}</span>;
    }
  };

  const filteredProjects = plmProjects.filter(project => {
    const search = searchTerm.toLowerCase();
    return project.name.toLowerCase().includes(search) || 
           (project.description && project.description.toLowerCase().includes(search));
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Cpu size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة دورة حياة المنتج (PLM)</h1>
            <p className="text-gray-500">تتبع المنتجات من التصميم والهندسة إلى التصنيع</p>
          </div>
        </div>
        <button 
          onClick={() => {
            setEditingProject(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>مشروع منتج جديد</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="البحث في المشاريع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-slate-600 font-semibold">اسم المشروع</th>
                <th className="p-4 text-slate-600 font-semibold">الحالة</th>
                <th className="p-4 text-slate-600 font-semibold">مدير المشروع</th>
                <th className="p-4 text-slate-600 font-semibold">تاريخ البدء</th>
                <th className="p-4 text-slate-600 font-semibold">تاريخ الإطلاق</th>
                <th className="p-4 text-slate-600 font-semibold">الميزانية</th>
                <th className="p-4 text-slate-600 font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{project.name}</div>
                    {project.description && (
                      <div className="text-sm text-slate-500 truncate max-w-xs">{project.description}</div>
                    )}
                  </td>
                  <td className="p-4">{getStatusBadge(project.status)}</td>
                  <td className="p-4 text-slate-600">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      {getManagerName(project.managerId)}
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(project.startDate).toLocaleDateString('ar-EG')}
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">
                    {project.targetLaunchDate ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(project.targetLaunchDate).toLocaleDateString('ar-EG')}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="p-4 text-slate-600">
                    {project.budget ? (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-slate-400" />
                        {project.budget.toLocaleString()}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(project)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => project.id && handleDelete(project.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <Cpu size={48} className="mx-auto mb-4 text-slate-300" />
                    <p>لا توجد مشاريع منتجات مطابقة للبحث</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PLMProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingProject={editingProject}
        users={users}
      />

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
        title="حذف المشروع"
        message="هل أنت متأكد من رغبتك في حذف هذا المشروع؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  );
};
