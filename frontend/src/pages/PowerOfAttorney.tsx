import React, { useState } from 'react';
import { FileSignature, Plus, Search, Edit, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { PowerOfAttorney } from '../types';
import { useToast } from '../context/ToastContext';
import PoAFormModal from '../components/lawfirm/PoAFormModal';
import ConfirmModal from '../components/ui/ConfirmModal';

const PowerOfAttorneyPage: React.FC = () => {
  const { success, error } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPoA, setEditingPoA] = useState<PowerOfAttorney | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Queries
  const clients = useLiveQuery(() => db.customers.toArray()) || [];
  const cases = useLiveQuery(() => db.lawCases?.toArray() || []) || [];
  
  const poas = useLiveQuery(async () => {
    let allPoas = await db.powerOfAttorneys.reverse().toArray();
    if (search) {
      allPoas = allPoas.filter(p => p.poaNumber.includes(search));
    }
    return allPoas;
  }, [search]) || [];

  const handleSavePoA = async (poaData: PowerOfAttorney) => {
    try {
      if (poaData.id) {
        await db.powerOfAttorneys.update(poaData.id, poaData);
        success('تم تحديث الوكالة بنجاح');
      } else {
        await db.powerOfAttorneys.add(poaData);
        success('تم إضافة الوكالة بنجاح');
      }
      setIsModalOpen(false);
    } catch (e) {
      error('حدث خطأ أثناء حفظ الوكالة');
    }
  };

  const handleDeletePoA = async (id: number) => {
    setDeleteId(id);
  };

  const getClientName = (id: number) => clients.find(c => c.id === id)?.name || 'غير معروف';

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <FileSignature className="w-8 h-8 text-indigo-600" />
            إدارة الوكالات
          </h1>
          <p className="text-slate-500 mt-2">سجل الوكالات الشرعية والقانونية للموكلين</p>
        </div>
        <button 
          onClick={() => { setEditingPoA(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition shadow-sm font-bold"
        >
          <Plus className="w-5 h-5" />
          إضافة وكالة
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="relative w-full max-w-md">
            <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="بحث برقم الوكالة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 text-sm font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">رقم الوكالة</th>
                <th className="px-6 py-4">الموكل</th>
                <th className="px-6 py-4">نوع الوكالة</th>
                <th className="px-6 py-4">تاريخ الإصدار</th>
                <th className="px-6 py-4">تاريخ الانتهاء</th>
                <th className="px-6 py-4 text-center">الحالة</th>
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {poas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <FileSignature className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    لا توجد وكالات مسجلة
                  </td>
                </tr>
              ) : (
                poas.map((poa) => (
                  <tr key={poa.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-800">{poa.poaNumber}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{getClientName(poa.clientId)}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {poa.type === 'general' ? 'عامة' : 'خاصة'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{new Date(poa.issueDate).toLocaleDateString('ar-EG')}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {poa.expiryDate ? new Date(poa.expiryDate).toLocaleDateString('ar-EG') : <span className="text-slate-400">مفتوح</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        poa.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        poa.status === 'expired' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {poa.status === 'active' && <CheckCircle2 className="w-3 h-3" />}
                        {poa.status === 'expired' && <Clock className="w-3 h-3" />}
                        {poa.status === 'revoked' && <XCircle className="w-3 h-3" />}
                        
                        {poa.status === 'active' ? 'سارية المفعول' : poa.status === 'expired' ? 'منتهية' : 'ملغاة'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center justify-center gap-2">
                      <button 
                        onClick={() => { setEditingPoA(poa); setIsModalOpen(true); }}
                        className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => poa.id && handleDeletePoA(poa.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <PoAFormModal 
          isOpen={isModalOpen}
          initialData={editingPoA}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSavePoA}
          clients={clients}
          cases={cases}
        />
      )}

      <ConfirmModal
        isOpen={deleteId !== null}
        title="تأكيد حذف الوكالة"
        message="هل أنت متأكد من حذف هذه الوكالة؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={async () => {
          if (deleteId !== null) {
            try {
              await db.powerOfAttorneys.delete(deleteId);
              success('تم الحذف بنجاح');
            } catch (e) {
              error('حدث خطأ');
            } finally {
              setDeleteId(null);
            }
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default PowerOfAttorneyPage;
