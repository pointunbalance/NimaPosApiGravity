import React from 'react';
import { Apple, Calendar, Salad, AlertTriangle, Coffee, ClipboardList, PieChart } from 'lucide-react';
import { format } from 'date-fns';

import { useSchoolMeals } from '../../components/school/meals/useSchoolMeals';
import { MealTrackingView } from '../../components/school/meals/MealTrackingView';
import { MealScheduleView } from '../../components/school/meals/MealScheduleView';
import { MealRestrictionsView } from '../../components/school/meals/MealRestrictionsView';
import { MealReportsView } from '../../components/school/meals/MealReportsView';
import { SchoolMealScheduleModal } from '../../components/school/meals/SchoolMealScheduleModal';
import { SchoolMealRestrictionModal } from '../../components/school/meals/SchoolMealRestrictionModal';

const EATING_STATUS_COLORS = {
  'جيد': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'متوسط': 'bg-amber-100 text-amber-700 border-amber-200',
  'ضعيف': 'bg-rose-100 text-rose-700 border-rose-200',
  'لم يأكل': 'bg-slate-100 text-slate-700 border-slate-200',
};

const MEAL_TYPES = [
  { id: 'breakfast', label: 'إفطار', icon: Coffee },
  { id: 'snack', label: 'سناك', icon: Apple },
  { id: 'lunch', label: 'غداء', icon: Salad },
];

const WEEK_DAYS = [
  { id: 'sunday', label: 'الأحد' },
  { id: 'monday', label: 'الإثنين' },
  { id: 'tuesday', label: 'الثلاثاء' },
  { id: 'wednesday', label: 'الأربعاء' },
  { id: 'thursday', label: 'الخميس' }
];

export const SchoolMeals = () => {
  const {
    activeTab,
    setActiveTab,
    trackingDate,
    setTrackingDate,
    trackingClass,
    setTrackingClass,
    classes,
    students,
    studentMeals,
    isScheduleModalOpen,
    setIsScheduleModalOpen,
    scheduleForm,
    setScheduleForm,
    isRestrictionModalOpen,
    setIsRestrictionModalOpen,
    allergies,
    setAllergies,
    dietaryNotes,
    setDietaryNotes,
    handleSaveMealTracking,
    openRestrictionsModal,
    saveRestrictions,
    openScheduleModal,
    saveSchedule,
    getDailyMenu
  } = useSchoolMeals();

  return (
    <div className="p-6" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-2xl">
            <Salad className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">التغذية والوجبات</h1>
            <p className="text-slate-500 font-medium">إدارة الوجبات، الممنوعات الغذائية، وتتبع تغذية الأطفال</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 hide-scrollbar">
        <button
          onClick={() => setActiveTab('tracking')}
          className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'tracking'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-200'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <ClipboardList className="w-4 h-4" /> متابعة الوجبات اليومية
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'schedule'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-200'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" /> جدول الوجبات الدائم
        </button>
        <button
          onClick={() => setActiveTab('restrictions')}
          className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'restrictions'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-200'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> الممنوعات والملاحظات
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-200'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <PieChart className="w-4 h-4" /> تقارير التغذية
        </button>
      </div>

      {/* Content Based on Tab */}
      {activeTab === 'tracking' && (
        <MealTrackingView
          trackingDate={trackingDate}
          setTrackingDate={setTrackingDate}
          trackingClass={trackingClass}
          setTrackingClass={setTrackingClass}
          classes={classes}
          students={students}
          studentMeals={studentMeals}
          handleSaveMealTracking={handleSaveMealTracking}
          MEAL_TYPES={MEAL_TYPES}
          EATING_STATUS_COLORS={EATING_STATUS_COLORS}
        />
      )}

      {activeTab === 'schedule' && (
        <MealScheduleView
          WEEK_DAYS={WEEK_DAYS}
          getDailyMenu={getDailyMenu}
          openScheduleModal={openScheduleModal}
        />
      )}

      {activeTab === 'restrictions' && (
        <MealRestrictionsView
          students={students}
          classes={classes}
          trackingClass={trackingClass}
          openRestrictionsModal={openRestrictionsModal}
        />
      )}

      {activeTab === 'reports' && (
        <MealReportsView classes={classes} students={students} />
      )}

      {/* Schedule Modal */}
      <SchoolMealScheduleModal
        isScheduleModalOpen={isScheduleModalOpen}
        setIsScheduleModalOpen={setIsScheduleModalOpen}
        scheduleForm={scheduleForm}
        setScheduleForm={setScheduleForm}
        saveSchedule={saveSchedule}
        WEEK_DAYS={WEEK_DAYS}
      />

      {/* Restrictions Modal */}
      <SchoolMealRestrictionModal
        isRestrictionModalOpen={isRestrictionModalOpen}
        setIsRestrictionModalOpen={setIsRestrictionModalOpen}
        allergies={allergies}
        setAllergies={setAllergies}
        dietaryNotes={dietaryNotes}
        setDietaryNotes={setDietaryNotes}
        saveRestrictions={saveRestrictions}
      />
    </div>
  );
};

export default SchoolMeals;
