import React, { useState, useMemo } from 'react';
import { Users, Search, Plus, FileText, Phone, ArrowLeft, Trash2, Heart } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useToast } from '../../context/ToastContext';
import { AddPatientModal } from '../../components/clinics/AddPatientModal';
import { PatientMedicalRecordModal } from '../../components/clinics/PatientMedicalRecordModal';
import { ClinicService } from '../../services/ClinicService';
import { CRMLoyaltyModal } from '../../components/clinics/CRMLoyaltyModal';

export default function ClinicPatients() {
    const { success, error, warning } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modals state
    const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
    const [selectedPatientRecord, setSelectedPatientRecord] = useState<number | null>(null);
    const [isCRMLopen, setIsCRMLopen] = useState(false);

    const allPatients = useLiveQuery(() => db.customers.toArray(), []) || [];

    const duplicateGroups = useMemo(() => {
        if (!allPatients.length) return [];
        const groups: Record<string, any[]> = {};
        
        allPatients.forEach(p => {
            if (p.phone) {
                const key = `phone_${p.phone}`;
                if (!groups[key]) groups[key] = [];
                groups[key].push(p);
            }
            if (p.nationalId) {
                const key = `national_${p.nationalId}`;
                if (!groups[key]) groups[key] = [];
                groups[key].push(p);
            }
        });

        // Filter groups that have more than 1 patient
        const dups = Object.values(groups).filter(g => g.length > 1);
        
        // Deduplicate the groups based on IDs so we don't show the same group twice
        const uniqueGroups: any[][] = [];
        const seenIds = new Set<string>();
        
        dups.forEach(group => {
            const groupIds = group.map(p => p.id).sort().join('-');
            if (!seenIds.has(groupIds)) {
                seenIds.add(groupIds);
                uniqueGroups.push(group);
            }
        });
        
        return uniqueGroups;
    }, [allPatients]);

    const handleMergeTrigger = async (group: any[]) => {
        if (!confirm('هل أنت متأكد من دمج هذه الملفات؟ (سيتم الاحتفاظ بالملف الأحدث ونقل السجلات إليه)')) return;
        try {
            // Sort by ID descending (newest first)
            const sorted = [...group].sort((a, b) => b.id - a.id);
            const primaryId = sorted[0].id;
            const duplicateIds = sorted.slice(1).map(p => p.id);

            await db.transaction('rw', [db.customers, db.appointments, db.clinicInvoices, db.medicalRecords, db.auditLogs], async () => {
                for (const oldId of duplicateIds) {
                    // Update related records
                    await db.appointments.where('customerId').equals(oldId).modify({ customerId: primaryId });
                    await db.clinicInvoices.where('customerId').equals(oldId).modify({ customerId: primaryId });
                    await db.medicalRecords.where('customerId').equals(oldId).modify({ customerId: primaryId });
                    
                    // delete old customer
                    await db.customers.delete(oldId);
                }

                await db.auditLogs.add({
                    userId: 1,
                    action: 'MERGE_PATIENTS',
                    module: 'ClinicPatients',
                    timestamp: new Date().toISOString(),
                    details: `تم دمج ملفات المرضى [${duplicateIds.join(', ')}] إلى الملف الأساسي [${primaryId}]`
                });
            });

            success('تم دمج الملفات بنجاح');
        } catch (err) {
            console.error(err);
            error('حدث خطأ أثناء دمج الملفات');
        }
    };

    const patients = useMemo(() => {
        if (!searchTerm) return allPatients;
        const lowerSearch = searchTerm.toLowerCase();
        return allPatients.filter(p => 
            p.name.toLowerCase().includes(lowerSearch) || 
            p.phone?.includes(searchTerm) ||
            p.nationalId?.includes(searchTerm) ||
            p.code?.toLowerCase().includes(lowerSearch)
        );
    }, [allPatients, searchTerm]);

    const handleSavePatient = async (patientData: any) => {
        try {
            await ClinicService.addPatient(patientData, 1);
            success('تم إضافة المريض بنجاح');
            setIsAddPatientOpen(false);
        } catch (err) {
            error('حدث خطأ أثناء حفظ بيانات المريض');
            console.error(err);
        }
    };

    const handleDeleteClick = async (patientId: number) => {
        try {
            const result = await ClinicService.deletePatient(patientId, 1);
            if (result === 'soft_deleted') {
                warning('تم إيقاف المريض لامتلاكه سجلات تاريخية لا يمكن مسحها');
            } else {
                success('تم حذف المريض بنجاح');
            }
        } catch (err) {
            error('حدث خطأ أثناء الحذف');
            console.error(err);
        }
    };

    return (
        <div className="h-full flex flex-col relative overflow-hidden bg-slate-50">
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <Users className="w-8 h-8 text-brand-600" />
                        سجل المرضى
                    </h1>
                    <p className="text-sm font-bold text-slate-500">
                        إدارة بيانات المرضى والملفات الطبية
                    </p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsCRMLopen(true)}
                        className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm flex items-center gap-2"
                    >
                        <Heart className="w-5 h-5" />
                        نظام الولاء والمتابعة (CRM)
                    </button>
                    <button 
                        onClick={() => setIsAddPatientOpen(true)} 
                        className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl shadow-brand-500/30 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        إضافة مريض
                    </button>
                </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-6">

                    {duplicateGroups.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
                            <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-3">
                                <Users className="w-5 h-5 text-amber-600" />
                                تنبيه: تم اكتشاف ملفات مكررة (نفس رقم الهاتف أو الهوية)
                            </h3>
                            <div className="space-y-3">
                                {duplicateGroups.map((group, idx) => (
                                    <div key={idx} className="bg-white/60 p-3 rounded-xl border border-amber-100 flex items-center justify-between">
                                        <div className="text-sm font-bold text-slate-700">
                                            الملفات المكررة: {group.map(p => p.name).join(' | ')} (السبب: {group[0].phone || group[0].nationalId})
                                        </div>
                                        <button 
                                            onClick={() => handleMergeTrigger(group)}
                                            className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors"
                                        >
                                            الدمج التلقائي (Merge)
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-amber-600 mt-3 flex items-center gap-1 font-bold">
                                ℹ️ الدمج التلقائي ينقل جميع السجلات السابقة والمواعيد والفواتير إلى أحدث ملف تم إنشاؤه، ويحذف الملفات المكررة.
                            </p>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center">
                            <div className="relative flex-1 w-full text-slate-700">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-12 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 h-12 text-sm font-medium"
                                    placeholder="ابحث برقم الهاتف أو الاسم، الكود، الرقم القومي..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">اسم المريض والكود</th>
                                        <th className="px-6 py-4 border-r border-slate-100">رقم الهاتف / الهوية</th>
                                        <th className="px-6 py-4 border-r border-slate-100">المديونية</th>
                                        <th className="px-6 py-4 w-40 text-left border-r border-slate-100">التفاصيل والإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {patients.length > 0 ? patients.map(patient => (
                                        <tr key={patient.id} className={`hover:bg-slate-50 transition-colors ${patient.status === 'inactive' ? 'opacity-50' : ''}`}>
                                            <td className="px-6 py-4 font-bold text-slate-800">
                                                <div className="flex items-center gap-2">
                                                    {patient.status === 'inactive' && <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-xs">غير نشط</span>}
                                                    {patient.name}
                                                    {patient.code && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-mono">{patient.code}</span>}
                                                </div>
                                                {patient.email && <div className="text-xs font-normal text-slate-400 mt-1">{patient.email}</div>}
                                            </td>
                                            <td className="px-6 py-4 border-r border-slate-50">
                                                <div className="flex items-center gap-2" dir="ltr">
                                                     <Phone className="w-3 h-3 text-slate-400" />
                                                     <span className="font-medium text-slate-600">{patient.phone || '-'}</span>
                                                </div>
                                                {patient.nationalId && <div className="text-xs text-slate-400 mt-1">الهوية: {patient.nationalId}</div>}
                                            </td>
                                            <td className="px-6 py-4 border-r border-slate-50 font-bold">
                                                {patient.dues && patient.dues > 0 ? (
                                                    <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded-md text-xs border border-rose-100">
                                                        {patient.dues.toLocaleString()} ج.م
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-left border-r border-slate-50">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => setSelectedPatientRecord(patient.id!)}
                                                        className="bg-brand-50 text-brand-700 hover:bg-brand-100 font-bold px-4 py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <FileText className="w-4 h-4" />الملف الطبي <ArrowLeft className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(patient.id!)}
                                                        className="bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold p-2 rounded-xl transition-colors flex items-center justify-center"
                                                        title="مسح المريض"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-16 text-center">
                                                 <div className="flex flex-col items-center justify-center">
                                                     <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                                          <Users className="w-8 h-8 text-slate-400" />
                                                     </div>
                                                     <p className="text-lg font-bold text-slate-600 mb-2">
                                                         {searchTerm ? 'لا يوجد نتائج للبحث' : 'لا يوجد مرضى مسجلين'}
                                                     </p>
                                                     {searchTerm && (
                                                         <button 
                                                             onClick={() => setSearchTerm('')} 
                                                             className="text-brand-600 hover:underline font-bold text-sm"
                                                         >
                                                             مسح البحث
                                                         </button>
                                                     )}
                                                 </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <AddPatientModal 
                isOpen={isAddPatientOpen}
                onClose={() => setIsAddPatientOpen(false)}
                onSave={handleSavePatient}
            />

            <PatientMedicalRecordModal 
                isOpen={selectedPatientRecord !== null}
                onClose={() => setSelectedPatientRecord(null)}
                patientId={selectedPatientRecord}
            />

            <CRMLoyaltyModal 
                isOpen={isCRMLopen}
                onClose={() => setIsCRMLopen(false)}
            />
        </div>
    );
}
