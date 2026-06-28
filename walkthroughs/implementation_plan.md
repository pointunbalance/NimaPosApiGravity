# Implementation Plan — Enterprise Expansion & Automation (v2.8.0)

هذه الخطة تهدف لتحويل النظام من "نقطة بيع ومحاسبة أساسية" إلى "نظام إدارة موارد مؤسسات (ERP) متكامل" من خلال سد الفجوات التي تم تحديدها في مراجعة v2.7.0.

## 🎯 الأهداف الرئيسية

1. **المرونة الضريبية:** دعم مستويات ضريبية متعددة.
2. **أتمتة المحاسبة:** تقليل العمل اليدوي في الإهلاك والتسويات.
3. **دقة المخزون:** تتبع دقيق لصلاحية المنتجات والـ Batches.
4. **التقارير المتقدمة:** توفير رؤية نقدية (Cash Flow).

---

## 🛠 التغييرات المقترحة

### 1. وحدة الضرائب المتقدمة (Advanced Tax Classes)

* **[MODIFY] [schema.py](file:///e:/NimaTechVibeCoding/NimaPosApiGravity/app/database/schema/tables.py):** إضافة حقل `tax_rate` لجدول `products` وحقل `tax_type` (معفى، قياسي، صفري).
* **[MODIFY] [product_repo.py](file:///e:/NimaTechVibeCoding/NimaPosApiGravity/app/repositories/product_repo.py):** تحديث عمليات الإضافة والتعديل لدعم الضريبة المخصصة.
* **[MODIFY] [invoice_repo.py](file:///e:/NimaTechVibeCoding/NimaPosApiGravity/app/repositories/invoice_repo.py):** تعديل منطق الحساب لاستخدام ضريبة المنتج بدلاً من الضريبة العامة للنظام.

### 2. تتبع الدفعات والصلاحية (Batch & Expiry Management)

* **[MODIFY] [purchase_repo.py](file:///e:/NimaTechVibeCoding/NimaPosApiGravity/app/repositories/purchase_repo.py):** عند استلام المشتريات، سيتم إجبار المستخدم على إدخال رقم الدفعة (Batch #) وتاريخ الانتهاء.
* **[MODIFY] [stock_movement_repo.py](file:///e:/NimaTechVibeCoding/NimaPosApiGravity/app/repositories/stock_movement_repo.py):** سيتم خصم المخزون من الدفعات الأقرب لتاريخ الانتهاء (FIFO logic Based on Expiry).

### 3. أتمتة الإهلاك (Automated Depreciation)

* **[NEW] [depreciation_service.py](file:///e:/NimaTechVibeCoding/NimaPosApiGravity/app/logic/depreciation_service.py):** خدمة تعمل في الخلفية أو عند الطلب لحساب الإهلاك الشهري للأصول الثابتة وتسجيل قيود يومية آلياً.
* **[MODIFY] [accounting_repo.py](file:///e:/NimaTechVibeCoding/NimaPosApiGravity/app/repositories/accounting_repo.py):** إضافة دالة `bulk_post_depreciation`.

### 4. التقارير المالية المتخصصة

* **[NEW] [cash_flow_repo.py](file:///e:/NimaTechVibeCoding/NimaPosApiGravity/app/repositories/cash_flow_repo.py):** دالات لحساب التدفقات النقدية من الأنشطة التشغيلية والاستثمارية والتمويلية.
* **[NEW] [revenue_forecast_repo.py](file:///e:/NimaTechVibeCoding/NimaPosApiGravity/app/repositories/revenue_forecast_repo.py):** منطق بسيط للتنبؤ بالمبيعات بناءً على المتوسطات المتحركة (Moving Averages).

---

## ✅ خطة التحقق (Verification Plan)

### الاختبارات المؤتمتة

* اختبار عملية بيع بمنتجات ذات ضرائب مختلفة والتأكد من صحة الفاتورة.
* اختبار خصم المخزون من Batch محدد والتأكد من صحة التواريخ.
* التأكد من توازن قيود الإهلاك (Assets Depreciation Account vs Fixed Assets).

### المراجعة اليدوية

* مراجعة تقرير التدفق النقدي ومقارنته بالميزانية العمومية وقائمة الدخل.
