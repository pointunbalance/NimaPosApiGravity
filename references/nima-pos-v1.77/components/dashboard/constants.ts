import { 
  LayoutGrid, ShoppingCart, Users, Briefcase, AppWindow, Server, LucideIcon 
} from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const TABS: TabItem[] = [
  { id: 'all', label: 'الكل', icon: LayoutGrid },
  { id: 'core', label: 'المبيعات والارتباطات', icon: ShoppingCart },
  { id: 'hr', label: 'الموارد البشرية', icon: Users },
  { id: 'ops', label: 'المخازن والمشتريات', icon: Briefcase },
  { id: 'industry', label: 'الحلول المتخصصة', icon: AppWindow },
  { id: 'admin', label: 'الإعدادات والنظام', icon: Server },
];

export const CATEGORY_MAP: Record<string, string> = {
  'نقطة البيع والتشغيل': 'core',
  'المطعم والكافيه': 'industry',
  'الخدمات والحجوزات': 'industry',
  'إدارة الملابس والأزياء': 'industry',
  'قسم التفصيل والخياطة': 'industry',
  'قسم الاستوديو والتصوير': 'industry',
  'إدارة التعليم والمدارس': 'industry',
  'الورش ومراكز الصيانة': 'industry',
  'صيانة الكمبيوتر والموبايل': 'industry',
  'الأندية الرياضية (الجيم)': 'industry',
  'الفنادق والضيافة': 'industry',
  'العيادات والمراكز الطبية': 'industry',
  'الصيدلية وإدارة الدواء': 'industry',
  'المبيعات والطلبات': 'core',
  'فريق المبيعات والتوزيع': 'core',
  'العملاء وبرامج الولاء': 'core',
  'إدارة علاقات العملاء (CRM)': 'core',
  'إدارة المنتجات': 'ops',
  'التصنيع والإنتاج': 'ops',
  'المستودعات والمخزون': 'ops',
  'المشتريات والموردين': 'ops',
  'الشحن واللوجستيات': 'ops',
  'المشاريع والتشغيل': 'ops',
  'الموارد البشرية (Core HR)': 'hr',
  'الرواتب والمزايا': 'hr',
  'إدارة المواهب وتطويرها': 'hr',
  'المالية والمحاسبة': 'admin',
  'العمليات المالية المتقدمة': 'admin',
  'الضرائب والإقفال': 'admin',
  'الإدارة القانونية': 'industry',
  'التقارير والإحصائيات': 'admin',
  'التكوين الإداري': 'admin',
  'أدوات المؤسسة': 'admin',
  'إدارة النظام والأمان': 'admin',
};
