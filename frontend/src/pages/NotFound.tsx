
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home, MoveRight } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center font-['Tajawal']">
      <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 max-w-lg w-full flex flex-col items-center">
        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 text-indigo-600">
          <FileQuestion className="w-12 h-12" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-slate-800 mb-2">404</h1>
        <h2 className="text-xl font-bold text-slate-600 mb-4">الصفحة غير موجودة</h2>
        
        <p className="text-slate-500 mb-8 leading-relaxed">
          عذراً، الصفحة التي تحاول الوصول إليها غير موجودة أو تم نقلها. يرجى التأكد من الرابط أو العودة للصفحة الرئيسية.
        </p>

        <button 
          onClick={() => navigate('/')}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group"
        >
          <Home className="w-5 h-5" />
          <span>العودة للرئيسية</span>
          <MoveRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        </button>
      </div>
      
      <div className="mt-8 text-slate-400 text-xs font-mono">
        Nima POS Enterprise
      </div>
    </div>
  );
};

export default NotFound;
