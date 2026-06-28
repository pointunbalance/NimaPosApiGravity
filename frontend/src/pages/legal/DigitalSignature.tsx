import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { PenTool, FileText, CheckCircle, ShieldCheck, Download, Activity, Key } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { Document as AppDocument } from '../../types';
import { useToast } from '../../context/ToastContext';

export const DigitalSignature: React.FC = () => {
    const { success, error, warning } = useToast();
    const documents = useLiveQuery(() => db.documents?.filter(d => !d.isArchived).toArray() || []) || [];
    const [selectedDocId, setSelectedDocId] = useState<number | ''>('');
    const [signaturePad, setSignaturePad] = useState<SignatureCanvas | null>(null);
    const [isSigning, setIsSigning] = useState(false);
    
    // Auth context
    let currentUserId = 1;
    let currentUserName = 'مدير النظام';
    try {
        const userStr = localStorage.getItem('nima_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            currentUserId = user.id;
            currentUserName = user.name;
        }
    } catch(e) {}

    const handleSign = async () => {
        if (!signaturePad || signaturePad.isEmpty()) {
            warning('يرجى التوقيع في المربع المخصص');
            return;
        }

        if (!selectedDocId) {
            warning('يرجى اختيار وثيقة للتوقيع');
            return;
        }

        setIsSigning(true);
        const signatureHash = signaturePad.toDataURL();

        try {
            const doc = documents.find(d => d.id === Number(selectedDocId));
            if (doc) {
                const newSig = {
                    signedBy: currentUserId,
                    timestamp: new Date(),
                    hash: 'SIM-SIG-' + Math.random().toString(36).substr(2, 9).toUpperCase() // simulated hash/encryption
                };
                
                const updatedSigs = [...(doc.digitalSignature || []), newSig];
                
                await db.documents?.update(doc.id!, {
                    digitalSignature: updatedSigs
                });

                await db.auditLogs.add({
                    userId: currentUserName,
                    userName: currentUserName,
                    action: 'update',
                    module: 'legal',
                    details: `تم توقيع الوثيقة (${doc.name}) إلكترونياً بختم زمني.`,
                    timestamp: new Date().toISOString()
                });

                success('تم اعتماد وتوقيع الوثيقة بنجاح');
                signaturePad.clear();
                setSelectedDocId('');
            }
        } catch(e) {
            console.error(e);
            error('حدث خطأ أثناء التوقيع');
        } finally {
            setIsSigning(false);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto animate-in fade-in duration-500 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl shadow-sm border border-indigo-200">
                            <PenTool className="w-8 h-8" />
                        </div>
                        نظام التوقيع الإلكتروني (Digital Signature)
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">اعتماد الوثائق بشكل رسمي، قانوني ومشفر.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                            <FileText className="text-indigo-500 w-5 h-5" />
                            اختيار الوثيقة
                        </h2>
                        
                        <select 
                            value={selectedDocId} 
                            onChange={(e) => setSelectedDocId(Number(e.target.value))}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none mb-4 bg-slate-50"
                        >
                            <option value="">-- اختر وثيقة للتوقيع --</option>
                            {documents.map(d => (
                                <option key={d.id} value={d.id}>{d.name} {d.version && `(إصدار ${d.version})`}</option>
                            ))}
                        </select>

                        {selectedDocId && (
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-4">
                                <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-amber-900 mb-1">إقرار وإلزام قانوني</h3>
                                    <p className="text-sm text-amber-700">توقيعك الإلكتروني هذا يعتبر ملزماً قانونياً ويعادل التوقيع اليدوي، سيتم ربطه بمعرف المستخدم الخاص بك وتوقيت الاعتماد الفعلي.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {selectedDocId && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
                             <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                                <PenTool className="text-indigo-500 w-5 h-5" />
                                لوحة التوقيع
                            </h2>
                            
                            <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 relative h-64 overflow-hidden mb-4">
                                <SignatureCanvas 
                                    ref={(ref) => setSignaturePad(ref)}
                                    penColor="black"
                                    canvasProps={{className: 'w-full h-full cursor-crosshair'}}
                                />
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <button 
                                    onClick={() => signaturePad?.clear()}
                                    className="text-slate-500 hover:text-rose-600 font-medium px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                                >
                                    مسح التوقيع
                                </button>
                                
                                <button
                                    onClick={handleSign}
                                    disabled={isSigning}
                                    className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-bold shadow-lg shadow-indigo-200/50 disabled:opacity-50"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    {isSigning ? 'جاري التشفير والاعتماد...' : 'اعتماد وتوقيع'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-sm border border-slate-700">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Key className="w-5 h-5 text-emerald-400" />
                            حالة الاعتمادات
                        </h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                                <span className="text-slate-400">وثائق موقّعة</span>
                                <span className="font-bold text-emerald-400">{documents.filter(d => d.digitalSignature && d.digitalSignature.length > 0).length}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                                <span className="text-slate-400">بانتظار توقيعي</span>
                                <span className="font-bold text-amber-400">0</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-500" />
                            سجل التواقيع الأخير
                        </h3>
                        
                        <div className="space-y-4">
                            {documents.filter(d => d.digitalSignature && d.digitalSignature.length > 0)
                                .slice(0, 5)
                                .map(d => (
                                <div key={d.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                                    <p className="font-medium text-sm text-slate-800 mb-1">{d.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                        تم التوقيع
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DigitalSignature;
