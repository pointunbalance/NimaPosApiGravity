import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';
import { syncService } from '../../services/SyncService';

export const SyncIndicator = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const unsubscribe = syncService.subscribe((online, count) => {
            setIsOnline(online);
            setPendingCount(count);
        });
        return unsubscribe;
    }, []);

    if (isOnline && pendingCount === 0) {
        return (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1" title="متصل - مزامنة ثنائية مفعلة">
                <Cloud className="w-4 h-4" />
                متصل
            </span>
        );
    }

    if (isOnline && pendingCount > 0) {
        return (
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 flex items-center gap-2" title="جاري المزامنة مع الخادم">
                <RefreshCw className="w-4 h-4 animate-spin" />
                مزامنة ({pendingCount})
            </span>
        );
    }

    // Offline mode
    return (
        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 flex items-center gap-1" title="وضع غير متصل بالإنترنت - يتم حفظ البيانات محلياً">
            <CloudOff className="w-4 h-4" />
            غير متصل بالشبكة (محلي) 
            {pendingCount > 0 && <span className="mr-1 text-rose-500 font-black">[{pendingCount} قيد الانتظار]</span>}
        </span>
    );
};
