import React from 'react';
import { X, Upload, Plus, ScanBarcode, Box, Layers, Tag, Palette, DollarSign, Save } from 'lucide-react';

interface RentalItemModalProps {
    itemForm: any;
    setItemForm: React.Dispatch<React.SetStateAction<any>>;
    setIsItemModalOpen: (isOpen: boolean) => void;
    handleSaveItem: () => void;
    handleMainImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleGalleryImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeGalleryImage: (idx: number) => void;
    partInput: string;
    setPartInput: (val: string) => void;
    addPart: () => void;
    removePart: (idx: number) => void;
    generateBarcode: () => void;
    isEditing?: boolean;
}

export const RentalItemModal: React.FC<RentalItemModalProps> = ({
    itemForm, setItemForm, setIsItemModalOpen, handleSaveItem, handleMainImageUpload,
    handleGalleryImageUpload, removeGalleryImage, partInput, setPartInput, addPart,
    removePart, generateBarcode, isEditing
}) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-slate-50">
                    <div>
                        <h3 className="font-extrabold text-xl text-slate-800">{isEditing ? 'تعديل الصنف' : 'إضافة أصل جديد'}</h3>
                        <p className="text-xs text-slate-500 font-medium">تسجيل قطعة للتأجير في المخزون</p>
                    </div>
                    <button onClick={() => setIsItemModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X className="w-6 h-6"/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="flex flex-col md:flex-row gap-8">
                        
                        {/* Left: Images & Identity */}
                        <div className="w-full md:w-1/3 flex flex-col gap-4">
                            <label className="block text-xs font-bold text-slate-500 mb-1">الصورة الرئيسية</label>
                            <div className="aspect-square bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center relative overflow-hidden group hover:border-indigo-400 transition-colors cursor-pointer">
                                {itemForm.image ? (
                                    <img src={itemForm.image} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center text-slate-400">
                                        <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <span className="text-xs font-bold">صورة رئيسية</span>
                                    </div>
                                )}
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleMainImageUpload} />
                            </div>
                            
                            <label className="block text-xs font-bold text-slate-500 mt-2 mb-1">صور إضافية (المعرض)</label>
                            <div className="grid grid-cols-3 gap-2">
                                {itemForm.images.map((img: string, idx: number) => (
                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                                        <img src={img} className="w-full h-full object-cover" />
                                        <button onClick={() => removeGalleryImage(idx)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100"><X className="w-3 h-3"/></button>
                                    </div>
                                ))}
                                <label className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-indigo-50">
                                    <Plus className="w-4 h-4 text-slate-400" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleGalleryImageUpload} />
                                </label>
                            </div>

                            <div className="space-y-2 mt-4">
                                <label className="block text-xs font-bold text-slate-500 mb-1">الباركود (Barcode)</label>
                                <div className="relative">
                                    <ScanBarcode className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none" 
                                        placeholder="Scan or Generate"
                                        value={itemForm.barcode}
                                        onChange={e => setItemForm({...itemForm, barcode: e.target.value})}
                                    />
                                    <button onClick={generateBarcode} className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] bg-white border px-2 py-0.5 rounded text-indigo-600 hover:bg-indigo-50">توليد</button>
                                </div>
                            </div>
                        </div>

                        {/* Right: Details Form */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم الصنف <span className="text-red-500">*</span></label>
                                <input 
                                    className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:bg-white outline-none font-bold" 
                                    placeholder="مثال: بدلة عريس سوداء إيطالي"
                                    value={itemForm.name}
                                    onChange={e => setItemForm({...itemForm, name: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">التصنيف</label>
                                    <select 
                                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-medium text-sm"
                                        value={itemForm.category}
                                        onChange={e => setItemForm({...itemForm, category: e.target.value})}
                                    >
                                        <option value="بدل رجالي">بدل رجالي (Suits)</option>
                                        <option value="فساتين">فساتين (Dresses)</option>
                                        <option value="أطفال">أطفال (Kids)</option>
                                        <option value="اكسسوارات">اكسسوارات</option>
                                        <option value="أحذية">أحذية</option>
                                        <option value="أخرى">أخرى</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">الكمية بالمخزن</label>
                                    <div className="relative">
                                        <Box className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input 
                                            type="number" onFocus={(e) => e.target.select()} 
                                            className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-center"
                                            value={itemForm.stock}
                                            onChange={e => setItemForm({...itemForm, stock: Number(e.target.value)})}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Parts Section */}
                            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                                <label className="block text-xs font-bold text-orange-800 mb-2 flex items-center gap-2">
                                    <Layers className="w-4 h-4" />
                                    مكونات القطعة (Parts Included)
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <input 
                                        className="flex-1 p-2 bg-white border border-orange-200 rounded-lg text-sm outline-none"
                                        placeholder="أضف قطعة (جاكيت، بنطلون...)"
                                        value={partInput}
                                        onChange={e => setPartInput(e.target.value)}
                                        onKeyDown={e => {if(e.key === 'Enter') addPart()}}
                                    />
                                    <button onClick={addPart} className="bg-orange-500 text-white px-3 rounded-lg font-bold hover:bg-orange-600"><Plus className="w-4 h-4"/></button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {itemForm.parts.map((p: string, idx: number) => (
                                        <span key={idx} className="bg-white text-orange-700 px-2 py-1 rounded border border-orange-200 text-xs font-bold flex items-center gap-1">
                                            {p}
                                            <button onClick={() => removePart(idx)}><X className="w-3 h-3 hover:text-red-500"/></button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Tag className="w-3 h-3"/> المقاس (Size)</label>
                                    <input 
                                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm"
                                        placeholder="42, 44, XL..."
                                        value={itemForm.size}
                                        onChange={e => setItemForm({...itemForm, size: e.target.value})}
                                        list="sizes"
                                    />
                                    <datalist id="sizes">
                                        {['40', '42', '44', '46', '48', '50', '52', '54', 'S', 'M', 'L', 'XL', 'XXL'].map(s => <option key={s} value={s} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Palette className="w-3 h-3"/> اللون</label>
                                    <input 
                                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm"
                                        placeholder="أسود، كحلي..."
                                        value={itemForm.color}
                                        onChange={e => setItemForm({...itemForm, color: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                <h4 className="font-bold text-slate-700 text-xs flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-emerald-600" /> البيانات المالية
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">سعر التأجير (اليومي)</label>
                                        <input 
                                            type="number" onFocus={(e) => e.target.select()}
                                            className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none font-bold text-emerald-600"
                                            value={itemForm.price}
                                            onChange={e => setItemForm({...itemForm, price: Number(e.target.value)})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">القيمة الرأسمالية (Asset Value)</label>
                                        <input 
                                            type="number" onFocus={(e) => e.target.select()}
                                            className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none font-bold text-slate-700"
                                            value={itemForm.costPrice}
                                            onChange={e => setItemForm({...itemForm, costPrice: Number(e.target.value)})}
                                            placeholder="سعر الشراء"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">وصف إضافي / ملاحظات</label>
                                <textarea 
                                    rows={2}
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm resize-none"
                                    placeholder="حالة الصنف، ملحقات..."
                                    value={itemForm.description}
                                    onChange={e => setItemForm({...itemForm, description: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
                    <button onClick={() => setIsItemModalOpen(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors">إلغاء</button>
                    <button onClick={handleSaveItem} className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors flex items-center justify-center gap-2">
                        <Save className="w-5 h-5" /> حفظ الصنف
                    </button>
                </div>
            </div>
        </div>
    );
};
