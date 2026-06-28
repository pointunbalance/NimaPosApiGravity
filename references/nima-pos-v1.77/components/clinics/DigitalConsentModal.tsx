import React, { useRef, useState } from 'react';
import { X, FileSignature, Upload } from 'lucide-react';
import { db } from '../../db';

interface DigitalConsentModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointmentId: number;
    onSuccess: () => void;
}

export const DigitalConsentModal: React.FC<DigitalConsentModalProps> = ({
    isOpen,
    onClose,
    appointmentId,
    onSuccess
}) => {
    const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

    // Simulated file upload or signing
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setSignaturePreview(ev.target?.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSave = async () => {
        if (!signaturePreview) {
            alert('يجب رفع أو توقيع نموذج الموافقة قبل الاستمرار');
            return;
        }
        try {
            await db.appointments.update(appointmentId, {
                consentFile: signaturePreview
            });
            await db.auditLogs.add({
                userId: 1, // demo user
                action: 'UPLOAD_CONSENT',
                module: 'Digital Consent',
                timestamp: new Date().toISOString(),
                details: `تم رفع نموذج الموافقة المستنيرة للموعد ${appointmentId}`
            });
            onSuccess();
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء حفظ الموافقة');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <FileSignature className="w-5 h-5 text-indigo-600" />
                        إقرار الموافقة المستنيرة (Digital Consent)
                    </h3>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm font-bold">
                        تنبيه طبي وقانوني: يُمنع بدء أو تسجيل الإجراءات عالية الخطورة (العمليات) قبل الحصول على إقرار مسجل من المريض.
                    </div>

                    <label className="block border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
                        <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-700">اضغط لرفع صورة الإقرار المُوقّع</p>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG, PDF</p>
                    </label>

                    {signaturePreview && (
                        <div className="mt-4 border border-emerald-200 bg-emerald-50 p-4 rounded-xl flex items-center gap-4">
                            {signaturePreview.startsWith('data:image') ? (
                                <img src={signaturePreview} alt="Signature Preview" className="w-16 h-16 object-cover rounded-lg border border-emerald-100" />
                            ) : (
                                <div className="w-16 h-16 bg-white border border-emerald-100 rounded-lg flex items-center justify-center">
                                    <FileSignature className="w-8 h-8 text-emerald-600" />
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-emerald-800">تم إرفاق المستند بنجاح</p>
                                <p className="text-xs text-emerald-600">جاهز للتشفير والحفظ</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition-colors">
                        إلغاء
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-200"
                    >
                        حفظ ومتابعة الإجراء
                    </button>
                </div>
            </div>
        </div>
    );
};
