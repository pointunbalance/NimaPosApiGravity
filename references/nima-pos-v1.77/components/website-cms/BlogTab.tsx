import React from 'react';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { WebsiteContent } from '../../types';

interface BlogTabProps {
  content: WebsiteContent;
  setContent: (content: WebsiteContent) => void;
}

export const BlogTab: React.FC<BlogTabProps> = ({ content, setContent }) => {
  const addBlogPost = () => {
    setContent({
      ...content,
      blogPosts: [...(content.blogPosts || []), { id: Date.now().toString(), title: '', excerpt: '', content: '', image: '', date: new Date().toISOString().split('T')[0], author: '' }]
    });
  };

  const removeBlogPost = (id: string) => {
    setContent({
      ...content,
      blogPosts: (content.blogPosts || []).filter(p => p.id !== id)
    });
  };

  const updateBlogPost = (id: string, field: string, value: string) => {
    setContent({
      ...content,
      blogPosts: (content.blogPosts || []).map(p => p.id === id ? { ...p, [field]: value } : p)
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
      <div className="flex justify-between items-center border-b pb-3">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <FileText className="text-indigo-500" />
          المدونة والمقالات
        </h2>
        <button onClick={addBlogPost} className="text-sm flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg">
          <Plus size={16} /> إضافة مقال
        </button>
      </div>
      
      <div className="space-y-4">
        {(content.blogPosts || []).map((post) => (
          <div key={post.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative group">
            <button 
              onClick={() => removeBlogPost(post.id)}
              className="absolute top-4 left-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={18} />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">عنوان المقال</label>
                <input 
                  type="text" 
                  value={post.title}
                  onChange={e => updateBlogPost(post.id, 'title', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">الكاتب</label>
                <input 
                  type="text" 
                  value={post.author}
                  onChange={e => updateBlogPost(post.id, 'author', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">مقتطف (نبذة قصيرة)</label>
                <textarea 
                  value={post.excerpt}
                  onChange={e => updateBlogPost(post.id, 'excerpt', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-16"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">المحتوى</label>
                <textarea 
                  value={post.content}
                  onChange={e => updateBlogPost(post.id, 'content', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-32"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">التاريخ</label>
                <input 
                  type="date" 
                  value={post.date}
                  onChange={e => updateBlogPost(post.id, 'date', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">رابط الصورة</label>
                <input 
                  type="text" 
                  value={post.image}
                  onChange={e => updateBlogPost(post.id, 'image', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ltr"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        ))}
        {(!content.blogPosts || content.blogPosts.length === 0) && (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">لا توجد مقالات مضافة.</div>
        )}
      </div>
    </div>
  );
};
