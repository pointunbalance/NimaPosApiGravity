import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Folder, FileText, Upload, Search, Download, Trash2, Eye, Edit, X, Save, Grid, List as ListIcon, FileImage, FileSpreadsheet, File as FileIcon, CheckSquare, Square } from 'lucide-react';
import { Document } from '../../types';
import { compressImage } from '../../utils/imageCompression';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';

const PREDEFINED_CATEGORIES = [
  'الموارد البشرية',
  'المالية والمحاسبة',
  'الشؤون القانونية',
  'العمليات',
  'المبيعات والتسويق',
  'تقنية المعلومات',
  'عام'
];

export const DMS: React.FC = () => {
  const { success, error: showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Partial<Document> | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; id?: number; type: 'single' | 'bulk' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documents = useLiveQuery(() => db.documents?.toArray() || []) || [];
  const users = useLiveQuery(() => db.users?.toArray() || []) || [];
  const currentUser = users.find(u => u.role === 'admin') || users[0];

  const filteredDocuments = documents.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === '' || d.category === filterCategory;
    const isArchived = d.isArchived === true;
    return matchesSearch && matchesCategory && !isArchived; // Only show active versions
  });

  const uniqueCategories = Array.from(new Set([...PREDEFINED_CATEGORIES, ...documents.map(d => d.category)]));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc?.name || !editingDoc?.category) return;

    try {
      const docData: Partial<Document> = {
        name: editingDoc.name,
        category: editingDoc.category,
        type: editingDoc.type || 'PDF',
        size: editingDoc.size || '0 KB',
        date: editingDoc.date || new Date().toISOString().split('T')[0],
        url: editingDoc.url || '',
        fileData: editingDoc.fileData || undefined,
        uploadedBy: editingDoc.uploadedBy || currentUser?.name || 'مدير النظام',
        description: editingDoc.description || '',
        version: editingDoc.version || 1,
        isArchived: editingDoc.isArchived || false,
        permissions: editingDoc.permissions || { roles: ['admin'], users: [] }
      };

      if (editingDoc.id) {
        if (editingDoc.fileData && editingDoc.fileData !== documents.find(d => d.id === editingDoc.id)?.fileData) {
           // It's a new file upload for an existing document. Create new version.
           const oldDoc = documents.find(d => d.id === editingDoc.id);
           if (oldDoc) {
               // Archive old doc
               await db.documents?.update(oldDoc.id!, { isArchived: true });
               // Save new doc with incremented version
               docData.version = (oldDoc.version || 1) + 1;
               await db.documents?.add(docData as Document);
               
               // Log to audit
               await db.auditLogs.add({
                  userId: currentUser?.name || 'system',
                  userName: currentUser?.name || 'system',
                  action: 'update',
                  module: 'settings',
                  details: `تم تحديث إصدار جديد للوثيقة: ${docData.name} - إصدار V${docData.version}`,
                  timestamp: new Date().toISOString()
               });
           }
        } else {
           // Just a metadata update
           await db.documents?.update(editingDoc.id, docData);
        }
        success('تم تحديث بيانات الوثيقة بنجاح');
      } else {
        await db.documents?.add(docData as Document);
        await db.auditLogs.add({
           userId: currentUser?.name || 'system',
           userName: currentUser?.name || 'system',
           action: 'create',
           module: 'settings',
           details: `تم إنشاء وثيقة جديدة: ${docData.name}`,
           timestamp: new Date().toISOString()
        });
        success('تم رفع وحفظ الوثيقة بنجاح');
      }

      setIsModalOpen(false);
      setEditingDoc(null);
    } catch (error) {
      console.error(error);
      showError('حدث خطأ أثناء حفظ الوثيقة');
    }
  };

  const handleDelete = async () => {
    if (!confirmConfig) return;
    try {
      if (confirmConfig.type === 'single' && confirmConfig.id) {
        await db.documents?.delete(confirmConfig.id);
        setSelectedDocs(selectedDocs.filter(docId => docId !== confirmConfig.id));
        success('تم حذف الوثيقة بنجاح');
      } else if (confirmConfig.type === 'bulk' && selectedDocs.length > 0) {
        await Promise.all(selectedDocs.map(id => db.documents?.delete(id)));
        setSelectedDocs([]);
        success('تم حذف الوثائق المحددة بنجاح');
      }
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء حذف الوثائق');
    }
    setConfirmConfig(null);
  };

  const processFile = (file: File) => {
    compressImage(file).then((result) => {
      const base64 = result;
      
      let sizeStr = '';
      if (file.size < 1024) sizeStr = file.size + ' B';
      else if (file.size < 1048576) sizeStr = (file.size / 1024).toFixed(1) + ' KB';
      else sizeStr = (file.size / 1048576).toFixed(1) + ' MB';

      const ext = file.name.split('.').pop()?.toUpperCase() || 'OTHER';

      setEditingDoc(prev => ({
        ...prev,
        name: prev?.name || file.name.split('.')[0],
        category: prev?.category || 'عام',
        type: ext,
        size: sizeStr,
        fileData: base64,
        date: new Date().toISOString().split('T')[0],
        uploadedBy: currentUser?.name || 'مدير النظام'
      }));
      setIsModalOpen(true);
    }).catch(err => {
      console.error(err);
      showError('حدث خطأ أثناء رفع ومعالجة الملف.');
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDownload = (doc: Document) => {
    if (doc.fileData) {
      const link = document.createElement('a');
      link.href = doc.fileData;
      link.download = `${doc.name}.${doc.type.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (doc.url) {
      window.open(doc.url, '_blank');
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedDocs(prev => 
      prev.includes(id) ? prev.filter(docId => docId !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedDocs.length === filteredDocuments.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(filteredDocuments.map(d => d.id!));
    }
  };

  const openModal = (doc?: Document) => {
    if (doc) {
      setEditingDoc({ ...doc });
    } else {
      setEditingDoc({
        name: '',
        category: 'عام',
        type: 'PDF',
        size: '0 KB',
        date: new Date().toISOString().split('T')[0],
        url: '',
        description: '',
        uploadedBy: currentUser?.name || 'مدير النظام'
      });
    }
    setIsModalOpen(true);
  };

  const getFileIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PDF': return <FileText className="w-6 h-6 text-rose-500" />;
      case 'JPG':
      case 'PNG':
      case 'JPEG': return <FileImage className="w-6 h-6 text-blue-500" />;
      case 'XLSX':
      case 'CSV': return <FileSpreadsheet className="w-6 h-6 text-emerald-500" />;
      default: return <FileIcon className="w-6 h-6 text-slate-500" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-full bg-gradient-to-tr from-sky-50/60 via-slate-50 to-pink-50/40 font-['Tajawal']" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-950 flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-xs border border-indigo-100">
              <Folder className="w-8 h-8" />
            </div>
            إدارة وثائق المؤسسة (DMS)
          </h1>
          <p className="text-slate-500 mt-2 font-medium">مستودع الوثائق والملفات المركزية والتحكم في الإصدارات والصلاحيات</p>
        </div>
        <div className="flex gap-3">
          {selectedDocs.length > 0 && (
            <button
              onClick={() => setConfirmConfig({ isOpen: true, type: 'bulk' })}
              className="bg-rose-100 text-rose-700 px-4 py-2.5 rounded-xl hover:bg-rose-200 transition-colors flex items-center gap-2 font-bold shadow-xs"
            >
              <Trash2 className="w-5 h-5" />
              حذف المحدد ({selectedDocs.length})
            </button>
          )}
          <button
            onClick={() => openModal()}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 font-bold shadow-sm"
          >
            <Upload className="w-5 h-5" />
            رفع وثيقة جديدة
          </button>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/30">
          <div className="relative md:w-1/3">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="بحث في الوثائق والمستندات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 items-center">
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold"
            >
              <option value="">كل التصنيفات</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                title="عرض قائمة"
              >
                <ListIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                title="عرض شبكة"
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Drag and Drop Area */}
        <div 
          className={`p-8 border-b border-slate-100 border-dashed transition-all text-center cursor-pointer ${isDragging ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50/30 border-slate-200 hover:bg-slate-50/80'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <Upload className={`w-12 h-12 mx-auto mb-3 transition-transform ${isDragging ? 'text-indigo-500 scale-110' : 'text-slate-400'}`} />
          <p className="text-slate-800 font-bold mb-1">اسحب وأفلت الملفات هنا</p>
          <p className="text-slate-500 text-sm font-medium">أو انقر لاختيار ملف من جهازك لمعالجته محلياً بشكل آمن</p>
        </div>

        {/* Documents Display */}
        {filteredDocuments.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <div className="flex flex-col items-center justify-center space-y-3">
              <Folder className="w-16 h-16 text-slate-300 animate-pulse" />
              <h3 className="text-lg font-bold text-slate-700">لا توجد وثائق متاحة</h3>
              <p className="text-sm font-medium">لم يتم العثور على وثائق مطابقة لمعايير البحث في المستودع المحلي.</p>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 text-sm">
                <tr>
                  <th className="p-4 w-12">
                    <button onClick={toggleAllSelection} className="text-slate-400 hover:text-indigo-600">
                      {selectedDocs.length === filteredDocuments.length && filteredDocuments.length > 0 ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5" />}
                    </button>
                  </th>
                  <th className="p-4 font-semibold">اسم الوثيقة</th>
                  <th className="p-4 font-semibold">التصنيف</th>
                  <th className="p-4 font-semibold">الحجم</th>
                  <th className="p-4 font-semibold">تاريخ الرفع</th>
                  <th className="p-4 font-semibold">بواسطة</th>
                  <th className="p-4 font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredDocuments.map(doc => (
                  <tr key={doc.id} className={`hover:bg-slate-50/40 transition-colors ${selectedDocs.includes(doc.id!) ? 'bg-indigo-50/20' : ''}`}>
                    <td className="p-4">
                      <button onClick={() => toggleSelection(doc.id!)} className="text-slate-400 hover:text-indigo-600">
                        {selectedDocs.includes(doc.id!) ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5" />}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100/80 flex items-center justify-center shrink-0 border border-slate-200/50">
                          {getFileIcon(doc.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-900 font-bold block">{doc.name}</span>
                            {doc.version && doc.version > 1 && (
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md border border-indigo-100">
                                V{doc.version}
                              </span>
                            )}
                          </div>
                          {doc.description && <span className="text-xs text-slate-500 truncate max-w-[200px] block mt-0.5 font-medium">{doc.description}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {doc.category}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 font-mono text-xs">{doc.size}</td>
                    <td className="p-4 text-slate-600 font-mono text-xs">{doc.date}</td>
                    <td className="p-4 text-slate-600 font-semibold">{doc.uploadedBy || '-'}</td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {(doc.url || doc.fileData) && (
                          <>
                            <button 
                              onClick={() => setPreviewDoc(doc)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="معاينة"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDownload(doc)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="تحميل"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => openModal(doc)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => doc.id && setConfirmConfig({ isOpen: true, id: doc.id, type: 'single' })}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredDocuments.map(doc => (
              <div key={doc.id} className={`bg-white border rounded-2xl p-4 transition-all hover:shadow-md relative group ${selectedDocs.includes(doc.id!) ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/10' : 'border-slate-200'}`}>
                <div className="absolute top-3 right-3 z-10">
                  <button onClick={() => toggleSelection(doc.id!)} className={`bg-white rounded-md ${selectedDocs.includes(doc.id!) ? 'text-indigo-600 animate-pulse' : 'text-slate-300 opacity-0 group-hover:opacity-100'} hover:text-indigo-600 transition-all`}>
                    {selectedDocs.includes(doc.id!) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex flex-col items-center text-center mb-4 cursor-pointer" onClick={() => setPreviewDoc(doc)}>
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform relative border border-slate-100">
                    {getFileIcon(doc.type)}
                    {doc.version && doc.version > 1 && (
                      <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md shadow-xs border border-indigo-200">
                        V{doc.version}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800 line-clamp-1 w-full text-sm" title={doc.name}>{doc.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 font-mono">{doc.size} • {doc.type}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 truncate max-w-[50%]">
                    {doc.category}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => handleDownload(doc)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="تحميل">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => openModal(doc)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="تعديل">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => doc.id && setConfirmConfig({ isOpen: true, id: doc.id, type: 'single' })} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="حذف">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                {getFileIcon(previewDoc.type)}
                <div>
                  <h3 className="font-bold text-slate-800">{previewDoc.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{previewDoc.size} • {previewDoc.date}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDownload(previewDoc)} className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold">
                  <Download className="w-4 h-4" /> تحميل
                </button>
                <button onClick={() => setPreviewDoc(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-slate-100 p-6 flex items-center justify-center">
              {previewDoc.fileData ? (
                previewDoc.type.match(/^(JPG|PNG|JPEG|GIF)$/i) ? (
                  <img src={previewDoc.fileData} alt={previewDoc.name} className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                ) : previewDoc.type.match(/^(PDF)$/i) ? (
                  <iframe src={previewDoc.fileData} className="w-full h-full rounded-lg shadow-sm border-0 min-h-[500px]" title={previewDoc.name} />
                ) : (
                  <div className="text-center text-slate-500">
                    <FileIcon className="w-24 h-24 mx-auto mb-4 text-slate-300 animate-pulse" />
                    <p className="text-lg font-bold mb-2">لا يمكن معاينة هذا النوع من الملفات</p>
                    <button onClick={() => handleDownload(previewDoc)} className="text-indigo-600 hover:underline font-bold">انقر هنا لتحميل الملف</button>
                  </div>
                )
              ) : previewDoc.url ? (
                <div className="text-center text-slate-500">
                  <Eye className="w-24 h-24 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-bold mb-2">هذا المستند محفوظ كـ رابط خارجي</p>
                  <a href={previewDoc.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold">فتح الرابط في نافذة جديدة ↗</a>
                </div>
              ) : (
                <div className="text-center text-slate-500">
                  <p className="font-medium">لا يوجد محتوى لعرضه</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit/Upload Modal */}
      {isModalOpen && editingDoc && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Folder className="w-6 h-6 text-indigo-600" />
                {editingDoc.id ? 'تعديل بيانات الوثيقة' : 'رفع وثيقة جديدة'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="doc-form" onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">اسم الوثيقة *</label>
                    <input
                      type="text"
                      required
                      value={editingDoc.name || ''}
                      onChange={e => setEditingDoc({...editingDoc, name: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="اسم الوثيقة"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">الوصف</label>
                    <textarea
                      value={editingDoc.description || ''}
                      onChange={e => setEditingDoc({...editingDoc, description: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                      placeholder="وصف محتوى الوثيقة بالتفصيل..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">التصنيف *</label>
                    <input
                      type="text"
                      required
                      value={editingDoc.category || ''}
                      onChange={e => setEditingDoc({...editingDoc, category: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="مثال: عقود، سياسات، قانوني"
                      list="categories"
                    />
                    <datalist id="categories">
                      {uniqueCategories.map(cat => <option key={cat} value={cat} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">النوع</label>
                    <select
                      value={editingDoc.type || 'PDF'}
                      onChange={e => setEditingDoc({...editingDoc, type: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                    >
                      <option value="PDF">PDF</option>
                      <option value="DOCX">DOCX</option>
                      <option value="XLSX">XLSX</option>
                      <option value="JPG">JPG</option>
                      <option value="PNG">PNG</option>
                      <option value="OTHER">أخرى</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">رابط الوثيقة الخارجي (URL) - اختياري</label>
                    <input
                      type="url"
                      value={editingDoc.url || ''}
                      onChange={e => setEditingDoc({...editingDoc, url: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-left font-mono"
                      placeholder="https://..."
                      dir="ltr"
                    />
                  </div>
                  {!editingDoc.id && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">أو رفع ملف المستند</label>
                      <div className="relative">
                        <input 
                          type="file" 
                          onChange={handleFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className={`w-full py-4 border-2 border-dashed rounded-xl font-medium transition-colors flex flex-col items-center justify-center gap-2 ${editingDoc.fileData ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100'}`}>
                          <Upload className="w-6 h-6 animate-pulse" />
                          {editingDoc.fileData ? 'تم اختيار الملف بنجاح' : 'انقر أو اسحب الملف هنا لمعالجته في متصفحك بشكل آمن'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 font-semibold">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
              >
                إلغاء
              </button>
              <button
                type="submit"
                form="doc-form"
                className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all flex items-center gap-2 shadow-xs"
              >
                <Save className="w-5 h-5" />
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.type === 'single' ? "حذف الوثيقة" : "حذف الوثائق المحددة"}
          message={
            confirmConfig.type === 'single'
              ? "هل أنت متأكد من حذف هذه الوثيقة نهائياً من مستودع الملفات المحلي؟"
              : `هل أنت متأكد من حذف ${selectedDocs.length} وثيقة محددة نهائياً من مستودع الملفات؟`
          }
          onConfirm={handleDelete}
          onCancel={() => setConfirmConfig(null)}
          confirmText="تأكيد الحذف النهائي"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
};

export default DMS;
