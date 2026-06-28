import React, { useState, useEffect } from 'react';
import { Map, Navigation, AlertTriangle, Clock, Zap, MapPin, Activity, CheckCircle2, AlertOctagon, Car } from 'lucide-react';
import { db } from '../db';
import { TicketTripSchedule, TicketVehicle } from '../types';

interface LiveTrip {
    id: string; // Unique id for the active instance
    tripId: number;
    tripCode: string;
    driverName: string;
    vehiclePlate: string;
    destination: string;
    currentSpeed: number;
    speedLimit: number;
    etaStatus: 'on_time' | 'delayed' | 'early';
    progress: number; // 0 to 100
    panicAlert: boolean;
    lastUpdate: string;
    lat: number;
    lng: number;
}

const TicketLiveTracking = () => {
    const [trips, setTrips] = useState<TicketTripSchedule[]>([]);
    const [vehicles, setVehicles] = useState<TicketVehicle[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    
    // Live simulation state
    const [activeTrips, setActiveTrips] = useState<LiveTrip[]>([]);
    const [selectedTrip, setSelectedTrip] = useState<LiveTrip | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [t, v] = await Promise.all([
            db.ticketTripSchedules.toArray(),
            db.ticketVehicles.toArray()
        ]);
        const d = [{ id: 1, name: 'سائق ١' }, { id: 2, name: 'سائق ٢' }]; // Mock drivers
        setTrips(t);
        setVehicles(v);
        setDrivers(d);
        
        // Generate mock live trips based on actual schedules
        const live: LiveTrip[] = t.slice(0, 5).map((trip, idx) => {
            const vehicle = v.find(veh => veh.id === trip.vehicleId);
            const driver = d[idx % (d.length || 1)]; // Assign random driver for demo
            
            const isSpeeding = Math.random() > 0.7; // 30% chance speeding
            const speedLimit = 100;
            const currentSpeed = isSpeeding ? speedLimit + Math.floor(Math.random() * 20) : speedLimit - Math.floor(Math.random() * 30);
            const isPanic = Math.random() > 0.9; // 10% chance panic
            
            let etaOptions: ('on_time' | 'delayed' | 'early')[] = ['on_time', 'delayed', 'early'];
            
            return {
                id: `live-${trip.id}-${Date.now()}`,
                tripId: trip.id!,
                tripCode: trip.tripCode,
                driverName: driver?.name || 'سائق غير محدد',
                vehiclePlate: vehicle?.plateNumber || 'غير محدد',
                destination: trip.routeId ? `مسار ${trip.routeId}` : 'وجهة غير محددة',
                currentSpeed: currentSpeed,
                speedLimit: speedLimit,
                etaStatus: etaOptions[Math.floor(Math.random() * etaOptions.length)],
                progress: Math.floor(Math.random() * 100),
                panicAlert: isPanic,
                lastUpdate: new Date().toLocaleTimeString('ar-EG'),
                lat: 26 + (Math.random() * 4), // Example Egypt Lats
                lng: 30 + (Math.random() * 2)  // Example Egypt Lngs
            };
        });
        
        setActiveTrips(live);
    };

    // Simulate real-time updates every 5 seconds
    useEffect(() => {
        if (activeTrips.length === 0) return;
        
        const interval = setInterval(() => {
            setActiveTrips(prev => prev.map(trip => {
                const speedChange = Math.floor(Math.random() * 11) - 5; // -5 to +5
                let newSpeed = trip.currentSpeed + speedChange;
                if (newSpeed < 0) newSpeed = 0;
                
                let newProgress = trip.progress + (newSpeed > 0 ? (Math.random() * 1) : 0);
                if (newProgress > 100) newProgress = 100;

                // Randomly clear or trigger panic for demo
                let panic = trip.panicAlert;
                if (Math.random() > 0.95) panic = !panic;

                return {
                    ...trip,
                    currentSpeed: newSpeed,
                    progress: newProgress,
                    panicAlert: panic,
                    lastUpdate: new Date().toLocaleTimeString('ar-EG'),
                    lat: trip.lat + (Math.random() * 0.01 - 0.005),
                    lng: trip.lng + (Math.random() * 0.01 - 0.005),
                };
            }));
        }, 5000);

        return () => clearInterval(interval);
    }, [activeTrips.length]);

    const handleResolvePanic = (tripId: string) => {
        setActiveTrips(prev => prev.map(t => t.id === tripId ? {...t, panicAlert: false} : t));
    };

    const StatusBadge = ({ status }: { status: LiveTrip['etaStatus'] }) => {
        switch(status) {
            case 'on_time': return <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700">في الموعد</span>;
            case 'delayed': return <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700">متأخر</span>;
            case 'early': return <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700">مبكر</span>;
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -z-10 translate-x-10 -translate-y-10"></div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
                            <Navigation className="w-6 h-6" />
                        </div>
                        شاشة المتابعة الحية والـ GPS
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Fleet Control & Live Tracking - مراقبة الأسطول وحالة الرحلات لحظة بلحظة</p>
                </div>
                
                <div className="flex gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-center px-4 border-l border-slate-200">
                        <p className="text-xs text-slate-500 font-bold mb-1">الرحلات النشطة</p>
                        <p className="text-2xl font-black text-indigo-600">{activeTrips.length}</p>
                    </div>
                    <div className="text-center px-4 border-l border-slate-200">
                        <p className="text-xs text-slate-500 font-bold mb-1">تجاوز السرعة</p>
                        <p className="text-2xl font-black text-amber-500">{activeTrips.filter(t => t.currentSpeed > t.speedLimit).length}</p>
                    </div>
                    <div className="text-center px-4">
                        <p className="text-xs text-rose-600 font-bold mb-1 flex items-center"><AlertOctagon className="w-3 h-3 ml-1"/> طوارئ</p>
                        <p className={`text-2xl font-black ${activeTrips.filter(t => t.panicAlert).length > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-300'}`}>
                            {activeTrips.filter(t => t.panicAlert).length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
                
                {/* List of Active Trips */}
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col shadow-sm">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shadow-sm z-10">
                        <h3 className="font-bold text-slate-800 flex items-center">
                            <Activity className="w-5 h-5 ml-2 text-indigo-500" />
                            المركبات على الطريق
                        </h3>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Live
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {activeTrips.map(trip => (
                            <div 
                                key={trip.id}
                                onClick={() => setSelectedTrip(trip)}
                                className={`p-4 border rounded-2xl cursor-pointer transition-all ${
                                    selectedTrip?.id === trip.id ? 'bg-indigo-50 border-indigo-500 shadow-md shadow-indigo-100' : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                                } ${trip.panicAlert ? 'border-rose-400 bg-rose-50 animate-pulse' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-black text-slate-800 text-sm flex items-center">
                                            {trip.tripCode}
                                            {trip.panicAlert && <AlertOctagon className="w-4 h-4 text-rose-600 ml-1 mr-1" />}
                                        </h4>
                                        <p className="text-xs text-slate-500 font-bold mt-1">السائق: {trip.driverName}</p>
                                    </div>
                                    <div className="text-left">
                                        <div className={`px-2 py-1 rounded-lg text-xs font-black ${trip.currentSpeed > trip.speedLimit ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                                            {trip.currentSpeed} <span className="font-normal text-[10px]">كم/س</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-3 relative w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                        className={`absolute top-0 right-0 h-full rounded-full transition-all duration-1000 ${
                                            trip.etaStatus === 'delayed' ? 'bg-amber-500' : 
                                            trip.etaStatus === 'early' ? 'bg-indigo-500' : 'bg-emerald-500'
                                        }`}
                                        style={{ width: `${trip.progress}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400 font-bold">
                                    <span>{trip.progress.toFixed(1)}% إنجاز</span>
                                    <span>الوجهة: {trip.destination}</span>
                                </div>
                            </div>
                        ))}
                        {activeTrips.length === 0 && (
                            <div className="p-8 text-center text-slate-500 font-bold">لا توجد رحلات نشطة حالياً</div>
                        )}
                    </div>
                </div>

                {/* Simulated Map / Details */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Map Area */}
                    <div className="flex-1 bg-slate-900 rounded-3xl border border-slate-200 overflow-hidden relative shadow-inner">
                        {/* CSS Simulated Map Layout for Operations */}
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-slate-900 to-slate-900"></div>
                        
                        {/* Grid lines */}
                        <div className="absolute top-0 right-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:40px_40px]"></div>
                        
                        {/* Tracking Radar UI */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                            <div className="w-[800px] h-[800px] border border-indigo-500 rounded-full"></div>
                            <div className="w-[600px] h-[600px] border border-indigo-500/50 rounded-full absolute"></div>
                            <div className="w-[400px] h-[400px] border border-indigo-500/30 rounded-full absolute"></div>
                            <div className="w-[200px] h-[200px] border border-indigo-500/20 rounded-full absolute"></div>
                            <div className="w-full h-[1px] bg-indigo-500/30 absolute"></div>
                            <div className="h-full w-[1px] bg-indigo-500/30 absolute"></div>
                        </div>

                        {/* Rendering Vehicle Points */}
                        {activeTrips.map((trip, idx) => {
                            // Map Lat/Lng to somewhat relative positions for demo
                            const top = `${30 + ((trip.lat - 26) / 4) * 40}%`;
                            const right = `${20 + ((trip.lng - 30) / 2) * 60}%`;
                            const isSelected = selectedTrip?.id === trip.id;
                            
                            return (
                                <div 
                                    key={trip.id}
                                    className={`absolute cursor-pointer transition-all duration-1000 ${isSelected ? 'z-20' : 'z-10'}`}
                                    style={{ top, right }}
                                    onClick={() => setSelectedTrip(trip)}
                                >
                                    {trip.panicAlert && (
                                        <div className="absolute -inset-8 bg-rose-500/20 rounded-full animate-ping"></div>
                                    )}
                                    <div className={`relative w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-lg ${
                                        trip.panicAlert ? 'bg-rose-600 border-rose-300' :
                                        isSelected ? 'bg-white border-indigo-600 text-indigo-600 scale-125' : 
                                        'bg-indigo-600 border-indigo-300 text-white'
                                    }`}>
                                        <Navigation className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-white'}`} style={{ transform: `rotate(${Math.random() * 360}deg)` }}/>
                                    </div>
                                    
                                    {/* Hover / Selected Info Tooltip */}
                                    <div className={`absolute top-full right-1/2 translate-x-1/2 mt-2 bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 shadow-xl w-48 text-right pointer-events-none transition-opacity ${isSelected || trip.panicAlert ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100`}>
                                        <p className="font-bold text-xs truncate">{trip.tripCode}</p>
                                        <p className="text-[10px] text-slate-300 mt-1">{trip.currentSpeed} كم/س <span className="mx-1">•</span> {trip.vehiclePlate}</p>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Minimap / Legend overlay */}
                        <div className="absolute bottom-4 right-4 bg-slate-800/80 backdrop-blur-md border border-slate-700 p-3 rounded-2xl text-xs text-slate-300 pointer-events-none">
                            <p className="font-bold text-white mb-2 pb-2 border-b border-slate-600">مفتاح الخريطة</p>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-600"></div> حركة طبيعية</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-600 animate-pulse"></div> طوارئ (SOS)</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-white border border-indigo-600"></div> محدص حالياً</div>
                            </div>
                        </div>

                    </div>

                    {/* Selected Trip Details Pane */}
                    {selectedTrip ? (
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm animate-in slide-in-from-bottom-4 shrink-0 transition-all">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                        بيانات الرحلة التفاعلية <span className="text-indigo-600">{selectedTrip.tripCode}</span>
                                    </h3>
                                    <p className="text-sm text-slate-500 font-bold mt-1">تحديث: {selectedTrip.lastUpdate}</p>
                                </div>
                                <div className="flex gap-2">
                                    <StatusBadge status={selectedTrip.etaStatus as any} />
                                    {selectedTrip.panicAlert && (
                                        <button onClick={() => handleResolvePanic(selectedTrip.id)} className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors">
                                            معالجة الطوارئ ✓
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <p className="text-slate-500 text-xs font-bold mb-1 flex items-center"><Zap className="w-3.5 h-3.5 ml-1 text-slate-400"/> السرعة الحالية</p>
                                    <p className={`text-2xl font-black ${selectedTrip.currentSpeed > selectedTrip.speedLimit ? 'text-rose-600' : 'text-slate-800'}`}>
                                        {selectedTrip.currentSpeed} <span className="text-sm text-slate-500">كم/س</span>
                                    </p>
                                    {selectedTrip.currentSpeed > selectedTrip.speedLimit && (
                                        <p className="text-[10px] text-rose-500 font-bold mt-1">تجاوز السرعة القانونية!</p>
                                    )}
                                </div>
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <p className="text-slate-500 text-xs font-bold mb-1 flex items-center"><Car className="w-3.5 h-3.5 ml-1 text-slate-400"/> المركبة - السائق</p>
                                    <p className="font-black text-slate-800 text-sm truncate">{selectedTrip.vehiclePlate}</p>
                                    <p className="text-xs text-slate-600 font-bold mt-1 truncate">{selectedTrip.driverName}</p>
                                </div>
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <p className="text-slate-500 text-xs font-bold mb-1 flex items-center"><Navigation className="w-3.5 h-3.5 ml-1 text-slate-400"/> الوجهة</p>
                                    <p className="font-black text-slate-800 text-sm h-full flex items-center">{selectedTrip.destination}</p>
                                </div>
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <p className="text-slate-500 text-xs font-bold mb-1 flex items-center"><AlertOctagon className="w-3.5 h-3.5 ml-1 text-slate-400"/> الحالة الأمنية</p>
                                    {selectedTrip.panicAlert ? (
                                        <p className="font-black text-rose-600 text-sm bg-rose-100 px-2 py-1 rounded w-fit animate-pulse">زر طوارئ نشط!</p>
                                    ) : (
                                        <p className="font-black text-emerald-600 text-sm flex items-center"><CheckCircle2 className="w-4 h-4 ml-1"/> مستقرة</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50/50 border border-slate-100 border-dashed rounded-3xl flex items-center justify-center shrink-0 h-48">
                            <p className="text-slate-400 font-bold text-sm">حدد مركبة من القائمة أو الخريطة لعرض تفاصيلها</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TicketLiveTracking;
