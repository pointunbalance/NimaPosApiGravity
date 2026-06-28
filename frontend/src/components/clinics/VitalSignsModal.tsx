import React, { useState } from 'react';
import { X, Activity } from 'lucide-react';
import { db } from '../../db';

interface VitalSignsModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointmentId: number;
    initialVitals?: any;
    onSuccess?: () => void;
}

export function VitalSignsModal({ isOpen, onClose, appointmentId, initialVitals, onSuccess }: VitalSignsModalProps) {
    const [bp, setBp] = useState(initialVitals?.bloodPressure || '');
    const [hr, setHr] = useState(initialVitals?.heartRate || '');
    const [temp, setTemp] = useState(initialVitals?.temperature || '');
    const [notes, setNotes] = useState(initialVitals?.notes || '');
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setSaving(true);
        try {
            // Check if high risk
            let isHighRisk = false;
            if (bp) {
                const parts = bp.split('/');
                if (parts.length === 2) {
                    const systolic = parseInt(parts[0]);
                    const diastolic = parseInt(parts[1]);
                    if (systolic >= 140 || diastolic >= 90) {
                        isHighRisk = true;
                    }
                }
            }
            if (temp) {
                if (parseFloat(temp) >= 38.5) isHighRisk = true;
            }

            await db.appointments.update(appointmentId, {
                vitals: {
                    bloodPressure: bp,
                    heartRate: hr,
                    temperature: temp,
                    notes,
                    isHighRisk
                }
            });
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                        <Activity className="w-6 h-6 text-rose-500" />
                        المؤشرات الحيوية
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">ضغط الدم</label>
                        <input 
                            type="text" 
                            placeholder="مثال: 120/80" 
                            value={bp} 
                            onChange={e => setBp(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">معدل نبضات القلب</label>
                        <input 
                            type="number" 
                            placeholder="bpm" 
                            value={hr} 
                            onChange={e => setHr(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">درجة الحرارة</label>
                        <input 
                            type="number" 
                            step="0.1"
                            placeholder="°C" 
                            value={temp} 
                            onChange={e => setTemp(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">ملاحظات التمريض</label>
                        <textarea 
                            rows={3}
                            value={notes} 
                            onChange={e => setNotes(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                    <button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl transition-all"
                    >
                        حفظ المؤشرات
                    </button>
                    <button 
                        onClick={onClose} 
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        </div>
    );
}
