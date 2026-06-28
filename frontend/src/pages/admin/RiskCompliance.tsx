import React, { useState } from 'react';
import { AlertTriangle, Plus, Search, ShieldCheck, ShieldAlert, Edit, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { RiskRecord, ComplianceRecord } from '../../types';
import RiskModal from '../../components/admin/RiskModal';
import ComplianceModal from '../../components/admin/ComplianceModal';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const RiskCompliance: React.FC = () => {
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState<'risks' | 'compliance'>('risks');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<RiskRecord | null>(null);

  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [editingCompliance, setEditingCompliance] = useState<ComplianceRecord | null>(null);

  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; id: number; type: 'risk' | 'compliance' } | null>(null);

  const risks = useLiveQuery(() => db.risks.toArray()) || [];
  const complianceRecords = useLiveQuery(() => db.complianceRecords.toArray()) || [];

  const filteredRisks = risks.filter(r => 
    r.title.includes(searchTerm) || r.description.includes(searchTerm)
  );

  const filteredCompliance = complianceRecords.filter(c => 
    c.title.includes(searchTerm) || c.description.includes(searchTerm)
  );

  // Risk Handlers
  const handleOpenRiskModal = (risk?: RiskRecord) => {
    setEditingRisk(risk || null);
    setIsRiskModalOpen(true);
  };

  const handleSaveRisk = async (formData: Partial<RiskRecord>) => {
    try {
      if (editingRisk?.id) {
        await db.risks.update(editingRisk.id, { ...formData, updatedAt: new Date().toISOString() });
        success('تم تحديث سجل الخطر بنجاح');
      } else {
        await db.risks.add({
          ...formData as RiskRecord,
          createdAt: new Date().toISOString()
        });
        success('تم إضافة سجل خطر جديد بنجاح');
      }
      setIsRiskModalOpen(false);
    } catch (error) {
      console.error('Error saving risk:', error);
      showError('حدث خطأ أثناء حفظ الخطر');
    }
  };

  const handleDeleteRisk = async () => {
    if (!confirmConfig) return;
    try {
      await db.risks.delete(confirmConfig.id);
      success('تم حذف سجل الخطر بنجاح');
    } catch (err) {
      console.error(err);
      showError('فشل في حذف سجل الخطر');
    }
    setConfirmConfig(null);
  };

  // Compliance Handlers
  const handleOpenComplianceModal = (record?: ComplianceRecord) => {
    setEditingCompliance(record || null);
    setIsComplianceModalOpen(true);
  };

  const handleSaveCompliance = async (formData: Partial<ComplianceRecord>) => {
    try {
      if (editingCompliance?.id) {
        await db.complianceRecords.update(editingCompliance.id, formData);
        await db.auditLogs.add({
          userId: 1, // Assume systemic or default user for now
          module: 'Compliance',
          action: `Updated compliance record (Id: ${editingCompliance.id}): ${formData.title}`,
          timestamp: new Date()
        });
        success('تم تحديث سجل الامتثال بنجاح');
      } else {
        await db.complianceRecords.add({
          ...formData as ComplianceRecord,
          createdAt: new Date().toISOString()
        });
        await db.auditLogs.add({
          userId: 1,
          module: 'Compliance',
          action: `Created compliance record: ${formData.title}`,
          timestamp: new Date()
        });
        success('تم تسجيل الامتثال الجديد بنجاح');
      }
      setIsComplianceModalOpen(false);
    } catch (error) {
      console.error('Error saving compliance record:', error);
      showError('حدث خطأ أثناء حفظ سجل الامتثال');
    }
  };

  const handleDeleteCompliance = async () => {
    if (!confirmConfig) return;
    try {
      await db.complianceRecords.delete(confirmConfig.id);
      success('تم حذف سجل الامتثال بنجاح');
    } catch (err) {
      console.error(err);
      showError('فشل في حذف سجل الامتثال');
    }
    setConfirmConfig(null);
  };

  const executeDelete = () => {
    if (!confirmConfig) return;
    if (confirmConfig.type === 'risk') {
      handleDeleteRisk();
    } else {
      handleDeleteCompliance();
    }
  };

  // Helpers
  const getRiskProbabilityBadge = (prob: string) => {
    switch (prob) {
      case 'low': return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-semibold">منخفضة</span>;
      case 'medium': return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-semibold">متوسطة</span>;
      case 'high': return <span className="px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded text-xs font-semibold">عالية</span>;
      case 'critical': return <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-bold animate-pulse">حرجة</span>;
      default: return null;
    }
  };

  const getComplianceStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant': return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><CheckCircle2 className="w-4 h-4" /> ممتثل</span>;
      case 'non_compliant': return <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><XCircle className="w-4 h-4" /> غير ممتثل</span>;
      case 'pending_review': return <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold flex items-center gap-1 w-fit animate-pulse"><Clock className="w-4 h-4" /> قيد المراجعة</span>;
      default: return null;
    }
  };

  const stats = {
    criticalRisks: risks.filter(r => r.probability === 'critical' || r.impact === 'critical').length,
    openRisks: risks.filter(r => r.status !== 'closed').length,
    nonCompliant: complianceRecords.filter(c => c.status === 'non_compliant').length,
    pendingCompliance: complianceRecords.filter(c => c.status === 'pending_review').length,
  };

  return (
    <div className="p-6 min-h-full bg-gradient-to-tr from-sky-50/60 via-slate-50 to-pink-50/40 font-['Tajawal']" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl shadow-xs">
            <AlertTriangle size={24} className="animate-bounce" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-950">إدارة المخاطر والامتثال</h1>
            <p className="text-slate-500 text-sm mt-0.5">تتبع المخاطر المؤسسية والامتثال الدقيق للوائح والمعايير</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handleOpenRiskModal()}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl hover:bg-red-700 transition-all font-bold shadow-xs"
          >
            <Plus size={20} />
            <span>سجل خطر جديد</span>
          </button>
          <button 
            onClick={() => handleOpenComplianceModal()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-xs"
          >
            <Plus size={20} />
            <span>سجل امتثال جديد</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg"><ShieldAlert className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">مخاطر حرجة</p>
            <p className="text-2xl font-bold text-red-600 font-mono">{stats.criticalRisks}</p>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><AlertTriangle className="w-6 h-6 animate-pulse" /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">مخاطر مفتوحة</p>
            <p className="text-2xl font-bold text-slate-800 font-mono">{stats.openRisks}</p>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg"><XCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">غير ممتثل</p>
            <p className="text-2xl font-bold text-rose-600 font-mono">{stats.nonCompliant}</p>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><ShieldCheck className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">امتثال قيد المراجعة</p>
            <p className="text-2xl font-bold text-indigo-600 font-mono">{stats.pendingCompliance}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <div className="flex">
            <button
              onClick={() => setActiveTab('risks')}
              className={`flex-1 py-4 text-center font-bold text-sm transition-all ${
                activeTab === 'risks'
                  ? 'text-red-600 border-b-2 border-red-600 bg-red-50/10'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
              }`}
            >
              سجل المخاطر المؤسسية
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              className={`flex-1 py-4 text-center font-bold text-sm transition-all ${
                activeTab === 'compliance'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/10'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
              }`}
            >
              سجل الامتثال والرقابة
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-gray-100 bg-slate-50/30">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={activeTab === 'risks' ? "البحث في المخاطر..." : "البحث في الامتثال للوائح..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'risks' ? (
            <table className="w-full text-right">
              <thead className="bg-slate-50 border-b border-slate-100 text-sm">
                <tr>
                  <th className="p-4 text-slate-600 font-semibold">عنوان الخطر</th>
                  <th className="p-4 text-slate-600 font-semibold">التصنيف</th>
                  <th className="p-4 text-slate-600 font-semibold">الاحتمالية</th>
                  <th className="p-4 text-slate-600 font-semibold">التأثير</th>
                  <th className="p-4 text-slate-600 font-semibold">الحالة</th>
                  <th className="p-4 text-slate-600 font-semibold">المالك</th>
                  <th className="p-4 text-slate-600 font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRisks.map(risk => (
                  <tr key={risk.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{risk.title}</td>
                    <td className="p-4 text-slate-600">{risk.category}</td>
                    <td className="p-4">{getRiskProbabilityBadge(risk.probability)}</td>
                    <td className="p-4">{getRiskProbabilityBadge(risk.impact)}</td>
                    <td className="p-4 text-slate-600 font-medium">{risk.status}</td>
                    <td className="p-4 text-slate-600">{risk.owner || '-'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleOpenRiskModal(risk)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="تعديل"><Edit size={16} /></button>
                        <button onClick={() => risk.id && setConfirmConfig({ isOpen: true, id: risk.id, type: 'risk' })} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="حذف"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRisks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <AlertTriangle size={48} className="text-gray-300 animate-pulse" />
                        <p>لا توجد سجلات مخاطر حالياً تطابق البحث.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-right">
              <thead className="bg-slate-50 border-b border-slate-100 text-sm">
                <tr>
                  <th className="p-4 text-slate-600 font-semibold">العنوان</th>
                  <th className="p-4 text-slate-600 font-semibold">النوع</th>
                  <th className="p-4 text-slate-600 font-semibold">الحالة</th>
                  <th className="p-4 text-slate-600 font-semibold">تاريخ الاستحقاق</th>
                  <th className="p-4 text-slate-600 font-semibold">المراجع</th>
                  <th className="p-4 text-slate-600 font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredCompliance.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{record.title}</td>
                    <td className="p-4 text-slate-600">{record.type}</td>
                    <td className="p-4">{getComplianceStatusBadge(record.status)}</td>
                    <td className="p-4 text-slate-600 font-mono text-xs">{record.dueDate || '-'}</td>
                    <td className="p-4 text-slate-600">{record.reviewer || '-'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleOpenComplianceModal(record)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="تعديل"><Edit size={16} /></button>
                        <button onClick={() => record.id && setConfirmConfig({ isOpen: true, id: record.id, type: 'compliance' })} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="حذف"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCompliance.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <ShieldCheck size={48} className="text-gray-300 animate-pulse" />
                        <p>لا توجد سجلات امتثال حالياً تطابق البحث.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <RiskModal 
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
        onSave={handleSaveRisk}
        editingRisk={editingRisk}
      />

      <ComplianceModal 
        isOpen={isComplianceModalOpen}
        onClose={() => setIsComplianceModalOpen(false)}
        onSave={handleSaveCompliance}
        editingRecord={editingCompliance}
      />

      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.type === 'risk' ? "حذف سجل خطر" : "حذف سجل امتثال"}
          message={
            confirmConfig.type === 'risk' 
              ? "هل أنت متأكد من حذف هذا الخطر المؤسسي من النظام بشكل نهائي؟"
              : "هل أنت متأكد من حذف هذا السجل الرقابي والامتثالي بشكل نهائي؟"
          }
          onConfirm={executeDelete}
          onCancel={() => setConfirmConfig(null)}
          confirmText="تأكيد الحذف"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
};
