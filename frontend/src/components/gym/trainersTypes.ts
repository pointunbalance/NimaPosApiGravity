export interface PayoutRecord {
  id: string;
  date: string;
  baseSalary: number;
  commissionAmount: number;
  extraBonus: number;
  extraDeduction: number;
  totalAmount: number;
  paymentMethod: string;
  notes?: string;
  journalRef?: string;
}

export interface TrainerType {
  id?: number;
  name: string;
  specialization: string;
  phone: string;
  status: 'متاح' | 'في إجازة' | 'موقوف';
  bio?: string;
  shift?: string;
  baseSalary?: number;
  commissionType?: 'fixed_per_student' | 'percentage_of_session';
  commissionValue?: number;
  rating?: number;
  hireDate?: string;
  payoutHistory?: PayoutRecord[];
}

export const SHIFT_OPTIONS = [
  'صباحي (06:00 ص - 02:00 م)',
  'مسائي (02:00 م - 10:00 م)',
  'دوام كامل (09:00 ص - 06:00 م)',
  'مرن / حسب الطلب'
];

export const SPECIALIZATION_OPTIONS = [
  '🏋️‍♂️ كمال أجسام وحديد',
  '🏃‍♂️ لياقة بدنية وكارديو',
  '🧘‍♀️ يوغا وبيلاتس',
  '🥊 بوكسينغ وفنون قتالية',
  '🔥 كروس فت وتدريب وظيفي',
  '📉 تخسيس وحرق مكثف',
  '🏊‍♂️ حصص مائية وسباحة',
  '✨ تدريب خاص ومقترن'
];
