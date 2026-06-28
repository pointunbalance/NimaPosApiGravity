export const INITIAL_LEVEL_FORM = {
  name: "",
  sortOrder: "1",
  ageFrom: "3",
  ageTo: "4",
  isActive: true
};

export const INITIAL_CLASS_FORM = {
  name: "",
  levelId: "",
  capacity: "20",
  teacherName: "",
  assistantName: "",
  status: "متاح",
  notes: ""
};

import { db } from '../../../db';

export async function saveLevelInDb(isEdit: boolean, currentId: number | null, levelFormData: any) {
  if (isEdit && currentId) {
    await db.educationalLevels.update(currentId, {
      ...levelFormData,
      sortOrder: Number(levelFormData.sortOrder)
    });
  } else {
    await db.educationalLevels.add({
      ...levelFormData,
      sortOrder: Number(levelFormData.sortOrder)
    });
  }
}

export async function saveClassInDb(isEdit: boolean, currentId: number | null, classFormData: any) {
  if (isEdit && currentId) {
    await db.schoolClassesList.update(currentId, {
      ...classFormData,
      levelId: Number(classFormData.levelId),
      capacity: Number(classFormData.capacity)
    });
  } else {
    await db.schoolClassesList.add({
      ...classFormData,
      levelId: Number(classFormData.levelId),
      capacity: Number(classFormData.capacity)
    });
  }
}

export async function deleteLevelFromDb(id: number) {
  await db.educationalLevels.delete(id);
}

export async function deleteClassFromDb(id: number) {
  await db.schoolClassesList.delete(id);
}

export async function transferStudentsInDb(selectedStudentsToTransfer: number[], transferTargetClass: string) {
  for (let sid of selectedStudentsToTransfer) {
    await db.schoolStudents.update(sid, { classroomId: Number(transferTargetClass) });
  }
}

export async function promoteStudentsInDb(studsToPromote: any[], nextLvlId: number) {
  for (let s of studsToPromote) {
    await db.schoolStudents.update(s.id!, { levelId: nextLvlId, classroomId: undefined });
  }
}
