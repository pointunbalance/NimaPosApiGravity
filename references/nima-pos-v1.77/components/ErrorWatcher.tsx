
import React, { useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { trackError } from '../utils/errorTracker';

const ErrorWatcher: React.FC = () => {
    const { error: showErrorToast } = useToast();

    useEffect(() => {
        // 1. Catch Global Script Errors
        const handleGlobalError = (event: ErrorEvent) => {
            trackError(event.error || event.message);
            showErrorToast(`حدث خطأ غير متوقع: ${event.message}`);
        };

        // 2. Catch Unhandled Promise Rejections (Async errors)
        const handlePromiseRejection = (event: PromiseRejectionEvent) => {
            trackError(event.reason);
            showErrorToast('حدث خطأ في عملية بالخلفية');
        };

        window.addEventListener('error', handleGlobalError);
        window.addEventListener('unhandledrejection', handlePromiseRejection);

        return () => {
            window.removeEventListener('error', handleGlobalError);
            window.removeEventListener('unhandledrejection', handlePromiseRejection);
        };
    }, [showErrorToast]);

    return null; // This component doesn't render anything
};

export default ErrorWatcher;
