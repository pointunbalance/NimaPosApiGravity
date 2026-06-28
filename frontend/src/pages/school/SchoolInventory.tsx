import React from 'react';
import { PackageSearch, Plus, Search, Filter, AlertCircle, ShoppingCart, DollarSign, Package, Tags } from 'lucide-react';
import { useSchoolInventory } from '../../components/school/inventory/useSchoolInventory';
import { CreateInventoryItemModal } from '../../components/school/inventory/CreateInventoryItemModal';
import { SellInventoryItemModal } from '../../components/school/inventory/SellInventoryItemModal';

export const SchoolInventory = () => {
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    isSellModalOpen,
    setIsSellModalOpen,
    selectedItem,
    setSelectedItem,
    filterCategory,
    setFilterCategory,
    searchQuery,
    setSearchQuery,
    students,
    classes,
    form,
    setForm,
    sellForm,
    setSellForm,
    handleCreate,
    openSellModal,
    handleSell,
    filteredInventory,
    getCategoryLabel,
  } = useSchoolInventory();

  return (
    <div className="p-6" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-sky-100 p-3 rounded-2xl">
            <PackageSearch className="w-8 h-8 text-sky-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">إدارة المخزون</h1>
            <p className="text-slate-500 font-medium">مراقبة وصرف المستلزمات والعهد المدرسية</p>
          </div>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-sky-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-sky-700 transition shadow-sm shadow-sky-200 cursor-pointer"
        >
          <Plus className="w-5 h-5" /> إضافة صنف جديد
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center mb-6">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="w-5 h-5 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="ابحث عن صنف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-medium outline-none"
          />
        </div>
        <div className="flex items-center gap-2 text-slate-500 font-bold">
          <Filter className="w-4 h-4" /> تصفية:
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-sky-500 outline-none bg-slate-50"
        >
          <option value="all">جميع الأقسام</option>
          <option value="uniform">يونيفورم</option>
          <option value="books">كتب دراسية</option>
          <option value="educational">أدوات تعليمية</option>
          <option value="cleaning">أدوات نظافة</option>
          <option value="meals">مكونات وجبات</option>
          <option value="activities">خامات أنشطة</option>
          <option value="toys">ألعاب</option>
          <option value="medical">أدوات طبية</option>
          <option value="bus">مستلزمات باص</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInventory.map((item) => {
          const itemName = item.name || item.itemName;
          const isLowStock = Number(item.quantity) <= Number(item.minQuantity || 0);
          const canSell = item.category === 'uniform' || item.category === 'books';

          return (
            <div
              key={item.id}
              className={`bg-white rounded-3xl border overflow-hidden flex flex-col hover:shadow-md transition-shadow ${
                isLowStock ? 'border-orange-300 shadow-sm shadow-orange-100' : 'border-slate-200 shadow-sm'
              }`}
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isLowStock ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-lg mb-0.5">{itemName}</h3>
                    <p className="text-xs font-bold text-slate-500">{getCategoryLabel(item.category)}</p>
                  </div>
                </div>
                {isLowStock && (
                  <span className="flex items-center gap-1 text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded-lg border border-orange-200">
                    <AlertCircle className="w-3.5 h-3.5" /> قريب للنفاد
                  </span>
                )}
              </div>

              <div className="p-5 flex-1 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-slate-500 text-xs font-bold mb-1 flex items-center gap-1.5">
                    <Tags className="w-3.5 h-3.5" /> الرصيد الحالي
                  </p>
                  <p className={`text-lg font-black ${isLowStock ? 'text-orange-600' : 'text-slate-800'}`}>
                    {item.quantity} <span className="text-xs font-medium text-slate-500">وحدة</span>
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-slate-500 text-xs font-bold mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> سعر الشراء
                  </p>
                  <p className="text-lg font-black text-slate-800 font-mono">
                    {item.purchasePrice || 0} <span className="text-xs font-medium text-slate-500 font-sans">ج.م</span>
                  </p>
                </div>

                <div className="col-span-2 flex justify-between mt-2 pt-4 border-t border-slate-100">
                  <div className="text-xs">
                    <span className="text-slate-500 font-bold">سعر البيع:</span>{' '}
                    <span className="font-bold text-slate-800 font-mono">{item.sellingPrice || '-'} ج.م</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500 font-bold">المورد:</span> <span className="font-bold text-slate-800">{item.supplier || '-'}</span>
                  </div>
                </div>
              </div>

              {canSell && (
                <div className="px-5 py-4 bg-sky-50/50 border-t border-slate-100">
                  <button
                    onClick={() => openSellModal(item)}
                    disabled={Number(item.quantity) === 0}
                    className="w-full flex items-center justify-center gap-2 bg-white text-sky-700 border border-sky-200 py-2 rounded-xl font-bold hover:bg-sky-100 hover:border-sky-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" /> بيع لطفل
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {filteredInventory.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
            <PackageSearch className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-bold text-lg text-slate-600">لا توجد أصناف في المخزن بهذا البحث</p>
          </div>
        )}
      </div>

      <CreateInventoryItemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        form={form}
        setForm={setForm}
        handleCreate={handleCreate}
      />

      <SellInventoryItemModal
        isOpen={isSellModalOpen}
        onClose={() => {
          setIsSellModalOpen(false);
          setSelectedItem(null);
        }}
        selectedItem={selectedItem}
        sellForm={sellForm}
        setSellForm={setSellForm}
        handleSell={handleSell}
        students={students}
        classes={classes}
      />
    </div>
  );
};

export default SchoolInventory;
