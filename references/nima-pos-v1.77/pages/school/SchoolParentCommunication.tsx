import React from 'react';
import { Send, History } from 'lucide-react';
import { useSchoolCommunication } from '../../components/school/communication/useSchoolCommunication';
import { RecipientSelector } from '../../components/school/communication/RecipientSelector';
import { MessageForm } from '../../components/school/communication/MessageForm';
import { CommunicationLogsTab } from '../../components/school/communication/CommunicationLogsTab';
import { FeedbackModal } from '../../components/ui/FeedbackModal';

export const SchoolParentCommunication = () => {
  const {
    activeTab,
    setActiveTab,
    students,
    classes,
    logs,
    selectedStudents,
    classFilter,
    setClassFilter,
    searchStudent,
    setSearchStudent,
    messageTemplate,
    customMessage,
    setCustomMessage,
    channel,
    setChannel,
    feedback,
    setFeedback,
    templates,
    filteredStudents,
    handleSelectAll,
    handleSelectStudent,
    handleTemplateChange,
    handleSendMessage,
  } = useSchoolCommunication();

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">التواصل مع أولياء الأمور</h1>
          <p className="text-slate-500 mt-1">إرسال رسائل وتسجيل الإشعارات المرسلة للحضانة والمدرسة</p>
        </div>
      </div>

      <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab('send')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer text-sm ${
            activeTab === 'send' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Send className="w-5 h-5" /> إرسال رسالة جديدة
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer text-sm ${
            activeTab === 'logs' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <History className="w-5 h-5" /> سجل المراسلات
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
        {activeTab === 'send' && (
          <div className="p-6 flex flex-col lg:flex-row gap-8">
            {/* Students Selection */}
            <RecipientSelector
              filteredStudents={filteredStudents}
              selectedStudents={selectedStudents}
              classes={classes}
              classFilter={classFilter}
              setClassFilter={setClassFilter}
              searchStudent={searchStudent}
              setSearchStudent={setSearchStudent}
              handleSelectAll={handleSelectAll}
              handleSelectStudent={handleSelectStudent}
            />

            {/* Message Composition */}
            <MessageForm
              channel={channel}
              setChannel={setChannel}
              messageTemplate={messageTemplate}
              handleTemplateChange={handleTemplateChange}
              templates={templates}
              customMessage={customMessage}
              setCustomMessage={setCustomMessage}
              handleSendMessage={handleSendMessage}
              selectedStudentsCount={selectedStudents.length}
            />
          </div>
        )}

        {activeTab === 'logs' && (
          <CommunicationLogsTab logs={logs} students={students} templates={templates} />
        )}
      </div>

      <FeedbackModal
        isOpen={feedback !== null}
        type={feedback?.type || 'success'}
        message={feedback?.message || ''}
        onClose={() => setFeedback(null)}
      />
    </div>
  );
};

export default SchoolParentCommunication;
