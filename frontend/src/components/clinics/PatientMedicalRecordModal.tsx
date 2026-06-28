import React, { useState } from 'react';
import { X, FileText, Calendar, Plus, User, Stethoscope, Printer, FileSearch, History, Activity, Upload, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { DrugService } from '../../services/DrugService';
import { encryptSync, decryptSync } from '../../lib/encryption';

interface PatientMedicalRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: number | null;
}

export const PatientMedicalRecordModal: React.FC<PatientMedicalRecordModalProps> = ({
    isOpen,
    onClose,
    patientId
}) => {
    const patient = useLiveQuery(() => patientId ? db.customers.get(patientId) : undefined, [patientId]);
    const appointments = useLiveQuery(() => patientId ? db.appointments.where('customerId').equals(patientId).toArray() : [], [patientId]) || [];
    const encryptedRecords = useLiveQuery(() => patientId ? db.medicalRecords.where('customerId').equals(patientId).filter(r => !r.isArchived).toArray() : [], [patientId]) || [];
    const medicalRecords = encryptedRecords.map(r => ({
        ...r,
        diagnosis: decryptSync(r.diagnosis || ''),
        prescription: decryptSync(r.prescription || ''),
        medicalHistory: decryptSync(r.medicalHistory || ''),
        labTests: decryptSync(r.labTests || ''),
        imaging: decryptSync(r.imaging || '')
    }));

    const doctors = useLiveQuery(() => db.doctors.toArray(), []) || [];
    const inventory = useLiveQuery(() => db.clinicInventoryItems.toArray(), []) || [];

    const [activeTab, setActiveTab] = useState<'history' | 'add_record' | 'archive'>('history');
    
    // New Record form
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [doctorId, setDoctorId] = useState<number | ''>('');
    const [diagnosis, setDiagnosis] = useState('');
    const [prescription, setPrescription] = useState('');
    const [medicalHistory, setMedicalHistory] = useState('');
    const [labTests, setLabTests] = useState('');
    const [imaging, setImaging] = useState('');
    const [icd10Code, setIcd10Code] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [consumedItems, setConsumedItems] = useState<{itemId: number, quantity: number}[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [drugInteractionWarning, setDrugInteractionWarning] = useState<string | null>(null);
    const [overrideWarning, setOverrideWarning] = useState(false);
    const [overrideReason, setOverrideReason] = useState('');
    const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
    const [simulatedRole, setSimulatedRole] = useState<'doctor' | 'nurse' | 'admin'>('doctor');
    const [suggestedProtocol, setSuggestedProtocol] = useState<any>(null);

    const bmi = (height && weight) ? (Number(weight) / Math.pow(Number(height)/100, 2)).toFixed(1) : '';

    const icd10Database = [
        { code: 'J00', name: 'التهاب البلعوم الأنفي الحاد (الزكام)' },
        { code: 'H04.1', name: 'اضطرابات وتغيرات الغدة الدمعية (جفاف العين)' },
        { code: 'K02', name: 'تسوس الأسنان' },
        { code: 'A09', name: 'إسهال والتهاب معدي معوي' },
        { code: 'I10', name: 'ارتفاع ضغط الدم الأساسي' },
        { code: 'E11', name: 'مرض السكري من النوع 2' },
        { code: 'J45', name: 'الربو' }
    ];

    // Templates & Protocols
    const clinicalTemplates = [
        {
            id: 'general_1',
            name: 'كشف عام (نزلة برد)',
            icd10Pattern: 'J00',
            diagnosis: 'نزلة برد والتهاب في الحلق، مع ارتفاع طفيف في درجات الحرارة.',
            prescription: '1. خافض حرارة (Paracetamol) 500mg - كل 8 ساعات\n2. فيتامين سي - قرص يومياً',
            medicalHistory: 'حرارة ورشح لمدة يومين.',
            labTests: '',
            imaging: ''
        },
        {
            id: 'ophtha_1',
            name: 'كشف رمد (جفاف العين)',
            icd10Pattern: 'H04.1',
            diagnosis: 'جفاف في العين مع احمرار طفيف بسبب الإجهاد البصري.',
            prescription: '1. قطرات مرطبة (Tears Naturale) - قطرة كل 4 ساعات\n2. مرهم للعين قبل النوم (Tobradex)',
            medicalHistory: 'استخدام للأجهزة الذكية لفترات طويلة.',
            labTests: '',
            imaging: ''
        },
        {
            id: 'dental_1',
            name: 'أسنـان (تسوس وحشو)',
            icd10Pattern: 'K02',
            diagnosis: 'تسوس في الضرس المولي الأيمن السفلي، تم تنظيف التسوس وعمل حشو ضوئي.',
            prescription: '1. مسكن (Ibuprofen) 400mg - عند اللزوم',
            medicalHistory: 'ألم عند مضغ الطعام البارد/الساخن.',
            labTests: '',
            imaging: 'أشعة بانوراما للفك (X-Ray Panorama)'
        },
        {
            id: 'htn_1',
            name: 'بروتوكول ضغط الدم المرتفع',
            icd10Pattern: 'I10',
            diagnosis: 'ارتفاع ضغط الدم الأساسي، غير مسيطر عليه.',
            prescription: '1. Amlodipine 5mg - مرة يومياً مساءً\n2. نظام غذائي قليل الصوديوم',
            medicalHistory: 'صداع متكرر، دوخة خفيفة.',
            labTests: 'صورة دم كاملة (CBC)\nوظائف كلى وتخطيط قلب (ECG)',
            imaging: ''
        },
        {
            id: 'dm_type2',
            name: 'بروتوكول السكري (النوع 2)',
            icd10Pattern: 'E11',
            diagnosis: 'مرض السكري من النوع الثاني.',
            prescription: '1. Metformin 500mg - مرة يومياً مع العشاء\n2. Gliclazide 30mg - مرة قبل الإفطار',
            medicalHistory: 'كثرة التبول والشعور بالعطش.',
            labTests: 'HbA1c (مخزون السكر)\nوظائف كلى (Creatinine)\nتحليل بول كامل',
            imaging: 'فحص قاع العين الشامل'
        }
    ];

    const commonDrugs = [
        { name: 'Paracetamol', dose: '500mg كل 8 ساعات', interactsWith: [] },
        { name: 'Amoxicillin', dose: '500mg كل 12 ساعة لمدة 5 أيام', interactsWith: [] },
        { name: 'Ibuprofen', dose: '400mg عند اللزوم بعد الأكل', interactsWith: ['Aspirin'] },
        { name: 'Aspirin', dose: '75mg قرص واحد يوميا', interactsWith: ['Ibuprofen'] },
        { name: 'Tears Naturale', dose: 'قطرة بالعين المصابة كل 4 ساعات', interactsWith: [] },
        { name: 'Vitamin C', dose: 'قرص فوار مرة يومياً', interactsWith: [] },
        { name: 'Tobradex', dose: 'نقطة واحدة 3 مرات يوميا', interactsWith: [] }
    ];

    const applyTemplate = (tplId: string) => {
        const tpl = clinicalTemplates.find(t => t.id === tplId);
        if (tpl) {
            setDiagnosis(tpl.diagnosis);
            setPrescription(tpl.prescription);
            setMedicalHistory(tpl.medicalHistory);
            setLabTests(tpl.labTests);
            setImaging(tpl.imaging);
        }
    };

    const runChecks = (currentPrescription: string) => {
        const historicalPrescriptionsText = medicalRecords.map(r => r.prescription).join('\n');
        const interactionWarnings = DrugService.checkInteractions(currentPrescription, historicalPrescriptionsText);
        const allergyWarnings = DrugService.checkAllergies(currentPrescription, (patient?.allergies || []).join(', '));
        
        const allWarnings = [...allergyWarnings, ...interactionWarnings];
        const newWarning = allWarnings.length > 0 ? allWarnings.join(' | ') : null;
        if(drugInteractionWarning !== newWarning) {
             setOverrideWarning(false);
             setOverrideReason('');
        }
        setDrugInteractionWarning(newWarning);
    };

    const addDrugToPrescription = (drugName: string, dose: string) => {
        const newLine = `${drugName} - ${dose}`;
        const newPrescription = prescription ? prescription + '\n' + newLine : newLine;
        setPrescription(newPrescription);
        runChecks(newPrescription);
    };

    const checkInteractions = (text: string) => {
        setPrescription(text);
        runChecks(text);
    };

    const handleSaveRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientId || !doctorId || !diagnosis) return;

        if (drugInteractionWarning && !overrideWarning) {
            alert('يوجد تحذير دوائي أو حساسية. يجب تأكيد الصرف وتوضيح السبب قبل الحفظ.');
            return;
        }
        if (overrideWarning && !overrideReason.trim()) {
            alert('يجب كتابة سبب التجاوز لاعتماد الروشتة.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingRecordId) {
                await db.transaction('rw', db.medicalRecords, async () => {
                    const oldRecord = await db.medicalRecords.get(editingRecordId);
                    if (!oldRecord) return;
                    if (oldRecord.version !== undefined && (window as any)._editingVersion !== undefined && oldRecord.version !== (window as any)._editingVersion) {
                        throw new Error("ConcurrencyError: لقد تم تعديل هذا السجل من قبل مستخدم آخر في نفس الوقت. يرجى تحديث الصفحة والمحاولة مرة أخرى.");
                    }
                    const auditTrail = oldRecord.auditTrail || [];
                    auditTrail.push({
                        date: new Date().toISOString(),
                        action: "تعديل",
                        previousDiagnosis: oldRecord.diagnosis,
                        previousPrescription: oldRecord.prescription,
                        updatedBy: 'مستخدم (بناءً على الصلاحيات)' // Should be real user
                    });

                    // Immutable Audit Log (Snapshotting) logic
                    // We DO NOT update. We create a new snapshot and mark the old one as archived.
                    const newMedicalRecordId = await db.medicalRecords.add({
                        customerId: patientId,
                        doctorId: Number(doctorId),
                        date: new Date(date),
                        diagnosis: encryptSync(diagnosis),
                        prescription: encryptSync(prescription),
                        medicalHistory: encryptSync(medicalHistory),
                        labTests: encryptSync(labTests),
                        imaging: encryptSync(imaging),
                        icd10Code,
                        height: Number(height) || undefined,
                        weight: Number(weight) || undefined,
                        bmi: Number(bmi) || undefined,
                        drugWarningOverride: overrideWarning ? { reason: overrideReason, warning: drugInteractionWarning, timestamp: new Date().toISOString() } : undefined,
                        auditTrail: [],
                        version: (oldRecord.version || 1) + 1
                    });
                    
                    await db.medicalRecords.update(editingRecordId, {
                        isArchived: true,
                        supersededByRecordId: newMedicalRecordId
                    });
                    
                    await db.auditLogs.add({
                        userId: 1, // replace with actual generic auth
                        action: 'UPDATE_MEDICAL_RECORD',
                        module: 'Clinic Medical Records',
                        timestamp: new Date().toISOString(),
                        details: `تعديل ملف طبي للمريض ${patientId}`,
                        oldValue: oldRecord,
                        newValue: { diagnosis, prescription, medicalHistory, labTests, imaging, icd10Code }
                    });
                });
            } else {
                await db.medicalRecords.add({
                    customerId: patientId,
                    doctorId: Number(doctorId),
                    date: new Date(date),
                    diagnosis: encryptSync(diagnosis),
                    prescription: encryptSync(prescription),
                    medicalHistory: encryptSync(medicalHistory),
                    labTests: encryptSync(labTests),
                    imaging: encryptSync(imaging),
                    icd10Code,
                    height: Number(height) || undefined,
                    weight: Number(weight) || undefined,
                    bmi: Number(bmi) || undefined,
                    drugWarningOverride: overrideWarning ? { reason: overrideReason, warning: drugInteractionWarning, timestamp: new Date().toISOString() } : undefined,
                    auditTrail: [],
                    version: 1
                });
            }

        // Deduct consumed items from inventory
        if (consumedItems.length > 0) {
            for (const item of consumedItems) {
                const invItem = await db.clinicInventoryItems.get(item.itemId);
                if (invItem) {
                    // 5% Wastage Logic (Indirect Inventory Consumption)
                    const wastagePercentage = 5; 
                    const wastageQty = item.quantity * (wastagePercentage / 100);
                    const totalDeductionQty = item.quantity + wastageQty;

                    let qtyToDeduct = totalDeductionQty;
                    let updatedBatches = invItem.batches ? [...invItem.batches] : [];
                    
                    // Priority to FEFO (First Expired, First Out) for batches
                    if (updatedBatches.length > 0) {
                        updatedBatches.sort((a,b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
                        for (let i = 0; i < updatedBatches.length; i++) {
                            if (qtyToDeduct <= 0) break;
                            const b = updatedBatches[i];
                            if (b.quantity >= qtyToDeduct) {
                                b.quantity -= qtyToDeduct;
                                qtyToDeduct = 0;
                            } else {
                                qtyToDeduct -= b.quantity;
                                b.quantity = 0;
                            }
                        }
                        // Remove empty batches
                        updatedBatches = updatedBatches.filter(b => b.quantity > 0);
                    }
                    
                    const newTotal = updatedBatches.length > 0 
                                    ? updatedBatches.reduce((a, b) => a + b.quantity, 0)
                                    : Math.max(0, Number(invItem.stockAmount) - totalDeductionQty);

                    const newExpiry = updatedBatches.length > 0 
                                    ? updatedBatches[0].expiryDate 
                                    : invItem.expiryDate;

                    await db.clinicInventoryItems.update(item.itemId, {
                        stockAmount: newTotal,
                        batches: updatedBatches,
                        expiryDate: newExpiry
                    });

                    // Log the consumption with wastage
                    await db.auditLogs.add({
                        userId: 1, 
                        action: 'INVENTORY_CONSUMPTION',
                        module: 'Clinic',
                        timestamp: new Date().toISOString(),
                        details: `تم خصم ${totalDeductionQty.toFixed(2)} وحدة من ${invItem.itemName} بمنطق FEFO. (يتضمن ${wastageQty.toFixed(2)} هالك طبيعي بنسبة ${wastagePercentage}%)`
                    });

                    // Auto-Reordering (SCM)
                    if (newTotal <= (Number(invItem.minStockLevel) || 0) && newTotal + totalDeductionQty > (Number(invItem.minStockLevel) || 0)) {
                        await db.purchaseOrders.add({
                            date: new Date(),
                            supplierId: 0,
                            supplierName: 'مورد غير محدد (Auto-Reorder)',
                            items: [
                                {
                                    productId: item.itemId,
                                    productName: invItem.itemName,
                                    quantity: Number(invItem.minStockLevel) * 2 || 10,
                                    costPrice: 0,
                                    total: 0
                                }
                            ],
                            subtotal: 0,
                            taxAmount: 0,
                            discountAmount: 0,
                            totalAmount: 0,
                            status: 'draft',
                            notes: 'تم الإنشاء تلقائياً بواسطة نظام Clinic SCM بسبب وصول المخزون للحد الأدنى.',
                            createdBy: 'System (Auto-Reorder)'
                        });
                        
                        await db.auditLogs.add({
                            userId: 1,
                            action: 'AUTO_REORDER',
                            module: 'Clinic',
                            timestamp: new Date().toISOString(),
                            details: `تم إنشاء مسودة أمر شراء تلقائي للصنف ${invItem.itemName} لوصوله للحد الأدنى (${newTotal}).`
                        });
                    }
                }
            }
        }

            setDiagnosis('');
            setPrescription('');
            setMedicalHistory('');
            setLabTests('');
            setImaging('');
            setIcd10Code('');
            setHeight('');
            setWeight('');
            setConsumedItems([]);
            setEditingRecordId(null);
            setActiveTab('history');

            // Automatic workflow engine logic
            if (labTests.trim() || imaging.trim()) {
                const activeApp = await db.appointments
                    .filter(a => a.customerId === patientId && a.status === 'in_progress')
                    .first();
                if (activeApp && activeApp.id) {
                    await db.appointments.update(activeApp.id, { status: 'waiting_lab' });
                    // Optional: alert or UI toast via state would go here
                }
            } else {
                // if there are no lab tests, we can mark the appointment as completed?
                // we'll leave it to the reception to click complete, or we can do it here.
                const activeApp = await db.appointments
                    .filter(a => a.customerId === patientId && a.status === 'in_progress')
                    .first();
                if (activeApp && activeApp.id) {
                    await db.appointments.update(activeApp.id, { status: 'completed', actualEndTime: new Date().toISOString() });
                }
            }

        } catch (error: any) {
            console.error(error);
            if (error?.message?.includes('ConcurrencyError')) {
                alert(error.message); // Should ideally be UI toast
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditRecord = (record: any) => {
        setEditingRecordId(record.id);
        (window as any)._editingVersion = record.version || 1;
        setDate(new Date(record.date).toISOString().split('T')[0]);
        setDoctorId(record.doctorId);
        setDiagnosis(record.diagnosis || '');
        setPrescription(record.prescription || '');
        setMedicalHistory(record.medicalHistory || '');
        setLabTests(record.labTests || '');
        setImaging(record.imaging || '');
        setIcd10Code(record.icd10Code || '');
        setHeight(record.height?.toString() || '');
        setWeight(record.weight?.toString() || '');
        setActiveTab('add_record');
    };

    const calculateAge = (birthDate: string | undefined) => {
        if (!birthDate) return 'غير محدد';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return `${age} سنة`;
    };

    const isRecordFrozen = (recordDate: string | Date) => {
        // Record is frozen if older than 24 hours
        // Since we only have date usually like YYYY-MM-DD, let's compare with yesterday
        const rDate = new Date(recordDate);
        const now = new Date();
        const diffHours = (now.getTime() - rDate.getTime()) / (1000 * 60 * 60);
        return diffHours > 24;
    };

    if (!isOpen || !patient) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
                >
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{patient.name}</h2>
                                <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-3">
                                    <span dir="ltr">{patient.phone}</span>
                                    {patient.birthDate && (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            <span>العمر: {calculateAge(patient.birthDate)}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-2">
                                <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider">RBAC Role</span>
                                <select 
                                    value={simulatedRole} 
                                    onChange={(e) => setSimulatedRole(e.target.value as any)}
                                    className="text-xs font-bold text-amber-900 bg-transparent border-none outline-none focus:ring-0 cursor-pointer"
                                    title="محاكاة الصلاحيات"
                                >
                                    <option value="doctor">طبيب معالج (D)</option>
                                    <option value="nurse">ممرضة مختبر (L)</option>
                                    <option value="admin">مدير تقني (A)</option>
                                </select>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                     <div className="flex border-b border-slate-200 shrink-0">
                         <button 
                             className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 flex items-center justify-center gap-2 ${activeTab === 'history' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                             onClick={() => setActiveTab('history')}
                         >
                             <FileText className="w-4 h-4" /> السجل الطبي والمواعيد
                         </button>
                         {simulatedRole !== 'nurse' && (
                             <button 
                                 className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 flex items-center justify-center gap-2 ${activeTab === 'add_record' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                 onClick={() => setActiveTab('add_record')}
                             >
                                 <Plus className="w-4 h-4" /> إضافة تشخيص
                             </button>
                         )}
                         <button 
                             className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 flex items-center justify-center gap-2 ${activeTab === 'archive' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                             onClick={() => setActiveTab('archive')}
                         >
                             <FileSearch className="w-4 h-4" /> الأرشيف الرقمي
                         </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                        {activeTab === 'history' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-brand-500" />
                                        المواعيد السابقة
                                    </h3>
                                    {appointments.length === 0 ? (
                                        <div className="bg-white rounded-xl p-6 text-center border border-slate-200">
                                            <p className="text-slate-500 font-bold">لم يسجل أي مواعيد.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {appointments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(app => {
                                                const doctor = doctors.find(d => d.id === app.doctorId);
                                                return (
                                                    <div key={app.id} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-800">{app.date} • {app.time}</span>
                                                            <span className="text-sm text-slate-500">الطبيب: د. {doctor?.name || '-'}</span>
                                                        </div>
                                                        <div className="bg-slate-100 px-3 py-1 rounded-lg text-sm font-bold text-slate-600">
                                                            {app.status === 'completed' ? 'تم الكشف' : app.status === 'scheduled' ? 'في الانتظار' : app.status}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Stethoscope className="w-5 h-5 text-emerald-500" />
                                        التشخيصات السابقة (الروشتة)
                                    </h3>
                                    {medicalRecords.length === 0 ? (
                                        <div className="bg-white rounded-xl p-6 text-center border border-slate-200">
                                            <p className="text-slate-500 font-bold">لا يوجد تشخيصات سابقة.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {medicalRecords.map(record => {
                                                const doctor = doctors.find(d => d.id === record.doctorId);
                                                const isFrozen = isRecordFrozen(record.date);
                                                const canEdit = !isFrozen || simulatedRole === 'admin';
                                                
                                                return (
                                                    <div key={record.id} className="bg-white border border-slate-200 p-5 rounded-2xl relative overflow-hidden">
                                                        {isFrozen && (
                                                            <div className="absolute top-0 right-0 left-0 bg-slate-100 border-b border-slate-200 px-4 py-1.5 flex justify-center items-center gap-2">
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">سجل مغلق (Data Freezing)</span>
                                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                                <span className="text-xs font-medium text-slate-600">هذا السجل مر عليه أكثر من 24 ساعة ومقفل ضد التعديل. يتطلب صلاحية مدير.</span>
                                                            </div>
                                                        )}
                                                        <div className={`flex justify-between items-center mb-3 ${isFrozen ? 'mt-6' : ''}`}>
                                                            <div className="font-bold text-slate-700 flex items-center gap-2">
                                                                 <Calendar className="w-4 h-4" /> {new Date(record.date).toLocaleDateString('ar-EG')}
                                                            </div>
                                                            <div className="text-sm text-slate-500 font-bold">
                                                                 د. {doctor?.name || '-'}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {simulatedRole === 'nurse' ? (
                                                                // Nurse View (Lab Only)
                                                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                                                     <div className="flex items-center gap-2 text-amber-800 font-bold mb-2">
                                                                         <AlertTriangle className="w-4 h-4" />
                                                                         صلاحية محدودة (ممرضة مختبر)
                                                                     </div>
                                                                     <p className="text-sm text-amber-700 mb-4">بناءً على الصلاحيات، يمكنك فقط رؤية طلبات التحاليل والأشعة. التشخيص والتاريخ الطبي محجوب (RBAC).</p>
                                                                     {record.labTests || record.imaging ? (
                                                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                             {record.labTests && (
                                                                                  <div>
                                                                                      <h4 className="text-sm text-slate-500 font-bold mb-1 flex items-center gap-1"><Activity className="w-4 h-4"/> التحاليل المطلوبة</h4>
                                                                                      <p className="text-slate-800 bg-white p-3 rounded-xl whitespace-pre-wrap">{record.labTests}</p>
                                                                                  </div>
                                                                             )}
                                                                             {record.imaging && (
                                                                                  <div>
                                                                                      <h4 className="text-sm text-slate-500 font-bold mb-1 flex items-center gap-1"><FileSearch className="w-4 h-4"/> الأشعة المطلوبة</h4>
                                                                                      <p className="text-slate-800 bg-white p-3 rounded-xl whitespace-pre-wrap">{record.imaging}</p>
                                                                                  </div>
                                                                             )}
                                                                         </div>
                                                                     ) : (
                                                                         <p className="text-sm text-slate-500">لا يوجد طلبات تحاليل أو أشعة في هذه الزيارة.</p>
                                                                     )}
                                                                </div>
                                                            ) : (
                                                                // Doctor / Admin View (Full Access)
                                                                <>
                                                                    <div>
                                                                        <h4 className="text-sm text-slate-500 font-bold mb-1">التشخيص</h4>
                                                                        <p className="text-slate-800 bg-slate-50 p-3 rounded-xl">{record.diagnosis}</p>
                                                                    </div>
                                                                    {record.medicalHistory && (
                                                                        <div>
                                                                            <h4 className="text-sm text-slate-500 font-bold mb-1 flex items-center gap-1"><History className="w-4 h-4"/> التاريخ المرضي والأعراض</h4>
                                                                            <p className="text-slate-800 bg-slate-50 p-3 rounded-xl whitespace-pre-wrap">{record.medicalHistory}</p>
                                                                        </div>
                                                                    )}
                                                                    {record.prescription && (
                                                                        <div>
                                                                            <h4 className="text-sm text-slate-500 font-bold mb-1 flex items-center gap-1"><FileText className="w-4 h-4"/> الوصفة الطبية (الأدوية)</h4>
                                                                            <p className="text-slate-800 bg-slate-50 p-3 rounded-xl whitespace-pre-wrap">{record.prescription}</p>
                                                                        </div>
                                                                    )}
                                                                    {(record.labTests || record.imaging) && (
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            {record.labTests && (
                                                                                 <div>
                                                                                     <h4 className="text-sm text-slate-500 font-bold mb-1 flex items-center gap-1"><Activity className="w-4 h-4"/> التحاليل المطلوبة</h4>
                                                                                     <p className="text-slate-800 bg-slate-50 p-3 rounded-xl whitespace-pre-wrap">{record.labTests}</p>
                                                                                 </div>
                                                                            )}
                                                                            {record.imaging && (
                                                                                 <div>
                                                                                     <h4 className="text-sm text-slate-500 font-bold mb-1 flex items-center gap-1"><FileSearch className="w-4 h-4"/> الأشعة المطلوبة</h4>
                                                                                     <p className="text-slate-800 bg-slate-50 p-3 rounded-xl whitespace-pre-wrap">{record.imaging}</p>
                                                                                 </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                            
                                                            <div className="flex justify-between items-center pt-2">
                                                                <div className="flex gap-2">
                                                                    {simulatedRole !== 'nurse' && record.auditTrail && record.auditTrail.length > 0 && (
                                                                        <div className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg flex items-center gap-1 border border-amber-100">
                                                                            <History className="w-4 h-4" /> تم تعديله ({record.auditTrail.length} مرة)
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex justify-end gap-2">
                                                                    {simulatedRole !== 'nurse' && (
                                                                        <button 
                                                                            onClick={() => handleEditRecord(record)} 
                                                                            disabled={!canEdit}
                                                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                                                                                canEdit ? 'text-slate-600 hover:text-slate-700 bg-slate-50 hover:bg-slate-100' : 'text-slate-400 bg-slate-50 cursor-not-allowed'
                                                                            }`}
                                                                        >
                                                                            تعديل {isFrozen && simulatedRole !== 'admin' ? '(مقفل)' : ''}
                                                                        </button>
                                                                    )}
                                                                    <button onClick={() => window.print()} className="text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                                                                        <Printer className="w-4 h-4" />
                                                                        طباعة الروشتة
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            {simulatedRole !== 'nurse' && record.auditTrail && record.auditTrail.length > 0 && (
                                                                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                                                                    <h5 className="text-xs font-bold text-slate-500 mb-2">تاريخ التعديلات (Audit Trail)</h5>
                                                                    {record.auditTrail.map((audit: any, idx: number) => (
                                                                        <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs">
                                                                            <div className="flex justify-between text-slate-500 font-bold mb-2">
                                                                                <span>بواسطة: {audit.updatedBy || 'مجهول'}</span>
                                                                                <span>{new Date(audit.date).toLocaleString('ar-EG')}</span>
                                                                            </div>
                                                                            <p className="text-slate-700 line-through opacity-70 mb-1"><span className="font-bold">التشخيص القديم:</span> {audit.previousDiagnosis}</p>
                                                                            {audit.previousPrescription && <p className="text-slate-700 line-through opacity-70"><span className="font-bold">الروشتة القديمة:</span> {audit.previousPrescription}</p>}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'add_record' && (
                            <div className="flex gap-6 h-full min-h-[500px]">
                                {/* Right Side: Form */}
                                <div className="flex-1 overflow-y-auto">
                                    <form onSubmit={handleSaveRecord} className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <div>
                                                <h3 className="font-bold text-slate-800">نماذج الكشف (Templates)</h3>
                                                <p className="text-xs text-slate-500">اختر نموذجاً لتعبئة التشخيص والأدوية تلقائياً</p>
                                            </div>
                                            <select 
                                                onChange={(e) => applyTemplate(e.target.value)}
                                                className="bg-white border border-slate-200 rounded-lg px-4 py-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                            >
                                                <option value="">-- اختر النموذج --</option>
                                                {clinicalTemplates.map(tpl => (
                                                    <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700">تاريخ الكشف</label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={date}
                                                    onChange={e => setDate(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700">الطبيب المعالج</label>
                                                <select
                                                    required
                                                    value={doctorId}
                                                    onChange={e => setDoctorId(e.target.value ? Number(e.target.value) : '')}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                                                >
                                                    <option value="">اختر الطبيب...</option>
                                                    {doctors.map(d => (
                                                        <option key={d.id} value={d.id}>د. {d.name} ({d.specialization})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-blue-800">الطول (سم)</label>
                                                    <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-blue-800">الوزن (كجم)</label>
                                                    <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-blue-800">مؤشر كتلة الجسم (BMI)</label>
                                                    <div className={`w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-bold text-center ${bmi ? (Number(bmi) > 25 ? 'text-rose-600' : 'text-emerald-600') : 'text-slate-400'}`}>
                                                        {bmi || '--'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-sm font-bold text-slate-700">التشخيص والتفاصيل *</label>
                                                    <select 
                                                        value={icd10Code} 
                                                        onChange={(e) => {
                                                            setIcd10Code(e.target.value);
                                                            const protocol = clinicalTemplates.find(t => t.icd10Pattern === e.target.value);
                                                            setSuggestedProtocol(protocol || null);
                                                        }}
                                                        className="text-xs bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-600 focus:outline-none focus:border-brand-500"
                                                    >
                                                        <option value="">+ كود ICD-10 (اختياري)</option>
                                                        {icd10Database.map(icd => (
                                                            <option key={icd.code} value={icd.code}>{icd.code} - {icd.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {suggestedProtocol && (
                                                    <div className="bg-brand-50 border border-brand-200 p-3 rounded-xl flex items-start gap-3 mt-2 shadow-sm relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-1 bg-brand-500 h-full"></div>
                                                        <Activity className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-black text-brand-800 mb-1">المساعد السريري (CDS)</h4>
                                                            <p className="text-xs text-brand-700 font-bold mb-2">يتوفر "بروتوكول علاجي قياسي" لهذا التشخيص بناءً على أحدث البروتوكولات الطبية.</p>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => {
                                                                    applyTemplate(suggestedProtocol.id);
                                                                    setSuggestedProtocol(null);
                                                                }}
                                                                className="text-xs bg-brand-600 text-white font-bold px-3 py-1.5 rounded-lg shadow-md hover:bg-brand-700 transition-colors"
                                                            >
                                                                تطبيق خطة العلاج المقترحة
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                <textarea
                                                    required
                                                    value={diagnosis}
                                                    onChange={e => setDiagnosis(e.target.value)}
                                                    rows={3}
                                                    placeholder="تفاصيل التشخيص الطبى..."
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none font-medium text-slate-800"
                                                ></textarea>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-sm font-bold text-slate-700">الروشتة الذكية (الأدوية)</label>
                                                    <select 
                                                        onChange={(e) => {
                                                            if (e.target.value) {
                                                                const drug = commonDrugs.find(d => d.name === e.target.value);
                                                                if (drug) addDrugToPrescription(drug.name, drug.dose);
                                                                e.target.value = "";
                                                            }
                                                        }}
                                                        className="text-xs bg-slate-100 border-none rounded-lg px-2 py-1 font-bold text-slate-600 focus:ring-0"
                                                    >
                                                        <option value="">+ إضافة دواء شائع (قاعدة بيانات)</option>
                                                        {commonDrugs.map(d => (
                                                            <option key={d.name} value={d.name}>{d.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <textarea
                                                    value={prescription}
                                                    onChange={e => checkInteractions(e.target.value)}
                                                    rows={4}
                                                    placeholder="أدخل الأدوية أو اختر من القائمة..."
                                                    className={`w-full bg-slate-50 border ${drugInteractionWarning ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-brand-500'} rounded-xl px-4 py-3 focus:outline-none focus:ring-2 resize-none font-medium leading-relaxed text-slate-800`}
                                                ></textarea>
                                                {drugInteractionWarning && (
                                                    <div className="flex flex-col gap-2 mt-2">
                                                        <div className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100 flex items-start gap-2">
                                                            <AlertTriangle className="w-5 h-5 shrink-0" />
                                                            <span className="leading-relaxed whitespace-pre-wrap">{drugInteractionWarning}</span>
                                                        </div>
                                                        <label className="flex items-center gap-2 cursor-pointer mt-1">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={overrideWarning} 
                                                                onChange={e => setOverrideWarning(e.target.checked)}
                                                                className="w-4 h-4 text-brand-600 rounded"
                                                            />
                                                            <span className="text-sm font-bold text-slate-700">تأكيد تجاوز التحذير بصلاحية الطبيب</span>
                                                        </label>
                                                        {overrideWarning && (
                                                            <textarea
                                                                value={overrideReason}
                                                                onChange={e => setOverrideReason(e.target.value)}
                                                                placeholder="اكتب سبب تجاوز التحذير الطبي (إلزامي)..."
                                                                className="w-full bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-yellow-400 text-sm font-medium text-slate-800"
                                                                rows={2}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-700">التاريخ المرضي <span className="text-slate-400 font-normal">(اختياري)</span></label>
                                                    <textarea value={medicalHistory} onChange={e => setMedicalHistory(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-brand-500 text-sm"></textarea>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-700">التحاليل <span className="text-slate-400 font-normal">(اختياري)</span></label>
                                                    <textarea value={labTests} onChange={e => setLabTests(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-brand-500 text-sm"></textarea>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="text-sm font-bold text-slate-700">المستلزمات الطبية المستهلكة (لخصمها من المخزن)</label>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setConsumedItems([...consumedItems, {itemId: 0, quantity: 1}])} 
                                                        className="text-xs bg-brand-100 text-brand-700 px-3 py-1 rounded-lg font-bold"
                                                    >+ إضافة مستلزم</button>
                                                </div>
                                                <p className="text-xs text-brand-600 mb-3 border-r-2 border-brand-500 pr-2 font-medium">
                                                    توجيه (Supply Chain): سيتم خصم الكميات آلياً من المخزن بناءً على تاريخ الصلاحية الأقرب (FEFO) الأول فالأول. سيتم تنبيه الإدارة آلياً إذا اقترب المخزون من حد إعادة الطلب.
                                                </p>
                                                {consumedItems.length > 0 && (
                                                    <div className="space-y-2">
                                                        {consumedItems.map((citem, i) => (
                                                            <div key={i} className="flex gap-2">
                                                                <select 
                                                                    value={citem.itemId} 
                                                                    onChange={(e) => setConsumedItems(consumedItems.map((c, idx) => idx === i ? { ...c, itemId: Number(e.target.value) } : c))} 
                                                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                                                                >
                                                                    <option value={0}>اختر الصنف...</option>
                                                                    {inventory.map((inv: any) => (
                                                                        <option key={inv.id} value={inv.id}>{inv.itemName} (المتاح: {inv.stockAmount})</option>
                                                                    ))}
                                                                </select>
                                                                <input 
                                                                    type="number" 
                                                                    min="1" 
                                                                    value={citem.quantity} 
                                                                    onChange={(e) => setConsumedItems(consumedItems.map((c, idx) => idx === i ? { ...c, quantity: Number(e.target.value) } : c))} 
                                                                    className="w-20 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-brand-500" 
                                                                />
                                                                <button type="button" onClick={() => setConsumedItems(consumedItems.filter((_, idx) => idx !== i))} className="p-2 text-rose-500 bg-rose-50 rounded-lg">
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-4">
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="px-8 py-3 rounded-xl font-bold bg-brand-600 text-white hover:bg-brand-700 transition-all shadow-lg hover:shadow-xl shadow-brand-500/30 flex items-center gap-2 w-full justify-center md:w-auto md:justify-end"
                                            >
                                                <Plus className="w-5 h-5" />
                                                حفظ التشخيص
                                            </button>
                                        </div>
                                    </form>
                                </div>
                                
                                {/* Left Side: History Panel (Comparison) */}
                                <div className="hidden lg:block w-80 shrink-0 bg-slate-100 rounded-2xl border border-slate-200 p-4 overflow-y-auto">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-200 pb-3">
                                        <History className="w-4 h-4 text-slate-500" />
                                        سجل التشخيصات السابقة
                                    </h3>
                                    {medicalRecords.length === 0 ? (
                                        <p className="text-sm text-slate-500 text-center py-8">لا يوجد سجلات سابقة للمقارنة.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {medicalRecords.map(record => (
                                                <div key={record.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-sm">
                                                    <div className="font-bold text-slate-700 mb-1 flex justify-between">
                                                        <span>{new Date(record.date).toLocaleDateString('ar-EG')}</span>
                                                        <span className="text-xs text-slate-500">د. {doctors.find(d => d.id === record.doctorId)?.name}</span>
                                                    </div>
                                                    <div className="text-slate-800 bg-slate-50 p-2 rounded-lg mb-2 line-clamp-3">
                                                        {record.diagnosis}
                                                    </div>
                                                    {record.prescription && (
                                                        <div className="text-xs text-slate-600 font-medium">
                                                            <span className="font-bold text-slate-500">الأدوية: </span>
                                                            <span className="line-clamp-2">{record.prescription}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'archive' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <FileSearch className="w-5 h-5 text-brand-500" />
                                        الأرشيف الرقمي (صور ومستندات)
                                    </h3>
                                    <label className="bg-brand-50 text-brand-600 hover:bg-brand-100 px-4 py-2 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-colors">
                                        <Upload className="w-4 h-4" /> رفع مستند
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*,.pdf" 
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file || !patientId) return;
                                                
                                                const reader = new FileReader();
                                                reader.onload = async (event) => {
                                                    const base64 = event.target?.result as string;
                                                    const docs = patient.documents || [];
                                                    await db.customers.update(patientId, { documents: [...docs, base64] });
                                                };
                                                reader.readAsDataURL(file);
                                            }} 
                                        />
                                    </label>
                                </div>
                                
                                {(!patient.documents || patient.documents.length === 0) ? (
                                    <div className="bg-white rounded-xl p-12 text-center border border-slate-200 border-dashed flex flex-col items-center justify-center">
                                         <ImageIcon className="w-12 h-12 text-slate-300 mb-4" />
                                         <p className="text-slate-500 font-bold mb-2">لا توجد ملفات مرفوعة</p>
                                         <p className="text-sm text-slate-400">يمكنك رفع صور الروشتات السابقة، التحاليل، أو الهوية.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {patient.documents.map((doc: string, idx: number) => (
                                            <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-square flex items-center justify-center bg-slate-50">
                                                {doc.startsWith('data:image') ? (
                                                    <img src={doc} alt={`Document ${idx}`} className="w-full h-full object-cover" />
                                                ) : (
                                                    <FileText className="w-12 h-12 text-slate-300" />
                                                )}
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                                    <button onClick={() => window.open(doc)} className="bg-white text-slate-800 p-2 rounded-lg font-bold text-sm">عرض</button>
                                                    <button onClick={async () => {
                                                        if (confirm('هل أنت متأكد من حذف هذا المستند؟')) {
                                                            const newDocs = patient.documents!.filter((_, i) => i !== idx);
                                                            await db.customers.update(patientId, { documents: newDocs });
                                                        }
                                                    }} className="bg-rose-500 text-white p-2 rounded-lg font-bold text-sm">حذف</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
