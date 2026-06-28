import React from 'react';
import { CheckCircle, XCircle, ChevronLeft } from 'lucide-react';
import { User } from '../../types';

interface UsersListProps {
  users: User[];
  selectedUserId?: number;
  onSelectUser: (user: User) => void;
  getContractStatus: (endDate?: Date) => { label: string; color: string; days: number | null };
}

const UsersList: React.FC<UsersListProps> = ({
  users,
  selectedUserId,
  onSelectUser,
  getContractStatus
}) => {
  return (
    <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden flex-1 min-h-0">
      <div className="overflow-x-auto h-full">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100 sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-5">الموظف</th>
              <th className="px-6 py-5">الدور</th>
              <th className="px-6 py-5">حالة العقد</th>
              <th className="px-6 py-5">الحالة</th>
              <th className="px-6 py-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users?.map(user => {
              const contract = getContractStatus(user.contractEndDate);
              return (
                <tr 
                  key={user.id} 
                  className={`hover:bg-indigo-50/30 transition-colors group cursor-pointer ${selectedUserId === user.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
                  onClick={() => onSelectUser(user)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 overflow-hidden">
                            {user.idCardImage ? <img src={user.idCardImage} className="w-full h-full object-cover" alt={user.name}/> : user.name.substring(0, 1)}
                        </div>
                        <p className="font-bold text-slate-800">{user.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-500">{user.role}</span>
                  </td>
                  <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded ${contract.color}`}>{contract.label}</span>
                  </td>
                  <td className="px-6 py-4">
                    {user.isActive ? <span className="text-green-600 font-bold text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3"/> نشط</span> : <span className="text-red-500 font-bold text-xs flex items-center gap-1"><XCircle className="w-3 h-3"/> محظور</span>}
                  </td>
                  <td className="px-6 py-4 text-left">
                      <ChevronLeft className="w-5 h-5 text-slate-300 inline-block" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersList;
