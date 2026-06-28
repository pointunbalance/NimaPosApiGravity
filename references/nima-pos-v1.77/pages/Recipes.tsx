import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Recipe, RecipeItem, Product } from '../types';
import { ChefHat, Search, Plus, Edit2, Trash2, Save, X, Utensils } from 'lucide-react';

export const Recipes: React.FC = () => {
  const recipes = useLiveQuery(() => db.recipes.toArray(), []);
  const products = useLiveQuery(() => db.products.toArray(), []);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  
  const [formData, setFormData] = useState<Partial<Recipe>>({
    name: '',
    productId: 0,
    yieldQuantity: 1,
    estimatedCost: 0,
    instructions: '',
    items: []
  });

  const [newItem, setNewItem] = useState<RecipeItem>({ productId: 0, quantity: 1, unit: '' });

  const filteredRecipes = recipes?.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    products?.find(p => p.id === r.productId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || formData.items?.length === 0) {
      alert('الرجاء اختيار المنتج النهائي وإضافة مكون واحد على الأقل');
      return;
    }

    if (editingRecipe && editingRecipe.id) {
      await db.recipes.update(editingRecipe.id, {
        ...formData,
        updatedAt: new Date()
      });
    } else {
      await db.recipes.add({
        ...formData as Recipe,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    setIsModalOpen(false);
    setEditingRecipe(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      productId: 0,
      yieldQuantity: 1,
      estimatedCost: 0,
      instructions: '',
      items: []
    });
    setNewItem({ productId: 0, quantity: 1, unit: '' });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الوصفة؟')) {
      await db.recipes.delete(id);
    }
  };

  const handleAddItem = () => {
    if (newItem.productId && newItem.quantity > 0) {
      setFormData(prev => ({
        ...prev,
        items: [...(prev.items || []), newItem]
      }));
      setNewItem({ productId: 0, quantity: 1, unit: '' });
    }
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index)
    }));
  };

  const getProductName = (id: number) => products?.find(p => p.id === id)?.name || 'منتج غير معروف';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-indigo-500" />
            الوصفات ومكونات الإنتاج (BOM)
          </h1>
          <p className="text-slate-500 text-sm mt-1">إدارة مكونات الأصناف وعمليات التصنيع</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          إضافة وصفة جديدة
        </button>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="البحث عن وصفة أو منتج..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 "
          />
        </div>
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <Utensils className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">لا توجد وصفات مسجلة</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            قم بربط الأصناف المباعة بمكوناتها الخام لخصمها من المخزون تلقائياً عند البيع أو التصنيع.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map(recipe => (
            <div key={recipe.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{recipe.name}</h3>
                  <p className="text-sm text-indigo-600 font-medium mt-1">
                    المنتج: {getProductName(recipe.productId)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setEditingRecipe(recipe);
                      setFormData(recipe);
                      setIsModalOpen(true);
                    }}
                    className="text-slate-400 hover:text-indigo-600"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(recipe.id!)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="p-4 flex-1">
                <div className="flex justify-between text-sm text-slate-500 mb-3">
                  <span>الكمية الناتجة: {recipe.yieldQuantity}</span>
                  <span>التكلفة التقديرية: {recipe.estimatedCost || 0}</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">المكونات:</h4>
                <ul className="space-y-2">
                  {recipe.items.map((item, idx) => (
                    <li key={idx} className="text-sm flex justify-between items-center bg-slate-50 p-2 rounded">
                      <span className="text-slate-700">{getProductName(item.productId)}</span>
                      <span className="text-slate-500 font-medium">{item.quantity} {item.unit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900">
                {editingRecipe ? 'تعديل الوصفة' : 'إضافة وصفة جديدة'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700 ">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">اسم الوصفة *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 "
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">المنتج النهائي *</label>
                  <select
                    required
                    value={formData.productId || ''}
                    onChange={e => setFormData({...formData, productId: parseInt(e.target.value)})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 "
                  >
                    <option value="">اختر المنتج...</option>
                    {products?.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الكمية الناتجة *</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={formData.yieldQuantity || 1}
                    onChange={e => setFormData({...formData, yieldQuantity: parseFloat(e.target.value)})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 "
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">التكلفة التقديرية</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.estimatedCost || 0}
                    onChange={e => setFormData({...formData, estimatedCost: parseFloat(e.target.value)})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 "
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <h3 className="font-bold text-slate-800 mb-4">مكونات الوصفة (المواد الخام)</h3>
                
                <div className="flex gap-2 mb-4">
                  <select
                    value={newItem.productId || ''}
                    onChange={e => setNewItem({...newItem, productId: parseInt(e.target.value)})}
                    className="flex-1 p-2 border rounded-lg "
                  >
                    <option value="">اختر المكون...</option>
                    {products?.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="الكمية"
                    min="0.01"
                    step="0.01"
                    value={newItem.quantity || ''}
                    onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value)})}
                    className="w-24 p-2 border rounded-lg "
                  />
                  <input
                    type="text"
                    placeholder="الوحدة (اختياري)"
                    value={newItem.unit || ''}
                    onChange={e => setNewItem({...newItem, unit: e.target.value})}
                    className="w-32 p-2 border rounded-lg "
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!newItem.productId || !newItem.quantity}
                    className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 disabled:opacity-50 "
                  >
                    إضافة
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-slate-800">{getProductName(item.productId)}</span>
                        <span className="text-slate-500">{item.quantity} {item.unit}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {(!formData.items || formData.items.length === 0) && (
                    <p className="text-center text-slate-500 py-4">لم يتم إضافة مكونات بعد</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">تعليمات التحضير / التصنيع</label>
                <textarea
                  rows={3}
                  value={formData.instructions || ''}
                  onChange={e => setFormData({...formData, instructions: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 "
                  placeholder="خطوات العمل..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg "
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Save size={20} />
                  حفظ الوصفة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recipes;
