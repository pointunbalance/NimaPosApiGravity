import React from 'react';
import { HardHat } from 'lucide-react';

export const UnderConstruction: React.FC<{ title: string; description: string }> = ({ title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-slate-200 mt-8">
      <HardHat className="w-24 h-24 text-amber-500 mb-6" strokeWidth={1.5} />
      <h2 className="text-3xl font-black text-slate-800 mb-4">{title}</h2>
      <p className="text-lg text-slate-500 max-w-lg text-center">{description}</p>
    </div>
  );
};
