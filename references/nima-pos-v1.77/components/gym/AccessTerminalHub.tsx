import React from 'react';
import { 
  Sliders, 
  Camera, 
  Shield, 
  Fingerprint, 
  Sparkles, 
  Play, 
  UserCheck, 
  UserMinus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle 
} from 'lucide-react';
import { ScanResultType, HardwareSettingsType } from './accessTypes';

interface AccessTerminalHubProps {
  scannedActionType: 'دخول' | 'خروج';
  setScannedActionType: (val: 'دخول' | 'خروج') => void;
  scannerInputTab: 'camera' | 'wedge' | 'fingerprint' | 'simulator';
  setScannerInputTab: (val: any) => void;
  isCameraActive: boolean;
  toggleCameraReceiver: () => void;
  availableCameras: MediaDeviceInfo[];
  activeCameraId: string;
  setActiveCameraId: (id: string) => void;
  cameraScanError: string | null;
  lastWedgeInputInfo: { code: string; timestamp: string } | null;
  hwSettings: HardwareSettingsType;
  isFingerprintScanning: boolean;
  fingerprintProgress: number;
  runNativeBiometricAuthentication: () => void;
  simulationMemberList: any[];
  verifyAndTriggerAccessByCode: (code: string, source: string) => void;
  lastScanResult: ScanResultType | null;
}

export const AccessTerminalHub: React.FC<AccessTerminalHubProps> = ({
  scannedActionType,
  setScannedActionType,
  scannerInputTab,
  setScannerInputTab,
  isCameraActive,
  toggleCameraReceiver,
  availableCameras,
  activeCameraId,
  setActiveCameraId,
  cameraScanError,
  lastWedgeInputInfo,
  hwSettings,
  isFingerprintScanning,
  fingerprintProgress,
  runNativeBiometricAuthentication,
  simulationMemberList,
  verifyAndTriggerAccessByCode,
  lastScanResult
}) => {
  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* terminal authentication console panel */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden border-t-4 border-t-indigo-600">
        
        {/* Header Block */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-xs font-black text-slate-800 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>منصة الاستقبال والمصادقة الموحدة</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-bold mt-1">تحديد وضع العبور النشط والاستقبال الذكي</p>
          </div>
          
          <span className="shrink-0 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-black rounded-lg flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>المستقبلات مستعدة</span>
          </span>
        </div>

        {/* Access direction switcher */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/30">
          <span className="text-[10px] font-extrabold text-slate-400 block mb-2">اتجاه حركة البوابات الحالية:</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setScannedActionType('دخول')}
              className={`py-2 px-3 text-[11px] font-black rounded-xl border-2 flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                scannedActionType === 'دخول'
                  ? 'bg-emerald-50/60 border-emerald-500 text-emerald-805 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>وضعية الدخول</span>
            </button>
            <button
              onClick={() => setScannedActionType('خروج')}
              className={`py-2 px-3 text-[11px] font-black rounded-xl border-2 flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                scannedActionType === 'خروج'
                  ? 'bg-amber-50/60 border-amber-500 text-amber-805 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <UserMinus className="w-3.5 h-3.5" />
              <span>وضعية الخروج</span>
            </button>
          </div>
        </div>

        {/* Input Tab Navigation Bar */}
        <div className="flex bg-slate-900 text-white p-2 flex-wrap gap-1">
          <button
            onClick={() => setScannerInputTab('camera')}
            className={`flex-1 py-1.5 px-2 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              scannerInputTab === 'camera' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>الـ QR والكاميرا</span>
          </button>
          <button
            onClick={() => setScannerInputTab('wedge')}
            className={`flex-1 py-1.5 px-2 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              scannerInputTab === 'wedge' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>RFID / USB</span>
          </button>
          {hwSettings.enableNativeBiometrics && (
            <button
              onClick={() => setScannerInputTab('fingerprint')}
              className={`flex-1 py-1.5 px-2 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                scannerInputTab === 'fingerprint' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>البصمة البيومترية</span>
            </button>
          )}
          <button
            onClick={() => setScannerInputTab('simulator')}
            className={`flex-1 py-1.5 px-2 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              scannerInputTab === 'simulator' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>المحاكي</span>
          </button>
        </div>

        {/* Active scan option body content */}
        <div className="p-5 border-t border-slate-100 min-h-[220px] flex flex-col justify-center">
          
          {/* CAMERA QR SCANNER */}
          {scannerInputTab === 'camera' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5">
                <span className="text-[10px] font-bold text-slate-400">حدد عدسة الكاميرا النشطة للاستجابة:</span>
                <select
                  value={activeCameraId}
                  onChange={(e) => setActiveCameraId(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-205 rounded-lg text-[10px] font-bold bg-white text-right"
                >
                  <option value="">-- كاميرا النظام الافتراضية --</option>
                  {availableCameras.map(cam => (
                    <option key={cam.deviceId} value={cam.deviceId}>{cam.label || `كاميرا #${cam.deviceId.slice(0,5)}`}</option>
                  ))}
                </select>
              </div>

              <div className="relative aspect-video w-full max-w-sm mx-auto bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center text-center p-4">
                {isCameraActive ? (
                  <>
                    <div id="physical-camera-canvas-view" className="absolute inset-0 w-full h-full object-cover"></div>
                    <div className="absolute inset-x-4 border-b-2 border-indigo-500 scanner-lasers opacity-75 z-10"></div>
                  </>
                ) : (
                  <div className="text-slate-500 space-y-2">
                    <Camera className="w-10 h-10 mx-auto text-slate-700 animate-pulse" />
                    <p className="text-[10px] font-bold text-slate-400">مغلق - انقر بالأسفل لبدء التغذية اللحظية</p>
                  </div>
                )}
              </div>

              {cameraScanError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-[10px] text-rose-800 rounded-xl leading-relaxed text-right">
                  {cameraScanError}
                </div>
              )}

              <button
                type="button"
                onClick={toggleCameraReceiver}
                className={`w-full py-2.5 text-xs font-black rounded-xl cursor-pointer shadow-sm transition-all text-center ${
                  isCameraActive 
                    ? 'bg-rose-600 text-white hover:bg-rose-700' 
                    : 'bg-indigo-650 bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isCameraActive ? 'إيقاف تغذية الكاميرا وطاقتها ⬛' : 'ابدأ تشغيل الكاميرا ومسح الـ QR ⚡'}
              </button>
            </div>
          )}

          {/* RFID KEYBOARD WEDGE GUN */}
          {scannerInputTab === 'wedge' && (
            <div className="text-center space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-dashed flex flex-col items-center justify-center gap-2">
                <Shield className="w-9 h-9 text-indigo-500 animate-[pulse_3s_infinite]" />
                <h4 className="text-xs font-black text-slate-800">جهاز المسح اللاسلكي RFID معشق ومستعد</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs font-bold">
                  سيقوم النظام باعتراض الإدخالات فائقة السرعة لأي مسدس باركود أو قارئ ملصقات كهرومغناطيسية متصل بالكمبيوتر عبر منفذ USB تلقائياً.
                </p>
              </div>

              {lastWedgeInputInfo ? (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-right text-[10px] flex justify-between items-center flex-row-reverse">
                  <span className="text-slate-400 font-mono">{lastWedgeInputInfo.timestamp}</span>
                  <span className="font-bold text-emerald-800">شارة مقروءة: <strong className="font-mono text-xs">{lastWedgeInputInfo.code}</strong></span>
                </div>
              ) : (
                <span className="text-[10px] font-bold text-slate-350 italic block">في انتظار تمرير الكارت أو ضربة الباركود...</span>
              )}
            </div>
          )}

          {/* FINGERPRINT BIOMETRIC TOUCHID */}
          {scannerInputTab === 'fingerprint' && (
            <div className="text-center space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <Fingerprint className={`w-full h-full text-indigo-600 ${isFingerprintScanning ? 'animate-pulse' : ''}`} />
                {isFingerprintScanning && (
                  <div className="absolute inset-0 border-4 border-indigo-600 rounded-full animate-ping opacity-60"></div>
                )}
              </div>

              {isFingerprintScanning ? (
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-indigo-600 animate-pulse">جاري التحقق من هوية المشترك بيومترياً...</p>
                  <div className="w-40 bg-slate-100 rounded-full h-1 my-2 mx-auto overflow-hidden">
                    <div className="bg-indigo-600 h-1 transition-all duration-150" style={{ width: `${fingerprintProgress}%` }}></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 leading-normal max-w-xs mx-auto">
                    اضغط على الزر بالأسفل لمحاكاة دمج مستشعر البصمات المقترن بالبوابات لإجراء مصادقة فورية.
                  </p>
                  <button
                    type="button"
                    onClick={runNativeBiometricAuthentication}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-extrabold rounded-xl shadow cursor-pointer mx-auto block"
                  >
                    بدء محاكاة مسح البصمة الآن 👆
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PROFILES ACCESS SIMULATOR */}
          {scannerInputTab === 'simulator' && (
            <div className="space-y-3 text-right">
              <span className="text-[10px] font-black text-slate-400 block mb-1">حدد ملف المشترك المراد تصفيته واختباره بالبوابات فورياً:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
                {simulationMemberList.map(member => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => verifyAndTriggerAccessByCode(member.gateToken || `CARD-${member.id}`, `محاكي النظام الموحد`)}
                    className="p-2 bg-slate-50 hover:bg-indigo-50/50 border border-slate-150 hover:border-indigo-200 transition-all text-right rounded-xl text-[10px] flex items-center justify-between flex-row-reverse cursor-pointer"
                  >
                    <Play className="w-3 h-3 text-indigo-505" />
                    <div className="space-y-0.5 text-right">
                      <span className="font-extrabold text-slate-800 block text-[11px]">{member.memberId}</span>
                      <span className="text-slate-400 text-[9px] block">رمز: {member.gateToken || `CARD-${member.id}`}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* verification feedback alert panel */}
      {lastScanResult && (
        <div className={`p-5 rounded-3xl border-2 shadow-sm animate-in fade-in zoom-in-95 duration-200 text-right ${
          lastScanResult.status === 'success'
            ? 'bg-emerald-50/50 border-emerald-500 text-emerald-805'
            : lastScanResult.status === 'expired'
            ? 'bg-rose-50/50 border-rose-500 text-rose-805'
            : lastScanResult.status === 'warning'
            ? 'bg-amber-50/50 border-amber-500 text-amber-805'
            : 'bg-slate-50/70 border-slate-405 border-slate-400 text-slate-805'
        }`}>
          <div className="flex items-center gap-2.5 mb-3.5 justify-end flex-row-reverse text-right">
            {lastScanResult.status === 'success' && <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
            {lastScanResult.status === 'expired' && <XCircle className="w-6 h-6 text-rose-600" />}
            {lastScanResult.status === 'warning' && <AlertTriangle className="w-6 h-6 text-amber-600" />}
            {lastScanResult.status === 'notfound' && <XCircle className="w-6 h-6 text-slate-500" />}
            
            <h3 className="font-black text-sm text-slate-800">نتيجة التحقق الفوري للبوابة</h3>
          </div>

          <div className="space-y-2 text-xs font-bold text-slate-600">
            <div className="flex justify-between items-center border-b pb-1.5 flex-row-reverse">
              <span className="text-slate-400">اسم العضو الهوائي:</span>
              <span className="font-extrabold text-slate-800 text-sm">{lastScanResult.memberName}</span>
            </div>
            
            <div className="flex justify-between items-center border-b pb-1.5 flex-row-reverse">
              <span className="text-slate-400">الباقة المقيدة المعبرة:</span>
              <span className="text-slate-700">{lastScanResult.plan}</span>
            </div>

            <div className="flex justify-between items-center border-b pb-1.5 flex-row-reverse">
              <span className="text-slate-400">تاريخ انتهاء الترخيص:</span>
              <span className="font-mono text-slate-700">{lastScanResult.endDate}</span>
            </div>

            <div className="flex justify-between items-center border-b pb-1.5 flex-row-reverse">
              <span className="text-slate-400">منفذ وجهاز التحقق:</span>
              <span className="text-slate-500">{lastScanResult.method}</span>
            </div>

            <p className="text-[11px] font-extrabold bg-white/70 p-2.5 rounded-xl border mt-3 text-right text-slate-700 leading-relaxed">
              {lastScanResult.message}
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
