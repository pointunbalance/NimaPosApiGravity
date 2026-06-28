import React from 'react';
import { Crown, Lock, Phone, ChevronLeft } from 'lucide-react';
import { User } from '../../types';

interface UsersGridProps {
  users: User[];
  selectedUserId?: number;
  onSelectUser: (user: User) => void;
  userPerformanceMap: Map<string, any>;
  topPerformer: string;
  getRoleBadge: (role: string) => { label: string; bg: string; icon: any };
  formatCurrency: (amount: number) => string;
}

const UsersGrid: React.FC<UsersGridProps> = ({
  users,
  selectedUserId,
  onSelectUser,
  userPerformanceMap,
  topPerformer,
  getRoleBadge,
  formatCurrency
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {users.map(user => {
            const roleBadge = getRoleBadge(user.role);
            const RoleIcon = roleBadge.icon;
            const perf = userPerformanceMap.get(user.name);
            const isTop = topPerformer === user.name;

            return (
                <div 
                  key={user.id} 
                  onClick={() => onSelectUser(user)}
                  className={`bg-white rounded-2xl border transition-all cursor-pointer relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg ${selectedUserId === user.id ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200'}`}
                >
                    {isTop && (
                        <div className="absolute top-0 right-0 bg-amber-400 text-white p-1.5 rounded-bl-xl shadow-md z-10">
                            <Crown className="w-4 h-4 fill-current" />
                        </div>
                    )}
                    
                    {/* Card Header Background */}
                    <div className="h-20 bg-slate-50 border-b border-slate-100 relative">
                        <div className={`absolute -bottom-8 right-6 w-16 h-16 rounded-full border-4 border-white shadow-md flex items-center justify-center text-2xl font-bold text-white overflow-hidden ${user.isActive ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                            {user.idCardImage ? <img src={user.idCardImage} className="w-full h-full object-cover" alt={user.name}/> : user.name.substring(0,1)}
                        </div>
                    </div>

                    <div className="pt-10 px-6 pb-6">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                {user.name}
                                {!user.isActive && <span title="محظور"><Lock className="w-4 h-4 text-red-500" /></span>}
                            </h3>
                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md mt-1 font-bold ${roleBadge.bg}`}>
                                <RoleIcon className="w-3 h-3" />
                                {roleBadge.label}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                                <p className="text-xs text-slate-400 mb-1">المبيعات</p>
                                <p className="font-bold text-indigo-600 text-sm">{perf ? formatCurrency(perf.totalSales) : '-'}</p>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                                <p className="text-xs text-slate-400 mb-1">آخر ظهور</p>
                                <p className="font-bold text-slate-600 text-sm">{perf?.lastActive ? new Date(perf.lastActive).toLocaleDateString() : '-'}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-50">
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {user.phone || 'غير مسجل'}</span>
                            <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:-translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
  );
};

export default UsersGrid;
