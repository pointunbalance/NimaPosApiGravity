import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";

export interface CostElement {
  id?: string;
  code: string;
  name: string;
  type: string;
  behavior: string;
  defaultCenter: string;
}

export const useCostAccountingData = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "elements" | "allocation">("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "مباشرة",
    behavior: "متغيرة",
    defaultCenter: "",
  });

  // Confirm delete dialog state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const fetchedCostElements = useLiveQuery(() => db.costAccounting.toArray(), []) || [];

  const costElements: CostElement[] =
    fetchedCostElements.length > 0
      ? fetchedCostElements.map((item: any) => ({
          id: String(item.id),
          code: item.code,
          name: item.name,
          type: item.type,
          behavior: item.behavior,
          defaultCenter: item.defaultCenter,
        }))
      : [
          {
            id: "1",
            code: "CE-001",
            name: "مواد خام أ",
            type: "مباشرة",
            behavior: "متغيرة",
            defaultCenter: "الإنتاج والتصنيع",
          },
          {
            id: "2",
            code: "CE-002",
            name: "إيجار المصنع",
            type: "غير مباشرة",
            behavior: "ثابتة",
            defaultCenter: "الإدارة العامة",
          },
        ];

  const filteredElements = costElements.filter(
    (el) => el.name.includes(searchQuery) || el.code.includes(searchQuery)
  );

  const mockCostData = [
    { name: "يناير", materials: 4000, labor: 2400, overhead: 2400 },
    { name: "فبراير", materials: 3000, labor: 1398, overhead: 2210 },
    { name: "مارس", materials: 2000, labor: 9800, overhead: 2290 },
    { name: "أبريل", materials: 2780, labor: 3908, overhead: 2000 },
  ];

  const pieData = [
    { name: "مواد مباشرة", value: 400 },
    { name: "أجور مباشرة", value: 300 },
    { name: "تكاليف غير مباشرة", value: 300 },
    { name: "إهلاكات", value: 200 },
  ];
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await db.costAccounting.update(editingId, formData as any);
    } else {
      await db.costAccounting.add({
        ...formData,
        amount: 0,
        period: new Date().toISOString().slice(0, 7), // YYYY-MM
      } as any);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      code: "",
      name: "",
      type: "مباشرة",
      behavior: "متغيرة",
      defaultCenter: "",
    });
  };

  const handleEdit = (item: CostElement) => {
    setFormData({
      code: item.code,
      name: item.name,
      type: item.type,
      behavior: item.behavior,
      defaultCenter: item.defaultCenter,
    });
    setEditingId(Number(item.id));
    setIsModalOpen(true);
  };

  const triggerDelete = (id: number) => {
    setDeleteTargetId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTargetId !== null) {
      await db.costAccounting.delete(deleteTargetId);
      setDeleteTargetId(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  return {
    activeTab,
    setActiveTab,
    isModalOpen,
    setIsModalOpen,
    editingId,
    setEditingId,
    searchQuery,
    setSearchQuery,
    formData,
    setFormData,
    costElements,
    filteredElements,
    mockCostData,
    pieData,
    COLORS,
    handleCreate,
    handleEdit,
    triggerDelete,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    confirmDelete,
  };
};
