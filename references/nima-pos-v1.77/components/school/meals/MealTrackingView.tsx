import React from 'react';
import { Coffee, Apple, Salad, AlertTriangle, Users } from 'lucide-react';

interface MealTrackingViewProps {
  trackingDate: string;
  setTrackingDate: (val: string) => void;
  trackingClass: string;
  setTrackingClass: (val: string) => void;
  classes: any[];
  students: any[];
  studentMeals: any[];
  handleSaveMealTracking: (studentId: number, mealType: string, status: string, notes?: string) => void;
  MEAL_TYPES: any[];
  EATING_STATUS_COLORS: Record<string, string>;
}

export const MealTrackingView: React.FC<MealTrackingViewProps> = ({
  trackingDate,
  setTrackingDate,
  trackingClass,
  setTrackingClass,
  classes,
  students,
  studentMeals,
  handleSaveMealTracking,
  MEAL_TYPES,
  EATING_STATUS_COLORS,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">تاريخ اليوم</label>
          <input
            type="date"
            value={trackingDate}
            onChange={(e) => setTrackingDate(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">الفصل</label>
          <select
            value={trackingClass}
            onChange={(e) => setTrackingClass(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-orange-500 outline-none min-w-[200px]"
          >
            <option value="">-- اختر الفصل للبدء --</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!trackingClass ? (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center">
          <Users className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="text-xl font-black text-slate-700 mb-2">اختر الفصل الدراسي</h3>
          <p className="text-slate-500 font-medium max-w-sm">
            الرجاء اختيار فصل دراسي من القائمة بالأعلى للبدء في تسجيل ومتابعة وجبات الأطفال.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 font-bold text-slate-600">اسم الطفل</th>
                  <th className="p-4 font-bold text-slate-600 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Coffee className="w-4 h-4 text-orange-500" /> إفطار
                    </div>
                  </th>
                  <th className="p-4 font-bold text-slate-600 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Apple className="w-4 h-4 text-rose-500" /> سناك
                    </div>
                  </th>
                  <th className="p-4 font-bold text-slate-600 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Salad className="w-4 h-4 text-emerald-500" /> غداء
                    </div>
                  </th>
                  <th className="p-4 font-bold text-slate-600 w-1/4">ملاحظة لولي الأمر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students
                  .filter((s) => s.classroomId === Number(trackingClass))
                  .map((student) => {
                    const sMeal = studentMeals.find((sm) => sm.studentId === student.id);
                    const sMealsData = sMeal?.meals || {};
                    const hasRestriction = student.allergies || student.dietaryNotes;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{student.name}</span>
                            {hasRestriction && (
                              <span
                                className="w-5 h-5 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center cursor-help"
                                title={`ممنوعات: ${student.allergies || 'لا يوجد'} | ملاحظات: ${
                                  student.dietaryNotes || 'لا يوجد'
                                }`}
                              >
                                <AlertTriangle className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </td>

                        {MEAL_TYPES.map((meal) => {
                          const mData = sMealsData[meal.id] || { status: 'لم يأكل' };
                          return (
                            <td key={meal.id} className="p-4">
                              <div className="flex justify-center">
                                <select
                                  value={mData.status}
                                  onChange={(e) =>
                                    handleSaveMealTracking(student.id!, meal.id, e.target.value, mData.notes)
                                  }
                                  className={`text-xs font-bold px-2 py-1.5 rounded-lg border focus:outline-none appearance-none cursor-pointer text-center ${
                                    EATING_STATUS_COLORS[mData.status] || ''
                                  }`}
                                >
                                  <option value="لم يأكل">لم يأكل</option>
                                  <option value="جيد">جيد</option>
                                  <option value="متوسط">متوسط</option>
                                  <option value="ضعيف">ضعيف</option>
                                </select>
                              </div>
                            </td>
                          );
                        })}

                        <td className="p-4">
                          <input
                            type="text"
                            placeholder="مثال: لم يأكل الخضار اليوم..."
                            value={sMealsData['lunch']?.notes || sMealsData['breakfast']?.notes || ''}
                            onChange={(e) => {
                              handleSaveMealTracking(
                                student.id!,
                                'lunch',
                                sMealsData['lunch']?.status || 'لم يأكل',
                                e.target.value
                              );
                            }}
                            className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-orange-500 rounded-md px-2 py-1 text-sm font-medium text-slate-600 placeholder:text-slate-300"
                          />
                        </td>
                      </tr>
                    );
                  })}
                {students.filter((s) => s.classroomId === Number(trackingClass)).length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">
                      لا يوجد أطفال مسجلين في هذا الفصل.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
