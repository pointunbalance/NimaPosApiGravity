import React from 'react';
import { Paperclip, Upload } from 'lucide-react';

interface AttachmentsTabProps {}

export const AttachmentsTab: React.FC<AttachmentsTabProps> = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
       <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <Paperclip className="w-6 h-6 text-indigo-600" />
          <h3 className="text-xl font-black text-slate-800">مرفقات ومستندات الطفل</h3>
       </div>
       <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
          <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="font-bold text-slate-700">اسحب وأفلت الملفات هنا، أو اضغط للاختيار</p>
          <p className="text-sm text-slate-500 mt-2">شهادة الميلاد، صور شخصية، تقارير طبية، إلخ (سيتم تخزينها محلياً)</p>
       </div>
       <p className="text-center text-slate-500 font-bold mt-4">لا توجد مرفقات مسجلة حالياً.</p>
    </div>
  );
};
