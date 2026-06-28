import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { User } from '../../types';
import { Briefcase, Clock, Calendar } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface JobsTabProps {
  user: User;
}

export const JobsTab: React.FC<JobsTabProps> = ({ user }) => {
  const { showToast } = useToast();

  const openJobs = useLiveQuery(() => {
    return db.jobPostings.where('status').equals('open').toArray();
  });

  const myJobApplications = useLiveQuery(() => {
    if (!user?.name) return [];
    return db.jobApplications.where('applicantName').equals(user.name).toArray();
  }, [user?.name]);

  const handleApplyForJob = async (job: any) => {
    if (!user?.name) return;
    
    try {
      await db.jobApplications.add({
        jobId: job.id,
        position: job.title,
        applicantName: user.name,
        email: user.name + '@example.com', // mock email
        phone: 'N/A', // mock phone
        status: 'applied',
        appliedDate: new Date()
      });
      showToast('تم التقديم للوظيفة بنجاح', 'success');
    } catch(err) {
      showToast('حدث خطأ أثناء التقديم', 'error');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800">الشواغر الداخلية</h2>
        <p className="text-sm text-gray-500">الوظائف المتاحة داخل الشركة للتقديم الداخلي</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {openJobs?.map(job => (
          <div key={job.id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-gray-800 mb-1">{job.title}</h3>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {job.department}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {job.type === 'full-time' ? 'دوام كامل' : job.type === 'part-time' ? 'دوام جزئي' : job.type === 'remote' ? 'عن بعد' : 'عقد'}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  نشر في: {new Date(job.postedDate).toLocaleDateString('ar-EG')}
                </div>
              </div>
            </div>
            {myJobApplications?.some(app => app.jobId === job.id) ? (
              <button disabled className="bg-gray-100 text-gray-500 px-6 py-2 rounded-lg font-medium whitespace-nowrap cursor-not-allowed">
                تم التقديم
              </button>
            ) : (
              <button 
                onClick={() => handleApplyForJob(job)}
                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
              >
                التقديم للوظيفة
              </button>
            )}
          </div>
        ))}
        {openJobs?.length === 0 && (
          <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p>لا توجد شواغر داخلية متاحة حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
};
