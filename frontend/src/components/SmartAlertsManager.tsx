import React, { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { notificationService } from '../utils/notifications';
import { format, differenceInDays, isSameDay, subDays } from 'date-fns';

export const SmartAlertsManager = () => {
    // Only run this logic periodically or on load to avoid heavy db lookups on every render
    useEffect(() => {
        const runChecks = async () => {
            const today = new Date();
            const todayStr = format(today, 'yyyy-MM-dd');
            const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

            try {
                // 1. Child absent for 2 consecutive days
                const students = await db.schoolStudents?.toArray() || [];
                const attendance = await db.schoolAttendanceList?.toArray() || [];
                if (students.length > 0) {
                    students.forEach(student => {
                        const attToday = attendance.find(a => a.studentId === student.id && a.date === todayStr);
                        const attYesterday = attendance.find(a => a.studentId === student.id && a.date === yesterdayStr);
                        if (attToday?.status === 'absent' && attYesterday?.status === 'absent') {
                            alertOnce(`غياب متكرر: ${student.name}`, `تغيب الطفل ${student.name} ليومين متتاليين.`, 'warning');
                        }
                    });

                    // 4. Child's birthday today
                    students.forEach(student => {
                        if (student.dateOfBirth) {
                            const dob = new Date(student.dateOfBirth);
                            if (dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate()) {
                                alertOnce(`عيد ميلاد سعيد! 🎂`, `اليوم يوافق عيد ميلاد الطفل ${student.name}`, 'info');
                            }
                        }
                    });

                    // 3. Child has food allergy
                    students.forEach(student => {
                        if ((student as any).medicalInfo?.includes('حساسية')) {
                            alertOnce(`حساسية غذائية: ${student.name}`, `يرجى الانتباه، الطفل لديه حالة حساسية مسجلة.`, 'error');
                        }
                    });
                }

                // 2. Child has due installment (School Fees)
                const fees = await db.schoolFees?.toArray() || [];
                fees.forEach(fee => {
                    if (fee.status !== 'paid' && fee.date) {
                        const dueDate = new Date(fee.date);
                        if (dueDate <= today) {
                            const student = students.find(s => s.id === fee.studentId);
                            alertOnce(`قسط مستحق: ${student?.name || 'طالب'}`, `يوجد قسط مستحق بقيمة ${fee.amount} بموعد ${fee.date}`, 'error');
                        }
                    }
                });

                // 5. Subscription ending in 3 days
                const subscriptions = await db.subscriptions?.toArray() || [];
                const in3Days = subDays(today, -3); // add 3 days
                subscriptions.forEach(sub => {
                    if (sub.status === 'active' && sub.nextBillingDate) {
                        const nextDate = new Date(sub.nextBillingDate);
                        if (isSameDay(nextDate, in3Days)) {
                            alertOnce(`تجديد اشتراك: ${sub.planName}`, `سجل اشتراك للعميل #${sub.customerId} ينتهي خلال 3 أيام.`, 'warning');
                        }
                    }
                });

                // 6. Class at maximum capacity
                const classes = await db.table('schoolClassesList').toArray() || [];
                const allStudents = await db.schoolStudents?.toArray() || [];
                classes.forEach(c => {
                    // For now assume student.classroomId links them.
                    const enrolledCount = allStudents.filter(s => s.classroomId === c.id).length;
                    if (c.capacity && enrolledCount >= c.capacity) {
                        alertOnce(`تنبيه السعة القصوى: ${c.name}`, `الفصل وصل للسعة القصوى (${c.capacity} طالب)`, 'warning');
                    }
                });

                // 7. Stock almost empty
                const products = await db.products?.toArray() || [];
                products.forEach(p => {
                    if ((p.stock || 0) <= ((p as any).reorderPoint || 5)) {
                        alertOnce(`نقص مخزون: ${p.name}`, `الكمية المتبقية ${p.stock} فقط في المخزن.`, 'warning');
                    }
                });

                // 8. Employee very late (Check daily HR attendance)
                const hrAttendance = await db.attendance?.toArray() || [];
                const users = await db.users?.toArray() || [];
                const todayAttendance = hrAttendance.filter(a => a.date === todayStr && a.status === 'late');
                todayAttendance.forEach(a => {
                    const user = users.find(u => u.id === a.userId);
                    alertOnce(`تأخير موظف`, `الموظف ${user?.name || a.userId} مسجل متأخر لليوم.`, 'warning');
                });

                // 10. Receipt Cancelled (Void logs)
                const voidLogs = await db.voidLogs?.toArray() || [];
                const todayVoids = voidLogs.filter(v => v.date && new Date(v.date).toISOString().startsWith(todayStr));
                if (todayVoids.length > 0) {
                    alertOnce(`تنبيه أمني: إلغاء فواتير`, `تم رصد إلغاء ${todayVoids.length} فواتير/عناصر اليوم.`, 'error');
                }

                // 11. Sensitive financial modification
                const auditLogs = await db.table('logs').toArray() || [];
                const sensitiveLogs = auditLogs.filter(l => 
                   new Date(l.date).toISOString().startsWith(todayStr) && 
                   (l.action?.includes('delete') || l.action?.includes('modify')) && 
                   l.module === 'accounting'
                );
                if (sensitiveLogs.length > 0) {
                    alertOnce(`مراجعة مالية مطلوبة`, `تم تعديل عمليات مالية بطريقة حساسة اليوم.`, 'error');
                }

                // 9. Backup failed
                // (Simulated check if backup failed based on local storage flag)
                const backupFailed = localStorage.getItem('lastBackupStatus') === 'failed';
                if (backupFailed) {
                    alertOnce(`فشل النسخ الاحتياطي`, `تعذر أخذ نسخة احتياطية محلية للنظام البارحة! يرجى المراجعة.`, 'error');
                }

                // 12. B2B Maintenance Contracts check
                const contractList = await db.contracts.toArray() || [];
                const b2bList = contractList.filter(c => c.type === 'customer' && (c as any).devicesCount !== undefined);
                b2bList.forEach((c: any) => {
                    if (c.nextVisitDate === todayStr) {
                        alertOnce(
                            `موعد صيانة وقائية لـ ${c.partyName} 🛠️`,
                            `اليوم موعد زيارة الصيانة الوقائية لشركة "${c.partyName}" لتنظيف الأجهزة وتحديث الأنتي فيرس.`,
                            'warning'
                        );
                    }
                });

            } catch (error) {
                console.error("Error running smart checks:", error);
            }
        };

        const alertOnce = async (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => {
            // Check if notification already exists for today to avoid spamming
            const allNotifs = await db.notifications.toArray();
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            
            const exists = allNotifs.some(n => 
                n.title === title && 
                n.message === message && 
                new Date(n.date).toISOString().startsWith(todayStr)
            );

            if (!exists) {
                notificationService.addNotification(title, message, type);
            }
        };

        // Run immediately on mount
        runChecks();

        // Run every 10 minutes
        const intervalId = setInterval(runChecks, 10 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, []);

    return null; // This is a logic-only component
};

export default SmartAlertsManager;
