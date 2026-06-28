import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Key, UserCheck, ShieldCheck, ArrowRight } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';

export const TeacherAppLogin = () => {
    const navigate = useNavigate();
    const [selectedUserId, setSelectedUserId] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const users = useLiveQuery(() => db.users?.toArray()) || [];
    // Or anyone assigned to classes, for demo lets assume users with name "معلمة" or just show all users
    const teachers = users.length > 0 ? users : [{ id: 1, name: 'المعلمة سارة', pinCode: '1234' }, { id: 2, name: 'المعلمة نورة', pinCode: '1234' }];

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!selectedUserId) {
            setError('يرجى اختيار الحساب');
            return;
        }

        if (pin.length < 8) {
            setError('الرمز غير صحيح');
            return;
        }
        
        // Login success
        localStorage.setItem('isTeacherAuth', 'true');
        localStorage.setItem('teacherId', selectedUserId);
        
        let teacherName = teachers.find(t => t.id.toString() === selectedUserId)?.name || 'معلمة';
        localStorage.setItem('teacherName', teacherName);
        
        navigate('/teacher-app/dashboard');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden flex-col font-sans">
            <div className="absolute top-0 left-0 w-full h-96 bg-emerald-600 rounded-b-[4rem] z-0 shadow-lg"></div>
            
            <div className="z-10 bg-white rounded-3xl p-8 shadow-2xl w-full max-w-md border border-slate-100 mb-8 mt-12 relative overflow-hidden">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
                        <UserCheck className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800">تطبيق المعلمة</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">إدارة الفصل، الحضور، والتقارير</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    {error && (
                        <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-bold border border-rose-100 text-center">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">اسم المعلمة / الحساب</label>
                        <select required value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all">
                            <option value="">-- اختر --</option>
                            {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">رمز الدخول (PIN)</label>
                        <div className="relative">
                            <Key className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="password" 
                                required
                                maxLength={8} 
                                value={pin} 
                                onChange={(e) => setPin(e.target.value)}
                                className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-black tracking-[1em] text-center focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all dir-ltr" 
                                dir="ltr"
                                placeholder="********"
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl transition shadow-md shadow-emerald-200 flex justify-center items-center gap-2">
                            تسجيل الدخول <LogIn className="w-5 h-5" />
                    </button>
                </form>
            </div>
            
            <a href="/" className="z-10 text-white/70 hover:text-white text-sm font-bold transition flex items-center gap-2">
                <ArrowRight className="w-4 h-4"/> العودة للموقع الرئيسي
            </a>
        </div>
    );
};
