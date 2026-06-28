import { useState } from 'react';
import { db } from '../../db';
import { Product } from '../../types';
import { exportToExcel, importFromExcel } from '../../utils/excel';

export const useProductsActions = (
  getFilteredProducts: (term?: string, cat?: string, stock?: 'all' | 'low' | 'out') => Promise<Product[]>,
  currencyCode: string,
  success: (msg: string) => void,
  error: (msg: string) => void
) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDeleteId, setProductToDeleteId] = useState<number | null>(null);

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
    } else {
      setEditingProduct(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = async (data: any, closeAfter: boolean = true) => {
    try {
      if (data.barcode) {
        const existingCode = await db.products.where('barcode').equals(data.barcode).first();
        if (existingCode && existingCode.id !== editingProduct?.id) {
          error("رمز الباركود موجود مسبقاً لمنتج آخر.");
          return;
        }
      }

      // Check unit barcodes
      if (data.units && data.units.length > 0) {
        for (const u of data.units) {
          if (u.barcode) {
            const productsWithUnitBarcode = await db.products.filter(p => p.barcode === u.barcode || (p.units && p.units.some(pu => pu.barcode === u.barcode))).toArray();
            const otherDocs = productsWithUnitBarcode.filter(p => p.id !== editingProduct?.id);
            if (otherDocs.length > 0) {
              error(`رمز الباركود (${u.barcode}) للوحدة موجود مسبقاً.`);
              return;
            }
          }
        }
      }

      await (db as any).transaction('rw', db.products, db.warehouses, db.inventory, db.productPriceHistory, async () => {
        if (editingProduct?.id) {
          // Price History Check
          if (data.price !== editingProduct.price || data.costPrice !== editingProduct.costPrice) {
            await db.productPriceHistory.add({
              productId: editingProduct.id,
              oldPrice: editingProduct.price || 0,
              newPrice: data.price || 0,
              oldCost: editingProduct.costPrice || 0,
              newCost: data.costPrice || 0,
              changeDate: new Date(),
              changedBy: 'النظام'
            });
          }
          await db.products.update(editingProduct.id, data);
        } else {
          const newProductId = await db.products.add(data as Product);
          
          if (data.type === 'simple') {
            const mainWarehouse = await db.warehouses.filter(w => w.isMain === true).first();
            if (mainWarehouse && mainWarehouse.id) {
              await db.inventory.add({
                warehouseId: mainWarehouse.id,
                productId: newProductId as number,
                quantity: data.stock || 0
              });
            }
          }
        }
      });
      success('تم حفظ المنتج بنجاح');
      if (closeAfter) {
        closeModal();
      } else {
        setEditingProduct(null);
      }
    } catch (e) {
      console.error("Error saving product", e);
      error("حدث خطأ أثناء الحفظ");
    }
  };

  const executeDeleteProduct = async (id: number) => {
    try {
      await (db as any).transaction('rw', db.products, db.inventory, async () => {
        await db.inventory.where('productId').equals(id).delete();
        await db.products.delete(id);
      });
      success('تم حذف المنتج بنجاح');
    } catch (e) {
      console.error(e);
      error('حدث خطأ أثناء الحذف');
    } finally {
      setProductToDeleteId(null);
    }
  };

  const duplicateProduct = (product: Product) => {
    const { id, ...rest } = product;
    setEditingProduct({ 
      ...rest, 
      name: `${rest.name} (نسخة)`,
      barcode: '' 
    } as Product);
    setIsModalOpen(true);
  };

  const handleExport = async (filterCategory: string) => {
    try {
      const filteredProducts = await getFilteredProducts(undefined, filterCategory);

      const exportData = filteredProducts.map(p => ({
        ID: p.id,
        Name: p.name,
        Barcode: p.barcode || '',
        Price: p.price,
        CostPrice: p.costPrice,
        Category: p.category || '',
        Stock: p.stock,
        AlertThreshold: p.alertThreshold || 5,
        Type: p.type || 'simple',
        TrackSerial: p.trackSerial ? 'Yes' : 'No'
      }));
      exportToExcel(exportData, `Products_${filterCategory}_${new Date().toISOString().split('T')[0]}`);
      success('تم تصدير المنتجات بنجاح');
    } catch (e) {
      console.error(e);
      error('حدث خطأ أثناء التصدير');
    }
  };

  const handlePrintList = async (filterCategory: string, filterStock: 'all' | 'low' | 'out') => {
    try {
      const filteredProducts = await getFilteredProducts(undefined, filterCategory, filterStock);

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        error('يرجى السماح بالنوافذ المنبثقة لطباعة القائمة.');
        return;
      }

      const html = `
        <html dir="rtl" lang="ar">
          <head>
            <title>قائمة المنتجات</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
              th { background-color: #f1f5f9; color: #475569; }
              .footer { margin-top: 40px; text-align: center; font-size: 0.9em; color: #777; border-top: 1px dashed #ccc; padding-top: 20px; }
              .text-red { color: #dc2626; font-weight: bold; }
              .text-orange { color: #ea580c; font-weight: bold; }
              .text-green { color: #16a34a; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>قائمة المنتجات</h2>
              <p>التاريخ: ${new Date().toLocaleString('ar-EG')}</p>
              <p>الفئة: ${filterCategory === 'all' ? 'الكل' : filterCategory} | الفلتر: ${filterStock === 'all' ? 'الكل' : filterStock === 'low' ? 'نواقص' : 'نفذت'} | الإجمالي: ${filteredProducts.length}</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>اسم المنتج</th>
                  <th>الباركود</th>
                  <th>الفئة</th>
                  <th>سعر البيع</th>
                  <th>سعر التكلفة</th>
                  <th>المخزون الحالي</th>
                </tr>
              </thead>
              <tbody>
                ${filteredProducts.map(item => {
                  let colorClass = 'text-green';
                  if (item.type !== 'composite') {
                    if (item.stock <= 0) colorClass = 'text-red';
                    else if (item.stock <= (item.alertThreshold || 5)) colorClass = 'text-orange';
                  } else {
                    colorClass = '';
                  }
                  
                  return `
                  <tr>
                    <td>${item.name} ${item.type === 'composite' ? '(حزمة)' : ''}</td>
                    <td>${item.barcode || '-'}</td>
                    <td>${item.category || '-'}</td>
                    <td>${item.price.toLocaleString()} ${currencyCode}</td>
                    <td>${(item.costPrice || 0).toLocaleString()} ${currencyCode}</td>
                    <td class="${colorClass}">${item.type === 'composite' ? '-' : item.stock}</td>
                  </tr>
                  `
                }).join('')}
              </tbody>
            </table>

            <div class="footer">
              <p>تم استخراج هذا التقرير من النظام</p>
            </div>
            <script>
              window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }
            </script>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
    } catch(e) {
      error('حدث خطأ أثناء الطباعة');
    }
  };

  const handleImport = async (file: File) => {
    try {
      const data = await importFromExcel(file);
      if (!data || data.length === 0) {
        error('الملف فارغ أو غير صالح');
        return;
      }

      const productsToImport: Partial<Product>[] = data.map(row => ({
        name: row.Name || row.name || 'منتج مستورد',
        barcode: row.Barcode || row.barcode || '',
        price: Number(row.Price || row.price) || 0,
        costPrice: Number(row.CostPrice || row.costPrice) || 0,
        category: row.Category || row.category || 'عام',
        stock: Number(row.Stock || row.stock) || 0,
        alertThreshold: Number(row.AlertThreshold || row.alertThreshold) || 5,
        type: (row.Type || row.type) === 'composite' ? 'composite' : 'simple',
        trackSerial: (row.TrackSerial || row.trackSerial) === 'Yes' || (row.TrackSerial || row.trackSerial) === true,
        composition: [],
        variants: [],
        units: [],
        isFavorite: 0
      }));

      await db.products.bulkAdd(productsToImport as Product[]);
      success(`تم استيراد ${productsToImport.length} منتج بنجاح`);
    } catch (e) {
      console.error(e);
      error('حدث خطأ أثناء الاستيراد. تأكد من صيغة الملف.');
    }
  };

  const handlePrintBarcodes = async () => {
    try {
      const allFiltered = await getFilteredProducts();
      
      if (!allFiltered || allFiltered.length === 0) {
        error('لا توجد منتجات لطباعة الباركود');
        return;
      }

      const productsWithBarcode = allFiltered.filter(p => p.barcode);
      if (productsWithBarcode.length === 0) {
        error('لا توجد منتجات تحتوي على باركود للطباعة');
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        error('يرجى السماح بالنوافذ المنبثقة لطباعة الباركود.');
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcodes</title>
            <style>
              body { margin: 0; padding: 20px; font-family: sans-serif; }
              .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
              .label { text-align: center; border: 1px dashed #ccc; padding: 15px; border-radius: 8px; page-break-inside: avoid; }
              .name { font-weight: bold; margin-bottom: 10px; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
              .price { font-size: 14px; margin-top: 10px; font-weight: bold; }
              @media print {
                body { padding: 0; }
                .grid { gap: 10px; }
                .label { border: 1px solid #000; }
              }
            </style>
          </head>
          <body>
            <div id="barcode-grid" class="grid"></div>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
            <script>
              const products = \${JSON.stringify(productsWithBarcode.map(p => ({ name: p.name, barcode: p.barcode, price: p.price })))};
              const grid = document.getElementById('barcode-grid');
              products.forEach(p => {
                const label = document.createElement('div');
                label.className = 'label';
                const nameDiv = document.createElement('div');
                nameDiv.className = 'name';
                nameDiv.innerText = p.name;
                label.appendChild(nameDiv);
                
                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                label.appendChild(svg);
                
                const priceDiv = document.createElement('div');
                priceDiv.className = 'price';
                priceDiv.innerText = p.price + ' ' + \${JSON.stringify(currencyCode)};
                label.appendChild(priceDiv);
                
                grid.appendChild(label);
                
                try {
                  JsBarcode(svg, p.barcode, {
                    format: "CODE128",
                    width: 1.5,
                    height: 40,
                    displayValue: true,
                    fontSize: 12
                  });
                } catch(e) {
                  console.error(e);
                }
              });
              setTimeout(() => { window.print(); window.close(); }, 500);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (e) {
      error('حدث خطأ أثناء إعداد الطباعة');
    }
  };

  return {
    isModalOpen,
    editingProduct,
    productToDeleteId,
    setProductToDeleteId,
    openModal,
    closeModal,
    handleSaveProduct,
    executeDeleteProduct,
    duplicateProduct,
    handleExport,
    handlePrintList,
    handleImport,
    handlePrintBarcodes
  };
};
