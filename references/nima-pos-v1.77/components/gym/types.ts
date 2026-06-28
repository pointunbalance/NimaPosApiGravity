export interface ClassType {
  id?: number;
  name: string;
  trainerId: string;    // Store trainer name or ID
  schedule: string;     // Formatted schedule string, e.g., "السبت، الإثنين [06:00 مساءً]"
  days?: string[];      // Days array, e.g. ["السبت", "الإثنين"]
  time?: string;        // 24h format time, e.g. "18:00"
  capacity: number;
  room?: string;        // Room/Hall, e.g. "صالة مخصصة A"
  category?: string;    // Category: Cardio, Iron, Yoga, MartialArts, etc.
  price?: number;       // Custom session price if premium
  status?: 'نشطة' | 'معلقة';
  enrolledMembers?: EnrolledMemberType[];
}

export interface EnrolledMemberType {
  memberId: string;
  memberName: string;
  phone?: string;
  enrolledAt: string;
  paidAmount?: number;
  paymentMethod?: string;
}

export const CATEGORIES_OPTIONS = [
  { value: 'كارديو ولياقة بدنية', label: '🏃‍♂️ كارديو ولياقة بدنية', color: 'emerald' },
  { value: 'كمال أجسام وحديد', label: '🏋️‍♂️ كمال أجسام وحديد', color: 'orange' },
  { value: 'يوغا وبيلاتس', label: '🧘‍♀️ يوغا وبيلاتس', color: 'violet' },
  { value: 'كروس فت وتدريب وظيفي', label: '🔥 كروس فت وتدريب وظيفي', color: 'amber' },
  { value: 'بوكسينغ وفنون قتالية', label: '🥊 بوكسينغ وفنون قتالية', color: 'rose' },
  { value: 'تخسيس وحرق مكثف', label: '📉 تخسيس وحرق مكثف', color: 'pink' },
  { value: 'حصص مائية وسباحة', label: '🏊‍♂️ حصص مائية وسباحة', color: 'cyan' },
  { value: 'أخرى / ترفيهي', label: '✨ أخرى / مكس', color: 'slate' }
];

export const WEEK_DAYS = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
