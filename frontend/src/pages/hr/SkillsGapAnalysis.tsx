import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Target, Users, BookOpen, Search, ArrowUpRight, Crosshair, Award } from 'lucide-react';

const SKILLS_DATABASE = [
  'React', 'TypeScript', 'Node.js', 'Python', 'Machine Learning', 
  'Project Management', 'Communication', 'Leadership', 'Sales', 'Data Analysis'
];

export default function SkillsGapAnalysis() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const users = useLiveQuery(() => db.users.where('isActive').equals(1).toArray());
  const trainingCourses = useLiveQuery(() => db.trainingCourses.toArray());

  // Simulate required skills for positions
  const getRequiredSkills = (role: string | undefined) => {
    switch(role?.toLowerCase()) {
      case 'developer': return ['React', 'TypeScript', 'Node.js'];
      case 'manager': return ['Project Management', 'Leadership', 'Communication'];
      case 'sales': return ['Sales', 'Communication', 'Data Analysis'];
      default: return ['Communication'];
    }
  };

  // Simulate current skills based on courses completed + random base
  const getEmployeeSkills = (userId: number) => {
    // For demo purposes, we randomly assign base skills based on userId so it's deterministic but varies
    const hasSkill = (idx: number) => (userId * idx) % 3 === 0;
    const baseSkills = SKILLS_DATABASE.filter((_, idx) => hasSkill(idx + 1));
    return baseSkills;
  };

  const analysis = useMemo(() => {
    if (!users) return [];
    
    return users.map(user => {
      const required = getRequiredSkills(user.role);
      const current = getEmployeeSkills(user.id!);
      
      const missing = required.filter(r => !current.includes(r));
      const matchPercentage = required.length === 0 ? 100 : Math.round(((required.length - missing.length) / required.length) * 100);
      
      return {
        user,
        required,
        current,
        missing,
        matchPercentage
      };
    }).sort((a, b) => a.matchPercentage - b.matchPercentage);
  }, [users]);

  const filteredAnalysis = analysis.filter(item => 
    item.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.user.jobTitle && item.user.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Target className="w-8 h-8 text-indigo-600" />
            تحليل فجوة المهارات (Skills Gap Analysis)
          </h1>
          <p className="text-slate-500 mt-1">تحديد المهارات المفقودة وتوجيه الموظفين للدورات المناسبة لضمان تطورهم.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="البحث باسم الموظف أو المسمى الوظيفي..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAnalysis.map(item => (
          <div key={item.user.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{item.user.name}</h3>
                <p className="text-sm text-slate-500">{item.user.jobTitle || item.user.role || 'موظف'}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${
                item.matchPercentage >= 80 ? 'bg-emerald-100 text-emerald-700' :
                item.matchPercentage >= 50 ? 'bg-amber-100 text-amber-700' :
                'bg-rose-100 text-rose-700'
              }`}>
                <Crosshair size={14} />
                {item.matchPercentage}% تطابق
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                  <Award size={16} /> المهارات المستهدفة للدور:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {item.required.map(skill => (
                    <span key={skill} className={`text-xs px-2 py-1 rounded-md mb-1 ${item.current.includes(skill) ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                       {skill}
                    </span>
                  ))}
                </div>
              </div>

              {item.missing.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-rose-600 mb-2 flex items-center gap-1">
                    <ArrowUpRight size={16} /> فجوة المهارات (يحتاج تطوير):
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.missing.map(skill => (
                      <span key={skill} className="text-xs px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-md">
                         {skill}
                      </span>
                    ))}
                  </div>
                  
                  {/* Action Suggestion */}
                  <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    <p className="text-xs font-medium text-indigo-800 flex items-center gap-1 mb-1">
                      <BookOpen size={14} /> توصية تدريبية:
                    </p>
                    <p className="text-xs text-indigo-600">
                      يُقترح تعيين الموظف لدورات تدريبية تغطي ({item.missing[0]}).
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredAnalysis.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            لا يوجد موظفين مسجلين بناءً على بحثك
          </div>
        )}
      </div>
    </div>
  );
}
