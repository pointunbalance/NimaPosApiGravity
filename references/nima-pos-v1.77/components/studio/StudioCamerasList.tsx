import React from 'react';
import { Camera } from '../../types';
import { Camera as CameraIcon, Edit, Trash2, Plus } from 'lucide-react';

interface StudioCamerasListProps {
  cameras: Camera[] | undefined;
  onEditCamera: (camera: Camera) => void;
  onDeleteCamera: (id: number) => void;
  onAddCamera: () => void;
}

const StudioCamerasList: React.FC<StudioCamerasListProps> = ({
  cameras,
  onEditCamera,
  onDeleteCamera,
  onAddCamera
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <CameraIcon className="w-6 h-6 text-indigo-600" />
          إدارة الكاميرات والمعدات
        </h2>
        <button 
          onClick={onAddCamera}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5" /> إضافة كاميرا
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cameras?.map(camera => (
          <div key={camera.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
            
            <div className="flex justify-between items-start mb-4">
              <div className="bg-indigo-100 text-indigo-600 p-3 rounded-2xl">
                <CameraIcon className="w-6 h-6" />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onEditCamera(camera)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="تعديل"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onDeleteCamera(camera.id!)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-1">{camera.name}</h3>
            <span className={`inline-block px-2 py-1 rounded-md text-[10px] font-bold mb-4 ${camera.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
              {camera.status === 'active' ? 'متاح' : 'غير متاح'}
            </span>

            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">سعر اليوم</span>
                <span className="font-bold text-slate-800">{camera.dailyRate}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">سعر الساعة</span>
                <span className="font-bold text-slate-800">{camera.hourlyRate}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">سعر الجلسة</span>
                <span className="font-bold text-slate-800">{camera.sessionRate}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">سعر الصورة</span>
                <span className="font-bold text-slate-800">{camera.photoRate}</span>
              </div>
            </div>
          </div>
        ))}

        {cameras?.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300">
            <CameraIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">لا توجد كاميرات مضافة بعد</p>
            <button 
              onClick={onAddCamera}
              className="mt-4 text-indigo-600 font-bold hover:underline"
            >
              إضافة كاميرا جديدة
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudioCamerasList;
