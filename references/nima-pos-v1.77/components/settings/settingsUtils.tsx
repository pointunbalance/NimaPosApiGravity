import React from 'react';

export const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <div 
        onClick={onChange}
        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 flex items-center ${checked ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'}`}
    >
        <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
    </div>
);

export const SectionTitle = ({ icon: Icon, title, desc }: { icon: any, title: string, desc?: string }) => (
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <h3 className="font-bold text-slate-800 text-lg leading-tight">{title}</h3>
            {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
        </div>
    </div>
);

export const AVAILABLE_PAGES = [
  // نقطة البيع والتشغيل
  { path: '/', label: 'لوحة القيادة (Dashboard)', section: 'نقطة البيع والتشغيل' },
  { path: '/pos', label: 'نقطة البيع (POS)', section: 'نقطة البيع والتشغيل' },
  { path: '/restaurant-pos', label: 'كاشير المطعم', section: 'نقطة البيع والتشغيل' },
  { path: '/kitchen', label: 'شاشة المطبخ', section: 'نقطة البيع والتشغيل' },
  { path: '/tables', label: 'إدارة الطاولات', section: 'نقطة البيع والتشغيل' },
  { path: '/delivery', label: 'إدارة التوصيل', section: 'نقطة البيع والتشغيل' },
  { path: '/employee-portal', label: 'بوابة الموظفين', section: 'نقطة البيع والتشغيل' },

  // إدارة الملابس والأزياء
  { path: '/pos', label: 'كاشير المبيعات', section: 'إدارة الملابس والأزياء' },
  { path: '/rentals', label: 'إيجار وحجوزات الملابس', section: 'إدارة الملابس والأزياء' },
  { path: '/products', label: 'إدارة الموديلات والمقاسات', section: 'إدارة الملابس والأزياء' },
  { path: '/customers', label: 'سجل العملاء', section: 'إدارة الملابس والأزياء' },
  { path: '/returns', label: 'الاستبدال والاسترجاع', section: 'إدارة الملابس والأزياء' },
  { path: '/shifts', label: 'الورديات وإغلاق الكاشير', section: 'إدارة الملابس والأزياء' },
  { path: '/inventory-count', label: 'جرد ونواقص المحل', section: 'إدارة الملابس والأزياء' },
  { path: '/expenses', label: 'المصروفات', section: 'إدارة الملابس والأزياء' },
  { path: '/accounting/journal', label: 'الحسابات والقيود', section: 'إدارة الملابس والأزياء' },
  { path: '/reports', label: 'تقارير المبيعات والإيجار', section: 'إدارة الملابس والأزياء' },

  // قسم التفصيل والخياطة
  { path: '/tailoring', label: 'طلبات التفصيل', section: 'قسم التفصيل والخياطة' },
  { path: '/customers', label: 'العملاء والمقاسات', section: 'قسم التفصيل والخياطة' },
  { path: '/products', label: 'المنتجات الجاهزة والخدمات', section: 'قسم التفصيل والخياطة' },
  { path: '/warehouse', label: 'مستودع الأقمشة والخامات', section: 'قسم التفصيل والخياطة' },
  { path: '/purchases/invoices', label: 'مشتريات الخامات', section: 'قسم التفصيل والخياطة' },
  { path: '/suppliers', label: 'موردين الخامات', section: 'قسم التفصيل والخياطة' },
  { path: '/employees', label: 'الخياطين والموظفين', section: 'قسم التفصيل والخياطة' },
  { path: '/shifts', label: 'الورديات واليومية', section: 'قسم التفصيل والخياطة' },
  { path: '/expenses', label: 'مصروفات المشغل', section: 'قسم التفصيل والخياطة' },
  { path: '/accounting/journal', label: 'حسابات المشغل', section: 'قسم التفصيل والخياطة' },

  // قسم الاستوديو والتصوير
  { path: '/pos', label: 'كاشير المبيعات (اكسسوارات)', section: 'قسم الاستوديو والتصوير' },
  { path: '/studio', label: 'حجز ومواعيد الاستوديو', section: 'قسم الاستوديو والتصوير' },
  { path: '/orders', label: 'أوامر الطباعة والمونتاج', section: 'قسم الاستوديو والتصوير' },
  { path: '/customers', label: 'عملاء الاستوديو', section: 'قسم الاستوديو والتصوير' },
  { path: '/products', label: 'إدارة الالبومات والبراويز', section: 'قسم الاستوديو والتصوير' },
  { path: '/shifts', label: 'الورديات وإيراد اليوم', section: 'قسم الاستوديو والتصوير' },
  { path: '/employees', label: 'المصورين والمصممين', section: 'قسم الاستوديو والتصوير' },
  { path: '/expenses', label: 'مصروفات الاستوديو', section: 'قسم الاستوديو والتصوير' },
  { path: '/accounting/journal', label: 'حسابات الاستوديو', section: 'قسم الاستوديو والتصوير' },
  { path: '/reports', label: 'تقارير الاستوديو', section: 'قسم الاستوديو والتصوير' },
  
  
  // إدارة المبيعات
  { path: '/orders', label: 'المبيعات', section: 'إدارة المبيعات' },
  { path: '/quotations', label: 'عروض الأسعار', section: 'إدارة المبيعات' },
  { path: '/b2b-sales', label: 'مبيعات الجملة', section: 'إدارة المبيعات' },
  { path: '/ecommerce', label: 'طلبات المتجر', section: 'إدارة المبيعات' },
  { path: '/commodity-contracts', label: 'حجوزات البضائع', section: 'إدارة المبيعات' },
  { path: '/van-sales', label: 'مبيعات المندوبين', section: 'إدارة المبيعات' },
  { path: '/returns', label: 'المرتجعات', section: 'إدارة المبيعات' },
  { path: '/fulfillment', label: 'التجهيز والشحن', section: 'إدارة المبيعات' },
  { path: '/sales-targets', label: 'أهداف المبيعات', section: 'إدارة المبيعات' },
  
  // العملاء والتسويق
  { path: '/customers', label: 'العملاء', section: 'العملاء والتسويق' },
  { path: '/loyalty', label: 'برنامج الولاء', section: 'العملاء والتسويق' },
  { path: '/promotions', label: 'العروض الترويجية', section: 'العملاء والتسويق' },
  { path: '/gift-cards', label: 'بطاقات الهدايا', section: 'العملاء والتسويق' },
  { path: '/subscriptions', label: 'الاشتراكات', section: 'العملاء والتسويق' },
  { path: '/installments', label: 'إدارة الأقساط', section: 'العملاء والتسويق' },
  { path: '/periodic-maintenance', label: 'صيانة المنتجات', section: 'العملاء والتسويق' },
  { path: '/crm/leads', label: 'الفرص والمبيعات', section: 'العملاء والتسويق' },
  { path: '/crm/tickets', label: 'الدعم الفني', section: 'العملاء والتسويق' },
  { path: '/crm/campaigns', label: 'الحملات التسويقية', section: 'العملاء والتسويق' },
  { path: '/customer-portal', label: 'بوابة العملاء', section: 'العملاء والتسويق' },
  
  // المنتجات والإنتاج
  { path: '/products', label: 'المنتجات', section: 'المنتجات والإنتاج' },
  { path: '/categories', label: 'التصنيفات', section: 'المنتجات والإنتاج' },
  { path: '/pricing-rules', label: 'قواعد التسعير', section: 'المنتجات والإنتاج' },
  { path: '/recipes', label: 'الوصفات (BOM)', section: 'المنتجات والإنتاج' },
  { path: '/bom', label: 'قائمة المواد (BOM)', section: 'المنتجات والإنتاج' },
  { path: '/work-centers', label: 'مراكز العمل', section: 'المنتجات والإنتاج' },
  { path: '/work-orders', label: 'أوامر التشغيل', section: 'المنتجات والإنتاج' },
  { path: '/quality-control', label: 'مراقبة الجودة', section: 'المنتجات والإنتاج' },
  { path: '/manufacturing/tqm', label: 'إدارة الجودة (TQM)', section: 'المنتجات والإنتاج' },
  { path: '/manufacturing/plm', label: 'دورة حياة المنتج (PLM)', section: 'المنتجات والإنتاج' },
  { path: '/production-planning', label: 'تخطيط الإنتاج', section: 'المنتجات والإنتاج' },
  { path: '/inventory/demand-forecasting', label: 'توقعات الطلب (AI)', section: 'المنتجات والإنتاج' },
  { path: '/barcodes', label: 'طباعة الباركود', section: 'المنتجات والإنتاج' },
  { path: '/sticker-printing', label: 'ملصقات المنتجات', section: 'المنتجات والإنتاج' },
  { path: '/restaurant-menu', label: 'تصميم المنيو', section: 'المنتجات والإنتاج' },
  
  // المستودعات والمشتريات
  { path: '/warehouse', label: 'المستودعات', section: 'المستودعات والمشتريات' },
  { path: '/advanced-wms', label: 'إدارة المخازن المتقدمة', section: 'المستودعات والمشتريات' },
  { path: '/branch-transfers', label: 'تحويلات الفروع', section: 'المستودعات والمشتريات' },
  { path: '/stock-adjustments', label: 'تسويات المخزون', section: 'المستودعات والمشتريات' },
  { path: '/inventory-count', label: 'الجرد الدوري', section: 'المستودعات والمشتريات' },
  { path: '/purchase-requests', label: 'طلبات الشراء الداخلية', section: 'المستودعات والمشتريات' },
  { path: '/purchase-orders', label: 'أوامر الشراء', section: 'المستودعات والمشتريات' },
  { path: '/purchases', label: 'المشتريات', section: 'المستودعات والمشتريات' },
  { path: '/suppliers', label: 'الموردين', section: 'المستودعات والمشتريات' },
  { path: '/rfqs', label: 'عروض أسعار الموردين', section: 'المستودعات والمشتريات' },
  { path: '/purchases/supplier-evaluation', label: 'تقييم الموردين', section: 'المستودعات والمشتريات' },
  { path: '/vendor-portal', label: 'بوابة الموردين', section: 'المستودعات والمشتريات' },
  
  // المشاريع واللوجستيات
  { path: '/projects', label: 'المشاريع والمقاولات', section: 'المشاريع واللوجستيات' },
  { path: '/projects/feasibility', label: 'دراسات الجدوى', section: 'المشاريع واللوجستيات' },
  { path: '/property-management', label: 'إدارة الممتلكات', section: 'المشاريع واللوجستيات' },
  { path: '/tasks', label: 'إدارة المهام', section: 'المشاريع واللوجستيات' },
  { path: '/events', label: 'إدارة الفعاليات', section: 'المشاريع واللوجستيات' },
  { path: '/timesheets', label: 'سجلات الوقت', section: 'المشاريع واللوجستيات' },
  { path: '/maintenance', label: 'أوامر الصيانة', section: 'المشاريع واللوجستيات' },
  { path: '/preventive-maintenance', label: 'الصيانة الوقائية', section: 'المشاريع واللوجستيات' },
  { path: '/fleet', label: 'إدارة المركبات', section: 'المشاريع واللوجستيات' },
  { path: '/shipping', label: 'الشحن والتخليص', section: 'المشاريع واللوجستيات' },
  { path: '/logistics/import-export', label: 'الاستيراد والتصدير', section: 'المشاريع واللوجستيات' },
  
  // الموارد البشرية
  { path: '/employees', label: 'ملفات الموظفين', section: 'الموارد البشرية' },
  { path: '/attendance', label: 'الحضور والانصراف', section: 'الموارد البشرية' },
  { path: '/shifts', label: 'الورديات', section: 'الموارد البشرية' },
  { path: 'shift_confirm', label: 'تأكيد نقدية وإقفال الورديات', section: 'الموارد البشرية' },
  { path: 'shift_expenses', label: 'تسجيل مصروفات من الدرج بوردية نشطة', section: 'الموارد البشرية' },
  { path: '/leaves', label: 'الإجازات والمغادرات', section: 'الموارد البشرية' },
  { path: '/payroll', label: 'الرواتب والأجور', section: 'الموارد البشرية' },
  { path: '/hr/commissions', label: 'العمولات والحوافز', section: 'الموارد البشرية' },
  { path: '/loans', label: 'السلف والقروض', section: 'الموارد البشرية' },
  { path: '/benefits', label: 'المزايا والتعويضات', section: 'الموارد البشرية' },
  { path: '/disciplinary', label: 'الإجراءات التأديبية', section: 'الموارد البشرية' },
  { path: '/hr/asset-custody', label: 'العهد العينية', section: 'الموارد البشرية' },
  { path: '/org-chart', label: 'الهيكل التنظيمي', section: 'الموارد البشرية' },
  { path: '/recruitment', label: 'التوظيف', section: 'الموارد البشرية' },
  { path: '/hr/careers-portal', label: 'بوابة التوظيف', section: 'الموارد البشرية' },
  { path: '/onboarding', label: 'تهيئة الموظفين', section: 'الموارد البشرية' },
  { path: '/performance', label: 'تقييم الأداء', section: 'الموارد البشرية' },
  { path: '/training', label: 'التدريب والتطوير', section: 'الموارد البشرية' },
  { path: '/hr/lms', label: 'نظام التعلم (LMS)', section: 'الموارد البشرية' },
  
  // الحسابات والمالية
  { path: '/expenses', label: 'المصروفات', section: 'الحسابات والمالية' },
  { path: '/capital', label: 'رأس المال', section: 'الحسابات والمالية' },
  { path: '/currencies', label: 'العملات', section: 'الحسابات والمالية' },
  { path: '/accounting/coa', label: 'دليل الحسابات', section: 'الحسابات والمالية' },
  { path: '/accounting/journal', label: 'قيود اليومية', section: 'الحسابات والمالية' },
  { path: '/accounting/general-ledger', label: 'دفتر الأستاذ', section: 'الحسابات والمالية' },
  { path: '/accounting/cost-centers', label: 'مراكز التكلفة', section: 'الحسابات والمالية' },
  { path: '/accounting/petty-cash', label: 'العهد النقدية', section: 'الحسابات والمالية' },
  { path: '/accounting/checks', label: 'إدارة الشيكات', section: 'الحسابات والمالية' },
  { path: '/accounting/bank-reconciliation', label: 'مطابقة البنوك', section: 'الحسابات والمالية' },
  { path: '/accounting/assets', label: 'الأصول الثابتة', section: 'الحسابات والمالية' },
  { path: '/accounting/treasury', label: 'الخزينة والسيولة', section: 'الحسابات والمالية' },
  { path: '/accounting/budgeting', label: 'الموازنات', section: 'الحسابات والمالية' },
  { path: '/accounting/aging', label: 'أعمار الديون', section: 'الحسابات والمالية' },
  { path: '/accounting/tax', label: 'الضرائب (VAT)', section: 'الحسابات والمالية' },
  { path: '/accounting/e-invoicing', label: 'الفاتورة الإلكترونية', section: 'الحسابات والمالية' },
  { path: '/accounting/closing', label: 'إقفال السنة', section: 'الحسابات والمالية' },
  { path: '/accounting/reports', label: 'التقارير المالية', section: 'الحسابات والمالية' },
  
  // الإدارة القانونية
  { path: '/law-firm', label: 'القضايا والجلسات', section: 'الإدارة القانونية' },
  { path: '/law-firm/clients-opponents', label: 'الموكلين والخصوم', section: 'الإدارة القانونية' },
  { path: '/law-firm/billing', label: 'المالية والأتعاب', section: 'الإدارة القانونية' },
  { path: '/law-firm/agenda', label: 'مفكرة المحامي', section: 'الإدارة القانونية' },
  { path: '/law-firm/memos-archive', label: 'مكتبة المذكرات', section: 'الإدارة القانونية' },
  { path: '/law-firm/judgments', label: 'الأحكام والتنفيذ', section: 'الإدارة القانونية' },
  { path: '/law-firm/investigations', label: 'التحقيقات العمالية', section: 'الإدارة القانونية' },
  { path: '/law-firm/power-of-attorney', label: 'الوكالات الشرعية', section: 'الإدارة القانونية' },
  { path: '/law-firm/consultations', label: 'الاستشارات القانونية', section: 'الإدارة القانونية' },
  { path: '/law-firm/ip-trademarks', label: 'الملكية الفكرية', section: 'الإدارة القانونية' },
  { path: '/law-firm/corporate-affairs', label: 'شؤون الشركات', section: 'الإدارة القانونية' },
  { path: '/law-firm/compliance', label: 'الامتثال التشريعي', section: 'الإدارة القانونية' },
  { path: '/legal/contracts', label: 'إدارة العقود', section: 'الإدارة القانونية' },
  { path: '/legal', label: 'أرشيف المستندات', section: 'الإدارة القانونية' },

  // التقارير والإحصائيات
  { path: '/reports', label: 'التقارير', section: 'التقارير والإحصائيات' },
  { path: '/custom-reports', label: 'التقارير المخصصة', section: 'التقارير والإحصائيات' },
  { path: '/reports/bi-dashboards', label: 'ذكاء الأعمال (BI)', section: 'التقارير والإحصائيات' },
  { path: '/market-monitor', label: 'مراقبة السوق (AI)', section: 'التقارير والإحصائيات' },

  // إدارة الحضانة والمدرسة
  { path: '/school/dashboard', label: 'لوحة القيادة والمدرسة', section: 'الحضانة والمدرسة' },
  { path: '/school/students', label: 'إدارة الأطفال والطلاب', section: 'الحضانة والمدرسة' },
  { path: '/school/parents', label: 'بيانات أولياء الأمور', section: 'الحضانة والمدرسة' },
  { path: '/school/classes', label: 'الفصول والمستويات', section: 'الحضانة والمدرسة' },
  { path: '/school/attendance', label: 'الحضور والانصراف', section: 'الحضانة والمدرسة' },
  { path: '/school/fees', label: 'الرسوم والاشتراكات', section: 'الحضانة والمدرسة' },
  { path: '/school/cashier', label: 'كاشير المدرسة والخزنة', section: 'الحضانة والمدرسة' },
  { path: '/school/transport', label: 'الباص والمواصلات', section: 'الحضانة والمدرسة' },
  { path: '/school/grades', label: 'التقييمات التعليمية', section: 'الحضانة والمدرسة' },
  { path: '/school/clinic', label: 'الصحة والتغذية', section: 'الحضانة والمدرسة' },
  { path: '/school/events', label: 'الأنشطة والفعاليات', section: 'الحضانة والمدرسة' },
  { path: '/school/parent-communication', label: 'الرسائل والإشعارات', section: 'الحضانة والمدرسة' },
  { path: '/school/reports', label: 'تقارير الحضانة والمدرسة', section: 'الحضانة والمدرسة' },
  
  // صلاحيات وإجراءات مقيدة للحضانة والمدرسة
  { path: 'school_view_finance', label: 'رؤية الماليات الخاصة بالمدرسة', section: 'صلاحيات المدرسة المقيدة' },
  { path: 'school_cancel_receipt', label: 'إلغاء إيصال استلام', section: 'صلاحيات المدرسة المقيدة' },
  { path: 'school_edit_payment', label: 'تعديل دفعة قديمة', section: 'صلاحيات المدرسة المقيدة' },
  { path: 'school_view_health', label: 'رؤية بيانات صحية', section: 'صلاحيات المدرسة المقيدة' },
  { path: 'school_manage_users', label: 'إدارة المستخدمين والصلاحيات', section: 'صلاحيات المدرسة المقيدة' },
  { path: 'school_add_record', label: 'إضافة السجلات (أطفال، دفعات، الخ)', section: 'صلاحيات المدرسة المقيدة' },
  { path: 'school_edit_record', label: 'تعديل السجلات', section: 'صلاحيات المدرسة المقيدة' },
  { path: 'school_delete_record', label: 'حذف السجلات', section: 'صلاحيات المدرسة المقيدة' },
  { path: 'school_export_print', label: 'الطباعة وتصدير البيانات', section: 'صلاحيات المدرسة المقيدة' },

  // التكوين الإداري
  { path: '/settings', label: 'الإعدادات', section: 'التكوين الإداري' },
  { path: '/branches', label: 'إدارة الفروع', section: 'التكوين الإداري' },
  { path: '/admin/pos-terminals', label: 'أجهزة نقاط البيع', section: 'التكوين الإداري' },
  { path: '/approval-workflows', label: 'مسارات الاعتماد', section: 'التكوين الإداري' },

  // أدوات المؤسسة
  { path: '/dms', label: 'إدارة الوثائق (DMS)', section: 'أدوات المؤسسة' },
  { path: '/document-editor', label: 'محرر المستندات', section: 'أدوات المؤسسة' },
  { path: '/internal-communication', label: 'التواصل الداخلي', section: 'أدوات المؤسسة' },
  { path: '/website-cms', label: 'إدارة محتوى الموقع', section: 'أدوات المؤسسة' },

  // إدارة النظام والأمان
  { path: '/users', label: 'المستخدمين', section: 'إدارة النظام والأمان' },
  { path: '/role-management', label: 'إدارة الصلاحيات', section: 'إدارة النظام والأمان' },
  { path: '/audit-logs', label: 'سجل التدقيق', section: 'إدارة النظام والأمان' },
  { path: '/logbook', label: 'سجل العمليات', section: 'إدارة النظام والأمان' },
  { path: '/admin/risk-compliance', label: 'المخاطر والامتثال', section: 'إدارة النظام والأمان' },
  { path: '/system-backups', label: 'النسخ الاحتياطي', section: 'إدارة النظام والأمان' },
  { path: '/recycle-bin', label: 'سلة المهملات', section: 'إدارة النظام والأمان' },
  { path: '/about', label: 'حول النظام', section: 'إدارة النظام والأمان' },

  // صلاحيات وإجراءات مقيدة (RBAC)
  { path: 'void_item', label: 'حذف صنف من الفاتورة', section: 'صلاحيات تفصيلية' },
  { path: 'give_discount', label: 'إضافة خصم', section: 'صلاحيات تفصيلية' },
  { path: 'change_price', label: 'تغيير السعر', section: 'صلاحيات تفصيلية' },
  { path: 'view_expected_cash', label: 'عرض النقد المتوقع للوردية', section: 'صلاحيات تفصيلية' },
  { path: 'shift_expenses', label: 'إضافة منصرفات للوردية', section: 'صلاحيات تفصيلية' },
  { path: 'shift_confirm', label: 'تأكيد وإغلاق الورديات', section: 'صلاحيات تفصيلية' }
];

export const DEFAULT_LAYOUT: any[] = [
    { id: 'logo', label: 'الشعار', visible: true, type: 'logo' },
    { id: 'store_name', label: 'اسم المتجر والعنوان', visible: true, type: 'store_name' },
    { id: 'header', label: 'رسالة الترويسة', visible: true, type: 'header' },
    { id: 'divider', label: 'فاصل خطي', visible: true, type: 'divider' },
    { id: 'customer', label: 'بيانات الفاتورة والعميل', visible: true, type: 'customer' },
    { id: 'items', label: 'قائمة المنتجات', visible: true, type: 'items' },
    { id: 'divider2', label: 'فاصل خطي', visible: true, type: 'divider' },
    { id: 'totals', label: 'المجاميع (الصافي والضريبة)', visible: true, type: 'totals' },
    { id: 'qr', label: 'رمز QR', visible: true, type: 'qr' },
    { id: 'footer', label: 'رسالة التذييل', visible: true, type: 'footer' },
    { id: 'barcode', label: 'باركود رقم الفاتورة', visible: false, type: 'barcode' },
];
