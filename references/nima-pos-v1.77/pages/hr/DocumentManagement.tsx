import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { format, differenceInDays } from 'date-fns';
import { AlertTriangle, Clock, FileText, CheckCircle2, Search, Edit2, X, Save } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const DocumentManagement: React.FC = () => {
    const { showToast } = useToast();
    const users = useLiveQuery(() => db.users.toArray()) || [];
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [newEndDate, setNewEndDate] = useState('');

    const documentStatus = useMemo(() => {
        return users.map(user => {
            const endDate = user.contractEndDate ? new Date(user.contractEndDate) : null;
            const daysToExpiry = endDate ? differenceInDays(endDate, new Date()) : null;
            
            let status = 'safe';
            if (daysToExpiry !== null) {
                if (daysToExpiry < 0) status = 'expired';
                else if (daysToExpiry <= 30) status = 'warning';
            }

            return {
                user,
                endDate,
                daysToExpiry,
                status
            };
        }).filter(item => 
            item.user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (item.user.jobTitle && item.user.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()))
        ).sort((a, b) => {
             if (a.daysToExpiry === null) return 1;
             if (b.daysToExpiry === null) return -1;
             return a.daysToExpiry - b.daysToExpiry;
        });
    }, [users, searchTerm]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'expired': return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'warning': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'safe': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const handleOpenEdit = (userId: number, currentEndDate: Date | null) => {
        setSelectedUserId(userId);
        setNewEndDate(currentEndDate ? format(currentEndDate, 'yyyy-MM-dd') : '');
        setIsEditModalOpen(true);
    };

    const handleSaveContract = async () => {
        if (selectedUserId && newEndDate) {
            try {
                await db.users.update(selectedUserId, {
                    contractEndDate: new Date(newEndDate)
                });
                showToast('تم تحديث تاريخ انتهاء العقد بنجاح', 'success');
                setIsEditModalOpen(false);
            } catch (error) {
                showToast('حدث خطأ أثناء التحديث', 'error');
            }
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">إدارة الوثائق والمنتهي صلاحيتها</h1>
                    <p className="text-slate-500 mt-1">تتبع تواريخ انتهاء العقود والوثائق الرسمية للموظفين وتجديدها</p>
                </div>
            </div>

            <div className="flex bg-white border border-slate-200 p-2 rounded-xl w-full max-w-md shadow-sm">
                <Search className="w-5 h-5 text-slate-400 mx-2 my-auto" />
                <input 
                    type="text" 
                    placeholder="البحث عن موظف..." 
                    className="w-full bg-transparent border-none outline-none p-2"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documentStatus.map(({ user, endDate, daysToExpiry, status }) => (
                    <div key={user.id} className={`p-5 rounded-2xl border bg-white shadow-sm flex flex-col gap-4 transition-all hover:shadow-md ${status === 'expired' ? 'ring-1 ring-rose-200 hover:shadow-rose-100' : ''}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${getStatusStyle(status)}`}>
                                    {user.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{user.name}</h3>
                                    <p className="text-sm text-slate-500">{user.jobTitle || 'موظف'}</p>
                                </div>
                            </div>
                            {status === 'expired' && <span title="منتهي الصلاحية"><AlertTriangle className="w-5 h-5 text-rose-500" /></span>}
                            {status === 'warning' && <span title="قرب الانتهاء"><Clock className="w-5 h-5 text-amber-500" /></span>}
                            {status === 'safe' && <span title="صالح"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></span>}
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-3">
                             <div className="flex justify-between items-center text-sm">
                                 <span className="text-slate-500 font-medium flex items-center gap-1"><FileText className="w-4 h-4"/> نهاية العقد</span>
                                 <span className="font-bold text-slate-800">{endDate ? format(endDate, 'yyyy/MM/dd') : 'غير محدد'}</span>
                             </div>
                             
                             {daysToExpiry !== null && (
                                 <div className={`mt-1 py-2 px-3 rounded-lg text-sm font-bold text-center border ${getStatusStyle(status)}`}>
                                     {status === 'expired' ? `منتهي منذ ${Math.abs(daysToExpiry)} يوم` : 
                                      status === 'warning' ? `ينتهي خلال ${daysToExpiry} يوم` : 
                                      `صالح لمدة ${daysToExpiry} يوم`}
                                 </div>
                             )}

                             <div className="mt-2 flex justify-end">
                                 <button 
                                     onClick={() => handleOpenEdit(user.id!, endDate)}
                                     className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-100 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors font-medium relative z-10"
                                     style={{zIndex: 10}} // Added z-index for clickability
                                 >
                                     <Edit2 className="w-4 h-4" />
                                     تحديث وتجديد
                                 </button>
                             </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Contract Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="text-indigo-600" />
                                تجديد عقد الموظف
                            </h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-white p-1.5 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">تاريخ انتهاء العقد الجديد</label>
                                <input
                                    type="date"
                                    value={newEndDate}
                                    onChange={(e) => setNewEndDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-5 py-2.5 text-slate-600 hover:bg-white rounded-xl transition-colors font-medium border border-transparent hover:border-slate-200"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleSaveContract}
                                disabled={!newEndDate}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 transition-all shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={18} />
                                حفظ التغييرات
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentManagement;
