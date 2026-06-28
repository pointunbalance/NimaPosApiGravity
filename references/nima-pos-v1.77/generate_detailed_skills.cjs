const fs = require('fs');
const path = require('path');

const navConfigPath = path.join(__dirname, 'components/layout/navigationConfig.ts');
const navConfigContent = fs.readFileSync(navConfigPath, 'utf8');

const sections = [];
const sectionRegex = /label:\s*'([^']+)',\s*section:\s*'([^']+)',\s*items:\s*\[([\s\S]*?)\]\s*\}/g;
let match;

while ((match = sectionRegex.exec(navConfigContent)) !== null) {
  const sectionLabel = match[1];
  const sectionId = match[2];
  const itemsBlock = match[3];
  
  if (sectionId === 'config' || sectionId === 'developer' || sectionId === 'tools') continue;
  
  const items = [];
  const itemRegex = /path:\s*'([^']+)',\s*label:\s*'([^']+)'/g;
  let itemMatch;
  while ((itemMatch = itemRegex.exec(itemsBlock)) !== null) {
    items.push({ path: itemMatch[1], label: itemMatch[2] });
  }
  
  // Try backup regex if no items found due to different quotes
  if (items.length === 0) {
    const itemRegex2 = /label:\s*"([^"]+)",\s*path:\s*"([^"]+)"/g;
    while ((itemMatch = itemRegex2.exec(itemsBlock)) !== null) {
      items.push({ path: itemMatch[2], label: itemMatch[1] });
    }
  }

  sections.push({ sectionLabel, sectionId, items });
}

console.log(`Found ${sections.length} business sections.`);

const skillsDir = path.join(__dirname, 'skills');
if (!fs.existsSync(skillsDir)) fs.mkdirSync(skillsDir);

sections.forEach(sec => {
  const dirPath = path.join(skillsDir, sec.sectionId);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  const skillFile = path.join(dirPath, 'SKILL.md');
  const pagesList = sec.items.map(i => `- **${i.label}** (${i.path})`).join('\n');
  
  let content = `---
name: "${sec.sectionId}"
description: "Guidelines and functional requirements for ${sec.sectionLabel}"
---

# ${sec.sectionLabel}

هذا الملف (Skill) يوفر معايير هندسية متكاملة لبناء وتوسيع قسم **${sec.sectionLabel}** داخل التطبيق، معتمداً على بيئة العمل الحالية (React + Dexie.js + TypeScript) لضمان العمل بدون اتصال بالإنترنت (Offline-First).

المطلوب بناء واجهات حديثة، واضحة، RTL، تقسم البيانات المعقدة إلى علامات تبويب (Tabs) ومكونات فرعية لتجنب التعقيد والازدحام.

## أولاً: صفحات القسم والوظائف الرئيسية (Pages & Functions)

الصفحات الموجودة في هذا القسم والتي يجب تغطية وظائفها وربطها مع قاعدة البيانات:
${pagesList}

لكل صفحة من هذه الصفحات، يجب توفير:
1. **واجهة مستخدم حديثة وبسيطة**: تعتمد على Tailwind CSS و مكونات \`lucide-react\`. يجب ألا تكون الشاشات مزدحمة، بل منظمة ومقسمة بشكل مريح للعين.
2. **إدارة متقدمة للبيانات**: استخدام \`useLiveQuery\` من \`dexie-react-hooks\` لاسترجاع البيانات بشكل تفاعلي.
3. **التكامل**: التأكد من أن العمليات في هذه الصفحات ترتبط بالتقارير والحسابات العامة للبرنامج.

## ثانياً: المعايير التقنية والتصميمية (Core Guidelines)

### 1. الهيكل التقني والقيود
- **البيانات المحلية (Offline-First)**: جميع البيانات تُخزن محلياً وتسترجع من \`Dexie.js\` من ملف \`db.ts\`. يُمنع استخدام أي سيرفرات أو قواعد متصلة بالإنترنت.
- **واجهة عربية (RTL)**: جميع الشاشات والمكونات متوافقة مع اتجاه اليمين لليسار.
- **سجل العمليات (Audit Logging)**: توثيق الحركات الحساسة (إضافة، تعديل، حذف) عبر دالة \`logActivity()\` كما في هذا المثال:
  \`\`\`typescript
  import { logActivity } from '../../utils/logger';
  await logActivity('${sec.sectionId}', 'عملية تصنيف', 'تم تسجيل إجراء ضمن القسم بنجاح');
  \`\`\`
- **الحذف الآمن (Soft Delete)**: عدم حذف السجلات المرتبطة بحسابات أو فواتير نهائياً، بل استخدام دورة حياة أو جدول الأرشيف \`recycleBin\`، وإخفائها برمجياً.

### 2. معايير تصميم الواجهات
- **التبويبات (Tabs)**: تقسيم الشاشات المعقدة (مثل ملفات المرضى، الفواتير الكبيرة، أو العقود) لتبويبات (مثل: البيانات الأساسية، المرفقات، الحساب، الإعدادات).
- **الاستجابة (Responsive)**: تصميم شبكي متجاوب (Grid/Flex) داعم للشاشات مختلفة الأحجام، مع التركيز على الكاشير أو شاشات المكاتب العريضة (Desktop الأولى) لتكون منظمة.
- **حالات الفراغ (Empty States)**: توجيه المستخدم لإضافة السجل الأول في حال فراغ الجداول (رسمة توضيحية + زر إضافة).

### 3. الصلاحيات والأمان
- التحقق من الصلاحيات بناءً على المسترجع من \`localStorage.getItem('nima_user')\`.
- إخفاء الأزرار والإجراءات التي لا يملك المستخدم صلاحية عليها بدلاً من إظهار رسالة خطأ فقط إن أمكن، مع إظهار رسائل خطأ واضحة عند التنفيذ.

## ثالثاً: الترابط والمحاسبة (Integrated Accounting)
يجب أن تؤدي العمليات داخل هذا القسم إلى تأثيرات صحيحة بالخزينة العامة ومكون القيود (\`journalEntries\`) إن كان لها أثر مالي (دفع، تحصيل، مصروف، إيراد خاص).
- أي أموال تدخل النظام يجب أن تُدرج כـ Debit في الخزينة و Credit في حساب الإيرادات.
- أي أموال تخرج يجب أن تُدرج כـ Credit في الخزينة و Debit في المصروفات.
- يمنع الحذف الفوري للإيصالات أو تعديلها لمن هم دون صلاحيات المُدير والمحاسب لتجنب التلاعب المالي.

## رابعاً: طباعة التقارير والتصدير
- يجب توفير خيارات طابعة نقطية (حرارية - Thermal 80mm) لعمليات الكاشير/الإيصالات، وطابعة A4 لتقارير الجرود والكشوفات.
- استخدام التنسيق الجاهز المعتمد لطباعة جداول واضحة للمدير، ودعم تصدير CSV/Excel.
`;

  fs.writeFileSync(skillFile, content);
});

console.log('Skill files fully generated/updated with paths and sections!');
