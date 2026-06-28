import React, { useRef } from 'react';
import { Plus, Download, Upload, ScanBarcode, Printer } from 'lucide-react';

interface ProductsHeaderProps {
  onOpenModal: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onPrintBarcodes: () => void;
  onPrintList: () => void;
}

const ProductsHeader: React.FC<ProductsHeaderProps> = ({ onOpenModal, onExport, onImport, onPrintBarcodes, onPrintList }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h1 className="text-3xl font-black text-slate-800 mb-2 font-['Tajawal'] tracking-tight">إدارة المنتجات</h1>
        <p className="text-slate-500 font-bold text-sm">مكتبة الأصناف، التسعير، وإدارة التكاليف</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={onPrintList}
          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 border border-emerald-200/80 px-4 py-3 rounded-xl flex items-center gap-2 transition-all font-bold shadow-sm cursor-pointer active:scale-95"
          title="طباعة قائمة المنتجات"
        >
          <Printer className="w-5 h-5 stroke-[2]" />
          <span className="hidden sm:inline">طباعة القائمة</span>
        </button>
        <button
          onClick={onPrintBarcodes}
          className="bg-amber-50 hover:bg-amber-100 text-amber-600 hover:text-amber-700 border border-amber-200/80 px-4 py-3 rounded-xl flex items-center gap-2 transition-all font-bold shadow-sm cursor-pointer active:scale-95"
          title="طباعة الباركودات"
        >
          <ScanBarcode className="w-5 h-5 stroke-[2]" />
          <span className="hidden sm:inline">طباعة الباركود</span>
        </button>
        <button
          onClick={onExport}
          className="bg-sky-50 hover:bg-sky-100 text-sky-600 hover:text-sky-700 border border-sky-200/80 px-4 py-3 rounded-xl flex items-center gap-2 transition-all font-bold shadow-sm cursor-pointer active:scale-95"
          title="تصدير إلى Excel"
        >
          <Download className="w-5 h-5 stroke-[2]" />
          <span className="hidden sm:inline">تصدير</span>
        </button>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".xlsx, .xls, .csv" 
          onChange={handleFileChange} 
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 border border-indigo-200/80 px-4 py-3 rounded-xl flex items-center gap-2 transition-all font-bold shadow-sm cursor-pointer active:scale-95"
          title="استيراد من Excel"
        >
          <Upload className="w-5 h-5 stroke-[2]" />
          <span className="hidden sm:inline">استيراد</span>
        </button>

        <button
          onClick={onOpenModal}
          className="bg-gradient-to-br from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white px-5 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-indigo-500/20 font-black cursor-pointer active:scale-95"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>منتج جديد</span>
        </button>
      </div>
    </div>
  );
};

export default ProductsHeader;
