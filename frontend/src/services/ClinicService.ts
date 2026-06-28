import { db } from "../db";
import { Customer } from "../types";

export class ClinicService {
  /**
   * Add a new patient with audit log
   */
  static async addPatient(patientData: any, userId: number | string = 1) {
    return await db.transaction('rw', [db.customers, db.auditLogs], async () => {
      const newId = await db.customers.add({...patientData, status: 'active'});
      await this.logAction(userId, 'CREATE_PATIENT', `وأضاف المريض ID:${newId}`);
      return newId;
    });
  }

  /**
   * Delete a patient (Hard or Soft Delete based on constraints)
   */
  static async deletePatient(patientId: number, userId: number | string = 1) {
    return await db.transaction('rw', [db.customers, db.medicalRecords, db.clinicInvoices, db.auditLogs], async () => {
      // Check for constraints
      const recordsCount = await db.medicalRecords.where('customerId').equals(patientId).count();
      const invoicesCount = await db.clinicInvoices.where('customerId').equals(patientId).count();

      if (recordsCount > 0 || invoicesCount > 0) {
        // Soft delete (Data Integrity)
        await db.customers.update(patientId, { status: 'inactive' });
        await this.logAction(userId, 'SOFT_DELETE_PATIENT', `تم إيقاف المريض ID:${patientId} لوجود سجلات مالية أو طبية`);
        return 'soft_deleted';
      } else {
        // Hard delete
        await db.customers.delete(patientId);
        await this.logAction(userId, 'HARD_DELETE_PATIENT', `تم حذف المريض ID:${patientId} وإرساله لسلة المهملات`);
        return 'hard_deleted';
      }
    });
  }

  /**
   * Update Patient with Optimistic Concurrency Control (OCC) mockup using locks or versions
   * Dexie uses IndexedDB transactions which provide ACID guarantees.
   */
  static async updateMedicalRecord(recordId: number, updateData: any, userId: number | string = 1) {
      return await db.transaction('rw', [db.medicalRecords, db.clinicInventoryItems, db.auditLogs], async () => {
          const oldRecord = await db.medicalRecords.get(recordId);
          if (!oldRecord) throw new Error('Record not found');
          // Update record
          await db.medicalRecords.update(recordId, updateData);
          await this.logAction(userId, 'UPDATE_MEDICAL_RECORD', `تعديل السجل الطبي ID:${recordId}`);
      });
  }

  /**
   * Base Audit Logger
   */
  static async logAction(userId: number | string, action: string, details: any) {
    await db.auditLogs.add({
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
      module: 'Clinic'
    });
  }
}
