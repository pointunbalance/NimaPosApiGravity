export interface MaintenanceLogType {
  id: string;
  date: string;
  description: string;
  cost: number;
  paymentMethod: 'cash' | 'bank' | 'on_credit';
  journalRef?: string;
  technician?: string;
}

export interface EquipmentType {
  id?: number;
  name: string;
  type: string;
  status: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number | '';
  nextMaintenance?: string;
  lastMaintenance?: string;
  supervisorId?: number | '';
  supplierName?: string;
  supplierPhone?: string;
  notes?: string;
  maintenanceLogs: MaintenanceLogType[];
}
