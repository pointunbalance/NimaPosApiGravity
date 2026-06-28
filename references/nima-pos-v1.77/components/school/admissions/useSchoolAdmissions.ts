import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../db";
import { useToast } from "../../../context/ToastContext";

export const LEAD_SOURCES = [
  "انستجرام",
  "فيسبوك",
  "واتساب",
  "تيك توك",
  "ترشيح من ولي أمر",
  "إعلان بالشارع",
  "بحث جوجل",
  "زيارة مباشرة",
  "أخرى",
];

export const useSchoolAdmissions = () => {
  const { success, error: toastError } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmParams, setConfirmParams] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const requestConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmParams({ title, message, onConfirm });
    setConfirmOpen(true);
  };

  const requests = useLiveQuery(() => db.schoolAdmissionRequests?.toArray()) || [];
  const levels = useLiveQuery(() => db.educationalLevels?.toArray()) || [];
  const employees = useLiveQuery(() => db.users?.toArray()) || [];
  const crmLogs = useLiveQuery(() => db.schoolCrmLogs?.toArray()) || [];

  const [form, setForm] = useState({
    childName: "",
    childAge: "",
    parentName: "",
    phone: "",
    altPhone: "",
    email: "",
    requestedLevelId: "",
    previousSchool: "",
    preferredContactTime: "",
    hasSiblingsInSchool: false,
    visitDate: "",
    leadSource: "فيسبوك",
    campaign: "",
    assignedTo: "",
    status: "new",
    receptionistNotes: "",
    rejectionReason: "",
  });

  const [followupForm, setFollowupForm] = useState({
    action: "call",
    result: "",
    notes: "",
    nextVisitDate: "",
    employeeId: "",
  });

  const resetForm = () => {
    setForm({
      childName: "",
      childAge: "",
      parentName: "",
      phone: "",
      altPhone: "",
      email: "",
      requestedLevelId: "",
      previousSchool: "",
      preferredContactTime: "",
      hasSiblingsInSchool: false,
      visitDate: "",
      leadSource: "فيسبوك",
      campaign: "",
      assignedTo: "",
      status: "new",
      receptionistNotes: "",
      rejectionReason: "",
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.schoolAdmissionRequests.add({
        ...form,
        createdAt: new Date().toISOString(),
      });
      setIsCreateModalOpen(false);
      resetForm();
      success("تم إضافة طلب الالتحاق بنجاح");
    } catch (err) {
      console.error(err);
      toastError("حدث خطأ أثناء إضافة الطلب");
    }
  };

  const handleAddFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      await db.schoolCrmLogs.add({
        requestId: selectedRequest.id,
        date: new Date().toISOString(),
        ...followupForm,
      });

      if (followupForm.nextVisitDate) {
        await db.schoolAdmissionRequests.update(selectedRequest.id, {
          visitDate: followupForm.nextVisitDate,
        });
      }

      setIsFollowupModalOpen(false);
      setFollowupForm({
        action: "call",
        result: "",
        notes: "",
        nextVisitDate: "",
        employeeId: "",
      });
      success("تم إضافة المتابعة بنجاح");
    } catch (err) {
      console.error(err);
      toastError("فشل إضافة المتابعة");
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await db.schoolAdmissionRequests.update(id, { status });
      success("تم تحديث حالة الطلب بنجاح");
    } catch (err) {
      console.error(err);
      toastError("فشل تحديث حالة الطلب");
    }
  };

  const convertToStudent = (request: any) => {
    requestConfirmation(
      "تأكيد تحويل الطلب وتفعيل الربط المالي",
      `هل تريد تحويل ${request.childName} إلى طفل مسجل بالنظام؟ سيقوم هذا بربط ولي الأمر وتوليد قيد إيرادات مستحقة تلقائياً.`,
      async () => {
        try {
          // 1. Check or create Guardian
          let guardianId: number | undefined;
          if (request.phone) {
            const existingGuardian = await db.guardians.where("primaryPhone").equals(request.phone).first();
            if (existingGuardian) {
              guardianId = existingGuardian.id;
            } else {
              guardianId = await db.guardians.add({
                name: request.parentName || "ولي أمر " + request.childName,
                relation: "أب",
                primaryPhone: request.phone,
                email: request.email || "",
                notes: `تم إنشاؤه تلقائياً من نظام الالتحاق CRM للطفل: ${request.childName}`,
              });
            }
          }

          // 2. Add student with linked guardianId
          const newStudentId = await db.schoolStudents.add({
            name: request.childName,
            levelId: request.requestedLevelId
              ? Number(request.requestedLevelId)
              : 0,
            status: "نشط",
            code: "STU-" + Math.floor(1000 + Math.random() * 9000),
            nationalId: "",
            classroomId: 0,
            birthDate: new Date().toISOString().split("T")[0],
            joinDate: new Date().toISOString().split("T")[0],
            gender: "ذكر",
            nationality: "",
            religion: "",
            address: "",
            guardianId: guardianId,
          });

          // 3. Post automatic journal entry for New Student Registration Fee
          try {
            const { AccountingEngine } = await import("../../../services/AccountingEngine");
            const arAccount = await db.accounts.where("code").equals("1030").first();
            const revenueAccount = await db.accounts.where("code").equals("4010").first();

            if (arAccount && revenueAccount) {
              const regFeeAmount = 150000; // 150,000 standard registration fee
              await AccountingEngine.postEntry({
                date: new Date(),
                reference: `REG-${newStudentId}`,
                description: `إثبات رسوم القبول والتسجيل للطفل الجديد: ${request.childName}`,
                lines: [
                  {
                    accountId: arAccount.id!,
                    accountName: arAccount.name,
                    debit: regFeeAmount,
                    credit: 0,
                    description: "رسوم قبول مستحقة",
                  },
                  {
                    accountId: revenueAccount.id!,
                    accountName: revenueAccount.name,
                    debit: 0,
                    credit: regFeeAmount,
                    description: "إيراد رسوم قبول وتسجيل جديدة",
                  },
                ],
                ignoreClosedPeriod: true,
              });
            }
          } catch (accErr) {
            console.error("Failed to post journal entry for student admission:", accErr);
          }

          await db.schoolAdmissionRequests.update(request.id, {
            status: "registered",
          });

          success(`تم قبول وتسجيل الطفل ${request.childName} بنجاح، وتوليد القيد المحاسبي لرسوم التسجيل.`);
        } catch (err) {
          console.error(err);
          toastError("حدث خطأ أثناء تحويل الطلب.");
        }
      }
    );
  };

  const updateRejection = async (id: number, reason: string) => {
    try {
      await db.schoolAdmissionRequests.update(id, { rejectionReason: reason });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = (id: number) => {
    requestConfirmation(
      "حذف الطلب",
      "هل أنت متأكد من حذف هذا الطلب؟",
      async () => {
        try {
          await db.schoolAdmissionRequests.delete(id);
          success("تم حذف الطلب بنجاح.");
        } catch (err) {
          console.error(err);
          toastError("فشل حذف الطلب");
        }
      }
    );
  };

  const filteredRequests = requests
    .filter((req) => {
      if (statusFilter !== "all" && req.status !== statusFilter) return false;

      const searchStr = searchQuery.toLowerCase();
      if (
        searchStr &&
        !req.childName.toLowerCase().includes(searchStr) &&
        !req.parentName.toLowerCase().includes(searchStr) &&
        !req.phone.includes(searchStr)
      ) {
        return false;
      }
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return {
    isCreateModalOpen,
    setIsCreateModalOpen,
    isFollowupModalOpen,
    setIsFollowupModalOpen,
    selectedRequest,
    setSelectedRequest,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    confirmOpen,
    setConfirmOpen,
    confirmParams,
    requests,
    levels,
    employees,
    crmLogs,
    form,
    setForm,
    followupForm,
    setFollowupForm,
    resetForm,
    handleCreate,
    handleAddFollowup,
    updateStatus,
    convertToStudent,
    updateRejection,
    handleDelete,
    filteredRequests,
  };
};
