import React from 'react';
import { User as UserIcon, ChevronDown, Loader2 } from 'lucide-react';
import { User } from '../../types';

interface UserSelectFieldProps {
  users: User[];
  selectedUserId: number | '';
  setSelectedUserId: (id: number | '') => void;
  setPin: (pin: string) => void;
  setError: (err: string) => void;
  playSound: (type: 'click' | 'success' | 'error' | 'delete' | 'typing') => void;
}

export const UserSelectField: React.FC<UserSelectFieldProps> = ({
  users,
  selectedUserId,
  setSelectedUserId,
  setPin,
  setError,
  playSound,
}) => {
  const selectedUser = selectedUserId ? users.find(u => u.id === Number(selectedUserId)) : null;

  const getInitials = (name: string): string => {
    if (!name) return '👤';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <div className="mb-6 relative w-full text-right">
      <label className="block text-xs md:text-sm font-extrabold text-slate-500 mb-2.5 tracking-wide uppercase">
        اسم المستخدم للموظف
      </label>
      
      {users.length === 0 ? (
        <div className="w-full h-[64px] bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 text-sm gap-2 animate-pulse shadow-inner">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          <span className="font-bold text-slate-500">جاري تحميل حسابات الموظفين...</span>
        </div>
      ) : (
        <div className="relative group/select">
          {/* Circular avatar box positioned absolutely inside select input */}
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden z-10 select-none pointer-events-none shadow-sm">
            {selectedUser ? (
              <div className="relative w-8 h-8 rounded-full flex items-center justify-center select-none">
                <div className={`w-full h-full rounded-full flex items-center justify-center font-bold text-white text-[10px] shadow-sm relative bg-gradient-to-tr ${selectedUser.role === 'admin' ? 'from-blue-500 to-indigo-600' : 'from-slate-400 to-slate-500'}`}>
                  {getInitials(selectedUser.name)}
                </div>
                {/* Active Session Online Status Indicator */}
                <span className="absolute bottom-0 left-0 w-2 h-2 bg-emerald-500 border border-white rounded-full" title="نشط"></span>
              </div>
            ) : (
              <UserIcon className="w-5 h-5 text-indigo-500 group-hover/select:text-indigo-600 transition-colors" />
            )}
          </div>

          <select 
            value={selectedUserId}
            onChange={(e) => {
              setSelectedUserId(Number(e.target.value));
              setPin('');
              setError('');
              playSound('click');
            }}
            className="w-full appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl py-3.5 pr-[64px] pl-12 text-slate-800 font-extrabold outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 transition-all duration-250 cursor-pointer text-right shadow-sm text-base relative z-0"
            dir="rtl"
          >
            <option value="" disabled className="bg-white text-slate-400">اختر حساب الموظف...</option>
            {users.map(u => (
              <option key={u.id} value={u.id} className="font-bold text-slate-800 bg-white py-2">
                {u.name} {u.role === 'admin' ? '⭐ (مدير النظام)' : '👤 (مساعد)'}
              </option>
            ))}
          </select>

          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center pointer-events-none text-slate-400">
            <ChevronDown className="w-6 h-6" />
          </div>
        </div>
      )}
    </div>
  );
};
