import React from 'react';
import { Wifi, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { HardwareSettingsType } from './accessTypes';

interface AccessIPRelayPanelProps {
  hwSettings: HardwareSettingsType;
  setHwSettings: (data: HardwareSettingsType) => void;
  onSaveSettings: (e: React.FormEvent) => void;
  gateTestStatus: 'idle' | 'sending' | 'success' | 'failed';
  gateTestResponse: string;
  testIPRelayConnection: () => void;
}

export const AccessIPRelayPanel: React.FC<AccessIPRelayPanelProps> = ({
  hwSettings,
  setHwSettings,
  onSaveSettings,
  gateTestStatus,
  gateTestResponse,
  testIPRelayConnection
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6 text-right font-sans" dir="rtl">
      
      <div>
        <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 border-b pb-3.5 flex-row-reverse text-right">
          <Wifi className="w-5 h-5 text-indigo-500" />
          <span>برمجة مرحلات البوابات الإلكترونية وبوردات الترحيل (TCP/IP Relays)</span>
        </h3>
        <p className="text-xs text-slate-400 mt-2 font-bold leading-normal">
          يمكن ربط النظام المحلي مع بوردات التحكم بالريلاي (مثل بوردات Modbus TCP أو بوردات ESP8266/ESP32 المحملة بسيرفر ويب) لتوصيل بوابات الصاروخ للعبور تلقائياً فور نجاح الفحص.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-row-reverse">
        
        {/* Connection testing trigger panel feedback */}
        <div className="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-4">
          <h4 className="font-extrabold text-xs text-slate-800">وحدة محاكاة واختبار البوابة</h4>
          <p className="text-[10px] text-slate-400 font-bold leading-normal">
            اضغط على الزر بالأسفل لإرسال نبضة عبور وهمية واختبار استجابة بورد الريلاي المعينة بالشبكة المحلية.
          </p>

          <button
            onClick={testIPRelayConnection}
            disabled={gateTestStatus === 'sending'}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${gateTestStatus === 'sending' ? 'animate-spin' : ''}`} />
            <span>نبضة فتح تجريبية (Trigger Relay)</span>
          </button>

          {gateTestStatus !== 'idle' && (
            <div className={`p-4 rounded-xl border text-[11px] font-bold leading-relaxed text-right ${
              gateTestStatus === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : gateTestStatus === 'failed' 
                ? 'bg-rose-50 border-rose-100 text-rose-800' 
                : 'bg-indigo-50 border-indigo-150 text-indigo-800 animate-pulse'
            }`}>
              <div className="flex items-center gap-1.5 mb-1 flex-row-reverse text-right">
                {gateTestStatus === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-slate-500" />}
                <span className="font-black">تقرير وحدة الربط:</span>
              </div>
              <p>{gateTestResponse}</p>
            </div>
          )}
        </div>

        {/* Configurations input Form */}
        <form onSubmit={onSaveSettings} className="lg:col-span-7 space-y-4 text-right">
          
          <div className="space-y-1.5 text-right">
            <label className="block text-xs font-bold text-slate-700">رابط خادم ومرحل كارت الـ IP Relay (HTTP Get) *</label>
            <input 
              type="text" 
              value={hwSettings.ipRelayUrl}
              onChange={(e) => setHwSettings({...hwSettings, ipRelayUrl: e.target.value})}
              placeholder="http://192.168.1.150/relay/1/on?duration=1000"
              required
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono text-left focus:outline-none"
            />
            <p className="text-[9px] text-slate-400 font-bold leading-normal">
              سيقوم البرنامج بإرسال طلب HTTP GET إلى هذا العنوان المحلي فور مصادقة دخول العضو، لفتح البوابة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1.5 text-right">
              <label className="block text-xs font-bold text-slate-700">مدة تفعيل Relay بالملي ثانية</label>
              <input 
                type="number" 
                value={hwSettings.ipRelayDuration}
                disabled={!hwSettings.ipRelayAutoOff}
                onChange={(e) => setHwSettings({...hwSettings, ipRelayDuration: Number(e.target.value)})}
                placeholder="1000"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono text-left focus:outline-none bg-slate-50 disabled:opacity-50"
              />
            </div>

            <div className="space-y-2 flex flex-col justify-end text-right">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-slate-700 justify-end flex-row-reverse">
                <input 
                  type="checkbox"
                  checked={hwSettings.ipRelayAutoOff}
                  onChange={(e) => setHwSettings({...hwSettings, ipRelayAutoOff: e.target.checked})}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span>تفعيل نبضة المغادرة الآلية</span>
              </label>
            </div>

          </div>

          {hwSettings.ipRelayAutoOff && (
            <div className="space-y-1.5 text-right">
              <label className="block text-xs font-bold text-slate-705">رابط إشارة الإغلاق الفورية (HTTP Get Off Signal)</label>
              <input 
                type="text" 
                value={hwSettings.ipRelayOffUrl}
                onChange={(e) => setHwSettings({...hwSettings, ipRelayOffUrl: e.target.value})}
                placeholder="http://192.168.1.150/relay/1/off"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono text-left focus:outline-none"
              />
            </div>
          )}

          <div className="border-t pt-4 flex gap-3 text-xs flex-row-reverse">
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl cursor-pointer"
            >
              حفظ وتثبيت التكوينات ⚡
            </button>
            
            <button
              type="button"
              onClick={() => {
                setHwSettings({
                  ipRelayUrl: 'http://191.168.1.150/relay/1/on?duration=1000',
                  ipRelayDuration: 1000,
                  ipRelayAutoOff: false,
                  ipRelayOffUrl: 'http://191.168.1.150/relay/1/off',
                  enableWedgeScanner: true,
                  enableLocalRelay: false,
                  enableNativeBiometrics: true
                });
              }}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 font-bold bg-white rounded-xl cursor-pointer"
            >
              استعادة الافتراضيات
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};
