import React from 'react';
import { Product } from '../../types';
import { ScanBarcode } from 'lucide-react';

interface SerialScanModalProps {
    isOpen: boolean;
    onClose: () => void;
    productForSerialScan: Product | null;
    serialScanInput: string;
    setSerialScanInput: (val: string) => void;
    availableSerials: any[];
    handleSerialConfirm: (serial: string) => void;
}

export const SerialScanModal: React.FC<SerialScanModalProps> = ({
    isOpen, onClose,
    productForSerialScan,
    serialScanInput, setSerialScanInput,
    availableSerials,
    handleSerialConfirm
}) => {
    if (!isOpen || !productForSerialScan) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col max-h-[80vh]">
                <h3 className="font-bold text-xl mb-4 text-center text-gray-800">اختر الرقم التسلسلي</h3>
                <p className="text-center text-gray-500 mb-4 text-sm">{productForSerialScan.name}</p>
                
                <div className="mb-4 relative">
                    <ScanBarcode className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                      placeholder="Scan IMEI..."
                      value={serialScanInput}
                      onChange={e => setSerialScanInput(e.target.value)}
                      autoFocus
                    />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                    {availableSerials
                      .filter(s => s.serialNumber.includes(serialScanInput))
                      .map((s, idx) => (
                        <button 
                          key={idx}
                          onClick={() => handleSerialConfirm(s.serialNumber)}
                          className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-xl transition-all group"
                        >
                            <span className="font-mono text-sm font-bold text-gray-700">{s.serialNumber}</span>
                            <span className="text-xs text-gray-400">{new Date(s.dateAdded).toLocaleDateString()}</span>
                        </button>
                    ))}
                    {availableSerials.length === 0 && (
                        <div className="text-center py-8 text-gray-400">لا توجد أرقام متاحة في هذا المخزن</div>
                    )}
                </div>
                <button onClick={onClose} className="w-full mt-4 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl text-sm">إلغاء (ESC)</button>
            </div>
        </div>
    );
};
