import React, { useState, useRef, useEffect } from 'react';
import { X, ScanSearch, Package, Tag, Layers } from 'lucide-react';
import { Product } from '../../types';

interface PriceCheckModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[] | undefined;
    formatCurrency: (amount: number) => string;
}

export const PriceCheckModal: React.FC<PriceCheckModalProps> = ({
    isOpen, onClose, products, formatCurrency
}) => {
    const [scanTerm, setScanTerm] = useState('');
    const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
    const [scannedVariant, setScannedVariant] = useState<any | null>(null);
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setScanTerm('');
            setScannedProduct(null);
            setScannedVariant(null);
            setError('');
            // Focus the input to be ready for barcode scanner
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleScanComplete = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setScannedProduct(null);
        setScannedVariant(null);

        if (!scanTerm.trim() || !products) return;

        let foundProduct: Product | undefined;
        let foundVariant: any | undefined;

        // Simple scale barcode matching logic (optional fallback if needed)
        let processedTerm = scanTerm;
        if (scanTerm.length === 13 && scanTerm.match(/^2[0-9]/)) {
           processedTerm = scanTerm.substring(0, 7);
        }

        for (const product of products) {
            if (product.barcode === scanTerm || product.barcode === processedTerm) {
                foundProduct = product;
                break;
            }
            if (product.variants) {
                const variant = product.variants.find(v => (v as any).barcode === scanTerm || (v as any).sku === scanTerm);
                if (variant) {
                    foundProduct = product;
                    foundVariant = variant;
                    break;
                }
            }
        }

        if (foundProduct) {
            setScannedProduct(foundProduct);
            if (foundVariant) setScannedVariant(foundVariant);
        } else {
            setError('المنتج غير موجود');
        }

        setScanTerm('');
        inputRef.current?.focus();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 fade-in-up">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col pt-2 relative">
                <button onClick={onClose} className="absolute top-4 left-4 bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-red-500 transition-colors z-10">
                    <X className="w-5 h-5" />
                </button>
                
                <div className="p-8 text-center bg-gradient-to-br from-brand-600 to-indigo-700 text-white rounded-t-xl mb-4 relative overflow-hidden">
                    <ScanSearch className="w-16 h-16 mx-auto mb-4 opacity-90 relative z-10" />
                    <h2 className="text-2xl font-black relative z-10">الاستعلام عن السعر</h2>
                    <p className="text-brand-100 mt-2 text-sm relative z-10">قم بمسح الباركود للبحث عن المنتج</p>
                    
                    {/* Decorative Background */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-300 opacity-20 rounded-full blur-2xl"></div>
                </div>

                <div className="px-6 pb-6">
                    <form onSubmit={handleScanComplete} className="mb-6">
                        <input
                            ref={inputRef}
                            type="text"
                            value={scanTerm}
                            onChange={(e) => setScanTerm(e.target.value)}
                            placeholder="امسح الباركود هنا..."
                            className="w-full text-center p-4 border-2 border-slate-200 rounded-2xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 outline-none text-lg transition-all"
                            autoFocus
                        />
                    </form>

                    <div className="min-h-[160px] flex flex-col justify-center items-center">
                        {error && (
                            <div className="text-red-500 font-bold bg-red-50 px-6 py-4 rounded-2xl w-full text-center border border-red-100">
                                {error}
                            </div>
                        )}

                        {scannedProduct && (
                            <div className="w-full animate-in fade-in zoom-in duration-300">
                                <div className="text-center mb-6">
                                    <h3 className="text-2xl font-black text-slate-800 leading-tight">
                                        {scannedProduct.name}
                                        {scannedVariant && <span className="block text-lg text-slate-500 font-bold mt-1">{scannedVariant.name}</span>}
                                    </h3>
                                    <p className="text-sm font-bold text-slate-400 mt-2 bg-slate-100 inline-block px-3 py-1 rounded-full">{scannedProduct.barcode}</p>
                                </div>
                                
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm">
                                        <div className="flex items-center gap-2 text-slate-600 font-bold">
                                            <Tag className="w-5 h-5 text-brand-500" />
                                            السعر
                                        </div>
                                        <span className="text-2xl font-black text-brand-600">
                                            {formatCurrency(scannedVariant ? scannedVariant.price : scannedProduct.price)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm">
                                        <div className="flex items-center gap-2 text-slate-600 font-bold">
                                            <Layers className="w-5 h-5 text-indigo-500" />
                                            المخزون
                                        </div>
                                        <span className={`text-xl font-black ${(scannedVariant ? scannedVariant.stock : scannedProduct.stock) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {scannedVariant ? scannedVariant.stock : scannedProduct.stock} {(scannedProduct as any).unit || ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!scannedProduct && !error && (
                            <div className="text-slate-400 text-center flex flex-col items-center">
                                <Package className="w-12 h-12 mb-2 opacity-50" />
                                <p className="font-bold">في انتظار مسح المنتج...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
