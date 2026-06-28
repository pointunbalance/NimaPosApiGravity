import React, { useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, BookOpen, LogOut, FileText, Bell, User } from 'lucide-react';

export const ParentPortalLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const isAuth = localStorage.getItem('isParentAuth');
        if (!isAuth) {
            navigate('/parent-portal/login', { replace: true });
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('isParentAuth');
        localStorage.removeItem('parentPortalTempPhone');
        localStorage.removeItem('parentPortalParentId');
        navigate('/parent-portal/login', { replace: true });
    };

    const navItems = [
        { path: '/parent-portal/dashboard', label: 'لوحة المتابعة', icon: LayoutDashboard },
        { path: '/parent-portal/requests', label: 'الطلبات والمراسلات', icon: MessageSquare }
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-l border-slate-200 flex-shrink-0 flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-indigo-700 leading-tight">بوابة<br/>ولي الأمر</h2>
                    </div>
                </div>
                <div className="p-4 flex-1 overflow-y-auto hidden md:block space-y-2">
                    {navItems.map(item => (
                        <Link 
                            key={item.path} 
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${location.pathname.startsWith(item.path) ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <item.icon className="w-5 h-5"/> {item.label}
                        </Link>
                    ))}
                </div>
                {/* Mobile horizontal nav */}
                <div className="md:hidden flex overflow-x-auto p-4 gap-2 custom-scrollbar bg-white">
                     {navItems.map(item => (
                        <Link 
                            key={item.path} 
                            to={item.path}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${location.pathname.startsWith(item.path) ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100'}`}
                        >
                            <item.icon className="w-4 h-4"/> {item.label}
                        </Link>
                    ))}
                </div>

                <div className="p-4 mt-auto border-t border-slate-100 hidden md:block">
                     <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 rounded-2xl text-rose-600 font-bold hover:bg-rose-50 transition-all">
                        <LogOut className="w-5 h-5"/> تسجيل خروج
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden flex flex-col h-screen relative">
                <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center px-6 sticky top-0 z-20">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700">
                             <User className="w-5 h-5"/>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">مرحباً بك</h3>
                            <p className="text-xs text-slate-500 font-medium">حساب ولي الأمر</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                         <button className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition relative">
                            <Bell className="w-5 h-5"/>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                         </button>
                          <button onClick={handleLogout} className="md:hidden w-10 h-10 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-600 hover:bg-rose-100 transition relative">
                            <LogOut className="w-5 h-5"/>
                         </button>
                     </div>
                </header>
                <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
                     <Outlet />
                </div>
            </main>
        </div>
    );
};
