"""Centralized string constants for NimaPOS API (Rule 4 Compliance)."""

# --- API Metadata ---
API_TITLE = "NimaPOS Enterprise API"
API_DESCRIPTION = (
    "🚀 **NimaPOS Enterprise API — v2.32.0**\n\n"
    "Official Global ERP, Smart Pricing, Economic Intelligence, Assets & Quality Control Ecosystem.\n\n"
    "### 📖 Quick Start Guide | دليل البدء السريع\n"
    "1. **Authentication**: Use `/auth/login` to obtain your token.\n"
    "2. **Activation**: Most endpoints require system activation via `/system/activate`.\n"
    "3. **RTL Support**: All documentation supports Arabic. جميع الوثائق تدعم اللغة العربية.\n"
    "4. **Search**: Use `Ctrl+F` or the built-in search bar to filter endpoints by name or category."
)

# --- Documentation Tags ---
TAGS_METADATA = [
    {"name": "🛒 Invoices / Sales", "description": "### Point of Sale & Invoicing | نقطة البيع والفواتير\nEverything related to sales, invoices, and quotations. إدارة كاملة للمبيعات والفواتير وعروض الأسعار."},
    {"name": "👥 Customers / CRM", "description": "### Customer Management | إدارة العملاء\nTrack client history, credit limits, and loyalty. تتبع سجل العملاء، حدود الائتمان، والولاء."},
    {"name": "📦 Inventory", "description": "### Stock & Products | المخزون والمنتجات\nReal-time stock tracking and product lifecycle. تتبع المخزون في الوقت الفعلي ودورة حياة المنتج."},
    {"name": "🏢 Purchases & Suppliers", "description": "### Procurement | المشتريات والموردين\nManage supplier relations and purchase orders. إدارة علاقات الموردين وأوامر الشراء."},
    {"name": "⚖️ Accounting / GL", "description": "### General Ledger | المحاسبة العامة\nTriple-entry accounting and asset management. المحاسبة ثلاثية القيود وإدارة الأصول."},
    {"name": "💰 Accounting / Vouchers", "description": "### Financial Vouchers | السندات المالية\nSettlements, discounts, and opening balances. التسويات، الخصومات، والأرصدة الافتتاحية."},
    {"name": "🔄 Accounting / Clearing", "description": "### Credit Clearing | مقاصة الائتمان\nSettle invoices using return credits. تسوية الفواتير باستخدام مرتجعات الائتمان."},
    {"name": "📊 Accounting / Statements", "description": "### Business Statements | كشوفات الحساب\nChronological business ledgers. دفاتر الأستاذ التسلسلية للأعمال."},
    {"name": "📈 Reports", "description": "### Analytics & KPIs | التحليلات والتقارير\nDeep business intelligence and profit metrics. ذكاء أعمال عميق ومقاييس الربح."},
    {"name": "🚀 Studio Pro", "description": "### Professional Studio | استوديو برو\nBookings, team assignment, and lifecycle. الحجوزات، تعيين الفريق، ودورة العمل."},
    {"name": "🖼️ Studio Portfolio", "description": "### Highlights | معرض الأعمال\nManage image and video highlights. إدارة الصور والفيديوهات المميزة."},
    {"name": "🧑‍💼 Studio Team", "description": "### Staffing | فريق العمل\nStaff management and role assignment. إدارة الموظفين وتعيين الأدوار."},
    {"name": "🍳 Hospitality / Kitchen", "description": "### F&B Operations | الضيافة والمطبخ\nTables, reservations, and KDS. الطاولات، الحجوزات، ونظام عرض المطبخ."},
    {"name": "🚚 Fleet & Logistics", "description": "### Fleet Management | الأسطول والخدمات اللوجستية\nVehicles, drivers, and fuel monitoring. المركبات والسائقين ومراقبة الوقود."},
    {"name": "🔑 Rentals Pro", "description": "### Asset Rentals | استئجار الأصول\nHigh-fidelity asset tracking and penalties. تتبع أصول التأجير والجزاءات."},
    {"name": "🌐 Online Commerce", "description": "### Store Engine | التجارة الإلكترونية\nStore integrations and webhook ingestion. تكامل المتاجر واستلام الويبهوك."},
    {"name": "🔔 Notifications", "description": "### Unified Alerts | التنبيهات الموحدة\nSMS, WhatsApp, and Email alerts. تنبيهات الرسائل القصيرة والواتساب والايميل."},
    {"name": "🛠️ Advanced", "description": "### Complex Modules | وحدات متقدمة\nLoyalty, promos, and custom warehouses. الولاء، العروض، والمستودعات المخصصة."},
    {"name": "📝 Orders", "description": "### Order Fulfillment | تنفيذ الطلبات\nKitchen operations and fulfillment. عمليات المطبخ وتنفيذ الطلبات."},
    {"name": "💳 HR & Payroll", "description": "### Employee Logic | الموارد البشرية والرواتب\nSalaries, attendance, and HR logic. الرواتب، الحضور، ومنطق الموارد البشرية."},
    {"name": "💳 Subscriptions & Billing", "description": "### Recurring Revenue | الاشتراكات والفوترة المتكررة\nManage subscription plans and recurring customer billing. إدارة خطط الاشتراك والفوترة الدورية للعملاء."},
    {"name": "🏭 MRP & Forecasting", "description": "### Material Planning | تخطيط المتطلبات والمخزون الذكي\nProactive inventory planning and demand forecasting. التخطيط الاستباقي للمخزون والتنبؤ بالطلب."},
    {"name": "🌐 Omnichannel Commerce", "description": "### Sync Engine | التجارة الشاملة\nReal-time stock sync with Shopify, Amazon, and Foodics. الربط اللحظي مع المتاجر العالمية."},
    {"name": "💰 Treasury & Liquidity", "description": "### Cash Flow | الخزينة والسيولة\nAdvanced cash flow forecasting and bank reconciliation. إدارة الخزانة والسيولة وتوقع التدفقات النقدية."},
    {"name": "📚 LMS & Internal Wiki", "description": "### Knowledge Hub | المرجع والتدريب الداخلي\nStandard Operating Procedures (SOPs) and employee training. المرجع الفني وتدريب الموظفين."},
    {"name": "⚙️ System & Settings", "description": "### Core Configuration | إعدادات النظام\nGlobal settings, security, and activation. الإعدادات العامة، الأمان، والتفعيل."},
    {"name": "🏦 Internal Accounts / Safes", "description": "### Cash & Safes | الصناديق والخزائن\nCash box management and fund transfers. إدارة صناديق النقد وتحويلات الأموال."},
    {"name": "[Phase 26] Promotions & Wallets", "description": "### Advanced Promotion Engine | محرك العروض المتقدم\nBOGO, cart rules, and customer store credit. عروض ترويجية تلقائية، محافظ العملاء، وكروت الهدايا."},
    {"name": "[Phase 28] Hardware & Scale Pro", "description": "### Hardware Integration | تكامل الأجهزة والملحقات\nBarcode scales, label design, and industrial printer management. الموازين الإلكترونية، تصميم الملصقات، وإدارة الطابعات الصناعية."},
    {"name": "[Phase 29] Customer Self-Service", "description": "### Portal & Service Desk | بوابة العميل والدعم الفني\nHelpdesk tickets, chronological statements, and self-service dashboards. نظام التذاكر، كشوفات الحساب، ولوحة تحكم العميل."},
    {"name": "[Phase 30] Webhooks & Integration", "description": "### Event Hub | الويبهوك والربط التقني\nReal-time event synchronization for external SAP, Odoo, or Custom apps. الربط اللحظي مع الأنظمة الخارجية."},
    {"name": "[Phase 31] Localization & Geography", "description": "### Egyptian Geography | المحافظات والمدن المصرية\nReference data for 27 Egyptian governorates, cities, and sales zones. دليل مرجعي للمحافظات والمدن ونطاقات البيع."},
]

# --- Common Messages ---
MSG_SUCCESS = "Operation completed successfully"
MSG_ERROR = "An error occurred during the operation"
MSG_NOT_FOUND = "Resource not found"
MSG_UNAUTHORIZED = "Unauthorized access"
