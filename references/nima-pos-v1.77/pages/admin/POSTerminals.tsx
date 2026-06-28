import React, { useState } from 'react';
import { MonitorSmartphone, Search, Plus, Wifi, WifiOff, Wrench, RefreshCw, Trash2, Edit, Key, Tablet, Smartphone, Monitor } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import POSTerminalModal from '../../components/admin/POSTerminalModal';
import { POSTerminal } from '../../types';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const POSTerminals: React.FC = () => {
  const { success, error: showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [terminalToEdit, setTerminalToEdit] = useState<POSTerminal | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; id: number } | null>(null);

  const terminals = useLiveQuery(() => db.posTerminals.toArray()) || [];
  const branches = useLiveQuery(() => db.branches.toArray()) || [];

  const handleAddTerminal = () => {
    setTerminalToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditTerminal = (terminal: POSTerminal) => {
    setTerminalToEdit(terminal);
    setIsModalOpen(true);
  };

  const handleDeleteTerminal = async () => {
    if (!confirmConfig) return;
    try {
      await db.posTerminals.delete(confirmConfig.id);
      success('تم حذف جهاز نقطة البيع بنجاح');
    } catch (err) {
      console.error(err);
      showError('فشل في حذف جهاز نقطة البيع');
    }
    setConfirmConfig(null);
  };

  const toggleTerminalStatus = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'online' ? 'offline' : (currentStatus === 'offline' ? 'maintenance' : 'online');
      await db.posTerminals.update(id, { status: newStatus as any });
      success('تم تحديث حالة اتصال الجهاز بنجاح');
    } catch (err) {
      console.error(err);
      showError('فشل في تحديث حالة الجهاز');
    }
  };

  const getBranchName = (id: number) => {
    return branches.find(b => b.id === id)?.name || 'الفرع الرئيسي';
  };

  const filteredTerminals = terminals.filter(t => 
    t.name.includes(searchTerm) || t.ipAddress?.includes(searchTerm) || t.macAddress?.includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online': return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><Wifi className="w-3.5 h-3.5" /> متصل</span>;
      case 'offline': return <span className="px-3 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><WifiOff className="w-3.5 h-3.5" /> غير متصل</span>;
      case 'maintenance': return <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold flex items-center gap-1 w-fit animate-pulse"><Wrench className="w-3.5 h-3.5" /> صيانة</span>;
      default: return null;
    }
  };

  const getDeviceIcon = (type?: string) => {
    switch (type) {
      case 'tablet': return <Tablet className="w-5 h-5 text-indigo-500" />;
      case 'mobile': return <Smartphone className="w-5 h-5 text-indigo-500" />;
      case 'kiosk': return <MonitorSmartphone className="w-5 h-5 text-indigo-500 animate-pulse" />;
      default: return <Monitor className="w-5 h-5 text-indigo-500" />;
    }
  };

  const stats = {
    total: terminals.length,
    online: terminals.filter(t => t.status === 'online').length,
    offline: terminals.filter(t => t.status === 'offline').length,
    maintenance: terminals.filter(t => t.status === 'maintenance').length,
  };

  return (
    <div className="p-6 min-h-full bg-gradient-to-tr from-sky-50/60 via-slate-50 to-pink-50/40 font-['Tajawal']" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shadow-xs">
            <MonitorSmartphone className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-950">أجهزة نقاط البيع (Terminals)</h1>
            <p className="text-slate-500 text-sm mt-0.5">إدارة ومراقبة الأجهزة المتصلة بالفروع بكفاءة عالية</p>
          </div>
        </div>
        <button 
          onClick={handleAddTerminal}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>تسجيل جهاز جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-slate-100/60 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><MonitorSmartphone className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">إجمالي الأجهزة</p>
            <p className="text-2xl font-bold text-slate-900 font-mono">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-slate-100/60 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Wifi className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">متصلة</p>
            <p className="text-2xl font-bold text-emerald-600 font-mono">{stats.online}</p>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-slate-100/60 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-slate-50 text-slate-600 rounded-lg"><WifiOff className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">غير متصلة</p>
            <p className="text-2xl font-bold text-slate-500 font-mono">{stats.offline}</p>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-slate-100/60 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Wrench className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">في الصيانة</p>
            <p className="text-2xl font-bold text-amber-600 font-mono">{stats.maintenance}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100/80 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/40 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث باسم الجهاز، IP، أو MAC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100 text-sm">
              <tr>
                <th className="p-4 text-slate-600 font-semibold">اسم الجهاز</th>
                <th className="p-4 text-slate-600 font-semibold">الفرع</th>
                <th className="p-4 text-slate-600 font-semibold">الشبكة (IP/MAC)</th>
                <th className="p-4 text-slate-600 font-semibold">كود الربط</th>
                <th className="p-4 text-slate-600 font-semibold">آخر اتصال</th>
                <th className="p-4 text-slate-600 font-semibold">الحالة</th>
                <th className="p-4 text-slate-600 font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTerminals.map((terminal) => (
                <tr key={terminal.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(terminal.deviceType)}
                      <span className="font-bold text-slate-800">{terminal.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">{getBranchName(terminal.branchId)}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-600 font-mono text-sm">{terminal.ipAddress || '---'}</span>
                      {terminal.macAddress && (
                        <span className="text-slate-400 font-mono text-xs">{terminal.macAddress}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {terminal.pairingCode ? (
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-indigo-500" />
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md text-sm">{terminal.pairingCode}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">---</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-600 text-sm font-mono">{new Date(terminal.lastSeen).toLocaleString('ar-EG')}</td>
                  <td className="p-4">{getStatusBadge(terminal.status)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleTerminalStatus(terminal.id!, terminal.status)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="تغيير الحالة"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditTerminal(terminal)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => terminal.id && setConfirmConfig({ isOpen: true, id: terminal.id })}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTerminals.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <MonitorSmartphone className="w-12 h-12 text-gray-300 animate-pulse" />
                      <p>لا توجد أجهزة مسجلة حالياً تطابق خيارات البحث.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <POSTerminalModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        terminalToEdit={terminalToEdit}
        branches={branches}
      />

      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title="حذف جهاز نقطة بيع"
          message="هل أنت متأكد من إلغاء وحذف تسجيل هذا الجهاز نهائياً من النظام؟ لن يتمكن من تسجيل الدخول لنقاط البيع مجدداً."
          onConfirm={handleDeleteTerminal}
          onCancel={() => setConfirmConfig(null)}
          confirmText="تأكيد الحذف"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
};
