export const initialDeferrals = [
  { id: '1', type: 'revenues', description: 'عقد صيانة سنوي - شركة العليان', reference: 'INV-24-089', totalAmount: 120000, remainingAmount: 60000, periodMonths: 12, monthlyAmount: 10000, lastAmortization: '2024-05-31' },
  { id: '2', type: 'expenses', description: 'إيجار مبنى الإدارة (سنوي)', reference: 'PV-102', totalAmount: 240000, remainingAmount: 100000, periodMonths: 12, monthlyAmount: 20000, lastAmortization: '2024-05-31' },
];

export const amortizationSchedule = [
  { name: 'يناير', revenue: 15000, expense: 8000 },
  { name: 'فبراير', revenue: 16500, expense: 8000 },
  { name: 'مارس', revenue: 20000, expense: 8500 },
  { name: 'أبريل', revenue: 22000, expense: 9000 },
  { name: 'مايو', revenue: 18000, expense: 8500 },
  { name: 'يونيو', revenue: 25000, expense: 12000 },
];
