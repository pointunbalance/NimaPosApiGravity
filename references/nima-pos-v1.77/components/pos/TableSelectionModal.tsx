import React, { useState, useEffect } from 'react';
import { X, Users, CheckCircle2 } from 'lucide-react';
import { Table } from '../../types';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';

interface TableSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedTable: string | null;
    onSelectTable: (tableId: string) => void;
}

export const TableSelectionModal: React.FC<TableSelectionModalProps> = ({ isOpen, onClose, selectedTable, onSelectTable }) => {
    const tables = useLiveQuery(() => db.diningTables.toArray(), []);
    const [activeZone, setActiveZone] = useState<string>('all');

    if (!isOpen) return null;

    const zones = ['all', ...Array.from(new Set(tables?.map(t => t.zone) || []))];
    const filteredTables = activeZone === 'all' ? tables : tables?.filter(t => t.zone === activeZone);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">اختيار الطاولة</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-4 border-b border-slate-100 flex gap-2 overflow-x-auto scrollbar-hide">
                    {zones.map(zone => (
                        <button
                            key={zone}
                            onClick={() => setActiveZone(zone)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeZone === zone ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {zone === 'all' ? 'الكل' : zone}
                        </button>
                    ))}
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                    {filteredTables && filteredTables.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {filteredTables.map(table => {
                                const isSelected = selectedTable === table.id?.toString();
                                const isOccupied = table.status === 'occupied';
                                
                                return (
                                    <button
                                        key={table.id}
                                        onClick={() => {
                                            if (!isOccupied || isSelected) {
                                                onSelectTable(table.id!.toString());
                                                onClose();
                                            }
                                        }}
                                        disabled={isOccupied && !isSelected}
                                        className={`relative p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all aspect-square ${
                                            isSelected
                                                ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-md scale-105'
                                                : isOccupied
                                                ? 'border-red-200 bg-red-50 text-red-400 cursor-not-allowed opacity-70'
                                                : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:shadow-sm'
                                        }`}
                                    >
                                        {isSelected && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-brand-500" />}
                                        <span className="text-2xl font-black">{table.name}</span>
                                        <div className="flex items-center gap-1 text-xs opacity-70">
                                            <Users className="w-3 h-3" /> {table.seats || 4}
                                        </div>
                                        {isOccupied && !isSelected && (
                                            <span className="absolute bottom-2 text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">مشغولة</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <p>لا توجد طاولات في هذه المنطقة</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
