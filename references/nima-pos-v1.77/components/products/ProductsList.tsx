import React from 'react';
import { Package, Star, ScanBarcode, Copy, Edit2, Trash2, Search, List, Grid } from 'lucide-react';
import { Product } from '../../types';
import JsBarcode from 'jsbarcode';
import ProductThumb from './ProductThumb';
import { TableVirtuoso, VirtuosoGrid } from 'react-virtuoso';

interface ProductsListProps {
  productsQuery: Product[];
  viewMode: 'list' | 'grid';
  setViewMode: (mode: 'list' | 'grid') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  filterStock: 'all' | 'low' | 'out';
  setFilterStock: (stock: 'all' | 'low' | 'out') => void;
  uniqueCategories: string[];
  onDuplicate: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
  loadMore: () => void;
  hasMore: boolean;
}

const ProductsList: React.FC<ProductsListProps> = ({
  productsQuery,
  viewMode,
  setViewMode,
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
  filterStock,
  setFilterStock,
  uniqueCategories,
  onDuplicate,
  onEdit,
  onDelete,
  loadMore,
  hasMore
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-180px)]">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row gap-4 justify-between items-center shrink-0">
        <div className="relative flex-1 w-full lg:max-w-xl">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="بحث باسم المنتج، الباركود..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">جميع الفئات</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value as any)}
            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">حالة المخزون (الكل)</option>
            <option value="low">مخزون منخفض</option>
            <option value="out">نفذت الكمية</option>
          </select>

          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shrink-0 mr-auto lg:mr-0">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* View Render */}
      <div className="bg-slate-50/30 flex-1 overflow-hidden relative">
        {!productsQuery || productsQuery.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Package className="w-16 h-16 opacity-20 mb-4" />
            <p className="text-lg font-bold">لا توجد منتجات مطابقة</p>
          </div>
        ) : viewMode === 'list' ? (
          <TableVirtuoso
            data={productsQuery}
            endReached={() => {
              if (hasMore) loadMore();
            }}
            overscan={200}
            className="w-full h-full"
            components={{
              Table: ({ style, ...props }) => (
                <table {...props} style={{ ...style, width: '100%', textAlign: 'right', borderCollapse: 'collapse' }} className="text-sm" />
              ),
              TableHead: React.forwardRef((props, ref) => (
                <thead {...props} ref={ref} className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0 z-10 shadow-sm" />
              )),
              TableRow: ({ item, ...props }) => (
                <tr {...props} className="hover:bg-slate-50 transition-colors group border-b border-slate-100" />
              ),
              TableBody: React.forwardRef((props, ref) => (
                <tbody {...props} ref={ref} className="divide-y divide-slate-100 bg-white" />
              )),
            }}
            fixedHeaderContent={() => (
              <tr>
                <th className="px-6 py-4 bg-slate-50">المنتج</th>
                <th className="px-6 py-4 bg-slate-50">التتبع</th>
                <th className="px-6 py-4 bg-slate-50">التكلفة</th>
                <th className="px-6 py-4 bg-slate-50">السعر</th>
                <th className="px-6 py-4 bg-slate-50">المخزون</th>
                <th className="px-6 py-4 bg-slate-50 text-center">إجراءات</th>
              </tr>
            )}
            itemContent={(index, product) => (
              <>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                      <ProductThumb src={product.image} images={product.images} productName={product.name} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 flex items-center gap-2">
                        {product.name}
                        {!!product.isFavorite && (
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        )}
                      </p>
                      <div className="flex flex-wrap gap-1.5 items-center mt-1">
                        <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {product.category}
                        </span>
                        {product.brand && (
                          <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-black">
                            {product.brand}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3">
                  {product.trackSerial ? (
                    <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100 font-bold flex items-center gap-1 w-fit">
                      <ScanBarcode className="w-3 h-3" /> IMEI/SN
                    </span>
                  ) : product.units && product.units.length > 0 ? (
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 font-bold">
                      {product.units.length + 1} وحدات
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">عادي</span>
                  )}
                </td>
                <td className="px-6 py-3 text-slate-500 font-medium">
                  <div>
                    <span className="block text-slate-800 font-bold" title="سعر الشراء">
                      {product.costPrice?.toLocaleString() || 0}
                    </span>
                    {product.averageCost !== undefined && product.averageCost > 0 && (
                      <span className="block text-xs text-slate-400 font-normal" title="متوسط التكلفة">
                        متوسط: {product.averageCost.toLocaleString()}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-3 font-bold text-slate-800">
                  {product.price.toLocaleString()}
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`px-2.5 py-1 rounded-md font-bold text-xs ${
                      product.stock > (product.alertThreshold || 5)
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center justify-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    {product.barcode && (
                      <button
                        onClick={() => {
                          const canvas = document.createElement('canvas');
                          try {
                            JsBarcode(canvas, product.barcode!, {
                              format: "CODE128",
                              width: 2,
                              height: 50,
                              displayValue: true
                            });
                          } catch (err) {
                            return;
                          }
                          const printWindow = window.open('', '_blank');
                          if (printWindow) {
                            printWindow.document.write(`
                              <html>
                                <head>
                                  <title>Print Barcode</title>
                                  <style>
                                    body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; }
                                    .label { text-align: center; border: 1px solid #ccc; padding: 20px; border-radius: 8px; }
                                    .name { font-weight: bold; margin-bottom: 10px; font-size: 18px; }
                                    .price { font-size: 16px; margin-top: 10px; }
                                  </style>
                                </head>
                                <body>
                                  <div class="label">
                                    <div class="name">${product.name}</div>
                                    <img src="${canvas.toDataURL()}" alt="${product.barcode}" />
                                    <div class="price">${product.price} ر.س</div>
                                  </div>
                                  <script>
                                    setTimeout(() => { window.print(); window.close(); }, 500);
                                  </script>
                                </body>
                              </html>
                            `);
                            printWindow.document.close();
                          }
                        }}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="طباعة الباركود"
                      >
                        <ScanBarcode className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onDuplicate(product)}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="تكرار"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(product)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="تعديل"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(product.id!)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </>
            )}
          />
        ) : (
          <VirtuosoGrid
            data={productsQuery}
            endReached={() => {
              if (hasMore) loadMore();
            }}
            overscan={200}
            listClassName="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4"
            itemClassName="flex"
            itemContent={(index, product) => (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow w-full group relative">
                <div className="absolute top-2 left-2 flex flex-col gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10">
                    {product.barcode && (
                      <button
                        onClick={() => {
                          const canvas = document.createElement('canvas');
                          try {
                            JsBarcode(canvas, product.barcode!, {
                              format: "CODE128",
                              width: 2,
                              height: 50,
                              displayValue: true
                            });
                          } catch (err) {
                            return;
                          }
                          const printWindow = window.open('', '_blank');
                          if (printWindow) {
                            printWindow.document.write(`
                              <html>
                                <head>
                                  <title>Print Barcode</title>
                                  <style>
                                    body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; }
                                    .label { text-align: center; border: 1px solid #ccc; padding: 20px; border-radius: 8px; }
                                    .name { font-weight: bold; margin-bottom: 10px; font-size: 18px; }
                                    .price { font-size: 16px; margin-top: 10px; }
                                  </style>
                                </head>
                                <body>
                                  <div class="label">
                                    <div class="name">${product.name}</div>
                                    <img src="${canvas.toDataURL()}" alt="${product.barcode}" />
                                    <div class="price">${product.price} ر.س</div>
                                  </div>
                                  <script>
                                    setTimeout(() => { window.print(); window.close(); }, 500);
                                  </script>
                                </body>
                              </html>
                            `);
                            printWindow.document.close();
                          }
                        }}
                        className="p-1.5 bg-white/90 backdrop-blur text-purple-600 hover:bg-purple-50 rounded-lg shadow-sm"
                        title="طباعة الباركود"
                      >
                        <ScanBarcode className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => onDuplicate(product)} className="p-1.5 bg-white/90 backdrop-blur text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" title="تكرار">
                        <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => onEdit(product)} className="p-1.5 bg-white/90 backdrop-blur text-blue-600 hover:bg-blue-50 rounded-lg shadow-sm" title="تعديل">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(product.id!)} className="p-1.5 bg-white/90 backdrop-blur text-red-600 hover:bg-red-50 rounded-lg shadow-sm" title="حذف">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden border border-slate-100 relative">
                  <ProductThumb src={product.image} images={product.images} productName={product.name} />
                  {product.trackSerial && (
                      <div className="absolute bottom-2 right-2 bg-purple-100 text-purple-700 p-1 rounded-md shadow-sm">
                          <ScanBarcode className="w-4 h-4" />
                      </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col">
                  <h4 className="font-bold text-slate-800 line-clamp-2 mb-1">{product.name}</h4>
                  <div className="flex flex-wrap gap-1 shadow-sm items-center mb-2">
                    <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{product.category}</span>
                    {product.brand && (
                      <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-black">{product.brand}</span>
                    )}
                  </div>
                  <div className="mt-auto flex items-end justify-between">
                    <div>
                        <p className="text-xs text-slate-400 mb-0.5">السعر</p>
                        <p className="font-black text-indigo-600">{product.price.toLocaleString()}</p>
                    </div>
                    <div className="text-left">
                        <p className="text-xs text-slate-400 mb-0.5">المخزون</p>
                        <span className={`px-2 py-0.5 rounded font-bold text-xs ${product.stock > (product.alertThreshold || 5) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {product.stock}
                        </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default ProductsList;
