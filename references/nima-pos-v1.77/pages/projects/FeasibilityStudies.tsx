import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import { FeasibilityStudy, Project } from "../../types";
import {
  Briefcase,
  Search,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  DollarSign,
  Calendar,
  Save,
  X,
  FileText,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Activity,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { FeasibilityStudyModal } from "./FeasibilityStudyModal";
import { FeasibilityStudyCard } from "./FeasibilityStudyCard";

export const FeasibilityStudies: React.FC = () => {
  const { success, error: showError } = useToast();
  const studies = useLiveQuery(() => db.feasibilityStudies.toArray(), []);
  const projects = useLiveQuery(() => db.projects.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toCollection().first(), []);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudy, setEditingStudy] = useState<FeasibilityStudy | null>(
    null,
  );
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [formData, setFormData] = useState<Partial<FeasibilityStudy>>({
    title: "",
    description: "",
    projectId: 0,
    expectedCost: 0,
    expectedRevenue: 0,
    roi: 0,
    paybackPeriod: 0,
    status: "draft",
    riskLevel: "medium",
    notes: "",
  });

  const currencyCode = settings?.currencyCode || "SAR";

  const filteredStudies =
    studies?.filter((s) => {
      const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || s.status === filterStatus;
      const matchesRisk = filterRisk === "all" || s.riskLevel === filterRisk;
      return matchesSearch && matchesStatus && matchesRisk;
    }) || [];

  // Calculate Statistics
  const totalStudies = studies?.length || 0;
  const approvedStudies = studies?.filter(s => s.status === 'approved').length || 0;
  const totalCost = studies?.reduce((sum, s) => sum + (s.expectedCost || 0), 0) || 0;
  const totalRevenue = studies?.reduce((sum, s) => sum + (s.expectedRevenue || 0), 0) || 0;
  const avgROI = totalStudies > 0 ? (studies?.reduce((sum, s) => sum + (s.roi || 0), 0) || 0) / totalStudies : 0;


  // Calculate ROI automatically
  const calculateROI = (revenue: number, cost: number) => {
    if (cost === 0) return 0;
    return ((revenue - cost) / cost) * 100;
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    if (name === "expectedCost" || name === "expectedRevenue") {
      const cost =
        name === "expectedCost"
          ? Number(value)
          : Number(formData.expectedCost || 0);
      const revenue =
        name === "expectedRevenue"
          ? Number(value)
          : Number(formData.expectedRevenue || 0);
      const newRoi = calculateROI(revenue, cost);
      newFormData.roi = newRoi;
      newFormData.riskLevel = calculateRiskLevel(newRoi, Number(newFormData.paybackPeriod || 0));
    }

    if (name === "paybackPeriod") {
       newFormData.riskLevel = calculateRiskLevel(Number(newFormData.roi || 0), Number(value));
    }

    setFormData(newFormData as any);
  };

  const calculateRiskLevel = (roi: number, payback: number) => {
    if (roi < 15 || payback > 24) return "high";
    if (roi > 35 && payback <= 12) return "low";
    return "medium";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      showError("الرجاء إدخال عنوان الدراسة");
      return;
    }

    const dataToSave = {
      ...formData,
      expectedCost: Number(formData.expectedCost),
      expectedRevenue: Number(formData.expectedRevenue),
      roi: Number(formData.roi),
      paybackPeriod: Number(formData.paybackPeriod),
      projectId: formData.projectId ? Number(formData.projectId) : undefined,
    } as FeasibilityStudy;

    try {
      if (editingStudy && editingStudy.id) {
        await db.feasibilityStudies.update(editingStudy.id, {
          ...dataToSave,
          updatedAt: new Date(),
        });
        success("تم تحديث دراسة الجدوى بنجاح");
      } else {
        await db.feasibilityStudies.add({
          ...dataToSave,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        success("تمت إضافة دراسة الجدوى الجديدة بنجاح");
      }
    } catch (err) {
      console.error(err);
      showError("حدث خطأ أثناء حفظ دراسة الجدوى");
    }

    setIsModalOpen(false);
    setEditingStudy(null);
    setFormData({
      title: "",
      description: "",
      projectId: 0,
      expectedCost: 0,
      expectedRevenue: 0,
      roi: 0,
      paybackPeriod: 0,
      status: "draft",
      riskLevel: "medium",
      notes: "",
    });
  };

  const handleEdit = (study: FeasibilityStudy) => {
    setEditingStudy(study);
    setFormData({
      ...study,
      projectId: study.projectId || 0,
    });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId !== null) {
      try {
        await db.feasibilityStudies.delete(deleteId);
        success("تم حذف دراسة الجدوى بنجاح");
      } catch (err) {
        console.error(err);
        showError("حدث خطأ أثناء حذف دراسة الجدوى");
      } finally {
        setDeleteId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            دراسات الجدوى
          </h2>
          <p className="text-slate-500 mt-1 font-medium">
            تحليل المشاريع وتقييم المتطلبات والعوائد درءاً للمخاطر
          </p>
        </div>
        <button
          onClick={() => {
            setEditingStudy(null);
            setFormData({
              title: "",
              description: "",
              projectId: 0,
              expectedCost: 0,
              expectedRevenue: 0,
              roi: 0,
              paybackPeriod: 0,
              status: "draft",
              riskLevel: "medium",
              notes: "",
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 font-bold whitespace-nowrap shrink-0"
        >
          <Plus className="w-5 h-5" />
          إضافة دراسة جديدة
        </button>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">إجمالي الدراسات</p>
            <p className="text-2xl font-black text-slate-800">{totalStudies}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">الدراسات المعتمدة</p>
            <p className="text-2xl font-black text-slate-800">{approvedStudies}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">إجمالي التكلفة المقدرة</p>
            <p className="text-xl font-black text-slate-800">{totalCost.toLocaleString()} <span className="text-xs font-normal text-slate-500">{currencyCode}</span></p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">متوسط العائد (ROI)</p>
            <p className="text-2xl font-black text-slate-800">{avgROI.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ابحث في الدراسات (العنوان، الوصف)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 shrink-0">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 outline-none py-2"
            >
              <option value="all">جميع الحالات</option>
              <option value="draft">مسودة</option>
              <option value="under_review">قيد المراجعة</option>
              <option value="approved">معتمدة</option>
              <option value="rejected">مرفوضة</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 shrink-0">
            <AlertTriangle className="w-4 h-4 text-slate-400" />
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 outline-none py-2"
            >
              <option value="all">كل المخاطر</option>
              <option value="low">منخفضة</option>
              <option value="medium">متوسطة</option>
              <option value="high">مرتفعة</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudies.map((study) => (
          <FeasibilityStudyCard
            key={study.id}
            study={study}
            currencyCode={currencyCode}
            onEdit={handleEdit}
            onDelete={(id) => setDeleteId(id)}
          />
        ))}
      </div>

      {filteredStudies.length === 0 && (
        <div className="text-center py-24 bg-white rounded-[2rem] border border-slate-200">
          <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {studies?.length === 0 ? "لا توجد دراسات جدوى بعد" : "لم يتم العثور على نتائج تطابق بحثك"}
          </h3>
          <p className="text-slate-500 max-w-md mx-auto">
            {studies?.length === 0 
              ? "ابدأ بإضافة دراسة جدوى جديدة لتقييم فرص نجاح مشاريعك وعوائدها المالية، أو قم بتحليل المخاطر المحتملة."
              : "جرب تغيير مصطلحات البحث أو إزالة الفلاتر المطبقة للوصول إلى الدرسات المتاحة."}
          </p>
          {studies?.length === 0 && (
            <button
               onClick={() => {
                 setEditingStudy(null);
                 setFormData({ title: "", description: "", projectId: 0, expectedCost: 0, expectedRevenue: 0, roi: 0, paybackPeriod: 0, status: "draft", riskLevel: "medium", notes: "" });
                 setIsModalOpen(true);
               }}
               className="mt-6 px-6 py-2.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة الدراسة الأولى
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      <FeasibilityStudyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formData={formData}
        handleFormChange={handleFormChange}
        handleSave={handleSave}
        projects={projects || []}
        editingStudy={editingStudy}
        currencyCode={currencyCode}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="تأكيد حذف دراسة الجدوى"
        message="هل أنت متأكد من رغبتك في حذف هذه الدراسة للجدوى؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  );
};

export default FeasibilityStudies;
