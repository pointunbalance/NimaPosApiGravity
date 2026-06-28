import React, { useState } from "react";
import { Plus, Search, Filter, Tag } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import { useToast } from "../../context/ToastContext";
import { DiscountCreateModal } from "../../components/school/discounts/DiscountCreateModal";
import { DiscountCard } from "../../components/school/discounts/DiscountCard";
import ConfirmModal from "../../components/ui/ConfirmModal";

const DISCOUNT_TYPES = [
  { id: "siblings", label: "خصم أخوات" },
  { id: "employees", label: "خصم موظفين" },
  { id: "special_case", label: "خصم حالة خاصة" },
  { id: "early_bird", label: "خصم مبكر" },
  { id: "manual", label: "خصم يدوي" },
  { id: "full_exemption", label: "إعفاء كامل" },
  { id: "partial_grant", label: "منحة جزئية" },
];

export const SchoolDiscounts = () => {
  const { success, error } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const discounts = useLiveQuery(() => db.schoolDiscounts?.toArray()) || [];
  const students = useLiveQuery(() => db.schoolStudents?.toArray()) || [];
  const classes = useLiveQuery(() => db.schoolClassesList?.toArray()) || [];

  const [form, setForm] = useState({
    studentId: "",
    type: "siblings",
    amount: 0,
    isPercentage: true,
    reason: "",
    isPermanent: false,
    appliesTo: "subscription_only",
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmParams, setConfirmParams] = useState<{
    id: number;
    status: "approved" | "rejected";
    title: string;
    message: string;
  } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId) {
      error("الرجاء اختيار الطالب أولاً");
      return;
    }
    try {
      await db.schoolDiscounts.add({
        ...form,
        amount: Number(form.amount),
        date: new Date().toISOString(),
        status: "pending", // Manager approval required
        addedBy: "المستخدم الحالي", // Should come from actual auth context
      });
      setIsCreateModalOpen(false);
      resetForm();
      success("تم تقديم طلب الخصم بنجاح وفي انتظار الاعتماد");
    } catch (err) {
      console.error(err);
      error("فشل تقديم طلب الخصم");
    }
  };

  const resetForm = () => {
    setForm({
      studentId: "",
      type: "siblings",
      amount: 0,
      isPercentage: true,
      reason: "",
      isPermanent: false,
      appliesTo: "subscription_only",
    });
  };

  const updateStatus = (id: number, status: "approved" | "rejected") => {
    setConfirmParams({
      id,
      status,
      title: status === "approved" ? "تأكيد اعتماد الخصم" : "تأكيد رفض الخصم",
      message: status === "approved" 
        ? "هل أنت متأكد من الموافقة على طلب الخصم هذا وتفعيله في حساب الطالب؟" 
        : "هل أنت متأكد من رفض طلب الخصم هذا وإلغائه؟",
    });
    setConfirmOpen(true);
  };

  const handleConfirmStatusUpdate = async () => {
    if (confirmParams) {
      try {
        await db.schoolDiscounts.update(confirmParams.id, { status: confirmParams.status });
        success(confirmParams.status === "approved" ? "تم اعتماد وتفعيل الخصم بنجاح" : "تم رفض الخصم وإلغاء الطلب");
      } catch (err) {
        console.error(err);
        error("فشل تحديث حالة الخصم");
      }
    }
    setConfirmOpen(false);
    setConfirmParams(null);
  };

  const filteredDiscounts = discounts.filter((d) => {
    if (filterStatus !== "all" && d.status !== filterStatus) return false;
    if (filterType !== "all" && d.type !== filterType) return false;

    const student = students.find((s) => s.id === Number(d.studentId));
    if (
      searchQuery &&
      student &&
      !student.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const getTypeLabel = (typeId: string) =>
    DISCOUNT_TYPES.find((t) => t.id === typeId)?.label || typeId;

  return (
    <div className="p-6" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-purple-100 p-3 rounded-2xl">
            <Tag className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">الخصومات والمنح</h1>
            <p className="text-slate-500 font-medium">
              إدارة واعتماد الخصومات لطلاب المدرسة والحضانة
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-purple-700 transition shadow-sm shadow-purple-200"
        >
          <Plus className="w-5 h-5" /> إضافة خصم جديد
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center mb-6">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="w-5 h-5 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="ابحث باسم الطالب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium outline-none text-slate-700"
          />
        </div>
        <div className="flex items-center gap-2 text-slate-500 font-bold">
          <Filter className="w-4 h-4" /> تصفية:
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-slate-50 text-slate-700"
        >
          <option value="all">جميع الحالات</option>
          <option value="pending">قيد الانتظار</option>
          <option value="approved">موافق عليه</option>
          <option value="rejected">مرفوض</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-slate-50 text-slate-700"
        >
          <option value="all">جميع الأنواع</option>
          {DISCOUNT_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDiscounts.map((discount) => {
          const student = students.find((s) => s.id === Number(discount.studentId));
          return (
            <DiscountCard
              key={discount.id}
              discount={discount}
              student={student}
              typeLabel={getTypeLabel(discount.type)}
              updateStatus={updateStatus}
            />
          );
        })}
        {filteredDiscounts.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-bold text-lg text-slate-600">لا توجد خصومات مطابقة للبحث</p>
          </div>
        )}
      </div>

      <DiscountCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        form={form}
        setForm={setForm}
        handleSubmit={handleCreate}
        students={students}
        classes={classes}
        DISCOUNT_TYPES={DISCOUNT_TYPES}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        title={confirmParams?.title || "تأكيد"}
        message={confirmParams?.message || ""}
        onConfirm={handleConfirmStatusUpdate}
        onCancel={() => setConfirmOpen(false)}
        confirmText="تأكيد"
        cancelText="إلغاء"
      />
    </div>
  );
};

export default SchoolDiscounts;
