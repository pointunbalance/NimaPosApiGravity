export interface MembershipType {
  id?: number;
  memberId: string;
  phone?: string;
  plan: string;
  price: number;
  startDate: string;
  endDate: string;
  status: 'فعال' | 'منتهي' | 'معلق';
  paymentMethod?: string;
  notes?: string;
}

export interface GymPlanType {
  id: string;
  name: string;
  durationDays: number;
  price: number;
  category: string;
}

export const DEFAULT_PLANS: GymPlanType[] = [
  { id: 'pla_1', name: 'الباقة الشهرية العادية', durationDays: 30, price: 350, category: 'عام' },
  { id: 'pla_2', name: 'الباقة الربع سنوية', durationDays: 90, price: 950, category: 'عام' },
  { id: 'pla_3', name: 'الباقة السنوية الكبرى', durationDays: 365, price: 3200, category: 'عام' },
  { id: 'pla_4', name: 'باقة VIP شاملة مسبح وسبا', durationDays: 30, price: 1200, category: 'ذهبي' },
  { id: 'pla_5', name: 'حصص يوغا وتخسيس مكثفة', durationDays: 14, price: 500, category: 'تخصصي' },
  { id: 'pla_6', name: 'باقة تدريب شخصي مخصصة', durationDays: 30, price: 1800, category: 'ذهبي' }
];
