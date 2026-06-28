import React from 'react';
import {
  UserMinus,
  Plus,
  Search,
  Filter,
  Clock,
  Check,
  X,
  CheckCircle2,
  XCircle,
  FileWarning,
  Wallet,
} from 'lucide-react';
import { format } from 'date-fns';

import { useSchoolWithdrawals } from '../../components/school/withdrawals/useSchoolWithdrawals';
import { SchoolWithdrawalCreateModal } from '../../components/school/withdrawals/SchoolWithdrawalCreateModal';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const SchoolWithdrawals = () => {
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    students,
    classes,
    activeStudents,
    form,
    setForm,
    handleCreate,
    updateStatus,
    filteredWithdrawals,
    isConfirmOpen,
    setIsConfirmOpen,
    confirmConfig,
  } = useSchoolWithdrawals();

  return (
    <div className="p-6" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-2xl">
            <UserMinus className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">إدارة الانسحابات</h1>
            <p className="text-slate-500 font-medium">طلبات انسحاب الطلاب والاستردادات وملف المخالصة</p>
          </div>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-700 transition shadow-sm shadow-red-200 cursor-pointer"
        >
          <Plus className="w-5 h-5" /> تسجيل طلب انسحاب
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center mb-6">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="w-5 h-5 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="ابحث باسم الطالب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 font-medium outline-none"
          />
        </div>
        <div className="flex items-center gap-2 text-slate-500 font-bold">
          <Filter className="w-4 h-4" /> تصفية:
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-red-500 outline-none bg-slate-50"
        >
          <option value="all">جميع الحالات</option>
          <option value="pending">قيد الانتظار (تحت المراجعة)</option>
          <option value="approved">موافق عليه (تمت المخالصة)</option>
          <option value="rejected">مرفوض</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredWithdrawals.map((req) => {
          const student = students.find((s) => s.id === Number(req.studentId));
          const studentClass = classes.find((c) => c.id === student?.classroomId);

          return (
            <div
              key={req.id}
              className={`bg-white rounded-3xl border overflow-hidden flex flex-col shadow-sm transition-all hover:shadow-md ${
                req.status === 'pending'
                  ? 'border-amber-200'
                  : req.status === 'approved'
                  ? 'border-emerald-200'
                  : 'border-rose-200'
              }`}
            >
              <div
                className={`p-5 border-b flex justify-between items-start ${
                  req.status === 'pending'
                    ? 'bg-amber-50/50 border-amber-100'
                    : req.status === 'approved'
                    ? 'bg-emerald-50/50 border-emerald-100'
                    : 'bg-rose-50/50 border-rose-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      req.status === 'pending'
                        ? 'bg-amber-100 text-amber-600'
                        : req.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-rose-100 text-rose-600'
                    }`}
                  >
                    <FileWarning className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg mb-0.5">{student?.name || 'طالب محذوف'}</h3>
                    <p className="text-xs font-bold text-slate-500">{studentClass ? studentClass.name : 'بدون فصل'}</p>
                  </div>
                </div>
                <div>
                  {req.status === 'pending' && (
                    <span className="flex items-center gap-1 text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-lg border border-amber-200">
                      <Clock className="w-3.5 h-3.5" /> قيد الانتظار
                    </span>
                  )}
                  {req.status === 'approved' && (
                    <span className="flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> معتمد ومخالص
                    </span>
                  )}
                  {req.status === 'rejected' && (
                    <span className="flex items-center gap-1 text-xs font-bold bg-rose-100 text-rose-700 px-2 py-1 rounded-lg border border-rose-200">
                      <XCircle className="w-3.5 h-3.5" /> مرفوض
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 flex-1 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-bold">تاريخ الطلب:</span>
                  <span className="text-slate-800 font-bold">{format(new Date(req.date), 'yyyy-MM-dd')}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 mb-1">سبب الانسحاب:</h4>
                  <p className="text-sm font-medium text-slate-700">{req.reason || 'لم يسجل'}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border ${req.hasDebt ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                    <h4 className="text-xs font-bold text-slate-400 mb-1">المديونية (عليه)</h4>
                    <p className={`font-black ${req.hasDebt ? 'text-red-600' : 'text-slate-500'}`}>
                      {req.hasDebt ? `${req.debtAmount} ج.م` : 'لا يوجد'}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl border ${req.hasRefund ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                    <h4 className="text-xs font-bold text-slate-400 mb-1">المسترد (له)</h4>
                    <p className={`font-black ${req.hasRefund ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {req.hasRefund ? `${req.refundAmount} ج.م` : 'لا يوجد'}
                    </p>
                  </div>
                </div>

                {req.hasRefund && req.status === 'pending' && (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <Wallet className="w-3.5 h-3.5" /> طريقة رد المبلغ:{' '}
                    <span className="text-slate-800">
                      {req.refundMethod === 'cash'
                        ? 'نقدي (خزنة)'
                        : req.refundMethod === 'bank_transfer'
                        ? 'تحويل بنكي'
                        : 'محفظة إلكترونية (كاش)'}
                    </span>
                  </div>
                )}

                {req.notes && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 mb-1">ملاحظات إضافية:</h4>
                    <p className="text-sm font-medium text-slate-700">{req.notes}</p>
                  </div>
                )}

                {req.decisionDate && (
                  <div className="flex justify-between items-center text-xs text-slate-500 pt-4 border-t border-slate-100">
                    <span className="font-bold">تاريخ القرار: {format(new Date(req.decisionDate), 'yyyy-MM-dd')}</span>
                  </div>
                )}
              </div>

              {req.status === 'pending' && (
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() =>
                      updateStatus(
                        req.id,
                        Number(req.studentId),
                        'approved',
                        req.hasRefund,
                        req.refundAmount,
                        req.refundMethod
                      )
                    }
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200 cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> اعتماد ورد المبلغ
                  </button>
                  <button
                    onClick={() =>
                      updateStatus(
                        req.id,
                        Number(req.studentId),
                        'rejected',
                        req.hasRefund,
                        req.refundAmount,
                        req.refundMethod
                      )
                    }
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white text-rose-600 py-2 rounded-xl text-sm font-bold hover:bg-rose-50 transition-colors border border-rose-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" /> رفض وإلغاء
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {filteredWithdrawals.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
            <UserMinus className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-bold text-lg text-slate-600">لا توجد طلبات انسحاب مسجلة</p>
          </div>
        )}
      </div>

      <SchoolWithdrawalCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        form={form}
        setForm={setForm}
        handleCreate={handleCreate}
        activeStudents={activeStudents}
        classes={classes}
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};

export default SchoolWithdrawals;
