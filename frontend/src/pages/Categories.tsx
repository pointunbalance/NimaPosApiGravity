import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Category } from '../types';

import CategoriesHeader from '../components/categories/CategoriesHeader';
import CategoriesToolbar from '../components/categories/CategoriesToolbar';
import CategoriesGrid from '../components/categories/CategoriesGrid';
import CategoryFormModal from '../components/categories/CategoryFormModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useToast } from '../context/ToastContext';

const Categories: React.FC = () => {
  const { success, error: showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'count-desc' | 'count-asc'>('name-asc');
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean; title: string; message: string; onConfirm: () => void} | null>(null);
  
  // Predefined Colors
  const colors = [
      '#6366f1', '#ef4444', '#10b981', '#f59e0b', '#ec4899', 
      '#8b5cf6', '#3b82f6', '#64748b', '#f97316', '#14b8a6',
      '#84cc16', '#a855f7', '#06b6d4', '#f43f5e', '#22c55e',
      '#ef0000', '#000000', '#795548', '#9c27b0', '#3f51b5', 
      '#00bcd4', '#009688', '#cddc39', '#ffc107', '#ff5722', 
      '#607d8b', '#e91e63', '#9e9e9e', '#4caf50', '#8bc34a', 
      '#03a9f4', '#00e5ff', '#ff1744', '#d50000', '#aa00ff'
  ];

  const categories = useLiveQuery(() => db.categories.toArray(), []);
  const products = useLiveQuery(() => db.products.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toCollection().first(), []);
  const currencyCode = settings?.currencyCode || 'EGP';

  // Calculate Product Counts and Values
  const categoryStats = useMemo(() => {
      const stats: Record<string, { count: number, value: number }> = {};
      products?.forEach(p => {
          if (p.category) {
              const trimmedCat = p.category.trim();
              if (!stats[trimmedCat]) stats[trimmedCat] = { count: 0, value: 0 };
              stats[trimmedCat].count += 1;
              stats[trimmedCat].value += (p.price * p.stock);
          }
      });
      return stats;
  }, [products]);
  
  const processedCategories = useMemo(() => {
      if (!categories) return [];
      
      const seen = new Set<string>();
      const uniqueCats: Category[] = [];
      categories.forEach(c => {
         const nameTrim = (c.name || '').trim();
         if (nameTrim && !seen.has(nameTrim)) {
             seen.add(nameTrim);
             uniqueCats.push(c);
         }
      });

      let filtered = uniqueCats.filter(c => 
          c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      filtered.sort((a, b) => {
          const countA = categoryStats[a.name.trim()]?.count || 0;
          const countB = categoryStats[b.name.trim()]?.count || 0;
          
          switch (sortBy) {
              case 'name-asc': return a.name.trim().localeCompare(b.name.trim(), 'ar');
              case 'name-desc': return b.name.trim().localeCompare(a.name.trim(), 'ar');
              case 'count-desc': return countB - countA;
              case 'count-asc': return countA - countB;
              default: return 0;
          }
      });

      return filtered;
  }, [categories, searchTerm, sortBy, categoryStats]);

  // Database Auto-Deduplication effect to automatically clean duplicates from DB
  useEffect(() => {
    const runDeduplication = async () => {
      try {
        const allCats = await db.categories.toArray();
        const seen = new Map<string, Category>();
        const duplicatesToDelete: number[] = [];
        const productsToUpdate: { productId: number, newCategory: string }[] = [];

        for (const cat of allCats) {
          const trimmed = (cat.name || '').trim();
          if (!trimmed) {
            if (cat.id) duplicatesToDelete.push(cat.id);
            continue;
          }

          if (seen.has(trimmed)) {
            const originalCat = seen.get(trimmed)!;
            if (cat.id) {
              duplicatesToDelete.push(cat.id);
              const duplicateProducts = await db.products.where('category').equals(cat.name).toArray();
              duplicateProducts.forEach(p => {
                if (p.id) {
                  productsToUpdate.push({ productId: p.id, newCategory: originalCat.name });
                }
              });
            }
          } else {
            seen.set(trimmed, cat);
          }
        }

        if (duplicatesToDelete.length > 0 || productsToUpdate.length > 0) {
          console.log(`[Deduplication] Merging ${duplicatesToDelete.length} duplicate categories...`);
          await db.transaction('rw', [db.categories, db.products], async () => {
            for (const item of productsToUpdate) {
              await db.products.update(item.productId, { category: item.newCategory });
            }
            for (const id of duplicatesToDelete) {
              await db.categories.delete(id);
            }
          });
        }
      } catch (err) {
        console.error('Failed to run category deduplication:', err);
      }
    };

    runDeduplication();
  }, [categories]);

  // --- Handlers ---

  const handleSaveCategory = async (data: Partial<Category>) => {
    try {
      if (data.name) {
          data.name = data.name.trim();
      }
      if (editingCategory?.id) {
        // Update category name in products if changed
        if (editingCategory.name.trim() !== data.name) {
            const productsToUpdate = products?.filter(p => (p.category || '').trim() === editingCategory.name.trim());
            if (productsToUpdate) {
                await Promise.all(productsToUpdate.map(p => db.products.update(p.id!, { category: data.name })));
            }
        }
        await db.categories.update(editingCategory.id, data);
        success('تم تحديث التصنيف بنجاح');
      } else {
        const trimmedName = (data.name || '').trim();
        const exists = await db.categories.filter(c => c.name.trim() === trimmedName).first();
        if (exists) {
            showError("التصنيف موجود بالفعل باسم مشابه!");
            return;
        }
        await db.categories.add({
            ...data,
            name: trimmedName
        } as Category);
        success('تم إضافة التصنيف بنجاح');
      }
      closeModal();
    } catch (error) {
      console.error("Error saving category", error);
    }
  };

  const deleteCategory = (id: number, name: string) => {
    const count = categoryStats[name.trim()]?.count || 0;
    if (count > 0) {
        showError(`لا يمكن حذف التصنيف "${name}" لأنه يحتوي على ${count} منتج. يرجى نقل المنتجات أو حذفها أولاً.`);
        return;
    }

    setConfirmConfig({
      isOpen: true,
      title: 'حذف التصنيف',
      message: `هل أنت متأكد من حذف التصنيف "${name}"؟ سيتم حذفه من قاعدة البيانات نهائياً.`,
      onConfirm: async () => {
        await db.categories.delete(id);
        success('تم حذف التصنيف بنجاح');
        setConfirmConfig(null);
      }
    });
  };

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
    } else {
      setEditingCategory(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: currencyCode }).format(amount);
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 font-['Tajawal'] min-h-screen rounded-2xl" dir="rtl">
      <CategoriesHeader onOpenModal={() => openModal()} />

      <CategoriesToolbar 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      <CategoriesGrid 
        processedCategories={processedCategories}
        categoryStats={categoryStats}
        searchTerm={searchTerm}
        formatCurrency={formatCurrency}
        onOpenModal={openModal}
        onDeleteCategory={deleteCategory}
      />

      <CategoryFormModal 
        isModalOpen={isModalOpen}
        closeModal={closeModal}
        category={editingCategory}
        colors={colors}
        onSave={handleSaveCategory}
      />

      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
          confirmText="تأكيد"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
};

export default Categories;
