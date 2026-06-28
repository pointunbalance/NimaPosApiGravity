import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Network, Search, AlertCircle, ArrowRight, UserPlus, TrendingUp, ShieldAlert, Award, Users, X, Save, Plus, Trash2 } from 'lucide-react';
import { User, SuccessionPlan } from '../../types';
import { useToast } from '../../context/ToastContext';
import { SuccessionPlanModal } from '../../components/hr/SuccessionPlanModal';

// Key Roles that require succession planning
const KEY_ROLES = [
    'مدير عام', 
    'مدير فرع', 
    'مدير الموارد البشرية', 
    'مدير مالي', 
    'رئيس قسم المبيعات'
];

export default function SuccessionPlanning() {
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const employeeList = useLiveQuery(() => db.users.where('isActive').equals(1).toArray()) || [];
  const savedPlans = useLiveQuery(() => db.successionPlans.toArray()) || [];

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<SuccessionPlan> | null>(null);

  // Helper: Get data merging DB state and basic defaults
  const getSuccessionData = (role: string) => {
    const occupant = employeeList.find(u => u.jobTitle === role || u.role === role);
    const dbPlan = savedPlans.find(p => p.role === role);

    let successors: {user: User, readiness: number, flightRisk: number}[] = [];

    if (dbPlan) {
        successors = dbPlan.successors.map(s => {
            const user = employeeList.find(u => u.id === s.employeeId);
            return user ? { user, readiness: s.readiness, flightRisk: s.flightRisk } : null;
        }).filter(Boolean) as any;
    } else {
        // Fallback or generic defaults to encourage them to save
        successors = employeeList
            .filter(u => u.id !== occupant?.id && u.jobTitle !== role)
            .map(u => ({
                user: u,
                readiness: (u.id! * 17) % 100,
                flightRisk: (u.id! * 13) % 100
            }))
            .filter(s => s.readiness > 60)
            .sort((a, b) => b.readiness - a.readiness)
            .slice(0, 3);
    }

    return {
        id: dbPlan?.id,
        role,
        occupant,
        successors: successors.sort((a, b) => b.readiness - a.readiness),
        riskLevel: occupant ? 'منخفض' : 'حرج (شاغر)',
        isSaved: !!dbPlan
    };
  };

  const successionPlans = useMemo(() => {
    return KEY_ROLES.map(role => getSuccessionData(role));
  }, [employeeList, savedPlans]);

  const handleEdit = (planData: any) => {
      setEditingPlan({
          role: planData.role,
          id: planData.id,
          occupantId: planData.occupant?.id,
          lastReviewed: new Date().toISOString(),
          successors: planData.successors.map((s: any) => ({
              employeeId: s.user.id,
              readiness: s.readiness,
              flightRisk: s.flightRisk
          }))
      });
      setIsEditModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingPlan || !editingPlan.role) return;

      try {
          if (editingPlan.id) {
              await db.successionPlans.update(editingPlan.id, {
                  ...editingPlan,
                  lastReviewed: new Date().toISOString()
              });
          } else {
              await db.successionPlans.add({
                  ...editingPlan,
                  lastReviewed: new Date().toISOString()
              } as SuccessionPlan);
          }
          showToast('تم حفظ خطة التعاقب', 'success');
          setIsEditModalOpen(false);
      } catch (err) {
          showToast('حدث خطأ أثناء حفظ الخطة', 'error');
      }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 flex-1">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Network className="w-8 h-8 text-indigo-600" />
            تخطيط التعاقب الوظيفي (Succession Planning)
          </h1>
          <p className="text-slate-500 mt-1">
              ضمان استمرارية الأعمال عبر تحديد وتجهيز خلفاء للأدوار القيادية والحرجة في المؤسسة.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {successionPlans.map((plan, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
                  
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
                      <div>
                          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                              {plan.role} 
                              {!plan.isSaved && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">مسودة تلقائية</span>}
                          </h3>
                          <div className="mt-2 flex items-center gap-2 text-sm">
                              <span className="text-slate-500">الشاغل الحالي:</span>
                              <span className="font-bold text-slate-700">
                                  {plan.occupant ? plan.occupant.name : <span className="text-rose-500 font-bold">لا يوجد (المنصب شاغر)</span>}
                              </span>
                          </div>
                      </div>
                      <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${!plan.occupant ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                           {plan.riskLevel}
                      </div>
                  </div>

                  <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                          <Users size={16} className="text-indigo-500"/> البدلاء المحتملون (Succession Pool)
                      </h4>
                      {plan.successors.length > 0 ? (
                          <div className="space-y-3">
                              {plan.successors.map((candidate, i) => (
                                  <div key={i} className="flex flex-col bg-slate-50 p-3 rounded-xl border border-slate-100">
                                      <div className="flex justify-between items-center mb-2">
                                          <div className="font-bold text-slate-800 flex items-center gap-2">
                                              <span className="bg-white w-6 h-6 rounded-full flex justify-center items-center text-xs shadow-sm border border-slate-200 text-slate-500">
                                                 #{i + 1}
                                              </span>
                                              {candidate.user.name}
                                          </div>
                                          <div className="text-xs text-slate-500 font-medium">
                                              {candidate.user.jobTitle || 'موظف'}
                                          </div>
                                      </div>
                                      
                                      <div className="flex gap-4 mt-1">
                                          <div className="flex-1">
                                              <div className="flex justify-between text-xs mb-1">
                                                  <span className="text-slate-500 flex items-center gap-1"><Award size={12}/> الجاهزية</span>
                                                  <span className={`font-bold ${candidate.readiness >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                      {candidate.readiness}%
                                                  </span>
                                              </div>
                                              <div className="w-full bg-slate-200 rounded-full h-1.5">
                                                  <div className={`h-1.5 rounded-full ${candidate.readiness >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${candidate.readiness}%` }}></div>
                                              </div>
                                          </div>
                                          <div className="flex-1">
                                              <div className="flex justify-between text-xs mb-1">
                                                  <span className="text-slate-500 flex items-center gap-1"><ShieldAlert size={12}/> خطر المغادرة</span>
                                                  <span className={`font-bold ${candidate.flightRisk >= 70 ? 'text-rose-600' : 'text-slate-600'}`}>
                                                      {candidate.flightRisk}%
                                                  </span>
                                              </div>
                                              <div className="w-full bg-slate-200 rounded-full h-1.5">
                                                  <div className={`h-1.5 rounded-full ${candidate.flightRisk >= 70 ? 'bg-rose-500' : 'bg-slate-500'}`} style={{ width: `${candidate.flightRisk}%` }}></div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="bg-rose-50 text-rose-600 p-4 rounded-xl flex items-center gap-2 text-sm border border-rose-100">
                              <AlertCircle size={18} />
                              لا يوجد بدلاء محتملين جاهزين. يرجى توجيه قسم التدريب والتطوير أو التوظيف.
                          </div>
                      )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                       <button onClick={() => handleEdit(plan)} className="text-indigo-600 font-bold text-sm flex items-center gap-1 hover:underline">
                           تعديل خطة التعاقب <ArrowRight size={16} />
                       </button>
                  </div>
              </div>
          ))}
      </div>

      <SuccessionPlanModal
        isOpen={isEditModalOpen}
        editingPlan={editingPlan}
        setEditingPlan={setEditingPlan}
        employeeList={employeeList}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSavePlan}
      />
    </div>
  );
}
