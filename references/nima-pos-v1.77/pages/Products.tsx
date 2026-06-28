import React from 'react';
import { useToast } from '../context/ToastContext';
import ProductsHeader from '../components/products/ProductsHeader';
import ProductsStats from '../components/products/ProductsStats';
import ProductsList from '../components/products/ProductsList';
import ProductFormModal from '../components/products/ProductFormModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useProductsData } from '../components/products/useProductsData';
import { useProductsActions } from '../components/products/useProductsActions';

const Products: React.FC = () => {
  const { success, error } = useToast();

  const pData = useProductsData();
  const pActions = useProductsActions(
    pData.getFilteredProducts,
    pData.currencyCode,
    success,
    error
  );

  return (
    <div className="p-8 h-full overflow-y-auto bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 font-['Tajawal']" dir="rtl">
      <ProductsHeader 
        onOpenModal={() => pActions.openModal()} 
        onExport={() => pActions.handleExport(pData.filterCategory)}
        onImport={pActions.handleImport}
        onPrintBarcodes={pActions.handlePrintBarcodes}
        onPrintList={() => pActions.handlePrintList(pData.filterCategory, pData.filterStock)}
      />

      <ProductsStats 
        stats={pData.productsStats} 
        formatCurrency={pData.formatCurrency}
      />

      <ProductsList 
        productsQuery={pData.productsQuery || []}
        viewMode={pData.viewMode}
        setViewMode={pData.setViewMode}
        searchTerm={pData.searchTerm}
        setSearchTerm={pData.setSearchTerm}
        filterCategory={pData.filterCategory}
        setFilterCategory={pData.setFilterCategory}
        filterStock={pData.filterStock}
        setFilterStock={pData.setFilterStock}
        uniqueCategories={pData.uniqueCategories}
        onDuplicate={pActions.duplicateProduct}
        onEdit={pActions.openModal}
        onDelete={(id) => pActions.setProductToDeleteId(id)}
        loadMore={pData.loadMore}
        hasMore={(pData.productsQuery?.length || 0) < pData.totalProducts}
      />

      {pActions.isModalOpen && (
        <ProductFormModal 
          isOpen={pActions.isModalOpen}
          onClose={pActions.closeModal}
          product={pActions.editingProduct}
          uniqueCategories={pData.uniqueCategories}
          simpleProducts={pData.simpleProducts}
          onSave={pActions.handleSaveProduct}
        />
      )}

      <ConfirmModal
        isOpen={pActions.productToDeleteId !== null}
        title="حذف المنتج"
        message="هل أنت متأكد من حذف هذا المنتج؟ سيتم حذفه بالكامل من قاعدة البيانات والمخزن ولا يمكن التراجع عن هذا الإجراء."
        onConfirm={() => {
          if (pActions.productToDeleteId !== null) {
            pActions.executeDeleteProduct(pActions.productToDeleteId);
          }
        }}
        onCancel={() => pActions.setProductToDeleteId(null)}
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  );
};

export default Products;
