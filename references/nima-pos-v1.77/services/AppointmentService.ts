import { db } from "../db";

export class AppointmentService {
    /**
     * Attempts to acquire a soft lock on a doctor's specific date and time slot.
     * Returns true if locked successfully, throws error if already locked.
     */
    static async acquireLock(doctorId: number, date: string, time: string, userId: string = 'receptionist_1') {
        const lockKey = `${doctorId}_${date}_${time}`;
        return await db.transaction('rw', db.appointmentLocks, async () => {
             // clean up expired locks
             const now = Date.now();
             await db.appointmentLocks.where('expiresAt').below(now).delete();

             const existingLock = await db.appointmentLocks.where({ doctorId, date, time }).first();
             if (existingLock && existingLock.expiresAt > now && existingLock.lockedBy !== userId) {
                 throw new Error("هذا الموعد قيد الحجز حالياً من قبل موظف آخر. الرجاء الانتظار دقيقتين أو اختيار موعد بديل.");
             }

             // create or update lock (valid for 2 minutes)
             if (existingLock) {
                 await db.appointmentLocks.update(existingLock.id!, {
                     expiresAt: now + 2 * 60 * 1000
                 });
             } else {
                 await db.appointmentLocks.add({
                     doctorId,
                     date,
                     time,
                     lockedBy: userId,
                     expiresAt: now + 2 * 60 * 1000
                 });
             }
             return true;
        });
    }

    /**
     * Rescheduling Engine: Handles doctor cancellation of a day by proposing alternatives and notifying patients.
     * It finds all scheduled appointments on that day, flags them as "needs_rescheduling",
     * and suggests alternative times.
     */
    static async cancelDayAndReschedule(doctorId: number, date: string) {
        return await db.transaction('rw', [db.appointments, db.auditLogs], async () => {
             const affectedAppointments = await db.appointments
                 .where({ doctorId, date })
                 .toArray();
             
             const scheduled = affectedAppointments.filter(a => a.status === 'scheduled');
             
             if (scheduled.length === 0) return { affected: 0, alternatives: [] };

             for (const app of scheduled) {
                 await db.appointments.update(app.id!, {
                     status: 'needs_rescheduling',
                     notes: (app.notes ? app.notes + '\n' : '') + 'تم اعتذار الطبيب عن هذا اليوم بشكل مفاجئ. الموعد بحاجة لإعادة الجدولة.'
                 });
             }

             // Simple naive alternative: Next day
             const nextDate = new Date(date);
             nextDate.setDate(nextDate.getDate() + 1);
             const nextDateStr = nextDate.toISOString().split('T')[0];

             // Provide audit log
             await db.auditLogs.add({
                 userId: 1,
                 module: 'Clinic',
                 action: 'EMERGENCY_CANCEL_DAY',
                 timestamp: new Date().toISOString(),
                 details: `الطبيب ${doctorId} ألغى يوم ${date}. تأثر ${scheduled.length} موعد.`
             });

             return {
                 affected: scheduled.length,
                 alternativeDate: nextDateStr
             };
        });
    }
}
