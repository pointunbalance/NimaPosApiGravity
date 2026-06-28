
import { logActivity } from './logger';

export const trackError = async (error: any, errorInfo?: any) => {
    try {
        let message = 'Unknown Error';
        let stack = '';

        if (typeof error === 'string') {
            message = error;
        } else if (error instanceof Error) {
            message = error.message;
            stack = error.stack || '';
        }

        const details = errorInfo 
            ? `Component Stack: ${JSON.stringify(errorInfo)}\nStack: ${stack}`
            : `Stack: ${stack}`;

        // Log to IndexedDB (Logbook)
        await logActivity(
            'system', 
            `خطأ تلقائي: ${message.substring(0, 50)}...`, 
            details, 
            0, 
            undefined, 
            'error'
        );

        console.error("System Error Tracked:", message, details);
    } catch (loggingError) {
        console.error("Failed to log error to DB:", loggingError);
    }
};
