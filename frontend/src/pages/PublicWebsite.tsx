import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Star, LifeBuoy, ShieldCheck, Zap, Globe, ArrowLeft, Briefcase, FileText, Users, MessageCircleHeart, HelpCircle, ChevronDown } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { WebsiteContent } from '../types';
import { Routes, Route, Link, useLocation } from 'react-router-dom';

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

const iconMap: Record<string, React.ReactNode> = {
  LifeBuoy: <LifeBuoy className="w-8 h-8" />,
  Star: <Star className="w-8 h-8" />,
  ShieldCheck: <ShieldCheck className="w-8 h-8" />,
  Zap: <Zap className="w-8 h-8" />,
  Globe: <Globe className="w-8 h-8" />
};

const Home = ({ content }: { content: WebsiteContent }) => (
  <>
    {/* Hero Section */}
    <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={content.heroImage} alt="Hero" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-slate-900/60 mix-blend-multiply"></div>
      </div>
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          {content.heroTitle}
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-xl md:text-2xl text-slate-200 mb-10 leading-relaxed">
          {content.heroSubtitle}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/website/services" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/30">
            اكتشف خدماتنا
          </Link>
          <Link to="/website/contact" className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full font-bold text-lg transition-all border border-white/30">
            تواصل معنا
          </Link>
        </motion.div>
      </div>
    </section>

    {/* Quick Services Preview */}
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">خدماتنا المميزة</h2>
          <p className="text-lg text-slate-600">نقدم مجموعة واسعة من الخدمات المصممة خصيصاً لتلبية احتياجاتك</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {content.services.slice(0, 3).map((service, index) => (
            <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-all group">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-indigo-600 group-hover:text-white">
                {iconMap[service.icon] || <Star className="w-8 h-8" />}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">{service.title}</h3>
              <p className="text-slate-600 leading-relaxed">{service.description}</p>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link to="/website/services" className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 transition-colors">
            عرض كل الخدمات <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>

    {/* Testimonials Preview */}
    {content.testimonials && content.testimonials.length > 0 && (
      <section className="py-24 bg-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">ماذا يقول عملاؤنا</h2>
            <p className="text-lg text-slate-600">نفخر بثقة عملائنا ونسعى دائماً لتقديم الأفضل</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.testimonials.slice(0, 3).map((testimonial, index) => (
              <motion.div key={testimonial.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative">
                <MessageCircleHeart className="absolute top-6 left-6 w-10 h-10 text-indigo-100" />
                <p className="text-slate-600 mb-6 relative z-10 leading-relaxed italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-4">
                  {testimonial.avatar ? (
                    <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                      {testimonial.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-800">{testimonial.name}</h4>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    )}
  </>
);

const About = ({ content }: { content: WebsiteContent }) => (
  <>
    <section className="py-24 bg-white min-h-[50vh] flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-slate-800 mb-8">من نحن</h2>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="prose prose-lg prose-indigo mx-auto text-slate-600 leading-relaxed">
            {content.aboutUs.split('\n').map((paragraph, i) => (
              <p key={i} className="mb-4">{paragraph}</p>
            ))}
          </motion.div>
        </div>
      </div>
    </section>

    {/* Team Section */}
    {content.team && content.team.length > 0 && (
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">فريق العمل</h2>
            <p className="text-lg text-slate-600">نخبة من الخبراء والمختصين لخدمتكم</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {content.team.map((member, index) => (
              <motion.div key={member.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 text-center group">
                <div className="h-64 overflow-hidden">
                  {member.image ? (
                    <img src={member.image} alt={member.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                      <Users className="w-16 h-16 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{member.name}</h3>
                  <p className="text-indigo-600 font-medium">{member.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    )}
  </>
);

const Services = ({ content }: { content: WebsiteContent }) => (
  <section className="py-24 bg-slate-50 min-h-[70vh]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">خدماتنا</h2>
        <p className="text-lg text-slate-600">حلول متكاملة مصممة لنجاح أعمالك</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {content.services.map((service, index) => (
          <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-indigo-600 group-hover:text-white">
              {iconMap[service.icon] || <Star className="w-8 h-8" />}
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">{service.title}</h3>
            <p className="text-slate-600 leading-relaxed">{service.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const Projects = ({ content }: { content: WebsiteContent }) => (
  <section className="py-24 bg-white min-h-[70vh]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">مشاريعنا</h2>
        <p className="text-lg text-slate-600">نماذج من أعمالنا السابقة التي نفخر بها</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {content.projects?.map((project, index) => (
          <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
            <div className="h-64 overflow-hidden relative">
              <img src={project.image} alt={project.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-bold text-indigo-600">
                {project.category}
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-3">{project.title}</h3>
              <p className="text-slate-600 leading-relaxed">{project.description}</p>
            </div>
          </motion.div>
        ))}
        {(!content.projects || content.projects.length === 0) && (
          <div className="col-span-full text-center py-12 text-slate-500">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-lg">لا توجد مشاريع مضافة حالياً</p>
          </div>
        )}
      </div>
    </div>
  </section>
);

const Blog = ({ content }: { content: WebsiteContent }) => (
  <section className="py-24 bg-slate-50 min-h-[70vh]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">المدونة والمقالات</h2>
        <p className="text-lg text-slate-600">أحدث الأخبار والمقالات في مجالنا</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {content.blogPosts?.map((post, index) => (
          <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all group flex flex-col">
            <div className="h-48 overflow-hidden relative">
              <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="p-6 flex flex-col flex-grow">
              <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                <span>{post.date}</span>
                <span>{post.author}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">{post.title}</h3>
              <p className="text-slate-600 leading-relaxed mb-4 flex-grow">{post.excerpt}</p>
              <button className="text-indigo-600 font-bold flex items-center gap-2 hover:text-indigo-700 mt-auto">
                اقرأ المزيد <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
        {(!content.blogPosts || content.blogPosts.length === 0) && (
          <div className="col-span-full text-center py-12 text-slate-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-lg">لا توجد مقالات مضافة حالياً</p>
          </div>
        )}
      </div>
    </div>
  </section>
);

const Contact = ({ content }: { content: WebsiteContent }) => {
  const [openFaq, setOpenFaq] = React.useState<string | null>(null);

  return (
    <>
      <section className="py-24 bg-white min-h-[70vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">اتصل بنا</h2>
            <p className="text-lg text-slate-600">نحن هنا للإجابة على استفساراتك وتلبية طلباتك</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="space-y-8">
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                <h3 className="text-2xl font-bold text-slate-800 mb-6">معلومات التواصل</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 mb-1">رقم الهاتف</h4>
                      <p className="text-slate-600 ltr" dir="ltr">{content.contactPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 mb-1">البريد الإلكتروني</h4>
                      <p className="text-slate-600">{content.contactEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 mb-1">العنوان</h4>
                      <p className="text-slate-600">{content.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
              <h3 className="text-2xl font-bold text-slate-800 mb-6">أرسل لنا رسالة</h3>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الاسم الكامل</label>
                  <input type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="أدخل اسمك" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني</label>
                  <input type="email" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="أدخل بريدك الإلكتروني" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الرسالة</label>
                  <textarea className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-32" placeholder="اكتب رسالتك هنا..."></textarea>
                </div>
                <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg transition-colors">
                  إرسال الرسالة
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      {content.faqs && content.faqs.length > 0 && (
        <section className="py-24 bg-slate-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-800 mb-4">الأسئلة الشائعة</h2>
              <p className="text-lg text-slate-600">إجابات على أكثر الأسئلة التي تصلنا</p>
            </div>
            <div className="space-y-4">
              {content.faqs.map((faq) => (
                <div key={faq.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <button 
                    onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                    className="w-full flex items-center justify-between p-6 text-right focus:outline-none"
                  >
                    <span className="font-bold text-slate-800">{faq.question}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === faq.id ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === faq.id && (
                    <div className="px-6 pb-6 text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

const PublicWebsite: React.FC = () => {
  const content = useLiveQuery(() => db.websiteContent.get(1)) || defaultContent;
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const navLinkClass = (path: string) => {
    const isActive = location.pathname === path || (path === '/website' && location.pathname === '/website/');
    return `font-medium transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
      {/* Navigation */}
      <nav className="bg-white sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link to="/website" className="text-2xl font-black text-indigo-600 tracking-tight">
                LOGO.
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-8 space-x-reverse">
              <Link to="/website" className={navLinkClass('/website')}>الرئيسية</Link>
              <Link to="/website/about" className={navLinkClass('/website/about')}>من نحن</Link>
              <Link to="/website/services" className={navLinkClass('/website/services')}>خدماتنا</Link>
              <Link to="/website/projects" className={navLinkClass('/website/projects')}>مشاريعنا</Link>
              <Link to="/website/blog" className={navLinkClass('/website/blog')}>المدونة</Link>
              <Link to="/website/contact" className={navLinkClass('/website/contact')}>اتصل بنا</Link>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/" className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm">
                <Globe size={18} />
                <span>العودة للنظام</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home content={content} />} />
          <Route path="/about" element={<About content={content} />} />
          <Route path="/services" element={<Services content={content} />} />
          <Route path="/projects" element={<Projects content={content} />} />
          <Route path="/blog" element={<Blog content={content} />} />
          <Route path="/contact" element={<Contact content={content} />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 text-center md:text-right">
            <div>
              <h3 className="text-2xl font-black text-white mb-6">LOGO.</h3>
              <p className="text-slate-400 leading-relaxed max-w-xs mx-auto md:mx-0">
                نقدم حلولاً مبتكرة وخدمات متكاملة لضمان نجاح أعمالك في العصر الرقمي.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold text-white mb-6">روابط سريعة</h4>
              <ul className="space-y-3">
                <li><Link to="/website" className="text-slate-400 hover:text-white transition-colors">الرئيسية</Link></li>
                <li><Link to="/website/about" className="text-slate-400 hover:text-white transition-colors">من نحن</Link></li>
                <li><Link to="/website/services" className="text-slate-400 hover:text-white transition-colors">الخدمات</Link></li>
                <li><Link to="/website/projects" className="text-slate-400 hover:text-white transition-colors">المشاريع</Link></li>
                <li><Link to="/website/blog" className="text-slate-400 hover:text-white transition-colors">المدونة</Link></li>
                <li><Link to="/website/contact" className="text-slate-400 hover:text-white transition-colors">اتصل بنا</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold text-white mb-6">تواصل معنا</h4>
              <ul className="space-y-3 text-slate-400">
                <li className="flex items-center justify-center md:justify-start gap-2">
                  <Mail className="w-5 h-5" /> {content.contactEmail}
                </li>
                <li className="flex items-center justify-center md:justify-start gap-2 ltr" dir="ltr">
                  {content.contactPhone} <Phone className="w-5 h-5" />
                </li>
                <li className="flex items-center justify-center md:justify-start gap-2">
                  <MapPin className="w-5 h-5" /> {content.address}
                </li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-800">
            <p className="text-slate-500 mb-4 md:mb-0">© {new Date().getFullYear()} جميع الحقوق محفوظة.</p>
            <div className="flex gap-4">
              {content.socialLinks.map((link, index) => (
                <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                  {link.platform}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicWebsite;
