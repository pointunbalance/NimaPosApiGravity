import React from 'react';
import { MessageCircle, Smartphone, Bell, Send } from 'lucide-react';

interface MessageFormProps {
  channel: 'whatsapp' | 'sms' | 'app';
  setChannel: (val: 'whatsapp' | 'sms' | 'app') => void;
  messageTemplate: string;
  handleTemplateChange: (val: string) => void;
  templates: any[];
  customMessage: string;
  setCustomMessage: (val: string) => void;
  handleSendMessage: () => void;
  selectedStudentsCount: number;
}

export const MessageForm: React.FC<MessageFormProps> = ({
  channel,
  setChannel,
  messageTemplate,
  handleTemplateChange,
  templates,
  customMessage,
  setCustomMessage,
  handleSendMessage,
  selectedStudentsCount,
}) => {
  return (
    <div className="flex-[2] space-y-6">
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-indigo-600" /> إعداد الرسالة
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
            channel === 'whatsapp' ? 'border-[#25D366] bg-[#25D366]/5' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <input
            type="radio"
            name="channel"
            value="whatsapp"
            checked={channel === 'whatsapp'}
            onChange={() => setChannel('whatsapp')}
            className="sr-only"
          />
          <MessageCircle className={`w-8 h-8 mb-2 ${channel === 'whatsapp' ? 'text-[#25D366]' : 'text-slate-400'}`} />
          <span className={`font-bold ${channel === 'whatsapp' ? 'text-[#25D366]' : 'text-slate-600'}`}>
            واتساب
          </span>
          <span className="text-[10px] text-slate-500 mt-1">توجيه تطبيق واتساب/ويب</span>
        </label>
        <label
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
            channel === 'sms' ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <input
            type="radio"
            name="channel"
            value="sms"
            checked={channel === 'sms'}
            onChange={() => setChannel('sms')}
            className="sr-only"
          />
          <Smartphone className={`w-8 h-8 mb-2 ${channel === 'sms' ? 'text-sky-500' : 'text-slate-400'}`} />
          <span className={`font-bold ${channel === 'sms' ? 'text-sky-600' : 'text-slate-600'}`}>
            رسالة نصية SMS
          </span>
          <span className="text-[10px] text-slate-500 mt-1">يحتاج لربط بوابة SMS</span>
        </label>
        <label
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
            channel === 'app' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <input
            type="radio"
            name="channel"
            value="app"
            checked={channel === 'app'}
            onChange={() => setChannel('app')}
            className="sr-only"
          />
          <Bell className={`w-8 h-8 mb-2 ${channel === 'app' ? 'text-indigo-500' : 'text-slate-400'}`} />
          <span className={`font-bold ${channel === 'app' ? 'text-indigo-600' : 'text-slate-600'}`}>
            تطبيق ولي الأمر
          </span>
          <span className="text-[10px] text-slate-500 mt-1">إشعار داخل التطبيق</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">
          استخدام قالب جاهز (اختياري)
        </label>
        <select
          value={messageTemplate}
          onChange={(e) => handleTemplateChange(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 bg-slate-50 font-bold text-xs"
        >
          <option value="">-- اكتب رسالة مخصصة --</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">نص الرسالة</label>
        <textarea
          rows={6}
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 bg-white resize-none text-sm font-medium leading-relaxed"
          placeholder="اكتب رسالتك هنا... (يمكنك استخدام {student_name} ليتم استبدالها باسم الطالب تلقائياً)"
        ></textarea>
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between font-bold">
          <span>
            سيتم استبدال <code>{'{'}student_name{'}'}</code> باسم الطالب المعني.
          </span>
          <span>{customMessage.length} حرف</span>
        </div>
      </div>

      <button
        onClick={handleSendMessage}
        disabled={selectedStudentsCount === 0 || !customMessage.trim()}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg cursor-pointer"
      >
        <Send className="w-6 h-6" /> إرسال الرسائل الآن ({selectedStudentsCount})
      </button>
    </div>
  );
};

export default MessageForm;
