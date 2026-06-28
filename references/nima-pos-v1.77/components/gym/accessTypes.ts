export interface HardwareSettingsType {
  ipRelayUrl: string;
  ipRelayDuration: number;
  ipRelayAutoOff: boolean;
  ipRelayOffUrl: string;
  enableWedgeScanner: boolean;
  enableLocalRelay: boolean;
  enableNativeBiometrics: boolean;
}

export interface AccessLogType {
  id?: number;
  memberId: string;
  timestamp: string;
  type: 'دخول' | 'خروج';
  method: string;
}

export interface ScanResultType {
  memberName: string;
  type: 'دخول' | 'خروج';
  status: 'success' | 'expired' | 'warning' | 'notfound';
  plan: string;
  endDate: string;
  method: string;
  message: string;
}
