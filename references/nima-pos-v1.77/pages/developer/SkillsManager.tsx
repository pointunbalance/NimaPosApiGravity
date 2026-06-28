import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  FileText, 
  Search, 
  Sparkles, 
  Plus, 
  BookOpen, 
  Eye, 
  Code2, 
  Columns, 
  Settings, 
  Info, 
  HelpCircle,
  Hash,
  Database,
  Cpu,
  RefreshCw,
  Edit3,
  MessageSquare,
  Bot,
  Calendar,
  History
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Skill {
  name: string;
  content: string;
  title?: string;
  description?: string;
  lineCount?: number;
  wordCount?: number;
  isSystem?: boolean;
}

const SkillsManager = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'business' | 'system'>('all');
  
  // Editor view modes: 'edit' | 'preview' | 'split'
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');

  // Metadata parsed state (for easy form updates)
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (textAreaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textAreaRef.current.scrollTop;
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const parseFrontmatter = (md: string) => {
    let title = '';
    let description = '';
    let cleanContent = md;

    if (md.startsWith('---')) {
      const parts = md.split('---');
      if (parts.length >= 3) {
        const yaml = parts[1];
        const titleMatch = yaml.match(/name:\s*["']?([^"'\n]+)["']?/);
        const descMatch = yaml.match(/description:\s*["']?([^"'\n]+)["']?/);
        
        if (titleMatch) title = titleMatch[1].trim();
        if (descMatch) description = descMatch[1].trim();
        cleanContent = parts.slice(2).join('---').trim();
      }
    }

    if (!title) {
      const match = md.match(/^#\s+(.+)$/m);
      title = match ? match[1].trim() : '';
    }

    return { title, description, cleanContent };
  };

  const skillTranslations: Record<string, string> = {
    'accounting': 'المالية والمحاسبة',
    'advanced_accounting': 'المحاسبة المتقدمة والتقارير',
    'clinics': 'العيادات الطبية والاستقبال',
    'clothes': 'إدارة المبيعات والملابس',
    'crm': 'إدارة علاقات العملاء CRM',
    'customers': 'بيانات وحسابات العملاء',
    'education': 'الأنظمة التعليمية والمدارس',
    'garage': 'خدمات صيانة السيارات والورش',
    'gym': 'إدارة الاشتراكات الرياضية والجيم',
    'hotel': 'إدارة الحجوزات والفنادق',
    'HR & Payroll System Guidelines': 'دليل الموارد البشرية والرواتب',
    'hr_core': 'إدارة الموارد البشرية الأساسية',
    'cloudsql-execute-sql': 'تنفيذ استعلامات SQL سحابية',
    'cloudsql-setup': 'تهيئة قواعد بيانات Cloud SQL',
    'cloudsql-update-schema': 'تحديث هيكل الجداول السحابي Schema',
    'firebase-integration': 'تكامل السحابة وإتاحة Offline Sync',
    'focus-mode': 'أوضاع التركيز وتصميم الإطارات في iFrame',
    'gemini-api': 'دمج ومعالجة نصوص وصور Gemini API',
    'gemini-interactions-api': 'واجهة التفاعل اللحظي مع Gemini',
    'github-import-migration': 'ترحيل وهندسة مشاريع GitHub المستوردة',
    'github-import-rewrite': 'تحديث وإعادة بناء لغات المشاريع المستوردة',
    'google-maps-platform': 'موقع العناوين ومسارات الخرائط التفاعلية',
    'image-generation': 'توليد الرسومات والشعارات بالذكاء الاصطناعي',
    'oauth-integration': 'مصادقة الهويات وتوصيل الحسابات بـ OAuth',
    'real-time-and-multi-user': 'التفاعل اللحظي وغرف المشاركة التنافسية',
    'shadcn-ui': 'مكونات وهيكل تصميم shadcn/ui الحديثة',
    'workspace-integration': 'تكامل مع تطبيقات Google Workspace'
  };

  const fetchSkills = async () => {
    try {
      const response = await fetch('/api/skills');
      if (!response.ok) throw new Error('فشل تحميل المهارات');
      const data = await response.json();
      
      const processedSkills = data.map((skill: any) => {
        const isSystem = skill.name.startsWith('system_skills/') || skill.name.includes('system');
        const { title, description } = parseFrontmatter(skill.content);
        
        const rawName = skill.name.split('/').pop()?.replace('.md', '') || skill.name;
        const translated = skillTranslations[rawName] || skillTranslations[title] || title || rawName;
        // If there's a translation, keep it bilingual for developer clarity
        const displayName = translated !== rawName ? `${translated} (${rawName})` : rawName;
        
        return {
          ...skill,
          title: displayName,
          description: description || 'لا يوجد وصف مخصص لهذا الدليل.',
          isSystem,
          lineCount: skill.content ? skill.content.split('\n').length : 0,
          wordCount: skill.content ? skill.content.trim().split(/\s+/).length : 0
        };
      }).sort((a: any, b: any) => (a.title || a.name).localeCompare(b.title || b.name, 'ar'));
      
      setSkills(processedSkills);
      if (processedSkills.length > 0 && !selectedSkill) {
        const first = processedSkills[0];
        setSelectedSkill(first);
        setContent(first.content);
        
        // Populate metadata fields
        const { title, description } = parseFrontmatter(first.content);
        setMetaTitle(title || first.title || '');
        setMetaDescription(description || first.description || '');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل المهارات');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (skill: Skill) => {
    setSelectedSkill(skill);
    setContent(skill.content);
    
    // Parse individual metadata fields
    const { title, description } = parseFrontmatter(skill.content);
    setMetaTitle(title || skill.title || '');
    setMetaDescription(description || skill.description || '');
  };

  // Sync typed content back to Metadata view fields
  useEffect(() => {
    if (viewMode !== 'preview') {
      const { title, description } = parseFrontmatter(content);
      if (title && title !== metaTitle) setMetaTitle(title);
      if (description && description !== metaDescription) setMetaDescription(description);
    }
  }, [content]);

  // Form updates reconstruct front-matter inside content
  const handleMetaChange = (newTitle: string, newDesc: string) => {
    setMetaTitle(newTitle);
    setMetaDescription(newDesc);

    let rawBody = content;
    if (content.startsWith('---')) {
      const parts = content.split('---');
      if (parts.length >= 3) {
        rawBody = parts.slice(2).join('---').trim();
      }
    }

    const reconstructed = `---
name: "${newTitle || selectedSkill?.name}"
description: "${newDesc}"
---

${rawBody}`;

    setContent(reconstructed);
  };

  const handleSave = async () => {
    if (!selectedSkill) return;
    setSaving(true);
    try {
      const response = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selectedSkill.name, content })
      });
      if (!response.ok) throw new Error('فشل الحفظ');
      
      const { title, description } = parseFrontmatter(content);
      
      setSkills(skills.map(s => s.name === selectedSkill.name ? { 
        ...s, 
        content, 
        title: title || s.title,
        description: description || s.description,
        lineCount: content.split('\n').length,
        wordCount: content.trim().split(/\s+/).length
      } : s));
      
      toast.success('تم حفظ وتحديث الدليل بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ التعديلات');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyTemplate = (type: 'business' | 'ai' | 'standard') => {
    if (!selectedSkill) return;
    
    let template = '';
    const nameOnly = selectedSkill.name.split('/').pop() || selectedSkill.name;

    if (type === 'business') {
      template = `---
name: "${metaTitle || nameOnly}"
description: "إرشادات هندسية وتفصيلية لقسم ${metaTitle || nameOnly}"
---

# ${metaTitle || nameOnly}

يوفر هذا الدليل المعايير التشغيلية والبرمجية لتطوير هذا القسم وتكامله مع قاعدة البيانات المحلية لقوانين النظام.

## أولاً: النطاق والوظائف (Scope & Functions)
- [ ] توفير واجهة مستخدم سريعة التحميل والتنقل.
- [ ] ربط البيانات المباشرة مع جدول قاعدة البيانات المخصص في \`db.ts\`.
- [ ] التحقق والمصادقة على المدخلات المالية والكمية لمنع الأخطاء المحاسبية.

## ثانياً: شروط العمل بدون اتصال بالإنترنت (Offline-First)
- العمل الكامل بالمتصفح دون الاعتماد على خوادم بعيدة.
- حفظ العمليات محلياً ومزامنتها تلقائياً عند عودة البيانات.
- دعم طباعة الفواتير أو الكشوفات مباشرة بصيغ متوافقة.
`;
    } else if (type === 'ai') {
      template = `---
name: "${metaTitle || nameOnly}"
description: "تعليمات الذكاء الاصطناعي وبنية الـ LLM للـ Agent"
---

# موجّه المساعد بقسم ${metaTitle || nameOnly}

توجيهات لضبط أداء وسلوك وكيل الذكاء الاصطناعي (Gemini Developer Guidelines) للرد والتصرف السليم.

## أولاً: قواعد السلوك والنبرة (Tone & Rules)
1. **الهدوء والدقة الفائقة**: الإجابة بالاختصار المفيد والمباشر دون إبهام أو وعود خيالية.
2. **اللغة العربية المهنية الأولى**: التحدث بمصطلحات محاسبية وإدارية متعارف عليها.
3. **أمان البيانات**: تفادي إفشاء أي مفاتيح برمجية أو معلومات حساسة.

## ثانياً: النماذج والضبط الدقيق (Parameters)
- النموذج الموصى به: \`gemini-2.5-flash\` لسرعة الاستجابة.
- درجة الحرارة (Temperature): 0.2 لتعزيز الموثوقية والمحاكاة المحاسبية الدقيقة.
`;
    } else {
      template = `---
name: "${metaTitle || nameOnly}"
description: "دليل قواعد العمل القياسي"
---

# ${metaTitle || nameOnly}

وثيقة متطورة لإرشادات العمل البرمجي والتنظيمي.

## قواعد أساسية:
- الالتزام بنظام الألوان المعتمد.
- تطبيق الدقة العالية لخطوط وأحجام الشاشات.
- الاحتفاظ بملف دائم للمراجعات وسجلات التوثيق والمراجعة.
`;
    }

    setContent(template);
    const { title, description } = parseFrontmatter(template);
    setMetaTitle(title || nameOnly);
    setMetaDescription(description || 'قالب دليل عمل جاهز');
    toast.success('تمت كتابة القالب المختار بنجاح للمحرر');
  };

  // Live Inline Markdown Parser for visual preview
  const parseInlineMarkdown = (text: string) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const codeRegex = /`(.*?)`/g;

    let parts: React.ReactNode[] = [];
    let keyIdx = 0;

    const tokens: { type: 'text' | 'bold' | 'code'; value: string; index: number }[] = [];
    
    text.replace(boldRegex, (match, p1, offset) => {
      tokens.push({ type: 'bold', value: p1, index: offset });
      return match;
    });

    text.replace(codeRegex, (match, p1, offset) => {
      tokens.push({ type: 'code', value: p1, index: offset });
      return match;
    });

    tokens.sort((a, b) => a.index - b.index);

    let currentPos = 0;
    for (const token of tokens) {
      if (token.index < currentPos) continue;
      
      if (token.index > currentPos) {
        parts.push(<span key={keyIdx++}>{text.substring(currentPos, token.index)}</span>);
      }
      
      if (token.type === 'bold') {
        parts.push(<strong key={keyIdx++} className="font-extrabold text-slate-900 border-b border-indigo-100/50">{token.value}</strong>);
        currentPos = token.index + token.value.length + 4;
      } else if (token.type === 'code') {
        parts.push(<code key={keyIdx++} className="bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 px-1.5 py-0.5 rounded font-mono text-xs border border-slate-200/50">{token.value}</code>);
        currentPos = token.index + token.value.length + 2;
      }
    }

    if (currentPos < text.length) {
      parts.push(<span key={keyIdx++}>{text.substring(currentPos)}</span>);
    }

    return parts.length > 0 ? parts : text;
  };

  const renderMarkdown = (md: string) => {
    if (!md) return <div className="text-slate-400 italic text-center py-12">لا يوجد محتوى لعرضه بالمعاينة حالياً. ابدأ بكتابة تعليماتك في المحرر.</div>;
    
    // Parse front-matter out
    let cleanMd = md;
    if (md.startsWith('---')) {
      const endIdx = md.indexOf('---', 3);
      if (endIdx !== -1) {
        cleanMd = md.substring(endIdx + 3).trim();
      }
    }

    const lines = cleanMd.split('\n');
    let inCodeBlock = false;
    let codeLines: string[] = [];

    return (
      <div className="space-y-4 text-slate-800 leading-relaxed font-sans select-text rtl">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          
          // Code block boundaries
          if (trimmed.startsWith('```')) {
            if (inCodeBlock) {
              inCodeBlock = false;
              const blockContent = codeLines.join('\n');
              codeLines = [];
              return (
                <div key={idx} className="relative group my-2">
                  <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded uppercase">Code Block</div>
                  <pre className="bg-[#121824] text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-emerald-950/20 shadow-inner">
                    <code>{blockContent}</code>
                  </pre>
                </div>
              );
            } else {
              inCodeBlock = true;
              return null;
            }
          }

          if (inCodeBlock) {
            codeLines.push(line);
            return null;
          }

          // Markdown Elements
          if (trimmed.startsWith('# ')) {
            return (
              <h1 key={idx} className="text-2xl font-black text-slate-900 border-r-4 border-brand-500 pr-3 pb-1 pt-6 mt-4">
                {trimmed.substring(2)}
              </h1>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-lg font-extrabold text-slate-800 border-b border-slate-100 pb-1.5 pt-4">
                {trimmed.substring(3)}
              </h2>
            );
          }
          if (trimmed.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-base font-bold text-slate-700 pt-3">
                {trimmed.substring(4)}
              </h3>
            );
          }

          // Lists
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const listContent = trimmed.substring(2);
            // Checkboxes Inside
            if (listContent.startsWith('[ ] ')) {
              return (
                <div key={idx} className="flex items-center gap-2 pr-4 text-slate-700 py-0.5">
                  <input type="checkbox" disabled className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4 shrink-0 transition-all cursor-default" />
                  <span className="text-sm font-medium">{parseInlineMarkdown(listContent.substring(4))}</span>
                </div>
              );
            }
            if (listContent.startsWith('[x] ') || listContent.startsWith('[X] ')) {
              return (
                <div key={idx} className="flex items-center gap-2 pr-4 text-slate-400 py-0.5 line-through">
                  <input type="checkbox" checked disabled className="rounded border-emerald-200 text-emerald-600 focus:ring-emerald-500 w-4 h-4 shrink-0 cursor-default" />
                  <span className="text-sm font-medium">{parseInlineMarkdown(listContent.substring(4))}</span>
                </div>
              );
            }
            return (
              <li key={idx} className="list-disc list-inside pr-4 text-slate-600 text-sm py-0.5 font-medium leading-relaxed">
                {parseInlineMarkdown(listContent)}
              </li>
            );
          }

          // Warnings or Info banners
          if (trimmed.startsWith('> ')) {
            return (
              <div key={idx} className="bg-brand-50/50 border-r-4 border-brand-500 p-4 rounded-l-xl text-brand-900 text-sm font-medium leading-relaxed my-3 shadow-sm flex items-start gap-2.5">
                <Info size={16} className="text-brand-600 mt-0.5 shrink-0" />
                <span>{parseInlineMarkdown(trimmed.substring(2))}</span>
              </div>
            );
          }

          if (trimmed === '') {
            return <div key={idx} className="h-2"></div>;
          }

          return (
            <p key={idx} className="text-sm leading-relaxed text-slate-600 font-medium whitespace-pre-wrap select-text">
              {parseInlineMarkdown(line)}
            </p>
          );
        })}
      </div>
    );
  };

  // Filter skills dynamically on client
  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      const matchSearch = 
        skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (skill.title && skill.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (skill.description && skill.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        skill.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (categoryFilter === 'all') return matchSearch;
      if (categoryFilter === 'system') return matchSearch && skill.isSystem;
      if (categoryFilter === 'business') return matchSearch && !skill.isSystem;
      return matchSearch;
    });
  }, [skills, searchTerm, categoryFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = skills.length;
    const businessCount = skills.filter(s => !s.isSystem).length;
    const systemCount = skills.filter(s => s.isSystem).length;
    const totalLines = skills.reduce((sum, s) => sum + (s.lineCount || 0), 0);
    const averageLines = total > 0 ? Math.round(totalLines / total) : 0;
    
    return {
      total,
      businessCount,
      systemCount,
      totalLines,
      averageLines
    };
  }, [skills]);

  return (
    <div className="p-6 h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-[1600px] mx-auto w-full" dir="rtl">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md border border-slate-700/30 shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-500/10 border border-brand-400/20 rounded-2xl text-brand-400 animate-pulse">
            <Cpu size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wide">
              أدوات ومجال المطور للذكاء الاصطناعي (Developer Automation Tools)
            </h1>
            <p className="text-slate-300 text-xs mt-1 flex items-center gap-1.5 font-medium">
              <AlertCircle size={14} className="text-brand-400" />
              تطوير ومراجعة التوجيهات الهندسية وقوانين النظام الفيدرالية المعتمدة.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !selectedSkill}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white rounded-xl shadow-md shadow-brand-600/10 transition-all font-extrabold disabled:opacity-50 text-xs sm:text-sm shrink-0"
          >
            <Save size={16} />
            {saving ? 'جاري الحفظ...' : 'حفظ الملف الحالي'}
          </button>
        </div>
      </div>

      {/* 2. Top Analytics Statistics Grid (Bento Style) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 shrink-0">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Database size={20} />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-slate-400 font-bold">إجمالي الأدلة</span>
            <span className="text-base font-black text-slate-800 leading-tight mt-0.5">{stats.total} أدلة</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Sparkles size={20} />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-slate-400 font-bold">أدلة الأقسام</span>
            <span className="text-base font-black text-slate-800 leading-tight mt-0.5">{stats.businessCount} دليل عملي</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0">
            <Cpu size={20} />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-slate-400 font-bold">أدلة الأنظمة والذكاء</span>
            <span className="text-base font-black text-slate-800 leading-tight mt-0.5">{stats.systemCount} نظام مرافق</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <Hash size={20} />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-slate-400 font-bold">إجمالي الأسطر</span>
            <span className="text-base font-black text-slate-800 leading-tight mt-0.5">{stats.totalLines} سطر برمجي</span>
          </div>
        </div>

        <div className="col-span-2 md:col-span-1 bg-gradient-to-r from-brand-600/5 to-indigo-600/5 border border-brand-100/60 p-4 rounded-xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-600/15 flex items-center justify-center text-brand-600 shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-slate-400 font-bold">حالة المزامنة والنشاط</span>
            <span className="text-xs font-black text-brand-700 leading-tight mt-1 flex items-center gap-1">
              محدث ونشط 🟢
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0 relative">
        
        {/* Sidebar Container */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 flex flex-col min-h-[400px] lg:min-h-0">
          <div className="shrink-0 space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="ابحث بقارئ المهارات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-brand-500 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-4 focus:ring-brand-50 text-slate-800 text-right"
                dir="rtl"
              />
            </div>

            {/* Filter Pills or Indicator */}
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`flex-1 py-1 px-2.5 rounded-lg text-[10px] font-black transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setCategoryFilter('business')}
                className={`flex-1 py-1 px-2.5 rounded-lg text-[10px] font-black transition-all ${
                  categoryFilter === 'business'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                أقسام العمل ({stats.businessCount})
              </button>
              <button
                onClick={() => setCategoryFilter('system')}
                className={`flex-1 py-1 px-2.5 rounded-lg text-[10px] font-black transition-all ${
                  categoryFilter === 'system'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ذكاء ونظام ({stats.systemCount})
              </button>
            </div>
          </div>

          {/* List area */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5" style={{ maxHeight: 'calc(100vh - 430px)' }}>
            {filteredSkills.length === 0 ? (
              <div className="text-center py-10">
                <AlertCircle size={24} className="mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-slate-400 text-xs font-semibold mt-3">لم نسجل دليلاً يطابق البحث</p>
              </div>
            ) : (
              filteredSkills.map(skill => {
                const isActive = selectedSkill?.name === skill.name;
                const skillNameClean = skill.name.split('/').pop() || skill.name;
                
                return (
                  <button
                    key={skill.name}
                    onClick={() => handleSelect(skill)}
                    className={`w-full text-right p-3 rounded-xl transition-all border flex items-center justify-between group ${
                      isActive
                        ? 'bg-brand-50/70 border-brand-200 text-brand-900 shadow-sm'
                        : 'bg-white hover:bg-slate-50/70 border-slate-100 hover:border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`p-2 rounded-lg shrink-0 transition-all relative ${
                        isActive 
                          ? 'bg-brand-600 text-white' 
                          : skill.isSystem 
                            ? 'bg-slate-100 text-slate-500 group-hover:bg-slate-200' 
                            : 'bg-indigo-50 text-indigo-500 group-hover:bg-indigo-100'
                      }`}>
                        {skill.isSystem ? <Cpu size={14} /> : <FileText size={14} />}
                      </div>
                      <div className="flex flex-col justify-center overflow-hidden">
                        <span className="text-xs font-extrabold truncate w-40 sm:w-48 text-slate-800">
                          {skill.title}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold mt-0.5 truncate w-36">
                          {skillNameClean}.md • {skill.lineCount} أسطر
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={14} className={`shrink-0 transition-transform ${isActive ? 'text-brand-600 translate-x-1' : 'text-slate-300'}`} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Workspace Display Area */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col min-h-[500px] lg:min-h-0">
          
          {selectedSkill ? (
            <>
              {/* Top Panel Controls */}
              <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-slate-400" />
                  <span className="text-slate-700 font-mono text-[12px] font-semibold tracking-wide">
                    <span className="text-slate-300">skills/</span>
                    {selectedSkill?.name}
                    <span className="text-slate-300">/SKILL.md</span>
                  </span>
                </div>

                {/* View Mode Selectors */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <div className="bg-slate-200/80 p-0.5 rounded-lg flex items-center">
                    <button
                      onClick={() => setViewMode('edit')}
                      className={`flex items-center gap-1 px-3 py-1 rounded-md text-[10px] font-black transition-all ${
                        viewMode === 'edit'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Code2 size={12} />
                      كود المصدر
                    </button>
                    <button
                      onClick={() => setViewMode('preview')}
                      className={`flex items-center gap-1 px-3 py-1 rounded-md text-[10px] font-black transition-all ${
                        viewMode === 'preview'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Eye size={12} />
                      معاينة منسقة
                    </button>
                    <button
                      onClick={() => setViewMode('split')}
                      className={`hidden sm:flex items-center gap-1 px-3 py-1 rounded-md text-[10px] font-black transition-all ${
                        viewMode === 'split'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Columns size={12} />
                      الشاشة المنقسمة
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden relative flex flex-col md:flex-row">
                
                {/* Left/Middle Pane: Editor and metadata fields */}
                {(viewMode === 'edit' || viewMode === 'split') && (
                  <div className="flex-1 overflow-hidden flex flex-col border-l border-slate-100 min-h-[300px] md:min-h-0 bg-[#fbfcfd]">
                    
                    {/* YAML front-matter Form Fields for easier editing */}
                    <div className="p-4 bg-slate-50/50 border-b border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0 shadow-inner">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 flex items-center gap-1">
                          <Edit3 size={11} className="text-slate-400" />
                          عنوان الدليل (Title)
                        </label>
                        <input
                          type="text"
                          value={metaTitle}
                          onChange={(e) => handleMetaChange(e.target.value, metaDescription)}
                          className="w-full text-xs font-extrabold bg-white border border-slate-200 focus:border-brand-500 rounded-lg p-2 focus:outline-none shadow-sm focus:ring-4 focus:ring-brand-50"
                          placeholder="أدخل عنواناً مخصصاً للملف..."
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 flex items-center gap-1">
                          <Info size={11} className="text-slate-400" />
                          وصف مقتضب للأدلة ليكون مرئي للمساعد
                        </label>
                        <input
                          type="text"
                          value={metaDescription}
                          onChange={(e) => handleMetaChange(metaTitle, e.target.value)}
                          className="w-full text-xs font-semibold bg-white border border-slate-200 focus:border-brand-500 rounded-lg p-2 focus:outline-none shadow-sm focus:ring-4 focus:ring-brand-50"
                          placeholder="أدخل ملخص لأهمية الدليل..."
                        />
                      </div>
                    </div>

                    {/* Main Raw Code Editor Container */}
                    <div className="flex-1 overflow-hidden flex relative">
                      {/* Interactive line numbers */}
                      <div 
                        ref={lineNumbersRef}
                        className="border-l border-slate-200/60 bg-slate-100/50 text-slate-400 font-mono text-[12px] text-left py-4 px-3.5 select-none overflow-hidden"
                        style={{ minWidth: '3.5rem', lineHeight: '1.8' }}
                      >
                        {content.split('\n').map((_, i) => (
                          <div key={i} className="text-right pr-1">{i + 1}</div>
                        ))}
                      </div>

                      <textarea
                        ref={textAreaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onScroll={handleScroll}
                        className="flex-1 w-full py-4 px-5 bg-transparent text-slate-800 font-mono text-[13px] font-semibold focus:outline-none resize-none overflow-auto selection:bg-brand-100 selection:text-brand-900 caret-brand-600 block leading-relaxed"
                        style={{ lineHeight: '1.8' }}
                        spellCheck={false}
                        dir="ltr"
                        wrap="off"
                        placeholder="# اكتب توجيهاتك الجديدة هنا..."
                      />
                    </div>

                    {/* Templates Helper inject bar */}
                    <div className="shrink-0 p-3 bg-slate-50 border-t border-slate-200/60 flex items-center flex-wrap gap-2 text-slate-500 text-xs font-bold leading-none">
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Sparkles size={11} />
                        لوحة القوالب الجاهزة:
                      </span>
                      <button
                        onClick={() => handleApplyTemplate('business')}
                        className="bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded text-[10px] font-black transition-colors"
                      >
                        + دليل أقسام العمل
                      </button>
                      <button
                        onClick={() => handleApplyTemplate('ai')}
                        className="bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded text-[10px] font-black transition-colors"
                      >
                        + دليل ذكاء اصطناعي
                      </button>
                      <button
                        onClick={() => handleApplyTemplate('standard')}
                        className="bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded text-[10px] font-black transition-colors"
                      >
                        + دليل عمل قياسي
                      </button>
                    </div>
                  </div>
                )}

                {/* Right Pane: Live rendered markdown preview */}
                {(viewMode === 'preview' || viewMode === 'split') && (
                  <div className="flex-1 overflow-auto p-6 bg-slate-50/30 selection:bg-brand-50 selection:text-brand-900 border-r border-slate-100 min-h-[300px] md:min-h-0 relative select-text" dir="rtl">
                    
                    {/* Preview Banner Header */}
                    <div className="shrink-0 bg-gradient-to-r from-brand-600/5 to-indigo-600/5 p-4 rounded-xl border border-brand-200/20 mb-6 flex flex-col justify-center leading-normal">
                      <div className="flex items-center gap-2 text-brand-700">
                        <BookOpen size={16} />
                        <span className="text-xs font-extrabold">{metaTitle || 'تعليمات ذكية'}</span>
                      </div>
                      <p className="text-slate-500 font-semibold text-[11px] mt-1 pr-6 leading-relaxed text-right">
                        {metaDescription || 'هذا المستند يتضمن بنود المعايير الأساسية الحالية.'}
                      </p>
                    </div>

                    {renderMarkdown(content)}
                  </div>
                )}
              </div>

              {/* Core Footer Indicators */}
              <div className="bg-slate-50 shrink-0 p-3 border-t border-slate-200/80 px-6 flex items-center justify-between text-[11px] text-slate-400 font-bold font-sans">
                <div className="flex items-center gap-4">
                  <span>أوراق العمل: <span className="text-slate-600">{content.split('\n').length} سطر</span></span>
                  <span>الحجم التقريبي: <span className="text-slate-600">{content.length} حرف</span></span>
                  <span>الكلمات: <span className="text-slate-600">{content.trim() ? content.trim().split(/\s+/).length : 0} كلمة</span></span>
                </div>
                <div className="flex items-center gap-2 text-brand-600">
                  <CheckCircle2 size={12} className="text-emerald-500 animate-pulse" />
                  <span>جاهز للاستهلاك الفوري بواسطة المساعد 🚀</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/25">
              <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 mb-4 border border-brand-100">
                <Database size={32} />
              </div>
              <h3 className="text-sm font-black text-slate-700">لم يتم اختيار دليل مهارة</h3>
              <p className="text-xs text-slate-400 font-semibold max-w-xs mt-2 leading-relaxed">
                الرجاء تحديد أحد أدلة المهارات وقواعد العمل من القائمة الجانبية اليمنى لعرض وتعديل التعليمات والارتجالات الهندسية.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default SkillsManager;
