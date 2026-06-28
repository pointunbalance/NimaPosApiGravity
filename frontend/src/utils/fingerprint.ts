export async function generateSHA256Hash(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const getDeviceFingerprint = async (): Promise<string> => {
    const components = [
        navigator.userAgent,
        navigator.language,
        screen.colorDepth,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset()
    ];
    let storedId = localStorage.getItem('device_fingerprint');
    if (!storedId) {
        storedId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('device_fingerprint', storedId);
    }
    const rawFingerprint = components.join('|') + '|' + storedId;
    const fullHash = await generateSHA256Hash(rawFingerprint);
    return fullHash.substring(0, 32).toUpperCase();
};

export const APP_MODULES = [
    { id: 'pos', label: 'كاشير المبيعات ونقاط البيع (الأساسي)', bit: 0 },
    { id: 'rentals', label: 'تأجير الملابس والأزياء', bit: 1 },
    { id: 'tailoring', label: 'التفصيل والخياطة', bit: 2 },
    { id: 'studio', label: 'حجوزات الاستوديو', bit: 3 },
    { id: 'restaurant', label: 'المطاعم والكافيهات', bit: 4 },
    { id: 'accounting', label: 'الحسابات العامة المتقدمة', bit: 5 },
    { id: 'hr', label: 'شؤون الموظفين والرواتب', bit: 6 },
    { id: 'crm', label: 'إدارة علاقات العملاء والتسويق', bit: 7 },
    { id: 'manufacturing', label: 'التصنيع والإنتاج', bit: 8 },
    { id: 'clinics', label: 'العيادات الطبية وإدارتها', bit: 9 },
    { id: 'school', label: 'إدارة المدارس والتعليم', bit: 10 },
    { id: 'realestate', label: 'إدارة الأملاك والعقارات', bit: 11 },
    { id: 'legal', label: 'المحاماة والشؤون القانونية', bit: 12 },
    { id: 'hotel', label: 'الفنادق والشقق بجميع أنواعها', bit: 13 },
] as const;

export interface LicenseConfig {
    featuresMask: number;
    packageType: 'basic' | 'pro' | 'enterprise' | 'trial';
    maxUsers: number;
    maxStudents: number;
}

export const generateActivationKey = async (fingerprint: string, durationDays: number = 365, config: LicenseConfig = { featuresMask: 0xFFFF, packageType: 'enterprise', maxUsers: 9999, maxStudents: 9999 }): Promise<string> => {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + durationDays);
    const expirationTimestamp = expirationDate.getTime();
    
    const timestampHex = expirationTimestamp.toString(16).toUpperCase();
    const featuresHex = config.featuresMask.toString(16).toUpperCase();
    
    // pack package info (Type: 0=trial, 1=basic, 2=pro, 3=enterprise), maxUsers (12 bits), maxStudents (16 bits)
    let typeVal = 3;
    if (config.packageType === 'trial') typeVal = 0;
    else if (config.packageType === 'basic') typeVal = 1;
    else if (config.packageType === 'pro') typeVal = 2;
    
    // type (4 bits) | users (12 bits) | students (16 bits) -> 32 bits
    const limitNum = (typeVal << 28) | ((config.maxUsers & 0xFFF) << 16) | (config.maxStudents & 0xFFFF);
    const limitHex = limitNum.toString(16).toUpperCase().padStart(8, '0');
    
    // Hash includes time, features, and limits
    const fullHash = await generateSHA256Hash(fingerprint + timestampHex + featuresHex + limitHex + "NIMA_POS_SECRET_V5");
    return `${timestampHex}-${featuresHex}-${limitHex}-${fullHash.substring(0, 16).toUpperCase()}`;
};

export const validateActivationKey = async (fingerprint: string, keyToValidate: string): Promise<{ valid: boolean; isExpired?: boolean; expirationDate?: Date; config?: LicenseConfig }> => {
    if (!keyToValidate || !keyToValidate.includes('-')) {
        return { valid: false };
    }
    
    const parts = keyToValidate.split('-');
    
    if (parts.length < 4) {
        // Fallback for V4
        if (parts.length === 3) {
            const [tHex, fHex, hPart] = parts;
            const eHash = await generateSHA256Hash(fingerprint + tHex + fHex + "NIMA_POS_SECRET_V4");
            if (hPart.toUpperCase() === eHash.substring(0, 16).toUpperCase()) {
                 const expirationTimestamp = parseInt(tHex, 16);
                 const expirationDate = new Date(expirationTimestamp);
                 const now = new Date();
                 const config: LicenseConfig = { featuresMask: parseInt(fHex, 16), packageType: 'enterprise', maxUsers: 9999, maxStudents: 9999 };
                 return { valid: true, isExpired: now.getTime() > expirationTimestamp, expirationDate, config };
            }
        }
        return { valid: false };
    }
    
    const [timestampHex, featuresHex, limitHex, hashPart] = parts;
    const expectedHash = await generateSHA256Hash(fingerprint + timestampHex + featuresHex + limitHex + "NIMA_POS_SECRET_V5");
    
    if (hashPart.toUpperCase() !== expectedHash.substring(0, 16).toUpperCase()) {
        return { valid: false };
    }
    
    const expirationTimestamp = parseInt(timestampHex, 16);
    const featuresMask = parseInt(featuresHex, 16);
    const limitNum = parseInt(limitHex, 16);
    
    const typeVal = (limitNum >> 28) & 0xF;
    const maxUsers = (limitNum >> 16) & 0xFFF;
    const maxStudents = limitNum & 0xFFFF;
    
    let packageType: LicenseConfig['packageType'] = 'enterprise';
    if (typeVal === 0) packageType = 'trial';
    else if (typeVal === 1) packageType = 'basic';
    else if (typeVal === 2) packageType = 'pro';
    
    const config: LicenseConfig = { featuresMask, packageType, maxUsers, maxStudents };
    
    const expirationDate = new Date(expirationTimestamp);
    const now = new Date();
    
    return { valid: true, isExpired: now.getTime() > expirationTimestamp, expirationDate, config };
};
