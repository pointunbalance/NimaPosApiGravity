import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { SalesTarget } from '../types';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';

import SalesTargetsHeader from '../components/sales-targets/SalesTargetsHeader';
import SalesTargetsSummary from '../components/sales-targets/SalesTargetsSummary';
import SalesTargetsList from '../components/sales-targets/SalesTargetsList';
import SalesTargetModal from '../components/sales-targets/SalesTargetModal';

const SalesTargets: React.FC = () => {
  const { success, error: showError } = useToast();
  const [timeframe, setTimeframe] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('percentage-desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<SalesTarget | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; targetId: number } | null>(null);

  const [formData, setFormData] = useState<Partial<SalesTarget>>({
    employeeId: 0,
    targetAmount: 0,
    achievedAmount: 0,
    commissionRate: 0,
    period: 'month',
    notes: ''
  });

  const salesTargets = useLiveQuery(() => db.salesTargets.toArray());
  const users = useLiveQuery(() => db.users.toArray());

  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const currencyCode = 'EGP'; // Explicitly use Egyptian currencies for this page
  const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(amount);

  const handleSave = async () => {
    try {
      if (editingTarget?.id) {
        await db.salesTargets.update(editingTarget.id, formData as SalesTarget);
        success('تم تحديث الهدف بنجاح');
      } else {
        await db.salesTargets.add(formData as SalesTarget);
        success('تم إضافة الهدف بنجاح');
      }
      setIsModalOpen(false);
      setEditingTarget(null);
      setFormData({ employeeId: 0, targetAmount: 0, achievedAmount: 0, commissionRate: 0, period: 'month', notes: '' });
    } catch (error) {
      console.error('Error saving sales target:', error);
      showError('فشل حفظ الهدف البيعي');
    }
  };

  const handleEdit = (target: SalesTarget) => {
    setEditingTarget(target);
    setFormData(target);
    setIsModalOpen(true);
  };

  const confirmDeleteTarget = (id: number) => {
    setConfirmConfig({ isOpen: true, targetId: id });
  };

  const handleDelete = async () => {
    if (!confirmConfig) return;
    const id = confirmConfig.targetId;
    try {
      await db.salesTargets.delete(id);
      success('تم حذف الهدف البيعي بنجاح');
    } catch (error) {
      console.error('Error deleting target:', error);
      showError('فشل في حذف الهدف البيعي');
    }
    setConfirmConfig(null);
  };

  const handleSync = async () => {
    if (!users || !salesTargets) return;
    
    try {
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();
      
      if (timeframe === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      } else if (timeframe === 'quarter') {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59);
      } else if (timeframe === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      }

      const orders = await db.orders
          .where('date')
          .between(startDate, endDate)
          .toArray();

      const employeeSales = new Map<number, number>();
      
      orders.forEach(order => {
        if (order.status !== 'completed') return;
        const targetUserId = order.salespersonId || order.courierId || order.userId;
        if (targetUserId) {
          const current = employeeSales.get(targetUserId) || 0;
          employeeSales.set(targetUserId, current + order.totalAmount);
        } else {
          // Fallback to cashiers if salespersonId or userId not present
          const user = users.find(u => u.name === order.cashierName);
          if (user && user.id) {
            const current = employeeSales.get(user.id) || 0;
            employeeSales.set(user.id, current + order.totalAmount);
          }
        }
      });

      const targetsToUpdate = salesTargets.filter(t => t.period === timeframe);
      let updatedCount = 0;
      for (const target of targetsToUpdate) {
        if (target.id) {
          const achieved = employeeSales.get(target.employeeId) || 0;
          if (target.achievedAmount !== achieved) {
            await db.salesTargets.update(target.id, { achievedAmount: achieved });
            updatedCount++;
          }
        }
      }
      
      success(`تم تحديث المحقق بنجاح لـ ${updatedCount} أهداف.`);
    } catch (error) {
      console.error('Error syncing sales targets:', error);
      showError('حدث خطأ أثناء تحديث المحقق.');
    }
  };

  const handleExport = () => {
    if (!filteredTargets || filteredTargets.length === 0) {
      showError('لا توجد بيانات للتصدير');
      return;
    }

    const headers = ['المندوب', 'الهدف', 'المحقق', 'نسبة العمولة', 'العمولة المستحقة', 'نسبة الإنجاز', 'الفترة', 'ملاحظات'];
    const csvData = filteredTargets.map(target => {
      const user = users?.find(u => u.id === target.employeeId);
      const perc = target.targetAmount > 0 ? (target.achievedAmount / target.targetAmount) * 100 : 0;
      const commission = (target.achievedAmount * (target.commissionRate || 0)) / 100;
      
      return [
        user?.name || 'غير معروف',
        target.targetAmount.toFixed(2),
        target.achievedAmount.toFixed(2),
        `${target.commissionRate}%`,
        commission.toFixed(2),
        `${perc.toFixed(2)}%`,
        target.period === 'month' ? 'شهري' : target.period === 'quarter' ? 'ربع سنوي' : 'سنوي',
        `"${target.notes || ''}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales_targets_${timeframe}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTargets = salesTargets
    ?.filter(t => t.period === timeframe)
    ?.filter(t => {
      if (!searchTerm) return true;
      const user = users?.find(u => u.id === t.employeeId);
      return user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      const percA = a.targetAmount > 0 ? a.achievedAmount / a.targetAmount : 0;
      const percB = b.targetAmount > 0 ? b.achievedAmount / b.targetAmount : 0;
      if (sortBy === 'percentage-desc') return percB - percA;
      if (sortBy === 'percentage-asc') return percA - percB;
      if (sortBy === 'target-desc') return (b.targetAmount || 0) - (a.targetAmount || 0);
      if (sortBy === 'achieved-desc') return (b.achievedAmount || 0) - (a.achievedAmount || 0);
      return 0;
    }) || [];
  
  const totalTarget = filteredTargets.reduce((sum, t) => sum + (t.targetAmount || 0), 0);
  const totalAchieved = filteredTargets.reduce((sum, t) => sum + (t.achievedAmount || 0), 0);
  const totalRemaining = Math.max(0, totalTarget - totalAchieved);
  const percentage = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;

  const calculateDaysRemaining = () => {
    const now = new Date();
    let endDate = new Date();
    
    if (timeframe === 'month') {
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (timeframe === 'quarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
    } else if (timeframe === 'year') {
      endDate = new Date(now.getFullYear(), 11, 31);
    }
    
    const diffTime = Math.abs(endDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
  };

  const daysRemaining = calculateDaysRemaining();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 font-['Tajawal'] min-h-screen rounded-2xl animate-in fade-in duration-350" dir="rtl">
      <SalesTargetsHeader 
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        onAddClick={() => {
          setEditingTarget(null);
          setFormData({ employeeId: 0, targetAmount: 0, achievedAmount: 0, commissionRate: 0, period: timeframe, notes: '' });
          setIsModalOpen(true);
        }}
        onSyncClick={handleSync}
        onExportClick={handleExport}
      />

      <SalesTargetsSummary 
        totalTarget={totalTarget}
        totalAchieved={totalAchieved}
        totalRemaining={totalRemaining}
        percentage={percentage}
        daysRemaining={daysRemaining}
        formatCurrency={formatCurrency}
      />

      <SalesTargetsList 
        targets={filteredTargets}
        users={users || []}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onEdit={handleEdit}
        onDelete={confirmDeleteTarget}
        formatCurrency={formatCurrency}
      />

      {isModalOpen && (
        <SalesTargetModal 
          editingTarget={editingTarget}
          formData={formData}
          setFormData={setFormData}
          users={users || []}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title="حذف هدف المبيعات"
          message="هل أنت متأكد من حذف هذا الهدف المالي البيعي نهائياً للمندوب؟ لا يمكن استعادة البيانات بعد تأكيد الحذف."
          onConfirm={handleDelete}
          onCancel={() => setConfirmConfig(null)}
          confirmText="تأكيد الحذف"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
};

export default SalesTargets;
