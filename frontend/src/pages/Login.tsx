import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { ShieldCheck, Store, Loader2, Zap, Building2, Wrench, Layers, ShieldAlert, VolumeX, Volume2 } from 'lucide-react';
import { User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { hashPin } from '../utils/crypto';
import { LoginSidebar } from '../components/login/LoginSidebar';
import { LoginFeatureShowcase } from '../components/login/LoginFeatureShowcase';
import { EnglishKeyboard } from '../components/login/EnglishKeyboard';
import { ArabicKeyboard } from '../components/login/ArabicKeyboard';
import { NumericKeypad } from '../components/login/NumericKeypad';
import { PINDisplay } from '../components/login/PINDisplay';
import { UserSelectField } from '../components/login/UserSelectField';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 15 }
  }
} as const;

interface LoginProps {
  onLogin: (user: User) => void;
}

let cachedAudioCtx: AudioContext | null = null;

const getSharedAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!cachedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      cachedAudioCtx = new AudioContextClass();
    }
  }
  if (cachedAudioCtx && cachedAudioCtx.state === 'suspended') {
    cachedAudioCtx.resume().catch(() => {});
  }
  return cachedAudioCtx;
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const users = useLiveQuery(async () => {
    const allUsers = await db.users.toArray();
    return allUsers.filter(u => u.isActive !== false);
  }, []) || [];

  const settings = useLiveQuery(() => db.settings.toCollection().first());

  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardMode, setKeyboardMode] = useState<'numeric' | 'english' | 'arabic'>('numeric');
  const [isShift, setIsShift] = useState(false);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('nima_login_muted') === 'true');
  const [shake, setShake] = useState(false);
  const [lockedFeedback, setLockedFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (lockedFeedback) {
      const t = setTimeout(() => setLockedFeedback(null), 3500);
      return () => clearTimeout(t);
    }
  }, [lockedFeedback]);

  const playSound = (type: 'click' | 'success' | 'error' | 'delete' | 'typing') => {
    if (isMuted) return;
    try {
      const ctx = getSharedAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.04);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'typing') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(950, now);
        osc.frequency.exponentialRampToValueAtTime(1300, now + 0.03);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
      } else if (type === 'delete') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.06);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(698.46, now + 0.06);
        osc.frequency.setValueAtTime(880.00, now + 0.12);
        osc.frequency.setValueAtTime(1174.66, now + 0.18);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.linearRampToValueAtTime(85, now + 0.28);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      }
    } catch (e) {
      console.warn('Audio Context failed', e);
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      const newVal = !prev;
      localStorage.setItem('nima_login_muted', newVal ? 'true' : 'false');
      return newVal;
    });
  };

  const keyboardNumRow = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const enRow1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  const enRow2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
  const enRow3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];

  const arRow1 = ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'];
  const arRow2 = ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'];
  const arRow3 = ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ'];

  useEffect(() => {
    if (users.length > 0 && selectedUserId === '') {
      const lastUserId = localStorage.getItem('nima_last_user_id');
      if (lastUserId) {
        const found = users.find(u => u.id === Number(lastUserId));
        if (found) {
          setSelectedUserId(found.id!);
          return;
        }
      }
      setSelectedUserId(users[0].id!);
    }
  }, [users, selectedUserId]);

  useEffect(() => {
    const migratePins = async () => {
      const allUsers = await db.users.toArray();
      for (const u of allUsers) {
        if (u.pin && u.pin.length < 8) {
          let newPin = u.pin;
          if (newPin === '1234') newPin = '12345678';
          else if (newPin === '0000') newPin = '00000000';
          else newPin = newPin.padEnd(8, '0');
          await db.users.update(u.id!, { pin: newPin });
        }
      }
    };
    migratePins();
  }, []);

  const handleNumClick = (num: string) => {
    if (loading || shake) return;
    if (pin.length < 8) {
      setPin(prev => prev + num);
      setError('');
      playSound('click');
    }
  };

  const handleDelete = () => {
    if (loading || shake) return;
    setPin(prev => prev.slice(0, -1));
    setError('');
    playSound('delete');
  };

  const handleLogin = async () => {
    if (pin.length < 8 || loading || shake) return;
    if (!selectedUserId) {
      setError('الرجاء اختيار الموظف');
      playSound('error');
      setShake(true);
      setTimeout(() => setShake(false), 550);
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 200));

    try {
      const targetUser = users.find(u => u.id === Number(selectedUserId));
      let isValidPin = false;
      if (targetUser) {
        if (targetUser.pin === pin) {
          isValidPin = true;
        } else {
          const hashed = await hashPin(pin);
          if (targetUser.pin === hashed) isValidPin = true;
        }
      }

      if (targetUser && isValidPin) {
        localStorage.setItem('nima_last_user_id', targetUser.id!.toString());
        localStorage.setItem('nima_user', JSON.stringify(targetUser));
        
        db.userSessions.add({
          userId: targetUser.id!,
          userName: targetUser.name,
          loginTime: new Date(),
          status: 'active',
          userAgent: navigator.userAgent,
          deviceType: /Mobile|Android|iP(ad|hone)/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
          location: 'الرياض، السعودية',
          ipAddress: 'Offline Localhost'
        }).catch(console.error);

        db.logs.add({
          type: 'system',
          action: 'USER_LOGIN',
          details: `تسجيل الدخول للنظام`,
          user: targetUser.name,
          date: new Date(),
          status: 'success',
          module: 'Auth'
        });

        playSound('success');
        onLogin(targetUser);
      } else {
        playSound('error');
        setShake(true);
        setTimeout(() => setShake(false), 550);
        setError('رمز الدخول غير صحيح لهذا المستخدم');
        setTimeout(() => {
          setPin('');
        }, 600);
      }
    } catch (err) {
      console.error(err);
      playSound('error');
      setShake(true);
      setTimeout(() => setShake(false), 550);
      setError('حدث خطأ في النظام');
      setTimeout(() => {
        setPin('');
      }, 600);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading || shake) return;
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (pin.length < 8) {
          setPin(prev => prev + e.key);
          setError('');
          playSound('typing');
        }
      }
      
      if (e.key === 'Backspace') {
        setPin(prev => prev.slice(0, -1));
        setError('');
        playSound('delete');
      }

      if (e.key === 'Enter' && pin.length === 8) {
        handleLogin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pin, loading, shake, selectedUserId]);

  useEffect(() => {
    if (pin.length === 8 && !loading && !shake) {
      handleLogin();
    }
  }, [pin, loading, shake]);

  const getModeBadge = (mode?: string) => {
    switch(mode) {
      case 'starter': return { label: 'Basic Edition', sub: 'نسخة المبتدئين', color: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', icon: Zap };
      case 'standard': return { label: 'Standard Edition', sub: 'النسخة القياسية', color: 'bg-blue-50 text-blue-700 border-blue-200/80', icon: Store };
      case 'service': return { label: 'Service Edition', sub: 'نسخة الخدمات', color: 'bg-orange-50 text-orange-700 border-orange-200/80', icon: Wrench };
      case 'enterprise': return { label: 'Enterprise Edition', sub: 'نسخة المؤسسات', color: 'bg-purple-50 text-purple-700 border-purple-200/80', icon: Building2 };
      default: return { label: 'Professional Edition', sub: 'نسخة احترافية', color: 'bg-indigo-50 text-indigo-700 border-indigo-200/80', icon: Layers };
    }
  };

  const modeInfo = getModeBadge(settings?.appMode);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#ff9e7d] via-[#f8a5c2] via-[#e2b0ff] to-[#74b9ff] flex flex-row font-['Tajawal'] select-none overflow-hidden h-screen w-screen relative" dir="rtl">
      <AnimatePresence>
        {lockedFeedback && (
          <motion.div 
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 border border-rose-200 text-rose-600 font-black px-6 py-3.5 rounded-2xl shadow-[0_10px_25px_rgba(225,29,72,0.1)] z-50 flex items-center gap-3.5 max-w-sm text-center leading-relaxed"
          >
            <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" strokeWidth={2.5} />
            <span className="text-xs font-sans">{lockedFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginSidebar settings={settings} playSound={playSound} setLockedFeedback={setLockedFeedback} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-transparent relative">
        {/* Global sticky header */}
        <header className="h-16 border-b border-white/25 bg-white/35 backdrop-blur-[24px] px-8 flex flex-row-reverse items-center justify-between shrink-0 select-none z-10 text-slate-800">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-indigo-600 animate-pulse" />
            <span className="text-sm md:text-base font-black text-slate-800 tracking-tight font-sans">بوابة الدخول الموحدة للموظفين</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleMute}
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-slate-200/60 hover:bg-white text-slate-600 hover:text-slate-950 transition-all duration-200 cursor-pointer shadow-sm text-xs font-black active:scale-95"
              title={isMuted ? "تشغيل الأصوات" : "كتم الأصوات"}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                  <span className="text-[10px] text-slate-500 font-extrabold font-sans">الصوت مغلق</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] text-emerald-600 font-extrabold font-sans">الصوت نشط</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-1.5 bg-white/80 border border-white/40 text-slate-800 px-3.5 py-1.5 rounded-full shadow-sm select-none">
              <ShieldCheck className="w-3.8 h-3.8 text-emerald-500" />
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider font-sans text-indigo-600">ENTERPRISE EDITION</span>
            </div>
          </div>
        </header>

        {/* Outer content container with pixel-perfect midline vertical alignment and balanced side margins */}
        <div className="flex-1 p-6 md:p-8 flex items-center justify-center relative z-10 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-transparent">
          <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row justify-center items-center gap-8 xl:gap-14 px-4">
            
            {/* Right taller Features Showcase Panel */}
            <LoginFeatureShowcase modeInfo={modeInfo} />

            {/* Left login card with numeric keypad */}
            <div data-login-keypad="true" className="w-full lg:w-auto flex flex-col items-center justify-center relative select-none shrink-0">
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={`w-full transition-all duration-300 ${keyboardMode === 'numeric' ? 'max-w-[430px] lg:w-[430px]' : 'max-w-[580px] lg:w-[580px]'} bg-white border border-slate-100/80 p-6 md:p-8 pb-4 rounded-[32px] shadow-[0_20px_50px_rgba(15,23,42,0.06)] relative z-10 text-slate-800`}
              >
                <motion.div variants={itemVariants} className="text-center mb-6">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-200 shadow-inner rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 lg:hidden overflow-hidden p-2">
                    {settings?.logo ? <img src={settings.logo} className="w-full h-full object-contain" /> : <Store className="w-8 h-8" />}
                  </div>
                  <h3 className="text-3xl font-[1000] text-slate-950 mb-2 font-sans tracking-tight">مرحباً بعودتك</h3>
                  <p className="text-slate-400 text-sm md:text-base font-bold">اختر الحساب وأدخل الرمز للمتابعة</p>
                </motion.div>

                {/* Dropdown User Selection Field */}
                <UserSelectField
                  users={users}
                  selectedUserId={selectedUserId}
                  setSelectedUserId={setSelectedUserId}
                  setPin={setPin}
                  setError={setError}
                  playSound={playSound}
                />

                {/* Language Toggle Tab Pill with precise spacing */}
                <div className="flex bg-slate-100/70 border border-slate-200/60 p-2 rounded-2xl mb-6 text-xs md:text-sm font-black gap-2 shadow-sm">
                  <button
                    type="button"
                    onClick={() => { setKeyboardMode('numeric'); playSound('click'); }}
                    className={`flex-1 py-1.5 px-3 md:py-2.5 md:px-4 rounded-xl transition-all duration-200 text-center select-none whitespace-nowrap cursor-pointer ${keyboardMode === 'numeric' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md border border-white/10 font-black scale-[1.015]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 font-bold'}`}
                  >
                    أرقام
                  </button>
                  <button
                    type="button"
                    onClick={() => { setKeyboardMode('english'); playSound('click'); }}
                    className={`flex-1 py-1.5 px-3 md:py-2.5 md:px-4 rounded-xl transition-all duration-200 text-center select-none whitespace-nowrap cursor-pointer ${keyboardMode === 'english' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md border border-white/10 font-black scale-[1.015]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 font-bold'}`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => { setKeyboardMode('arabic'); playSound('click'); }}
                    className={`flex-1 py-1.5 px-3 md:py-2.5 md:px-4 rounded-xl transition-all duration-200 text-center select-none whitespace-nowrap cursor-pointer ${keyboardMode === 'arabic' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md border border-white/10 font-black scale-[1.015]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 font-bold'}`}
                  >
                    عربي
                  </button>
                </div>

                {/* Perfectly centered PIN Indicator dots */}
                <div className="w-full flex items-center justify-center mb-6">
                  <PINDisplay
                    pin={pin}
                    shake={shake}
                    error={error}
                    loading={loading}
                    selectedUserId={selectedUserId}
                  />
                </div>
                
                {error && (
                  <div className="mb-4 p-3 bg-rose-50 text-rose-500 text-sm font-black rounded-xl text-center border border-rose-200 animate-in fade-in slide-in-from-top-2 select-none font-sans shadow-sm">
                    {error}
                  </div>
                )}

                {/* Keypads */}
                {keyboardMode === 'numeric' && (
                  <NumericKeypad
                    loading={loading}
                    pin={pin}
                    setPin={setPin}
                    handleNumClick={handleNumClick}
                    handleDelete={handleDelete}
                    playSound={playSound}
                    disabled={loading || users.length === 0}
                  />
                )}

                {keyboardMode === 'english' && (
                  <EnglishKeyboard
                    loading={loading}
                    users={users}
                    isShift={isShift}
                    setIsShift={setIsShift}
                    keyboardNumRow={keyboardNumRow}
                    enRow1={enRow1}
                    enRow2={enRow2}
                    enRow3={enRow3}
                    handleNumClick={handleNumClick}
                    handleDelete={handleDelete}
                    playSound={playSound}
                  />
                )}

                {keyboardMode === 'arabic' && (
                  <ArabicKeyboard
                    loading={loading}
                    users={users}
                    keyboardNumRow={keyboardNumRow}
                    arRow1={arRow1}
                    arRow2={arRow2}
                    arRow3={arRow3}
                    handleNumClick={handleNumClick}
                    handleDelete={handleDelete}
                  />
                )}

                {/* Anchored bottom security text with precise 16px bottom margin */}
                <div className="text-center mt-6 pt-4 border-t border-slate-100">
                  <p className="text-[11.5px] text-slate-400 font-[1000] tracking-normal leading-normal font-sans block select-none">
                    جميع العمليات مسجلة للأمان والرقابة
                  </p>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
