import React, { useState } from "react";
import { Brain, Plus, Search, Filter } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import { format } from "date-fns";
import { BehaviorCreateModal } from "../../components/school/behavior/BehaviorCreateModal";
import { BehaviorRecordCard } from "../../components/school/behavior/BehaviorRecordCard";
import { BEHAVIOR_TYPES } from "../../components/school/behavior/behaviorConstants";
import { useToast } from "../../context/ToastContext";

export const SchoolBehavior = () => {
  const { success, error } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const records = useLiveQuery(() => db.schoolBehavioralTracking?.toArray()) || [];
  const students = useLiveQuery(() => db.schoolStudents?.toArray()) || [];
  const classes = useLiveQuery(() => db.schoolClassesList?.toArray()) || [];
  const employees = useLiveQuery(() => db.users?.toArray()) || [];

  const activeStudents = students.filter((s) => s.status === "نشط");
  const specialists = employees.filter(
    (e) =>
      e.jobTitle?.includes("أخصائي") ||
      e.department === "clinic" ||
      e.jobTitle?.includes("معلم")
  );

  const [form, setForm] = useState({
    studentId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    type: "hitting",
    priority: "medium",
    recurrent: false,
    dailyNotes: "",
    modificationPlan: "",
    teacherEvaluation: "",
    specialistEvaluation: "",
    parentMeetingDate: "",
    parentMeetingNotes: "",
    improvementResult: "",
    specialistId: "",
    status: "ongoing", // ongoing, resolved, improved
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId) {
      error("الرجاء اختيار الطفل أولاً");
      return;
    }
    try {
      await db.schoolBehavioralTracking.add({
        ...form,
        createdAt: new Date().toISOString(),
      });
      setIsCreateModalOpen(false);
      resetForm();
      success("تم إضافة سجل الملاحظة السلوكية بنجاح");
    } catch (err) {
      console.error(err);
      error("فشل إضافة السجل السلوكي");
    }
  };

  const resetForm = () => {
    setForm({
      studentId: "",
      date: format(new Date(), "yyyy-MM-dd"),
      type: "hitting",
      priority: "medium",
      recurrent: false,
      dailyNotes: "",
      modificationPlan: "",
      teacherEvaluation: "",
      specialistEvaluation: "",
      parentMeetingDate: "",
      parentMeetingNotes: "",
      improvementResult: "",
      specialistId: "",
      status: "ongoing",
    });
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await db.schoolBehavioralTracking.update(id, { status });
      success("تم تحديث حالة المتابعة بنجاح");
    } catch (err) {
      console.error(err);
      error("فشل تحديث الحالة");
    }
  };

  const filteredRecords = records
    .filter((r) => {
      if (filterCategory !== "all" && r.type !== filterCategory) return false;

      const student = students.find((s) => s.id === Number(r.studentId));
      if (
        searchQuery &&
        student &&
        !student.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getTypeMeta = (typeId: string) =>
    BEHAVIOR_TYPES.find((t) => t.id === typeId) || BEHAVIOR_TYPES[0];

  return (
    <div className="p-6" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-sky-100 p-3 rounded-2xl">
            <Brain className="w-8 h-8 text-sky-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">
              المتابعة النفسية والسلوكية
            </h1>
            <p className="text-slate-500 font-medium">
              ملاحظات السلوك، خطط التعديل، ومتابعة التحسن للطلاب
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-sky-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-sky-700 transition shadow-sm shadow-sky-200"
        >
          <Plus className="w-5 h-5" /> إضافة سجل متابعة
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
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-medium outline-none text-slate-700"
          />
        </div>
        <div className="flex items-center gap-2 text-slate-500 font-bold">
          <Filter className="w-4 h-4" /> تصفية بالسلوك:
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-sky-500 outline-none bg-slate-50 text-slate-700"
        >
          <option value="all">جميع السلوكيات</option>
          {BEHAVIOR_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRecords.map((record) => {
          const student = students.find((s) => s.id === Number(record.studentId));
          const studentClass = classes.find((c) => c.id === student?.classroomId);
          const typeMeta = getTypeMeta(record.type);
          return (
            <BehaviorRecordCard
              key={record.id}
              record={record}
              student={student}
              studentClass={studentClass}
              typeMeta={typeMeta}
              updateStatus={updateStatus}
            />
          );
        })}

        {filteredRecords.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-bold text-lg text-slate-600">لا توجد سجلات متابعة سلوكية</p>
          </div>
        )}
      </div>

      <BehaviorCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        form={form}
        setForm={setForm}
        handleSubmit={handleCreate}
        students={activeStudents}
        specialists={specialists}
        BEHAVIOR_TYPES={BEHAVIOR_TYPES}
      />
    </div>
  );
};

export default SchoolBehavior;
