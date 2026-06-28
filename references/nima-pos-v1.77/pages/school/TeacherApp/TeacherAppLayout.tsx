import React, { useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Clock, Camera, LogOut, FileText, Bell, User } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export const TeacherAppLayout = () => {
    const { success, error: toastError, info } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const isAuth = localStorage.getItem('isTeacherAuth');
        if (!isAuth) {
            navigate('/teacher-app/login', { replace: true });
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('isTeacherAuth');
        localStorage.removeItem('teacherId');
        localStorage.removeItem('teacherName');
        navigate('/teacher-app/login', { replace: true });
    };

    const teacherName = localStorage.getItem('teacherName') || 'المعلمة';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center px-4 md:px-6 sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700">
                             <User className="w-5 h-5"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">مرحباً</h3>
                        <p className="text-xs text-slate-500 font-medium">{teacherName}</p>
                    </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition relative">
                        <Bell className="w-5 h-5"/>
                        </button>
                    </div>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 pb-24">
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex justify-between items-center z-20 pb-[calc(env(safe-area-inset-bottom,0px)+8px)]">
                <Link to="/teacher-app/dashboard" className={`flex flex-col items-center gap-1 ${location.pathname === '/teacher-app/dashboard' ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <Users className="w-6 h-6"/>
                    <span className="text-[10px] font-bold">فصلي</span>
                </Link>
                <button onClick={() => info('الجدول اليومي قريباً')} className="flex flex-col items-center gap-1 text-slate-400">
                    <Clock className="w-6 h-6"/>
                    <span className="text-[10px] font-bold">الجدول</span>
                </button>
                <div className="relative -top-5">
                    <button onClick={() => info('ميزة إضافة نشاط سريع قريباً')} className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 border-4 border-white">
                        <Camera className="w-6 h-6"/>
                    </button>
                </div>
                <button onClick={() => info('التقارير اليومية قريباً')} className="flex flex-col items-center gap-1 text-slate-400">
                    <FileText className="w-6 h-6"/>
                    <span className="text-[10px] font-bold">التقارير</span>
                </button>
                <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-rose-400">
                    <LogOut className="w-6 h-6"/>
                    <span className="text-[10px] font-bold">خروج</span>
                </button>
            </nav>
        </div>
    );
};
