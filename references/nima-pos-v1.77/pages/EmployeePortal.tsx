import React, { useState } from 'react';
import { 
  FileText, Calendar, Banknote, Clock, UserCheck, 
  ListTodo, Briefcase, ShoppingCart, Laptop, 
  Coins, Wallet, Star, GraduationCap, AlertTriangle, Gift
} from 'lucide-react';
import { User } from '../types';
import { LeavesTab } from '../components/employee-portal/LeavesTab';
import { LoansTab } from '../components/employee-portal/LoansTab';
import { PayrollTab } from '../components/employee-portal/PayrollTab';
import { AttendanceTab } from '../components/employee-portal/AttendanceTab';
import { TasksTab } from '../components/employee-portal/TasksTab';
import { JobsTab } from '../components/employee-portal/JobsTab';
import { PurchaseRequestsTab } from '../components/employee-portal/PurchaseRequestsTab';
import { AssetsTab } from '../components/employee-portal/AssetsTab';
import { CommissionsTab } from '../components/employee-portal/CommissionsTab';
import { PettyCashTab } from '../components/employee-portal/PettyCashTab';
import { PerformanceAppraisalsTab } from '../components/employee-portal/PerformanceAppraisalsTab';
import { TrainingEnrollmentsTab } from '../components/employee-portal/TrainingEnrollmentsTab';
import { DisciplinaryActionsTab } from '../components/employee-portal/DisciplinaryActionsTab';
import { BenefitsTab } from '../components/employee-portal/BenefitsTab';

const EmployeePortal: React.FC = () => {
  const user: User = JSON.parse(localStorage.getItem('nima_user') || '{}');
  const [activeTab, setActiveTab] = useState<'leaves' | 'loans' | 'payroll' | 'attendance' | 'tasks' | 'jobs' | 'purchaseRequests' | 'assets' | 'commissions' | 'pettyCash' | 'performanceAppraisals' | 'trainingEnrollments' | 'disciplinaryActions' | 'benefits'>('leaves');

  if (!user?.id) return (
    <div className="p-6 text-center text-gray-500">
      يرجى تسجيل الدخول للوصول إلى بوابة الموظفين.
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">بوابة الخدمة الذاتية للموظفين (ESS)</h1>
          <p className="text-gray-500">أهلاً بك، {user.name}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveTab('leaves')}
          className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'leaves' ? 'border-indigo-600 text-indigo-600 ' : 'border-transparent text-gray-500 hover:text-gray-700 '
          }`}
        >
          <Calendar className="w-5 h-5" />
          الإجازات والاستئذان
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'loans' ? 'border-indigo-600 text-indigo-600 ' : 'border-transparent text-gray-500 hover:text-gray-700 '
          }`}
        >
          <Banknote className="w-5 h-5" />
          السلف والقروض
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'payroll' ? 'border-indigo-600 text-indigo-600 ' : 'border-transparent text-gray-500 hover:text-gray-700 '
          }`}
        >
          <Clock className="w-5 h-5" />
          مسير الرواتب
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'attendance' ? 'border-indigo-600 text-indigo-600 ' : 'border-transparent text-gray-500 hover:text-gray-700 '
          }`}
        >
          <UserCheck className="w-5 h-5" />
          الحضور والانصراف
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'tasks' ? 'border-indigo-600 text-indigo-600 ' : 'border-transparent text-gray-500 hover:text-gray-700 '
          }`}
        >
          <ListTodo className="w-5 h-5" />
          المهام
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'jobs' ? 'border-indigo-600 text-indigo-600 ' : 'border-transparent text-gray-500 hover:text-gray-700 '
          }`}
        >
          <Briefcase className="w-5 h-5" />
          الوظائف الداخلية
        </button>
        <button
          onClick={() => setActiveTab('purchaseRequests')}
          className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'purchaseRequests' ? 'border-indigo-600 text-indigo-600 ' : 'border-transparent text-gray-500 hover:text-gray-700 '
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          طلبات الشراء
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'assets' ? 'border-indigo-600 text-indigo-600 ' : 'border-transparent text-gray-500 hover:text-gray-700 '
          }`}
        >
          <Laptop className="w-5 h-5" />
          العهد العينية
        </button>
        <button
          onClick={() => setActiveTab('commissions')}
          className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'commissions' ? 'border-indigo-600 text-indigo-600 ' : 'border-transparent text-gray-500 hover:text-gray-700 '
          }`}
        >
          <Coins className="w-5 h-5" />
          العمولات والحوافز
        </button>
        <button
          onClick={() => setActiveTab('pettyCash')}
          className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'pettyCash' ? 'border-indigo-600 text-indigo-600 ' : 'border-transparent text-gray-500 hover:text-gray-700 '
          }`}
        >
          <Wallet className="w-5 h-5" />
          العهد المالية
        </button>
        <button
          onClick={() => setActiveTab('performanceAppraisals')}
          className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'performanceAppraisals' ? 'border-indigo-600 text-indigo-600 ' : 'border-transparent text-gray-500 hover:text-gray-700 '
          }`}
        >
          <Star className="w-5 h-5" />
          تقييم الأداء
        </button>
        <button
          onClick={() => setActiveTab('trainingEnrollments')}
          className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'trainingEnrollments' ? 'border-indigo-600 text-indigo-600 ' : 'border-transparent text-gray-500 hover:text-gray-700 '
          }`}
        >
          <GraduationCap className="w-5 h-5" />
          الدورات التدريبية
        </button>
        <button
          onClick={() => setActiveTab('disciplinaryActions')}
          className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'disciplinaryActions' ? 'border-indigo-600 text-indigo-600 ' : 'border-transparent text-gray-500 hover:text-gray-700 '
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
          الإجراءات التأديبية
        </button>
        <button
          onClick={() => setActiveTab('benefits')}
          className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'benefits' ? 'border-indigo-600 text-indigo-600 ' : 'border-transparent text-gray-500 hover:text-gray-700 '
          }`}
        >
          <Gift className="w-5 h-5" />
          المزايا
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeTab === 'leaves' && <LeavesTab user={user} />}
        {activeTab === 'loans' && <LoansTab user={user} />}
        {activeTab === 'payroll' && <PayrollTab user={user} />}
        {activeTab === 'attendance' && <AttendanceTab user={user!} />}
        {activeTab === 'tasks' && <TasksTab user={user} />}
        {activeTab === 'jobs' && <JobsTab user={user} />}
        {activeTab === 'purchaseRequests' && <PurchaseRequestsTab user={user} />}
        {activeTab === 'assets' && <AssetsTab user={user} />}
        {activeTab === 'commissions' && <CommissionsTab user={user} />}
        {activeTab === 'pettyCash' && <PettyCashTab user={user} />}
        {activeTab === 'performanceAppraisals' && <PerformanceAppraisalsTab user={user} />}
        {activeTab === 'trainingEnrollments' && <TrainingEnrollmentsTab user={user} />}
        {activeTab === 'disciplinaryActions' && <DisciplinaryActionsTab user={user} />}
        {activeTab === 'benefits' && <BenefitsTab user={user} />}
      </div>
    </div>
  );
};

export default EmployeePortal;
