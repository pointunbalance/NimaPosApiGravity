import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";

export interface ProjectItem {
  id?: number;
  projectId: string;
  name: string;
  customerId: string;
  budget: number;
  actual: number;
  revenue: number;
  completionPercentage: number;
  status: string;
}

export const useProjectAccountingData = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "wip">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    projectCode: "",
    projectName: "",
    client: "",
    budget: 0,
    actual: 0,
    revenue: 0,
    completion: 0,
    status: "جاري العمل",
  });

  // Confirm delete dialog state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const projects = useLiveQuery(() => db.projectAccounting.toArray(), []) || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await db.projectAccounting.update(editingId, {
        projectId: formData.projectCode,
        name: formData.projectName,
        customerId: formData.client,
        budget: Number(formData.budget),
        actual: Number(formData.actual),
        revenue: Number(formData.revenue),
        completionPercentage: Number(formData.completion),
        status: formData.status,
      });
    } else {
      await db.projectAccounting.add({
        projectId: formData.projectCode,
        name: formData.projectName,
        customerId: formData.client,
        budget: Number(formData.budget),
        actual: Number(formData.actual),
        revenue: Number(formData.revenue),
        completionPercentage: Number(formData.completion),
        status: formData.status,
      });
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      projectCode: "",
      projectName: "",
      client: "",
      budget: 0,
      actual: 0,
      revenue: 0,
      completion: 0,
      status: "جاري العمل",
    });
  };

  const handleEdit = (proj: ProjectItem) => {
    setFormData({
      projectCode: proj.projectId,
      projectName: proj.name,
      client: proj.customerId,
      budget: proj.budget,
      actual: proj.actual,
      revenue: proj.revenue,
      completion: proj.completionPercentage,
      status: proj.status,
    });
    setEditingId(proj.id || null);
    setIsModalOpen(true);
  };

  const triggerDelete = (id: number) => {
    setDeleteTargetId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTargetId !== null) {
      await db.projectAccounting.delete(deleteTargetId);
      setDeleteTargetId(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  const defaultProjects =
    projects.length > 0
      ? projects.map((p) => ({
          name: p.name,
          budget: p.budget,
          actual: p.actual,
          revenue: p.revenue,
        }))
      : [
          { name: "مشروع البرج", budget: 1500000, actual: 1200000, revenue: 1400000 },
          {
            name: "مجمع الفيلات",
            budget: 3000000,
            actual: 1800000,
            revenue: 1500000,
          },
          { name: "مبنى تجاري", budget: 800000, actual: 850000, revenue: 900000 },
          { name: "صيانة مستشفى", budget: 400000, actual: 250000, revenue: 300000 },
        ];

  const displayList: ProjectItem[] =
    projects.length > 0
      ? projects.map((p) => ({
          id: p.id,
          projectId: p.projectId,
          name: p.name,
          customerId: p.customerId,
          budget: p.budget,
          actual: p.actual,
          revenue: p.revenue,
          completionPercentage: p.completionPercentage,
          status: p.status,
        }))
      : [
          {
            projectId: "PRJ-24-001",
            name: "بناء مجمع الفاروق",
            customerId: "شركة التطوير العقاري",
            budget: 5000000,
            actual: 2000000,
            revenue: 2500000,
            completionPercentage: 45,
            status: "جاري العمل",
          },
          {
            projectId: "PRJ-24-002",
            name: "تمديد شبكة مياه",
            customerId: "وزارة المياه",
            budget: 1200000,
            actual: 120000,
            revenue: 150000,
            completionPercentage: 10,
            status: "بدأ حديثاً",
          },
        ];

  const filteredList = displayList.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.projectId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalActive = displayList.filter((p) =>
    ["جاري العمل", "بدأ حديثاً"].includes(p.status)
  ).length;
  const totalRevenue = displayList.reduce((acc, p) => acc + p.revenue, 0);
  const totalActual = displayList.reduce((acc, p) => acc + p.actual, 0);

  return {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    isModalOpen,
    setIsModalOpen,
    editingId,
    setEditingId,
    formData,
    setFormData,
    projects,
    handleCreate,
    handleEdit,
    triggerDelete,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    confirmDelete,
    defaultProjects,
    displayList,
    filteredList,
    totalActive,
    totalRevenue,
    totalActual,
  };
};
