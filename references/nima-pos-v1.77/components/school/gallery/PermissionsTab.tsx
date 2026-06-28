import React from 'react';

interface PermissionsTabProps {
  students: any[];
  classes: any[];
  handleToggleStudentPermission: (studentId: number, field: 'photographyAllowed' | 'publishingAllowed', val: boolean) => void;
}

export const PermissionsTab: React.FC<PermissionsTabProps> = ({
  students,
  classes,
  handleToggleStudentPermission,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div>
          <h2 className="text-lg font-black text-slate-800">صلاحيات التصوير والنشر للأطفال</h2>
          <p className="text-sm text-slate-500 font-medium">بناءً على طلب ولي الأمر</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-4 font-bold text-slate-600">اسم الطفل</th>
              <th className="p-4 font-bold text-slate-600">الفصل</th>
              <th className="p-4 font-bold text-slate-600 text-center">مسموح تصويره</th>
              <th className="p-4 font-bold text-slate-600 text-center">مسموح بنشر صوره كدعاية</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-slate-800">{student.name}</td>
                <td className="p-4 text-slate-600 font-medium">
                  {classes.find((c) => c.id === student.classroomId)?.name || '-'}
                </td>

                <td className="p-4 text-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={student.photographyAllowed ?? true}
                      onChange={(e) =>
                        handleToggleStudentPermission(student.id!, 'photographyAllowed', e.target.checked)
                      }
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </td>

                <td className="p-4 text-center">
                  <label className="relative inline-flex items-center cursor-pointer text-center">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={student.publishingAllowed ?? true}
                      onChange={(e) =>
                        handleToggleStudentPermission(student.id!, 'publishingAllowed', e.target.checked)
                      }
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default PermissionsTab;
