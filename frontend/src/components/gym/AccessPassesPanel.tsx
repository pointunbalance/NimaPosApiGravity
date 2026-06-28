import React from 'react';
import { Printer, User, HelpCircle, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface AccessPassesPanelProps {
  simulationMemberList: any[];
  badgeMemberId: number | null;
  setBadgeMemberId: (id: number) => void;
  currentBadgeMember: any;
}

export const AccessPassesPanel: React.FC<AccessPassesPanelProps> = ({
  simulationMemberList,
  badgeMemberId,
  setBadgeMemberId,
  currentBadgeMember
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6 text-right font-sans" dir="rtl">
      
      <div>
        <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 border-b pb-3.5 flex-row-reverse text-right">
          <Printer className="w-5 h-5 text-indigo-500" />
          <span>منشئ ومصمم بطاقات المرور الذكية للأعضاء</span>
        </h3>
        <p className="text-xs text-slate-400 mt-2 font-bold leading-normal">
          يتيح هذا الاستوديو تخصيص وتوليد رمز استجابة سريعة QR فريد لكل مشترك، وطباعة بطاقات الهوية المادية لتبسيط عبور اللاعبين بمجرد تقريب البطاقة من عدسة الكاميرات بالصالة.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start flex-row-reverse">
        
        {/* Right side: configuration widgets */}
        <div className="xl:col-span-5 space-y-5 text-right">
          
          <div className="space-y-2 text-right">
            <label className="block text-xs font-bold text-slate-700">اختر المشترك المعني بالتقرير والبطاقة:</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <select
                value={badgeMemberId || ''}
                onChange={(e) => setBadgeMemberId(Number(e.target.value))}
                className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white text-right"
              >
                {simulationMemberList.map(m => (
                  <option key={m.id} value={m.id}>👥 {m.memberId}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border space-y-2 text-slate-550 leading-relaxed text-[10px] font-bold">
            <h5 className="font-black text-slate-800 flex items-center gap-1.5 flex-row-reverse">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-505" />
              <span>تعليمات الطباعة المادية:</span>
            </h5>
            <ol className="list-decimal list-inside pr-1 space-y-1 text-right">
              <li>اختر العضو المطلوب من القائمة المستدلة.</li>
              <li>انقر على زر "إصدار وطباعة البطاقة الفورية" بالأسفل.</li>
              <li>سيتم تهيئة أبعاد البطاقة وحزم الشعار والـ QR أوتوماتيكياً للطباعة عبر الورق اللاصق أو كروت البلاستيك المخصصة (PVC ID Cards).</li>
            </ol>
          </div>

          <button
            onClick={() => window.print()}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-sm cursor-pointer flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>إصدار وطباعة البطاقة الفورية 🖨️</span>
          </button>

        </div>

        {/* Left side/Main: crisp template preview card with barcode/QR code SVG */}
        <div className="xl:col-span-7 flex flex-col items-center justify-center p-4">
          
          <div 
            id="gym-printable-badge-card"
            className="w-80 aspect-[1.586/1] bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-2xl border border-slate-800 p-5 shadow-xl relative overflow-hidden flex flex-col justify-between font-sans text-right"
            dir="rtl"
          >
            {/* Ambient visual decorations */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-cyan-500/10 rounded-full blur-lg"></div>

            {/* Top row */}
            <div className="flex justify-between items-start flex-row-reverse">
              <div className="text-right">
                <span className="text-[10px] font-black text-indigo-400 block tracking-wider uppercase">معسكر النخبة الرياضي</span>
                <span className="text-[8px] text-slate-400 block">مرآب التدريب البدني الاحترافي</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[8px] font-black tracking-wide rounded-md">ACTIVE PASS</span>
            </div>

            {/* Middle row info */}
            <div className="flex gap-4 items-center flex-row-reverse">
              {/* Boxed QR code SVG */}
              <div className="bg-white p-2 rounded-xl shrink-0 shadow-lg">
                <QRCodeSVG 
                  value={currentBadgeMember?.gateToken || `CARD-${currentBadgeMember?.id || '101'}`} 
                  size={70}
                  level="H"
                />
              </div>

              {/* textual details */}
              <div className="space-y-1 flex-1 text-right">
                <p className="text-xs font-black text-white">{currentBadgeMember?.memberId}</p>
                <p className="text-[9px] text-slate-350 font-extrabold flex justify-end gap-1 flex-row-reverse">
                  <span className="text-slate-500">الباقة:</span>
                  <span>{currentBadgeMember?.plan || 'باقة كلاسيك المفتوحة'}</span>
                </p>
                <p className="text-[9px] font-mono text-slate-400 flex justify-end gap-1 flex-row-reverse">
                  <span className="text-slate-500">صالحة حتى:</span>
                  <span>{currentBadgeMember?.endDate || 'مفتوحة الصلاحية'}</span>
                </p>
              </div>
            </div>

            {/* Bottom Bar badge string parameters */}
            <div className="border-t border-slate-800/80 pt-1.5 flex justify-between items-center text-[8px] text-slate-500 font-mono font-bold flex-row-reverse">
              <span>SERIAL: {currentBadgeMember?.gateToken || `CARD-${currentBadgeMember?.id || '101'}`}</span>
              <span className="font-sans">بوابة التفتيش الموحدة</span>
            </div>

          </div>

          <span className="text-[10px] text-slate-400 italic font-bold mt-3 block">
            * هذا المعاين الفني يعبر بدقة عن أبعاد الكارت المطبوع (CR80 Standard ID Card).
          </span>

        </div>

      </div>

    </div>
  );
};
