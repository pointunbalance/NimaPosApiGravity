import React from 'react';
import { CheckCircle, BookOpen, FileText } from 'lucide-react';
import { useGrades } from '../../components/school/grades/useGrades';
import { SubjectModal, EvaluationModal } from '../../components/school/grades/GradesModals';
import { SkillsSetupTab } from '../../components/school/grades/SkillsSetupTab';
import { ContinuousEvaluationTab } from '../../components/school/grades/ContinuousEvaluationTab';
import { ReportsCertificatesTab } from '../../components/school/grades/ReportsCertificatesTab';

export const Grades = () => {
  const {
    activeTab,
    setActiveTab,
    classes,
    subjects,
    evaluations,
    isSubjectModalOpen,
    setSubjectModalOpen,
    subjectData,
    setSubjectData,
    evalClassFilter,
    setEvalClassFilter,
    evalDate,
    setEvalDate,
    evalType,
    setEvalType,
    isEvalModalOpen,
    setEvalModalOpen,
    selectedStudentForEval,
    setSelectedStudentForEval,
    evalFormData,
    setEvalFormData,
    generalNotes,
    setGeneralNotes,
    reportClassFilter,
    setReportClassFilter,
    reportStudentFilter,
    setReportStudentFilter,
    handleSaveSubject,
    handleDeleteSubject,
    openEvalModal,
    handleEvalChange,
    handleSaveEvaluation,
    printReport,
    handleSendReport,
    studentsToEvaluate,
    studentsForReports,
    handlePopulateDefaultSubjects,
  } = useGrades();

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen" dir="rtl">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">التقييمات والجانب التعليمي</h1>
        <p className="text-slate-500 mt-1">المهارات، السلوك، التقييم المستمر، الشهادات، والتقارير</p>
      </div>

      <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab('evaluate')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === 'evaluate' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <CheckCircle className="w-5 h-5" /> التقييم المستمر
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === 'reports' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-5 h-5" /> تقارير وشهادات الأطفال
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === 'skills' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-5 h-5" /> إعداد المواد والمهارات
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
        {activeTab === 'skills' && (
          <SkillsSetupTab
            subjects={subjects}
            setSubjectData={setSubjectData}
            setSubjectModalOpen={setSubjectModalOpen}
            handlePopulateDefaultSubjects={handlePopulateDefaultSubjects}
            handleDeleteSubject={handleDeleteSubject}
          />
        )}

        {activeTab === 'evaluate' && (
          <ContinuousEvaluationTab
            evalClassFilter={evalClassFilter}
            setEvalClassFilter={setEvalClassFilter}
            classes={classes}
            evalDate={evalDate}
            setEvalDate={setEvalDate}
            evalType={evalType}
            setEvalType={setEvalType}
            studentsToEvaluate={studentsToEvaluate}
            evaluations={evaluations}
            openEvalModal={openEvalModal}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsCertificatesTab
            reportClassFilter={reportClassFilter}
            setReportClassFilter={setReportClassFilter}
            reportStudentFilter={reportStudentFilter}
            setReportStudentFilter={setReportStudentFilter}
            classes={classes}
            studentsForReports={studentsForReports}
            printReport={printReport}
            handleSendReport={handleSendReport}
          />
        )}
      </div>

      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setSubjectModalOpen(false)}
        formData={subjectData}
        setFormData={setSubjectData}
        onSubmit={handleSaveSubject}
      />

      <EvaluationModal
        isOpen={isEvalModalOpen}
        onClose={() => setEvalModalOpen(false)}
        student={selectedStudentForEval}
        subjects={subjects}
        formData={evalFormData}
        handleEvalChange={handleEvalChange}
        generalNotes={generalNotes}
        setGeneralNotes={setGeneralNotes}
        onSubmit={handleSaveEvaluation}
      />
    </div>
  );
};

export default Grades;
