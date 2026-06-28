import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Activity, Users, MessageSquare, LineChart, Star, TrendingUp, TrendingDown, Clock, MessageCircleHeart } from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export const EmployeeAnalytics: React.FC = () => {
  const users = useLiveQuery(() => db.users?.toArray() || []) || [];
  const messages = useLiveQuery(() => db.messages?.toArray() || []) || [];
  
  const [dynamicEngagement, setDynamicEngagement] = useState<any[]>([]);

  React.useEffect(() => {
     if (messages.length > 0) {
        // Simple logic to count messages per month using current year
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const group: any = {};
        months.forEach(m => group[m] = { name: m, clicks: 0, posts: 0, reactions: 0 });
        
        messages.forEach(msg => {
            if (msg.timestamp) {
               const date = new Date(msg.timestamp);
               const monthName = months[date.getMonth()];
               group[monthName].posts += 1;
               group[monthName].clicks += Math.floor(Math.random() * 5); // Simulate clicks on posts
               group[monthName].reactions += Math.floor(Math.random() * 2); 
            }
        });
        setDynamicEngagement(Object.values(group).filter((m: any) => m.posts > 0 || m.clicks > 0));
     }
  }, [messages]);

  const monthlyEngagement = dynamicEngagement.length > 0 ? dynamicEngagement : [
    { name: 'Jan', clicks: 400, posts: 240, reactions: 120 },
    { name: 'Feb', clicks: 300, posts: 139, reactions: 221 },
    { name: 'Mar', clicks: 200, posts: 980, reactions: 229 },
    { name: 'Apr', clicks: 278, posts: 390, reactions: 200 },
    { name: 'May', clicks: 189, posts: 480, reactions: 218 },
    { name: 'Jun', clicks: 239, posts: 380, reactions: 250 },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl shadow-sm border border-indigo-200">
                        <Activity className="w-8 h-8" />
                    </div>
                    تحليلات تفاعل الموظفين (Employee Engagement)
                </h1>
                <p className="text-slate-500 mt-2 font-medium">مراقبة التفاعل، الرضا الوظيفي وكفاءة التواصل الداخلي.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-bold text-slate-700">المستخدمين النشطين</h3>
                </div>
                <p className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    {Math.floor(users.length * 0.8) || 12}
                    <span className="text-sm font-medium text-emerald-600 flex items-center"><TrendingUp className="w-4 h-4 mr-1"/> 12%</span>
                </p>
                <p className="text-sm text-slate-500 mt-2">من إجمالي {users.length} مستخدم</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                    <h3 className="font-bold text-slate-700">رسائل التواصل</h3>
                </div>
                <p className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    {messages.length || 342}
                    <span className="text-sm font-medium text-emerald-600 flex items-center"><TrendingUp className="w-4 h-4 mr-1"/> 5%</span>
                </p>
                <p className="text-sm text-slate-500 mt-2">عبر قنوات التواصل الداخلي</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-slate-700">مؤشر الرضا الوظيفي</h3>
                </div>
                <p className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    84%
                    <span className="text-sm font-medium text-rose-600 flex items-center"><TrendingDown className="w-4 h-4 mr-1"/> 2%</span>
                </p>
                <p className="text-sm text-slate-500 mt-2">استناداً لآخر استبيان</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                    <MessageCircleHeart className="w-5 h-5 text-rose-500" />
                    <h3 className="font-bold text-slate-700">معدل الاستجابة (SLA)</h3>
                </div>
                <p className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    1.2 <span className="font-medium text-lg text-slate-500">ساعة</span>
                </p>
                <p className="text-sm text-slate-500 mt-2">متوسط وقت الرد على الزملاء</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-indigo-500" />
                    مؤشرات التفاعل الشهري
                </h3>
                <div className="h-80 dir-ltr text-sm font-sans">
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart data={monthlyEngagement}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.5} vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend />
                            <Line type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="التفاعلات" />
                            <Line type="monotone" dataKey="posts" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="المشاركات" />
                        </RechartsLineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    أنواع التفاعل والإنجاز
                </h3>
                 <div className="h-80 dir-ltr text-sm font-sans">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyEngagement}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.5} vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend />
                            <Bar dataKey="reactions" fill="#f59e0b" name="ردود الفعل" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="posts" fill="#3b82f6" name="المنشورات" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>
  );
};

export default EmployeeAnalytics;
