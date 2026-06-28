import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Printer, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export const PrinterMonitor: React.FC = () => {
    const printers = useLiveQuery(() => db.printers.toArray(), []) || [];
    
    // We can simulate printer status, or just show them all. In a real world, we would have a status field or ping them.
    // Since we don't have real network pings here, we will just show their configured status or assume online if they exist.
    const onlinePrinters = printers.filter(p => p.type === 'network' || p.type === 'system');
    
    if (printers.length === 0) return null;

    return (
        <div className="relative group flex items-center">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/50 border border-slate-200 rounded-full hover:bg-white transition-colors">
                <Printer className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-600">{printers.length}</span>
                {onlinePrinters.length === printers.length ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
            </button>

            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-3">
                <h4 className="text-sm font-bold text-slate-800 mb-3 border-b pb-2 flex items-center justify-between">
                    <span>حالة الطابعات</span>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">{printers.length} طابعة</span>
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {printers.map(printer => (
                        <div key={printer.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-slate-100 rounded-md text-slate-600">
                                    <Printer className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-700">{printer.name}</p>
                                    <p className="text-[9px] text-slate-400 capitalize">{printer.type}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md">
                                <CheckCircle2 className="w-3 h-3" />
                                <span className="text-[10px] font-bold">متصلة</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
