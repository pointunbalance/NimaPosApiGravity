import React from 'react';
import { Key, User, QrCode, Fingerprint, CheckCircle } from 'lucide-react';

interface AccessRegistrationPanelProps {
  simulationMemberList: any[];
  selectedEnrollMemberId: number | null;
  setSelectedEnrollMemberId: (id: number) => void;
  customEnrollGateToken: string;
  setCustomEnrollGateToken: (val: string) => void;
  enrollCustomTokenKey: (e: React.FormEvent) => void;
  enrollScanSuccess: string | null;
  setEnrollScanSuccess: (val: string | null) => void;
  runNativeBiometricRegister: () => void;
  hwSettings: any;
}

export const AccessRegistrationPanel: React.FC<AccessRegistrationPanelProps> = ({
  simulationMemberList,
  selectedEnrollMemberId,
  setSelectedEnrollMemberId,
  customEnrollGateToken,
  setCustomEnrollGateToken,
  enrollCustomTokenKey,
  enrollScanSuccess,
  setEnrollScanSuccess,
  runNativeBiometricRegister,
  hwSettings
}) => {
  const selectedMember = simulationMemberList.find(m => m.id === selectedEnrollMemberId);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6 text-right font-sans" dir="rtl">
      
      <div>
        <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 border-b pb-3.5 flex-row-reverse text-right">
          <Key className="w-5 h-5 text-indigo-600" />
          <span>تشفير وبرمجة هويات العبور وربط الكروت للمشتركين</span>
        </h3>
        <p className="text-xs text-slate-400 mt-2 font-bold leading-normal">
          تتيح هذه اللوحة ربط الكروت المغناطيسية RFID وقراءات الكاميرا للعضوية المحددة لتفعيل العبور الفوري عبر بوابات الصالة وعقود صالة الحديد والتدريب.
        </p>
      </div>

      {/* Enroll success dialog message */}
      {enrollScanSuccess && (
        <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl space-y-2 flex flex-col justify-start text-right">
          <div className="flex items-center gap-2 flex-row-reverse text-right">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h4 className="font-black text-xs text-emerald-800">عملية برمجة ناجحة</h4>
          </div>
          <p className="text-[11px] text-emerald-705 leading-relaxed font-bold">{enrollScanSuccess}</p>
          <button
            onClick={() => setEnrollScanSuccess(null)}
            className="text-[10px] text-emerald-600 underline text-right font-black mt-1"
          >
            إغلاق الرسالة
          </button>
        </div>
      )}

      {/* Member Selector */}
      <div className="space-y-2 max-w-xl text-right">
        <label className="block text-xs font-bold text-slate-700">اختر اسم العضو للتشفير والربط وبطاقة البوابة *</label>
        <div className="relative">
          <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <select
            value={selectedEnrollMemberId || ''}
            onChange={(e) => {
              setSelectedEnrollMemberId(Number(e.target.value));
              setEnrollScanSuccess(null);
            }}
            className="w-full pr-9 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white text-right"
          >
            <option value="">-- اختر عضوية اللاعب من القائمة --</option>
            {simulationMemberList.map(m => (
              <option key={m.id} value={m.id}>
                👤 {m.memberId} (الحالة: {m.status || 'فعال'}) - الباقة: {m.plan || 'كلاسيك'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedMember && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Card token RFID custom field input */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-3.5">
            <h4 className="font-black text-xs text-slate-800 flex items-center gap-1.5 flex-row-reverse">
              <QrCode className="w-4.5 h-4.5 text-indigo-500" />
              <span>ربط كارت RFID أو باركود QR</span>
            </h4>
            <p className="text-[10px] text-slate-400 leading-normal font-bold">
              امسح الكود عبر الكاميرا أو مرر الكارت بالقارئ، أو اكتب الرمز المعبر بحد أدنى 4 ترميزات يدوياً بالأسفل.
            </p>

            <form onSubmit={enrollCustomTokenKey} className="space-y-2.5">
              <input 
                type="text" 
                value={customEnrollGateToken}
                onChange={(e) => setCustomEnrollGateToken(e.target.value)}
                placeholder="مثال: CARD-1001 أو رمز الباركود..."
                required
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-left focus:outline-none focus:ring-1 focus:ring-indigo-550"
              />
              
              <button
                type="submit"
                className="w-full py-2 bg-indigo-650 bg-indigo-600 text-white font-black text-xs rounded-lg hover:bg-indigo-700 transition-all shadow-sm cursor-pointer"
              >
                ربط وحفظ الكود للعضو ⚡
              </button>
            </form>

            {selectedMember.gateToken && (
              <p className="text-[10px] text-slate-500 font-bold bg-white p-2 rounded border">
                الرمز النشط للعبور حالياً: <strong className="font-mono text-indigo-600">{selectedMember.gateToken}</strong>
              </p>
            )}
          </div>

          {/* Biometrics touch panel scanner driver simulated connection */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-3.5">
            <h4 className="font-black text-xs text-slate-805 flex items-center gap-1.5 flex-row-reverse">
              <Fingerprint className="w-4.5 h-4.5 text-indigo-505" />
              <span>تسجيل بصمة أصبع بيومترية (Desk Driver)</span>
            </h4>
            <p className="text-[10px] text-slate-400 leading-normal font-bold">
              تتيح هذه الأداة الاتصال بقارئ البصمات المكتبي (USB Biometric Peripheral) وتسجيل نمط الإصبع لحفظه بقاعدة البيانات للتحقق السريع.
            </p>

            <button
              onClick={runNativeBiometricRegister}
              className="w-full py-2.5 bg-slate-900 border hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-all shadow-sm cursor-pointer"
            >
              تشغيل مستشعر البصمات وتسجيل النمط 👆
            </button>

            {selectedMember.gateFingerprintDate ? (
              <div className="text-[10px] text-emerald-800 bg-emerald-50 p-2.5 rounded border border-emerald-100 flex items-center justify-between flex-row-reverse">
                <span>البصمة مسجلة ونشطة</span>
                <span className="font-mono">{selectedMember.gateFingerprintDate}</span>
              </div>
            ) : (
              <span className="text-[9px] text-slate-400 block italic">لم تسجل لهذا العضو أي بصمات بيومترية بعد.</span>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
