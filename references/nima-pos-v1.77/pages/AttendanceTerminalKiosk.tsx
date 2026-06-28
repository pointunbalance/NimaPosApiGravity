import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, CheckCircle, XCircle, ArrowRight, User as UserIcon } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

export const AttendanceTerminalKiosk = () => {
    const navigate = useNavigate();
    const [pin, setPin] = useState('');
    const [step, setStep] = useState<'pin' | 'preview' | 'success' | 'error'>('pin');
    const [message, setMessage] = useState('');
    const [employee, setEmployee] = useState<any>(null);
    const [countdown, setCountdown] = useState(2); // Reduced to 2 second delay for faster capture
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Continuous clock
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // PIN logic
    const handleNumberClick = (num: string) => {
        if (pin.length < 8) {
            setPin(prev => prev + num);
        }
    };

    const handleClear = () => {
        setPin('');
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
    };

    // Auto-submit when PIN reaches 8 digits
    useEffect(() => {
        if (pin.length === 8 && step === 'pin') {
            checkPin(pin);
        }
    }, [pin, step]);

    const checkPin = async (enteredPin: string) => {
        try {
            const users = await db.users.toArray();
            const user = users.find(u => u.pin === enteredPin && u.isActive !== false);

            if (user) {
                setEmployee(user);
                setPin('');
                setStep('preview');
                startCamera();
            } else {
                setMessage('الرمز السري غير صحيح');
                setStep('error');
                setTimeout(() => {
                    setPin('');
                    setStep('pin');
                }, 2000);
            }
        } catch (error) {
            console.error('Error checking PIN:', error);
            setMessage('حدث خطأ في النظام');
            setStep('error');
            setTimeout(() => {
                setPin('');
                setStep('pin');
            }, 2000);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for video metadata to load to ensure it's playing
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    startCountdown();
                };
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setMessage('تعذر الوصول للكاميرا. يرجى التحقق من الصلاحيات.');
            setStep('error');
            setTimeout(() => {
                setStep('pin');
            }, 3000);
        }
    };

    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
        }
    }, []);

    const startCountdown = () => {
        setCountdown(2);
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    captureImage();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const captureImage = async () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            // Draw video frame to canvas
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageDataUrl = canvas.toDataURL('image/jpeg', 0.6); // compress sightly
                setImageSrc(imageDataUrl);
                stopCamera();
                await markAttendance(imageDataUrl);
            }
        }
    };

    const markAttendance = async (photoData: string) => {
        if (!employee) return;
        
        const today = format(new Date(), 'yyyy-MM-dd');
        const currentTime = format(new Date(), 'HH:mm');

        const timeToMinutes = (timeStr: string) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };

        let shiftStartMin = employee.shiftStartTime ? timeToMinutes(employee.shiftStartTime) : null;
        let shiftEndMin = employee.shiftEndTime ? timeToMinutes(employee.shiftEndTime) : null;

        try {
            if (employee.workShiftId && (!shiftStartMin || !shiftEndMin)) {
                 const workShift = await db.workShifts.get(employee.workShiftId);
                 if (workShift) {
                     if (!shiftStartMin && workShift.startTime) shiftStartMin = timeToMinutes(workShift.startTime);
                     if (!shiftEndMin && workShift.endTime) shiftEndMin = timeToMinutes(workShift.endTime);
                 }
            }

            let currentMin = timeToMinutes(currentTime);

            const existingRecord = await db.attendance.where({ userId: employee.id!, date: today }).first();

            if (existingRecord) {
                if (!existingRecord.checkOutTime) {
                    // It's a check-out
                    let earlyLeaveMinutes = 0;
                    if (shiftEndMin && currentMin < shiftEndMin) {
                        earlyLeaveMinutes = shiftEndMin - currentMin;
                    }

                    await db.attendance.update(existingRecord.id!, {
                        checkOutTime: currentTime,
                        photoOut: photoData,
                        earlyLeaveMinutes: earlyLeaveMinutes > 0 ? earlyLeaveMinutes : undefined
                    });

                    let msg = `تم تسجيل الانصراف بنجاح، رافقتك السلامة ${employee.name.split(' ')[0]}`;
                    if (earlyLeaveMinutes > 0) {
                        toast.error(`تنبيه للمدير: انصراف مبكر للموظف ${employee.name} بمقدار ${earlyLeaveMinutes} دقيقة`, { duration: 5000 });
                    }
                    setMessage(msg);
                } else {
                    // Already checked out
                    setMessage(`لقد قمت بتسجيل الحضور والانصراف لهذا اليوم ${employee.name.split(' ')[0]}`);
                }
            } else {
                // It's a check-in
                let lateMinutes = 0;
                let status: 'present' | 'late' = 'present';
                if (shiftStartMin && currentMin > shiftStartMin + 15) { // 15 mins grace period
                    lateMinutes = currentMin - shiftStartMin;
                    status = 'late';
                }

                await db.attendance.add({
                    userId: employee.id!,
                    date: today,
                    checkInTime: currentTime,
                    photoIn: photoData,
                    status: status,
                    lateMinutes: lateMinutes > 0 ? lateMinutes : undefined
                });

                let msg = `تم تسجيل الحضور بنجاح، أهلاً بك ${employee.name.split(' ')[0]}`;
                if (lateMinutes > 0) {
                    toast.error(`تنبيه للمدير: تأخير الموظف ${employee.name} بمقدار ${lateMinutes} دقيقة`, { duration: 5000 });
                }
                setMessage(msg);
            }

            setStep('success');
            setTimeout(() => {
                resetTerminal();
            }, 4000); // Wait 4 seconds on success screen
            
        } catch (error) {
            console.error('Error marking attendance:', error);
            setMessage('حدث خطأ أثناء حفظ السجل');
            setStep('error');
            setTimeout(() => {
                resetTerminal();
            }, 3000);
        }
    };

    const resetTerminal = () => {
        setStep('pin');
        setPin('');
        setEmployee(null);
        setImageSrc(null);
        setMessage('');
        stopCamera();
    };

    // Clean up camera on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);


    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100 overflow-hidden relative" dir="rtl">
            <Toaster position="top-center" />
            {/* Background decorative blobs */}
            <div className="absolute top-0 right-0 -m-32 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute bottom-0 left-0 -m-32 w-96 h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            <button 
                onClick={() => {stopCamera(); navigate('/attendance');}}
                className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white transition-all z-50">
                <ArrowRight className="w-5 h-5" />
                <span>إغلاق</span>
            </button>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center z-10">
                {/* Left side: Clock and Info */}
                <div className="flex flex-col items-center md:items-start text-center md:text-right space-y-6">
                    <div className="backdrop-blur-md bg-white/5 border border-white/10 p-8 rounded-3xl w-full shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-xl text-indigo-300 font-medium mb-2">
                                {format(time, 'EEEE، d MMMM yyyy', { locale: arSA })}
                            </h2>
                            <h1 className="text-7xl font-black tabular-nums text-white tracking-tight">
                                {format(time, 'HH:mm')}
                            </h1>
                            <p className="text-slate-400 mt-2 font-mono text-xl animate-pulse">
                                {format(time, 'ss')} ثانية
                            </p>
                        </div>
                    </div>
                    <div className="px-4">
                       <h3 className="text-2xl font-bold mb-2">نظام الحضور والانصراف</h3>
                       <p className="text-slate-400">يرجى إدخال رمز الموظف الخاص بك لتسجيل الدخول أو الخروج السريع بصمة الوجه المرفقة.</p>
                    </div>
                </div>

                {/* Right side: Interactive Panel */}
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col items-center min-h-[500px] justify-center">
                    
                    {step === 'pin' && (
                        <div className="w-full max-w-xs mx-auto animate-in fade-in zoom-in-95 duration-300">
                            <div className="text-center mb-8">
                                <p className="text-lg text-slate-300 font-medium mb-4">أدخل الرمز السري</p>
                                <div className="flex justify-center gap-4">
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className={`w-5 h-5 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-indigo-400 scale-125 shadow-[0_0_15px_rgba(129,140,248,0.5)]' : 'bg-slate-700'}`}></div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => handleNumberClick(num.toString())}
                                        className="h-16 rounded-2xl bg-white/5 hover:bg-white/20 text-2xl font-bold transition-all active:scale-95 shadow-sm hover:shadow-indigo-500/20"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    onClick={handleClear}
                                    className="h-16 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-lg font-bold transition-all active:scale-95"
                                >
                                    مسح
                                </button>
                                <button
                                    onClick={() => handleNumberClick('0')}
                                    className="h-16 rounded-2xl bg-white/5 hover:bg-white/20 text-2xl font-bold transition-all active:scale-95 shadow-sm"
                                >
                                    0
                                </button>
                                <button
                                    onClick={handleBackspace}
                                    className="h-16 rounded-2xl bg-slate-700/50 hover:bg-slate-700/80 text-lg font-bold transition-all active:scale-95 flex items-center justify-center"
                                >
                                    ⌫
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-500">
                            <h3 className="text-xl font-bold mb-6 text-center text-indigo-200">
                                أهلاً {employee?.name}، انظر للكاميرا!
                            </h3>
                            <div className="relative w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.4)]">
                                <video 
                                    ref={videoRef}
                                    className="object-cover w-full h-full transform -scale-x-100"
                                    playsInline
                                    muted
                                ></video>
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                                    <span className="text-8xl font-black text-white drop-shadow-lg animate-pulse">
                                        {countdown}
                                    </span>
                                </div>
                            </div>
                            <p className="mt-6 text-slate-300 font-medium text-center animate-pulse flex items-center gap-2">
                                <Camera className="w-5 h-5 text-indigo-400" />
                                <span>جاري التقاط الصورة...</span>
                            </p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="w-full flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="w-32 h-32 mb-6 rounded-full overflow-hidden border-4 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                                {imageSrc ? (
                                    <img src={imageSrc} alt="Captured preview" className="w-full h-full object-cover transform -scale-x-100" />
                                ) : (
                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                       <UserIcon className="w-12 h-12 text-slate-500" />
                                    </div>
                                )}
                            </div>
                            <CheckCircle className="w-16 h-16 text-emerald-400 mb-4 animate-bounce" />
                            <h3 className="text-2xl font-bold text-white mb-2">{message}</h3>
                            <p className="text-emerald-200/80">تم التوثيق بالبصمة الحيوية</p>
                            <p className="mt-8 text-sm text-slate-500">جاري العودة للرئيسية...</p>
                        </div>
                    )}

                    {step === 'error' && (
                        <div className="w-full flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                            <XCircle className="w-20 h-20 text-rose-500 mb-6" />
                            <h3 className="text-2xl font-bold text-white">{message}</h3>
                        </div>
                    )}

                </div>
            </div>
            
            {/* Hidden canvas for capturing image */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};
