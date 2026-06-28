import React from 'react';
import { 
  ChevronLeft, Crown, Lock, BarChart3, Activity, 
  RotateCcw, Phone, MapPin, Clock, Edit2, Trash2, CheckCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { User } from '../../types';

interface UserDetailSidebarProps {
  user: User | null;
  activeTab: 'overview' | 'performance' | 'activity';
  setActiveTab: (tab: 'overview' | 'performance' | 'activity') => void;
  onClose: () => void;
  userPerformanceMap: Map<string, any>;
  topPerformer: string;
  getContractStatus: (endDate?: Date) => { label: string; color: string; days: number | null };
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
  onToggleStatus?: (user: User) => void; // Added here
  logs: any[];
}

const UserDetailSidebar: React.FC<UserDetailSidebarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onClose,
  userPerformanceMap,
  topPerformer,
  getContractStatus,
  formatCurrency,
  formatDate,
  onEdit,
  onDelete,
  onToggleStatus,
  logs
}) => {
  if (!user) return null;
  
  const perf = userPerformanceMap.get(user.name) || { totalSales: 0, orderCount: 0, refundCount: 0, refundValue: 0, lastActive: null, recentOrders: [], dailySales: [] };
  const contractStatus = getContractStatus(user.contractEndDate);
  const isTop = topPerformer === user.name;
  
  // Calculate Advanced Stats
  const avgBasket = perf.orderCount > 0 ? perf.totalSales / perf.orderCount : 0;
  const refundRate = perf.orderCount > 0 ? (perf.refundCount / (perf.orderCount + perf.refundCount)) * 100 : 0;

  return (
      <div className="w-full lg:w-[480px] bg-white border-r border-slate-200 shadow-2xl flex flex-col h-full animate-in slide-in-from-left duration-300 relative z-20">
          <div className="bg-slate-900 text-white p-6 relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl translate-x-10 -translate-y-10"></div>
              
              <div className="flex justify-between items-start relative z-10">
                <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-2">
                    {isTop && (
                        <div className="flex items-center gap-1 bg-amber-400 text-amber-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg shadow-amber-900/20 animate-pulse">
                            <Crown className="w-3 h-3 fill-current" />
                            الموظف المثالي
                        </div>
                    )}
                    {onToggleStatus && (
                         <button onClick={() => onToggleStatus(user)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-xs flex items-center gap-1" title={user.isActive ? "حظر الموظف" : "تفعيل الموظف"}>
                             {user.isActive ? <Lock className="w-4 h-4 text-red-300"/> : <CheckCircle className="w-4 h-4 text-green-300"/>}
                         </button>
                    )}
                    <button onClick={() => onEdit(user)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors" title="تعديل">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(user.id!)} className="p-2 bg-white/10 hover:bg-red-500/20 text-red-200 rounded-full transition-colors" title="حذف">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              </div>
              
              <div className="flex flex-col items-center mt-2 relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-4xl font-bold shadow-xl border-4 border-white/10 mb-3 relative overflow-hidden">
                      {user.idCardImage ? (
                          <img src={user.idCardImage} className="w-full h-full object-cover" alt="ID" />
                      ) : (
                          user.name.substring(0, 1)
                      )}
                      {!user.isActive && <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center"><Lock className="w-8 h-8 text-white"/></div>}
                  </div>
                  <h2 className="text-xl font-bold">{user.name}</h2>
                  <p className="text-indigo-200 text-sm mt-1 font-medium">{user.jobTitle || (user.role === 'admin' ? 'مدير النظام' : 'موظف')}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm border border-white/5">
                      <p className="text-xs text-indigo-200 mb-1">إجمالي المبيعات</p>
                      <p className="font-bold text-lg">{formatCurrency(perf.totalSales)}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm border border-white/5">
                      <p className="text-xs text-indigo-200 mb-1">عدد الطلبات</p>
                      <p className="font-bold text-lg">{perf.orderCount}</p>
                  </div>
              </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-white px-4">
              <button onClick={() => setActiveTab('overview')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>بيانات عامة</button>
              <button onClick={() => setActiveTab('performance')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'performance' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>مؤشرات الأداء</button>
              <button onClick={() => setActiveTab('activity')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'activity' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>سجل النشاط</button>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6">
              
              {activeTab === 'performance' && (
                  <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                      {/* Performance Chart */}
                      {perf.dailySales.length > 0 && (
                          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                                  أداء المبيعات الأسبوعي
                              </h4>
                              <div className="h-40 w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={perf.dailySales}>
                                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                          <Tooltip 
                                            cursor={{fill: '#f1f5f9'}}
                                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                            formatter={(val: number) => [formatCurrency(val), 'المبيعات']}
                                          />
                                          <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                                      </BarChart>
                                  </ResponsiveContainer>
                              </div>
                          </div>
                      )}

                      {/* KPIs */}
                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                              <p className="text-xs text-slate-400 font-bold mb-1 flex items-center gap-1"><Activity className="w-3 h-3"/> متوسط السلة</p>
                              <p className="text-xl font-black text-slate-800">{formatCurrency(avgBasket)}</p>
                          </div>
                          <div className={`bg-white p-4 rounded-xl border shadow-sm ${refundRate > 5 ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}>
                              <p className={`text-xs font-bold mb-1 flex items-center gap-1 ${refundRate > 5 ? 'text-red-500' : 'text-slate-400'}`}>
                                  <RotateCcw className="w-3 h-3"/> معدل المرتجعات
                              </p>
                              <p className={`text-xl font-black ${refundRate > 5 ? 'text-red-700' : 'text-slate-800'}`}>
                                  {refundRate.toFixed(1)}%
                              </p>
                          </div>
                      </div>
                  </div>
              )}

              {activeTab === 'overview' && (
                  <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">بيانات الاتصال</h4>
                          <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Phone className="w-4 h-4" /></div>
                                  <div>
                                      <p className="text-xs text-slate-400">الهاتف</p>
                                      <p className="text-sm font-medium text-slate-800" dir="ltr">{user.phone || '-'}</p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-3">
                                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><MapPin className="w-4 h-4" /></div>
                                  <div>
                                      <p className="text-xs text-slate-400">العنوان</p>
                                      <p className="text-sm font-medium text-slate-800">{user.address || '-'}</p>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">حالة التعاقد</h4>
                          <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-slate-600">تاريخ البدء</span>
                              <span className="text-sm font-bold">{user.startDate ? formatDate(user.startDate) : '-'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">نهاية العقد</span>
                              <span className={`text-xs px-2 py-1 rounded ${contractStatus.color}`}>{contractStatus.label}</span>
                          </div>
                          {contractStatus.days && contractStatus.days > 0 && (
                              <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${contractStatus.days < 30 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{width: '80%'}}></div>
                              </div>
                          )}
                      </div>
                  </div>
              )}

              {activeTab === 'activity' && (
                  <div className="space-y-0 animate-in slide-in-from-right-4 duration-300">
                      {logs && logs.length > 0 ? (
                          <div className="relative border-r border-slate-200 mr-2 space-y-6">
                              {logs.map(log => (
                                  <div key={log.id} className="relative pr-6">
                                      <div className={`absolute -right-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-slate-50 ${log.status === 'error' ? 'bg-red-500' : 'bg-indigo-500'}`}></div>
                                      <div>
                                          <p className="text-xs text-slate-400 font-mono mb-1">
                                              {new Date(log.date).toLocaleDateString()} • {new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                          </p>
                                          <p className="font-bold text-sm text-slate-800">{log.action}</p>
                                          {log.details && <p className="text-xs text-slate-500 mt-1">{log.details}</p>}
                                          {log.amount ? <p className="text-xs font-bold text-emerald-600 mt-1">{formatCurrency(log.amount)}</p> : null}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="text-center py-10 text-slate-400">
                              <Clock className="w-10 h-10 mx-auto mb-2 opacity-20" />
                              <p>لا يوجد نشاط مسجل مؤخراً</p>
                          </div>
                      )}
                  </div>
              )}
          </div>

          <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
              <button 
                onClick={() => onEdit(user)}
                className="flex-1 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
              >
                  <Edit2 className="w-4 h-4" /> تعديل
              </button>
              <button 
                onClick={() => onDelete(user.id!)}
                className="flex-1 py-3 bg-red-50 text-red-700 font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                  <Trash2 className="w-4 h-4" /> حذف
              </button>
          </div>
      </div>
  );
};

export default UserDetailSidebar;
