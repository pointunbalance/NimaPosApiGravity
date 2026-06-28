import React, { useState, useEffect } from 'react';
import { Save, Globe, LayoutTemplate, Briefcase, FileText, Phone, Users, MessageCircleHeart, HelpCircle, Image as ImageIcon } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { WebsiteContent } from '../types';
import { useToast } from '../context/ToastContext';

// Import newly extracted tabs
import { GeneralTab } from '../components/website-cms/GeneralTab';
import { ServicesTab } from '../components/website-cms/ServicesTab';
import { ProjectsTab } from '../components/website-cms/ProjectsTab';
import { BlogTab } from '../components/website-cms/BlogTab';
import { TeamTab } from '../components/website-cms/TeamTab';
import { TestimonialsTab } from '../components/website-cms/TestimonialsTab';
import { FaqsTab } from '../components/website-cms/FaqsTab';
import { ContactTab } from '../components/website-cms/ContactTab';
import { SeoTab } from '../components/website-cms/SeoTab';

const svgPlaceholder = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2394a3b8'%3Eصورة%3C/text%3E%3C/svg%3E`;

const defaultContent: WebsiteContent = {
  heroTitle: 'مرحباً بكم في شركتنا',
  heroSubtitle: 'نقدم أفضل الخدمات والحلول لعملائنا',
  heroImage: svgPlaceholder,
  aboutUs: 'نحن شركة رائدة في مجال تقديم الحلول التقنية المبتكرة التي تساعد عملائنا على تحقيق أهدافهم.',
  services: [
    { id: '1', title: 'تطوير الويب', description: 'تطبيقات ويب سريعة وموثوقة', icon: 'Globe' },
    { id: '2', title: 'حماية البيانات', description: 'أعلى معايير الأمان', icon: 'ShieldCheck' }
  ],
  projects: [
    { id: '1', title: 'مشروع تطوير الويب', description: 'تطوير منصة متكاملة للعميل', image: svgPlaceholder, category: 'تطوير ويب' },
    { id: '2', title: 'تطبيق جوال', description: 'تطبيق جوال لخدمات التوصيل', image: svgPlaceholder, category: 'تطبيقات' },
  ],
  team: [
    { id: '1', name: 'أندري لسينكو', role: 'المدير التنفيذي', image: svgPlaceholder },
    { id: '2', name: 'أولغا تسيخوتسكا', role: 'مديرة التصميم', image: svgPlaceholder },
  ],
  testimonials: [
    { id: '1', name: 'ميكولا بافليوك', role: 'مدير شركة آفاق', content: 'خدمات ممتازة وفريق محترف', avatar: svgPlaceholder },
  ],
  faqs: [
    { id: '1', question: 'ما هي خدماتكم الأساسية؟', answer: 'نقدم خدمات الاستشارات وتطوير البرمجيات.' },
    { id: '2', question: 'كيف يمكنني التواصل معكم؟', answer: 'عبر البريد الإلكتروني أو الهاتف الموضح في أسفل الصفحة.' }
  ],
  blogPosts: [
    { id: '1', title: 'أهمية التحول الرقمي', excerpt: 'كيف يؤثر التحول الرقمي على نمو الشركات...', content: '...', date: '2023-10-01', author: 'أندري لسينكو', image: svgPlaceholder },
  ],
  contactEmail: 'info@company.com',
  contactPhone: '+966 50 000 0000',
  address: 'الرياض، المملكة العربية السعودية',
  socialLinks: [
    { platform: 'Twitter', url: 'https://twitter.com' },
    { platform: 'LinkedIn', url: 'https://linkedin.com' },
  ],
};

const WebsiteCMS: React.FC = () => {
  const { success, error: showError } = useToast();
  const existingContent = useLiveQuery(() => db.websiteContent.get(1));
  const [content, setContent] = useState<WebsiteContent>(defaultContent);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (existingContent) {
      setContent(existingContent);
    }
  }, [existingContent]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await db.websiteContent.put({ ...content, id: 1 });
      setTimeout(() => {
        setIsSaving(false);
        success('تم حفظ بيانات الموقع بنجاح');
      }, 800);
    } catch (error) {
      console.error(error);
      setIsSaving(false);
      showError('حدث خطأ أثناء حفظ التغييرات');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <LayoutTemplate size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">إدارة محتوى الموقع</h1>
            <p className="text-slate-500">تحكم شامل في جميع أقسام ومحتويات الموقع العام</p>
          </div>
        </div>
        <div className="flex gap-3">
          <a 
            href="#/website" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
          >
            <Globe size={20} />
            <span>معاينة الموقع</span>
          </a>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
          >
            <Save size={20} />
            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button onClick={() => setActiveTab('general')} className={`flex items-center gap-2 px-4 py-2 font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'general' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          <LayoutTemplate size={18} /> الرئيسية
        </button>
        <button onClick={() => setActiveTab('services')} className={`flex items-center gap-2 px-4 py-2 font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'services' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          <Briefcase size={18} /> الخدمات
        </button>
        <button onClick={() => setActiveTab('projects')} className={`flex items-center gap-2 px-4 py-2 font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'projects' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          <ImageIcon size={18} /> المشاريع
        </button>
        <button onClick={() => setActiveTab('blog')} className={`flex items-center gap-2 px-4 py-2 font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'blog' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          <FileText size={18} /> المدونة
        </button>
        <button onClick={() => setActiveTab('team')} className={`flex items-center gap-2 px-4 py-2 font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'team' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          <Users size={18} /> فريق العمل
        </button>
        <button onClick={() => setActiveTab('testimonials')} className={`flex items-center gap-2 px-4 py-2 font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'testimonials' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          <MessageCircleHeart size={18} /> آراء العملاء
        </button>
        <button onClick={() => setActiveTab('faqs')} className={`flex items-center gap-2 px-4 py-2 font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'faqs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          <HelpCircle size={18} /> الأسئلة الشائعة
        </button>
        <button onClick={() => setActiveTab('contact')} className={`flex items-center gap-2 px-4 py-2 font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'contact' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          <Phone size={18} /> التواصل
        </button>
        <button onClick={() => setActiveTab('seo')} className={`flex items-center gap-2 px-4 py-2 font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'seo' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          <Globe size={18} /> الـ SEO وإعدادات النشر
        </button>
      </div>

      <div className="space-y-6">
        {activeTab === 'general' && (
          <GeneralTab content={content} setContent={setContent} />
        )}

        {activeTab === 'services' && (
          <ServicesTab content={content} setContent={setContent} />
        )}

        {activeTab === 'projects' && (
          <ProjectsTab content={content} setContent={setContent} />
        )}

        {activeTab === 'blog' && (
          <BlogTab content={content} setContent={setContent} />
        )}

        {activeTab === 'team' && (
          <TeamTab content={content} setContent={setContent} />
        )}

        {activeTab === 'testimonials' && (
          <TestimonialsTab content={content} setContent={setContent} />
        )}

        {activeTab === 'faqs' && (
          <FaqsTab content={content} setContent={setContent} />
        )}

        {activeTab === 'contact' && (
          <ContactTab content={content} setContent={setContent} />
        )}

        {activeTab === 'seo' && (
          <SeoTab content={content} setContent={setContent} />
        )}
      </div>
    </div>
  );
};

export default WebsiteCMS;
