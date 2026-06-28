import React from 'react';
import { Armchair, X, LayoutGrid } from 'lucide-react';
import { Table as TableType } from '../../types';

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: TableType[];
  selectedTable: string;
  setSelectedTable: (table: string) => void;
}

export const TableModal: React.FC<TableModalProps> = ({
  isOpen, onClose, tables, selectedTable, setSelectedTable
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-800 text-white relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-black flex items-center gap-3"><LayoutGrid className="w-8 h-8 text-orange-400" /> خريطة الطاولات</h2>
                    <p className="text-slate-400 font-medium mt-1">يرجى تحديد طاولة العميل لإتمام عملية الطلب المحلي.</p>
                </div>
                <button onClick={onClose} className="text-white hover:bg-white/10 p-3 rounded-full transition-all relative z-10 bg-white/5"><X className="w-6 h-6"/></button>
            </div>
            
            <div className="p-8 overflow-y-auto bg-slate-50 flex-1">
                {tables.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-slate-400 py-16 text-center">
                        <Armchair className="w-20 h-20 mb-4 text-slate-300" />
                        <p className="text-xl font-bold text-slate-600 mb-2">لا توجد طاولات متاحة</p>
                        <p className="text-sm font-medium">قم بإضافة وتوزيع الطاولات من شاشة "إدارة الطاولات" أولاً.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                        {tables.map(table => (
                            <button
                                key={table.id}
                                onClick={() => {
                                    setSelectedTable(table.name);
                                    onClose();
                                }}
                                className={`p-6 rounded-3xl flex flex-col items-center justify-center gap-3 border-4 transition-all hover:scale-105 active:scale-95 ${
                                    selectedTable === table.name 
                                        ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-500/20' 
                                        : 'border-white bg-white hover:border-orange-200 shadow-sm'
                                }`}
                            >
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${selectedTable === table.name ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    <Armchair className="w-8 h-8" />
                                </div>
                                <span className={`font-black text-xl ${selectedTable === table.name ? 'text-orange-700' : 'text-slate-600'}`}>{table.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
