import React, { useState, useRef } from 'react';
import { Laptop, Search, Plus, CheckCircle, XCircle, User, Edit, Trash2, Save, X, Eye, Download, Printer, AlertTriangle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { AssetCustody as AssetCustodyType } from '../../types';
import { format } from 'date-fns';

export const AssetCustody: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'returned'>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<number | null>(null);
  
  const [editingAsset, setEditingAsset] = useState<Partial<AssetCustodyType> | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetCustodyType | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const currentUser = JSON.parse(localStorage.getItem('nima_user') || '{}');
  const users = useLiveQuery(() => db.users.toArray()) || [];
  
  const assets = useLiveQuery(async () => {
    const allAssets = await db.assetCustody.toArray();
    return allAssets.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, []);

  const visibleAssets = currentUser.role === 'admin' 
    ? assets 
    : assets?.filter(a => a.employeeId === currentUser.id);

  const getUserName = (id: number) => {
    return users.find(u => u.id === id)?.name || 'غير معروف';
  };

  const filteredAssets = visibleAssets?.filter(asset => {
    const employeeName = getUserName(asset.employeeId);
    const matchesSearch = asset.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset?.assetName || !editingAsset?.employeeId || !editingAsset?.serialNumber) return;

    const assetData: any = {
      employeeId: editingAsset.employeeId,
      assetName: editingAsset.assetName,
      serialNumber: editingAsset.serialNumber,
      issueDate: editingAsset.issueDate || new Date().toISOString(),
      status: editingAsset.status || 'active',
      condition: editingAsset.condition || 'ممتازة',
      returnDate: editingAsset.status === 'returned' ? (editingAsset.returnDate || new Date().toISOString()) : undefined
    };

    if (editingAsset.id) {
      await db.assetCustody.update(editingAsset.id, assetData);
    } else {
      await db.assetCustody.add(assetData);
    }

    setIsModalOpen(false);
    setEditingAsset(null);
  };

  const confirmDelete = async () => {
    if (assetToDelete) {
      await db.assetCustody.delete(assetToDelete);
      setAssetToDelete(null);
    }
  };

  const handleReturnAsset = async (id: number) => {
    await db.assetCustody.update(id, { 
      status: 'returned',
      returnDate: new Date().toISOString()
    });
  };

  const openModal = (asset?: AssetCustodyType) => {
    if (asset) {
      setEditingAsset(asset);
    } else {
      setEditingAsset({
        employeeId: 0,
        assetName: '',
        serialNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        status: 'active',
        condition: 'ممتازة'
      });
    }
    setIsModalOpen(true);
  };

  const handleExportCSV = () => {
    if (!filteredAssets || filteredAssets.length === 0) return;
    
    const headers = ['الموظف', 'العهدة', 'الرقم التسلسلي', 'تاريخ الاستلام', 'تاريخ الإرجاع', 'الحالة', 'الحالة الفنية'];
    const csvContent = [
      headers.join(','),
      ...filteredAssets.map(asset => {
        return [
          `"${getUserName(asset.employeeId)}"`,
          `"${asset.assetName}"`,
          `"${asset.serialNumber}"`,
          `"${format(new Date(asset.issueDate), 'yyyy-MM-dd')}"`,
          `"${asset.returnDate ? format(new Date(asset.returnDate), 'yyyy-MM-dd') : '-'}"`,
          `"${asset.status === 'active' ? 'في حوزة الموظف' : 'تم إرجاعها'}"`,
          `"${asset.condition}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `العهد_العينية_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!currentUser || !currentUser.id) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto" ref={printRef}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Laptop className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">إدارة العهد العينية</h1>
            <p className="text-slate-500 mt-1">تتبع الأجهزة والمعدات المُسلمة للموظفين</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Download size={20} />
            تصدير
          </button>
          <button
            onClick={handlePrint}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Printer size={20} />
            طباعة
          </button>
          {currentUser.role === 'admin' && (
            <button 
              onClick={() => openModal()}
              className="bg-teal-600 text-white px-4 py-2 rounded-xl hover:bg-teal-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>تسليم عهدة جديدة</span>
            </button>
          )}
        </div>
      </div>

      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">تقرير العهد العينية</h1>
        <p className="text-center text-slate-500">تاريخ الطباعة: {format(new Date(), 'yyyy-MM-dd')}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:border-none print:shadow-none">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 print:hidden">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث باسم الموظف أو العهدة أو الرقم التسلسلي..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-slate-800"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">في حوزة الموظف</option>
            <option value="returned">تم إرجاعها</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-slate-600 font-semibold text-sm">الموظف</th>
                <th className="p-4 text-slate-600 font-semibold text-sm">العهدة</th>
                <th className="p-4 text-slate-600 font-semibold text-sm">الرقم التسلسلي</th>
                <th className="p-4 text-slate-600 font-semibold text-sm">تاريخ الاستلام</th>
                <th className="p-4 text-slate-600 font-semibold text-sm">الحالة</th>
                <th className="p-4 text-slate-600 font-semibold text-sm print:hidden">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets?.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-medium text-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold">
                      {getUserName(asset.employeeId).charAt(0)}
                    </div>
                    {getUserName(asset.employeeId)}
                  </td>
                  <td className="p-4 text-slate-800 font-medium">{asset.assetName}</td>
                  <td className="p-4 text-slate-500 font-mono text-sm">{asset.serialNumber}</td>
                  <td className="p-4 text-slate-600">{format(new Date(asset.issueDate), 'yyyy-MM-dd')}</td>
                  <td className="p-4">
                    {asset.status === 'active' ? (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1 w-fit">
                        <CheckCircle className="w-4 h-4" /> في حوزة الموظف
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm flex items-center gap-1 w-fit">
                        <XCircle className="w-4 h-4" /> تم إرجاعها
                      </span>
                    )}
                  </td>
                  <td className="p-4 print:hidden">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setSelectedAsset(asset);
                          setIsViewModalOpen(true);
                        }}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="عرض التفاصيل"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {currentUser.role === 'admin' && (
                        <>
                          {asset.status === 'active' && (
                            <button
                              onClick={() => handleReturnAsset(asset.id!)}
                              className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                              title="إرجاع العهدة"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => openModal(asset)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setAssetToDelete(asset.id!)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(!filteredAssets || filteredAssets.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    لا توجد عهد عينية مطابقة للبحث.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {isViewModalOpen && selectedAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Laptop className="text-teal-600" />
                تفاصيل العهدة
              </h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">العهدة</h3>
                  <p className="font-bold text-slate-800">{selectedAsset.assetName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">الرقم التسلسلي</h3>
                  <p className="font-mono text-slate-800">{selectedAsset.serialNumber}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">الموظف المستلم</h3>
                  <p className="text-slate-800">{getUserName(selectedAsset.employeeId)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">الحالة الفنية</h3>
                  <p className="text-slate-800">{selectedAsset.condition}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">تاريخ الاستلام</h3>
                  <p className="text-slate-800">{format(new Date(selectedAsset.issueDate), 'yyyy-MM-dd')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">تاريخ الإرجاع</h3>
                  <p className="text-slate-800">{selectedAsset.returnDate ? format(new Date(selectedAsset.returnDate), 'yyyy-MM-dd') : '-'}</p>
                </div>
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-slate-500 mb-1">الحالة</h3>
                  <div className="mt-1">
                    {selectedAsset.status === 'active' ? (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1 w-fit">
                        <CheckCircle className="w-4 h-4" /> في حوزة الموظف
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm flex items-center gap-1 w-fit">
                        <XCircle className="w-4 h-4" /> تم إرجاعها
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl transition-colors font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && editingAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingAsset.id ? 'تعديل بيانات العهدة' : 'تسليم عهدة جديدة'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="asset-form" onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">اسم العهدة *</label>
                  <input
                    type="text"
                    required
                    value={editingAsset.assetName || ''}
                    onChange={e => setEditingAsset({...editingAsset, assetName: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="مثال: لابتوب Dell XPS"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">الرقم التسلسلي *</label>
                  <input
                    type="text"
                    required
                    value={editingAsset.serialNumber || ''}
                    onChange={e => setEditingAsset({...editingAsset, serialNumber: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-mono"
                    placeholder="مثال: SN-12345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">الموظف المستلم *</label>
                  <select
                    required
                    value={editingAsset.employeeId || ''}
                    onChange={e => setEditingAsset({...editingAsset, employeeId: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="">اختر الموظف...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">تاريخ الاستلام *</label>
                    <input
                      type="date"
                      required
                      value={editingAsset.issueDate ? format(new Date(editingAsset.issueDate), 'yyyy-MM-dd') : ''}
                      onChange={e => setEditingAsset({...editingAsset, issueDate: new Date(e.target.value).toISOString()})}
                      className="w-full px-4 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">الحالة الفنية</label>
                    <input
                      type="text"
                      value={editingAsset.condition || ''}
                      onChange={e => setEditingAsset({...editingAsset, condition: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                      placeholder="مثال: ممتازة، جيدة..."
                    />
                  </div>
                </div>
                {editingAsset.id && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">حالة العهدة</label>
                    <select
                      value={editingAsset.status || 'active'}
                      onChange={e => setEditingAsset({...editingAsset, status: e.target.value as any})}
                      className="w-full px-4 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      <option value="active">في حوزة الموظف</option>
                      <option value="returned">تم إرجاعها</option>
                    </select>
                  </div>
                )}
                {editingAsset.status === 'returned' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">تاريخ الإرجاع</label>
                    <input
                      type="date"
                      value={editingAsset.returnDate ? format(new Date(editingAsset.returnDate), 'yyyy-MM-dd') : ''}
                      onChange={e => setEditingAsset({...editingAsset, returnDate: new Date(e.target.value).toISOString()})}
                      className="w-full px-4 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                )}
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
                form="asset-form"
                className="px-6 py-2.5 bg-teal-600 text-white hover:bg-teal-700 rounded-xl transition-colors font-medium flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {assetToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">تأكيد الحذف</h2>
              <p className="text-slate-600 mb-6">
                هل أنت متأكد من حذف سجل العهدة هذا؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setAssetToDelete(null)}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors font-medium"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium"
                >
                  نعم، احذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetCustody;
