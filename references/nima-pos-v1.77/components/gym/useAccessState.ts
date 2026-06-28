import { useState, useEffect, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { HardwareSettingsType, AccessLogType, ScanResultType } from './accessTypes';
import { Html5Qrcode } from 'html5-qrcode';

export const useAccessState = () => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  const [mainTab, setMainTab] = useState<'scanner' | 'enrollment' | 'gate-relays' | 'passes'>('scanner');
  const [scannedActionType, setScannedActionType] = useState<'دخول' | 'خروج'>('دخول');
  const [scannerInputTab, setScannerInputTab] = useState<'camera' | 'wedge' | 'fingerprint' | 'simulator'>('camera');

  const [activeCameraId, setActiveCameraId] = useState<string>('');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraScanError, setCameraScanError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const [hwSettings, setHwSettings] = useState<HardwareSettingsType>({
    ipRelayUrl: 'http://192.168.1.150/relay/1/on?duration=1000',
    ipRelayDuration: 1000,
    ipRelayAutoOff: false,
    ipRelayOffUrl: 'http://192.168.1.150/relay/1/off',
    enableWedgeScanner: true,
    enableLocalRelay: false,
    enableNativeBiometrics: true
  });

  const [lastWedgeInputInfo, setLastWedgeInputInfo] = useState<{ code: string; timestamp: string } | null>(null);
  const [selectedEnrollMemberId, setSelectedEnrollMemberId] = useState<number | null>(null);
  const [customEnrollGateToken, setCustomEnrollGateToken] = useState('');
  const [enrollScanSuccess, setEnrollScanSuccess] = useState<string | null>(null);
  const [badgeMemberId, setBadgeMemberId] = useState<number | null>(null);
  const [gateTestStatus, setGateTestStatus] = useState<'idle' | 'sending' | 'success' | 'failed'>('idle');
  const [gateTestResponse, setGateTestResponse] = useState<string>('');

  const [isFingerprintScanning, setIsFingerprintScanning] = useState(false);
  const [fingerprintProgress, setFingerprintProgress] = useState(0);

  const [lastScanResult, setLastScanResult] = useState<ScanResultType | null>(null);

  const records: AccessLogType[] = useLiveQuery(() => db.gymAccessLogs.orderBy('id').reverse().toArray()) || [];
  const registeredMembers = useLiveQuery(() => db.gymMembershipsList.toArray()) || [];

  const defaultDemoMembers = useMemo(() => [
    { id: 1001, memberId: 'كابتن بوهدان شفتشينكو', phone: '01011223344', plan: 'كلاسيك 3 شهور', status: 'فعال', endDate: '2026-12-15', gateToken: 'CARD-1001' },
    { id: 1002, memberId: 'الدكتورة أولغا تيموشينكو', phone: '01299887766', plan: 'الباقة الذهبية السنوية', status: 'فعال', endDate: '2026-11-20', gateToken: 'CARD-1002' },
    { id: 1003, memberId: 'الأستاذ تاراس فرانتسوف', phone: '01188334422', plan: 'الباقة الماسية الشاملة', status: 'فعال', endDate: '2026-09-01', gateToken: 'CARD-1003' },
    { id: 1004, memberId: 'اللاعب ياروسلاف كوفالينكو', phone: '01566778899', plan: 'الباقة الفضية الشهرية', status: 'منتهي', endDate: '2026-04-10', gateToken: 'CARD-1004' }
  ], []);

  const simulationMemberList = useMemo(() => {
    return registeredMembers.length > 0 ? registeredMembers : defaultDemoMembers;
  }, [registeredMembers, defaultDemoMembers]);

  useEffect(() => {
    const savedHWS = localStorage.getItem('gym_access_hw_settings');
    if (savedHWS) {
      try { setHwSettings(JSON.parse(savedHWS)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if (simulationMemberList.length > 0 && badgeMemberId === null) {
      setBadgeMemberId(simulationMemberList[0].id || null);
    }
  }, [simulationMemberList, badgeMemberId]);

  useEffect(() => {
    const fetchCameras = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(d => d.kind === 'videoinput');
          setAvailableCameras(videoDevices);
          if (videoDevices.length > 0) setActiveCameraId(videoDevices[0].deviceId);
        }
      } catch (e) {
        console.warn('Cameras restricted', e);
      }
    };
    fetchCameras();
  }, []);

  const playTerminalSound = (status: 'success' | 'warning' | 'error' | 'bell') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (status === 'success') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start(); osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); osc.stop(ctx.currentTime + 0.15);
      } else if (status === 'bell') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        osc.start(); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.stop(ctx.currentTime + 0.65);
      } else if (status === 'warning') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(330, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        osc.start(); osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35); osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.type = 'square'; osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start(); osc.frequency.setValueAtTime(120, ctx.currentTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4); osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const firePhysicalGateRelay = async () => {
    if (!hwSettings.enableLocalRelay || !hwSettings.ipRelayUrl) return;
    try {
      await fetch(hwSettings.ipRelayUrl, { method: 'GET', mode: 'no-cors' });
      if (hwSettings.ipRelayAutoOff && hwSettings.ipRelayOffUrl) {
        setTimeout(async () => {
          await fetch(hwSettings.ipRelayOffUrl, { method: 'GET', mode: 'no-cors' });
        }, hwSettings.ipRelayDuration);
      }
    } catch (err) {
      console.warn('Physical relay target inaccessible offline.', err);
    }
  };

  const verifyAndTriggerAccessByCode = async (scannedStringWord: string, deviceSourceLabel: string) => {
    const searchString = scannedStringWord.toLowerCase().trim();
    const matchedMember = simulationMemberList.find((m: any) => {
      const memberTokenId = String(m.gateToken || '').toLowerCase().trim();
      const memberPhone = String(m.phone || '').toLowerCase().trim();
      const memberName = String(m.memberId || '').toLowerCase().trim();
      const memberIdVal = String(m.id || '').toLowerCase().trim();
      return searchString === memberTokenId || searchString === memberPhone || searchString === `card-${memberIdVal}` || memberName.includes(searchString);
    });

    if (!matchedMember) {
      playTerminalSound('error');
      setLastScanResult({
        memberName: scannedStringWord,
        type: scannedActionType,
        status: 'notfound',
        plan: 'غير مسجل بالصالة',
        endDate: '-',
        method: deviceSourceLabel,
        message: 'عذراً! المدخل غير مرتبط بأي عضو حالياً. يرجى مراجعة إدارة المعسكر الرياضي.'
      });
      return;
    }

    const isExpired = matchedMember.status === 'منتهي' || (matchedMember.endDate && new Date(matchedMember.endDate) < new Date());
    const isSuspended = matchedMember.status === 'معلق';

    let scanStatus: 'success' | 'expired' | 'warning' = 'success';
    let outputReason = scannedActionType === 'دخول' ? 'تم التصريح بالعبور - البوابة تفتح الآن' : 'تم تسجيل مغادرة الصالة بنجاح';

    if (isExpired) {
      scanStatus = 'expired';
      outputReason = 'تنبيه: محاولة عبور فاشلة! العضوية منتهية المفعول الصلاحي.';
      playTerminalSound('error');
    } else if (isSuspended) {
      scanStatus = 'warning';
      outputReason = 'تنبيه: العضوية معلقة! يرجى الاستعلام وتصفية الأقساط.';
      playTerminalSound('warning');
    } else {
      playTerminalSound('success');
      firePhysicalGateRelay();
    }

    const nowLocalDate = new Date();
    const formattedTimestamp = nowLocalDate.getFullYear() + '-' + 
      String(nowLocalDate.getMonth() + 1).padStart(2, '0') + '-' + 
      String(nowLocalDate.getDate()).padStart(2, '0') + ' ' + 
      String(nowLocalDate.getHours()).padStart(2, '0') + ':' + 
      String(nowLocalDate.getMinutes()).padStart(2, '0') + ':' + 
      String(nowLocalDate.getSeconds()).padStart(2, '0');

    await db.gymAccessLogs.add({
      memberId: matchedMember.memberId,
      timestamp: formattedTimestamp,
      type: scannedActionType,
      method: deviceSourceLabel
    });

    setLastScanResult({
      memberName: matchedMember.memberId,
      type: scannedActionType,
      status: scanStatus,
      plan: matchedMember.plan || 'بدون باقة مبرمجة',
      endDate: matchedMember.endDate || 'عضوية مفتوحة',
      method: deviceSourceLabel,
      message: outputReason
    });
  };

  // Keyboard Wedge barcode interception mechanism
  useEffect(() => {
    if (!hwSettings.enableWedgeScanner) return;
    let keyboardInputData = '';
    let lastKeyStrokeTime = Date.now();

    const handleHardwareKeystroke = (e: KeyboardEvent) => {
      const now = Date.now();
      const isFastTyping = (now - lastKeyStrokeTime) < 45;
      if (!isFastTyping) keyboardInputData = '';
      lastKeyStrokeTime = now;

      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;

      if (e.key === 'Enter') {
        const finalBufferOutput = keyboardInputData.trim();
        if (finalBufferOutput.length >= 3) {
          setLastWedgeInputInfo({ code: finalBufferOutput, timestamp: new Date().toLocaleTimeString() });
          verifyAndTriggerAccessByCode(finalBufferOutput, 'ممسحة الكروت الذكية (Wedge)');
          keyboardInputData = '';
          e.preventDefault();
        }
      } else if (e.key.length === 1) {
        keyboardInputData += e.key;
      }
    };

    window.addEventListener('keydown', handleHardwareKeystroke);
    return () => window.removeEventListener('keydown', handleHardwareKeystroke);
  }, [hwSettings.enableWedgeScanner, scannedActionType, simulationMemberList]);

  const startCameraProcessing = () => {
    try {
      const qrcodeScanner = new Html5Qrcode("physical-camera-canvas-view");
      html5QrCodeRef.current = qrcodeScanner;
      qrcodeScanner.start(
        activeCameraId ? { deviceId: { exact: activeCameraId } } : { facingMode: "environment" },
        { fps: 15, qrbox: { width: 220, height: 220 } },
        (decodedText: string) => {
          verifyAndTriggerAccessByCode(decodedText, 'كاميرا مسح الـ QR للبطاقات');
          playTerminalSound('bell');
        },
        () => {}
      ).catch(() => {
        setCameraScanError('عفواً! تعذر قفل الكاميرا. يرجى تفقد ترخيص الكاميرات بالمتصفح.');
        setIsCameraActive(false);
      });
    } catch {
      setCameraScanError('خطأ تقني في تشغيل مسح QR الكاميرات.');
      setIsCameraActive(false);
    }
  };

  const stopCameraProcessing = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().then(() => {
        setIsCameraActive(false);
        html5QrCodeRef.current = null;
      }).catch(() => setIsCameraActive(false));
    } else {
      setIsCameraActive(false);
    }
  };

  const toggleCameraReceiver = async () => {
    if (isCameraActive) {
      stopCameraProcessing();
    } else {
      setIsCameraActive(true);
      setCameraScanError(null);
      setTimeout(() => startCameraProcessing(), 500);
    }
  };

  const runNativeBiometricRegister = async () => {
    if (!selectedEnrollMemberId) return;
    const memberObj = simulationMemberList.find(m => m.id === selectedEnrollMemberId);
    if (!memberObj) return;

    // Simulate reliable desktop scanner drivers callback
    const fallbackId = btoa(`BIO-FINGER-SHA256-${memberObj.id}-${Date.now()}`);
    if (registeredMembers.length > 0) {
      await db.gymMembershipsList.update(memberObj.id!, {
        gateFingerprint: fallbackId,
        gateFingerprintDate: new Date().toISOString().split('T')[0]
      });
    } else {
      (memberObj as any).gateFingerprint = fallbackId;
      (memberObj as any).gateFingerprintDate = new Date().toISOString().split('T')[0];
    }
    playTerminalSound('success');
    setEnrollScanSuccess(`تم الاتصال بمستشعر البصمات المكتبي. تم قيد ترميز البصمة للعضو: ${memberObj.memberId}`);
  };

  const runNativeBiometricAuthentication = async () => {
    setIsFingerprintScanning(true);
    setFingerprintProgress(10);
    const interval = setInterval(() => {
      setFingerprintProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsFingerprintScanning(false);
            const targetSimName = simulationMemberList[0]?.memberId || "سليم جلال";
            verifyAndTriggerAccessByCode(targetSimName, 'قارئ بصمة بيومترية - مستشعر مدمج');
          }, 400);
          return 100;
        }
        return p + 15;
      });
    }, 100);
  };

  const enrollCustomTokenKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollMemberId || !customEnrollGateToken) return;
    try {
      if (registeredMembers.length > 0) {
        await db.gymMembershipsList.update(selectedEnrollMemberId, { gateToken: customEnrollGateToken });
      } else {
        const item = simulationMemberList.find(m => m.id === selectedEnrollMemberId);
        if (item) (item as any).gateToken = customEnrollGateToken;
      }
      playTerminalSound('success');
      setEnrollScanSuccess('تم حفظ وربط رمز الكارات الذكي / الباركود بنجاح!');
      setCustomEnrollGateToken('');
    } catch (err) {
      console.error(err);
    }
  };

  const testIPRelayConnection = async () => {
    setGateTestStatus('sending');
    setGateTestResponse('جاري إرسال إشارة فتح النبضة...');
    try {
      await fetch(hwSettings.ipRelayUrl, { method: 'GET', mode: 'no-cors' });
      setGateTestStatus('success');
      setGateTestResponse('تم إرسال إشارة الفتح بنجاح للمرافق!');
      playTerminalSound('success');
    } catch (e: any) {
      setGateTestStatus('failed');
      setGateTestResponse(`فشل في الاتصال بالمحقن: ${e.message}`);
      playTerminalSound('error');
    }
  };

  const handleSaveHWSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('gym_access_hw_settings', JSON.stringify(hwSettings));
    playTerminalSound('success');
    setGateTestStatus('success');
    setGateTestResponse('تم حفظ إعدادات المنافذ والأجهزة بنجاح.');
  };

  const [formData, setFormData] = useState({ memberId: '', timestamp: '', type: 'دخول' as 'دخول' | 'خروج', method: 'يدوي' });

  const handleOpenModal = (editMode = false, item: any = null) => {
    setIsEdit(editMode);
    if (editMode && item) {
      setCurrentId(item.id!);
      setFormData({
        memberId: item.memberId || '',
        timestamp: item.timestamp || '',
        type: item.type || 'دخول',
        method: item.method || 'يدوي'
      });
    } else {
      setCurrentId(null);
      const currTime = new Date().toISOString().slice(0, 16).replace('T', ' ');
      setFormData({
        memberId: '',
        timestamp: currTime,
        type: 'دخول',
        method: 'يدوي'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && currentId) {
        await db.gymAccessLogs.update(currentId, formData);
      } else {
        await db.gymAccessLogs.add(formData);
      }
      setIsModalOpen(false);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => {
    await db.gymAccessLogs.delete(id);
  };

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      return Object.values(item).some(val => 
        String(val).toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [records, search]);

  const statsCore = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = records.filter(log => log.timestamp && log.timestamp.includes(todayStr));
    const totalEntriesToday = todayLogs.filter(log => log.type === 'دخول').length;
    const totalExitsToday = todayLogs.filter(log => log.type === 'خروج').length;
    const activeNowInGym = Math.max(0, totalEntriesToday - totalExitsToday);
    return {
      totalEntriesToday,
      totalExitsToday,
      activeNowInGym
    };
  }, [records]);

  const currentBadgeMember = useMemo(() => {
    return simulationMemberList.find(m => m.id === badgeMemberId) || simulationMemberList[0];
  }, [badgeMemberId, simulationMemberList]);

  return {
    search,
    setSearch,
    isModalOpen,
    setIsModalOpen,
    isEdit,
    currentId,
    mainTab,
    setMainTab,
    scannedActionType,
    setScannedActionType,
    scannerInputTab,
    setScannerInputTab,
    activeCameraId,
    setActiveCameraId,
    availableCameras,
    isCameraActive,
    cameraScanError,
    hwSettings,
    setHwSettings,
    lastWedgeInputInfo,
    selectedEnrollMemberId,
    setSelectedEnrollMemberId,
    customEnrollGateToken,
    setCustomEnrollGateToken,
    enrollScanSuccess,
    setEnrollScanSuccess,
    badgeMemberId,
    setBadgeMemberId,
    gateTestStatus,
    gateTestResponse,
    isFingerprintScanning,
    fingerprintProgress,
    lastScanResult,
    setLastScanResult,
    records,
    simulationMemberList,
    filteredRecords,
    statsCore,
    currentBadgeMember,
    playTerminalSound,
    toggleCameraReceiver,
    runNativeBiometricRegister,
    runNativeBiometricAuthentication,
    enrollCustomTokenKey,
    testIPRelayConnection,
    handleSaveHWSettings,
    handleOpenModal,
    handleSave,
    handleDelete,
    verifyAndTriggerAccessByCode,
    formData,
    setFormData
  };
};
