import React from 'react';
import { Banknote, Eye, Trash2, Calendar } from 'lucide-react';
import { BankCheck } from '../../types';

interface CheckManagementGridProps {
  filteredChecks: BankCheck[];
  activeTab: 'receivable' | 'payable';
  getDaysRemaining: (dueDate: Date) => number;
  getStatusBadge: (status: BankCheck['status'], dueDate: Date) => React.ReactNode;
  onViewImage: (image: string) => void;
  onDeleteCheck: (id: number) => void;
  onOpenModal: (check: BankCheck) => void;
}

const CheckManagementGrid: React.FC<CheckManagementGridProps> = ({
  filteredChecks, activeTab, getDaysRemaining, getStatusBadge, onViewImage, onDeleteCheck, onOpenModal
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredChecks?.map(check => {
        const daysLeft = getDaysRemaining(check.dueDate);
        return (
          <div key={check.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden group">
            
            {/* Check Header (Visual style like physical check) */}
            <div className="bg-slate-50 p-4 border-b border-dashed border-slate-200 relative">
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-xs font-bold text-slate-400">NO. {check.number}</span>
                <div className="flex gap-1">
                  {check.image && (
                    <button onClick={() => onViewImage(check.image!)} className="p-1.5 bg-white rounded text-indigo-500 hover:bg-indigo-50 shadow-sm"><Eye className="w-3 h-3"/></button>
                  )}
                  <button onClick={() => onDeleteCheck(check.id!)} className="p-1.5 bg-white rounded text-red-400 hover:text-red-600 hover:bg-red-50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3"/></button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold uppercase text-white shadow-md ${activeTab === 'receivable' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                  {check.bankName.substring(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">{check.bankName}</h3>
                  <p className="text-[10px] text-gray-500">تاريخ: {new Date(check.issueDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Check Body */}
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">{activeTab === 'receivable' ? 'من السيد' : 'إلى السيد'}</p>
                  <p className="font-bold text-gray-800 line-clamp-1">{check.payeeName}</p>
                </div>
                <div className="text-left bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  <p className="font-black text-lg text-slate-800 dir-ltr">{check.amount.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold mb-1">تاريخ الاستحقاق</span>
                  <span className={`font-bold text-sm flex items-center gap-1 ${daysLeft < 0 && check.status === 'pending' ? 'text-red-600' : 'text-slate-700'}`}>
                    <Calendar className="w-3 h-3"/>
                    {new Date(check.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  {getStatusBadge(check.status, check.dueDate)}
                </div>
              </div>
            </div>

            {/* Footer Action */}
            {check.status === 'pending' && (
              <button 
                onClick={() => onOpenModal(check)} 
                className="w-full py-3 bg-slate-50 text-slate-600 text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-colors border-t border-slate-100"
              >
                تحديث الحالة / تعديل
              </button>
            )}
          </div>
        );
      })}
      
      {filteredChecks.length === 0 && (
        <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <Banknote className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="font-bold text-lg">لا توجد شيكات مطابقة</p>
          <p className="text-sm opacity-70">جرب تغيير الفلتر أو إضافة شيك جديد</p>
        </div>
      )}
    </div>
  );
};

export default CheckManagementGrid;
