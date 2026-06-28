import React, { useState } from 'react';
import { Layers, Plus, Search, Edit, Trash2, Save, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Recipe, RecipeItem, Product } from '../../types';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useToast } from '../../context/ToastContext';

const BillOfMaterials: React.FC = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [recipeToDeleteId, setRecipeToDeleteId] = useState<number | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Partial<Recipe> | null>(null);

  const recipes = useLiveQuery(() => db.recipes.toArray());
  const products = useLiveQuery(() => db.products.toArray());

  const filteredRecipes = recipes?.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecipe?.name || !editingRecipe?.productId) return;

    const recipeData: any = {
      name: editingRecipe.name,
      productId: Number(editingRecipe.productId),
      items: editingRecipe.items || [],
      yieldQuantity: Number(editingRecipe.yieldQuantity) || 1,
      estimatedCost: Number(editingRecipe.estimatedCost) || 0,
      instructions: editingRecipe.instructions,
      createdAt: editingRecipe.createdAt || new Date(),
      updatedAt: new Date(),
    };

    if (editingRecipe.id) {
      await db.recipes.update(editingRecipe.id, recipeData);
      showToast('تم تعديل قائمة المواد بنجاح', 'success');
    } else {
      await db.recipes.add(recipeData);
      showToast('تم إضافة قائمة المواد بنجاح', 'success');
    }

    setIsModalOpen(false);
    setEditingRecipe(null);
  };

  const handleDelete = (id: number) => {
    setRecipeToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (recipeToDeleteId) {
      await db.recipes.delete(recipeToDeleteId);
      showToast('تم حذف قائمة المواد بنجاح', 'success');
      setRecipeToDeleteId(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  const openModal = (recipe?: Recipe) => {
    if (recipe) {
      setEditingRecipe(recipe);
    } else {
      setEditingRecipe({
        name: '',
        productId: 0,
        items: [],
        yieldQuantity: 1,
        estimatedCost: 0,
        instructions: ''
      });
    }
    setIsModalOpen(true);
  };

  const addItem = () => {
    if (editingRecipe) {
      setEditingRecipe({
        ...editingRecipe,
        items: [...(editingRecipe.items || []), { productId: 0, quantity: 1, unit: '' }]
      });
    }
  };

  const updateItem = (index: number, field: keyof RecipeItem, value: any) => {
    if (editingRecipe && editingRecipe.items) {
      const newItems = [...editingRecipe.items];
      newItems[index] = { ...newItems[index], [field]: value };
      setEditingRecipe({ ...editingRecipe, items: newItems });
    }
  };

  const removeItem = (index: number) => {
    if (editingRecipe && editingRecipe.items) {
      const newItems = [...editingRecipe.items];
      newItems.splice(index, 1);
      setEditingRecipe({ ...editingRecipe, items: newItems });
    }
  };

  const getProductName = (id: number) => {
    return products?.find(p => p.id === id)?.name || 'غير معروف';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Layers className="w-8 h-8 text-indigo-600" />
            قائمة المواد (BOM)
          </h1>
          <p className="text-slate-500 mt-1">إدارة قوائم المواد ومكونات الإنتاج</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          إضافة قائمة مواد
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="البحث في قوائم المواد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">المنتج النهائي</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">اسم القائمة</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">الكمية المنتجة</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">التكلفة التقديرية</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecipes?.map(recipe => (
                <tr key={recipe.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{getProductName(recipe.productId)}</td>
                  <td className="px-6 py-4 text-slate-600">{recipe.name}</td>
                  <td className="px-6 py-4 text-slate-600">{recipe.yieldQuantity}</td>
                  <td className="px-6 py-4 text-slate-600">{recipe.estimatedCost}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openModal(recipe)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => recipe.id && handleDelete(recipe.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRecipes?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Layers className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    لا توجد قوائم مواد مطابقة للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && editingRecipe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingRecipe.id ? 'تعديل قائمة المواد' : 'إضافة قائمة مواد جديدة'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="bom-form" onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">اسم القائمة *</label>
                    <input
                      type="text"
                      required
                      value={editingRecipe.name || ''}
                      onChange={e => setEditingRecipe({...editingRecipe, name: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">المنتج النهائي *</label>
                    <select
                      required
                      value={editingRecipe.productId || ''}
                      onChange={e => setEditingRecipe({...editingRecipe, productId: Number(e.target.value)})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">-- اختر المنتج --</option>
                      {products?.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">الكمية المنتجة (الإنتاجية) *</label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={editingRecipe.yieldQuantity || ''}
                      onChange={e => setEditingRecipe({...editingRecipe, yieldQuantity: Number(e.target.value)})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">التكلفة التقديرية</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingRecipe.estimatedCost || ''}
                      onChange={e => setEditingRecipe({...editingRecipe, estimatedCost: Number(e.target.value)})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-slate-700">المكونات (المواد الخام)</label>
                    <button 
                      type="button"
                      onClick={addItem}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة مكون
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {editingRecipe.items?.map((item, index) => (
                      <div key={index} className="flex gap-3 items-start bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="flex-1">
                          <select
                            required
                            value={item.productId || ''}
                            onChange={e => updateItem(index, 'productId', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                          >
                            <option value="">-- اختر المكون --</option>
                            {products?.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            required
                            min="0.001"
                            step="0.001"
                            placeholder="الكمية"
                            value={item.quantity || ''}
                            onChange={e => updateItem(index, 'quantity', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                          />
                        </div>
                        <div className="w-24">
                          <input
                            type="text"
                            placeholder="الوحدة"
                            value={item.unit || ''}
                            onChange={e => updateItem(index, 'unit', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {(!editingRecipe.items || editingRecipe.items.length === 0) && (
                      <div className="text-center py-4 text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                        لم يتم إضافة أي مكونات بعد
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">تعليمات التصنيع</label>
                  <textarea
                    rows={3}
                    value={editingRecipe.instructions || ''}
                    onChange={e => setEditingRecipe({...editingRecipe, instructions: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  ></textarea>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors font-medium"
              >
                إلغاء
              </button>
              <button
                type="submit"
                form="bom-form"
                className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors font-medium flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
        title="حذف قائمة المواد"
        message="هل أنت متأكد من رغبتك في حذف قائمة المواد هذه؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  );
};

export default BillOfMaterials;
