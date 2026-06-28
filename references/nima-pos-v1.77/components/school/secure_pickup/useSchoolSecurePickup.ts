import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../db";
import { format } from "date-fns";

export const useSchoolSecurePickup = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [isManageAuthModalOpen, setIsManageAuthModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const students = useLiveQuery(() => db.schoolStudents?.toArray()) || [];
  const classes = useLiveQuery(() => db.schoolClassesList?.toArray()) || [];
  const authorizedPickups = useLiveQuery(() => db.authorizedPickups?.toArray()) || [];
  const pickupLogs = useLiveQuery(() =>
    db.schoolPickupLogs
      ?.where("date")
      .equals(format(new Date(), "yyyy-MM-dd"))
      .toArray()
  ) || [];

  const activeStudents = students.filter(
    (s) => s.status === "نشط" || s.status === "متوقف"
  );

  const filteredStudents = activeStudents.filter((student) => {
    if (
      searchQuery &&
      !student.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !student.code?.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const handleLogPickup = async (payload: {
    pickupPersonId: number;
    pickupPersonName: string;
    relation: string;
    note: string;
  }) => {
    if (!selectedStudent) return;

    await db.schoolPickupLogs.add({
      studentId: selectedStudent.id,
      date: format(new Date(), "yyyy-MM-dd"),
      time: format(new Date(), "HH:mm:ss"),
      pickupPersonId: payload.pickupPersonId,
      pickupPersonName: payload.pickupPersonName,
      relation: payload.relation,
      notes: payload.note,
      employeeName: "موظف الاستقبال",
      createdAt: new Date().toISOString(),
    });

    setIsPickupModalOpen(false);
    setSelectedStudent(null);
  };

  const handleAddAuthPerson = async (authForm: any) => {
    await db.authorizedPickups.add({
      ...authForm,
      createdAt: new Date().toISOString(),
    });
  };

  const triggerDeleteAuth = (id: number) => {
    setDeleteTargetId(id);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDeleteAuth = async () => {
    if (deleteTargetId !== null) {
      await db.authorizedPickups.delete(deleteTargetId);
      setDeleteTargetId(null);
    }
    setIsConfirmDeleteOpen(false);
  };

  const openPickupModal = (student: any) => {
    setSelectedStudent(student);
    setIsPickupModalOpen(true);
  };

  const openManageAuthModal = (student: any) => {
    setSelectedStudent(student);
    setIsManageAuthModalOpen(true);
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedStudent,
    setSelectedStudent,
    isPickupModalOpen,
    setIsPickupModalOpen,
    isManageAuthModalOpen,
    setIsManageAuthModalOpen,
    isConfirmDeleteOpen,
    setIsConfirmDeleteOpen,
    students,
    classes,
    authorizedPickups,
    pickupLogs,
    filteredStudents,
    activeStudents,
    handleLogPickup,
    handleAddAuthPerson,
    triggerDeleteAuth,
    confirmDeleteAuth,
    openPickupModal,
    openManageAuthModal,
  };
};
