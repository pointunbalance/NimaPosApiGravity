import React from 'react';
import { Camera, Upload, X, Settings2, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AlbumPhotosViewProps {
  selectedAlbum: any;
  setSelectedAlbum: (val: any) => void;
  isUploadMode: boolean;
  setIsUploadMode: (val: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  selectedFiles: File[];
  uploadConfig: any;
  setUploadConfig: React.Dispatch<React.SetStateAction<any>>;
  allPhotos: any[];
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  processAndUploadPhotos: () => Promise<void>;
}

export const AlbumPhotosView: React.FC<AlbumPhotosViewProps> = ({
  selectedAlbum,
  setSelectedAlbum,
  isUploadMode,
  setIsUploadMode,
  fileInputRef,
  selectedFiles,
  uploadConfig,
  setUploadConfig,
  allPhotos,
  handleFileChange,
  processAndUploadPhotos,
}) => {
  const albumPhotos = allPhotos.filter((p) => p.albumId === selectedAlbum.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setSelectedAlbum(null)}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-black text-slate-800">{selectedAlbum.title}</h2>
          <p className="text-sm font-medium text-slate-500">
            {selectedAlbum.date} - {selectedAlbum.type}
          </p>
        </div>
        <button
          onClick={() => setIsUploadMode(true)}
          className="flex items-center gap-2 bg-pink-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-pink-700 transition cursor-pointer"
        >
          <Upload className="w-4 h-4" /> رفع صور
        </button>
      </div>

      {!isUploadMode ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {albumPhotos.map((photo) => (
            <div
              key={photo.id}
              className="relative group rounded-xl overflow-hidden bg-slate-100 border border-slate-200 aspect-square"
            >
              <img src={photo.dataUrl} className="w-full h-full object-cover" alt="Gallery item" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button className="bg-white/90 p-2 rounded-full text-slate-700 hover:text-red-500 hover:bg-white transition m-1 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {photo.isShared && (
                <div className="absolute top-2 right-2 bg-emerald-500/90 text-white px-1.5 py-0.5 rounded text-[10px] font-bold backdrop-blur-sm">
                  مشارك
                </div>
              )}
            </div>
          ))}
          {albumPhotos.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 bg-slate-50 rounded-3xl border border-slate-200">
              <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <h3 className="text-lg font-black text-slate-700 mb-1">الألبوم فارغ</h3>
              <p className="font-medium text-slate-500">قم برفع الصور لمشاركتها وحفظها.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-800 text-lg">رفع صور جديدة للألبوم</h3>
            <button onClick={() => setIsUploadMode(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="col-span-2">
              <div
                className="border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50 hover:bg-slate-100/50 transition-colors p-12 text-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <Upload className="w-12 h-12 text-pink-500 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-slate-700 mb-2">اضغط لاختيار الصور</h4>
                <p className="text-slate-500 text-sm">أو قم بسحب الصور وإفلاتها هنا</p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-6">
                  <h5 className="font-bold text-slate-700 mb-3">الصور المختارة ({selectedFiles.length})</h5>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="w-16 h-16 rounded-lg bg-slate-200 shrink-0 border border-slate-200 overflow-hidden relative"
                      >
                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-pink-500" /> إعدادات النشر
                </h4>

                <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-pink-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={uploadConfig.isShared}
                    onChange={(e) => setUploadConfig({ ...uploadConfig, isShared: e.target.checked })}
                    className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                  />
                  <div>
                    <p className="font-bold text-slate-700 text-sm">مشاركة مع أولياء الأمور</p>
                    <p className="text-xs text-slate-500 mt-0.5">ستظهر هذه الصور في تطبيق الجوال</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer mt-3 hover:border-pink-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={uploadConfig.excludeUnpermitted}
                    onChange={(e) => setUploadConfig({ ...uploadConfig, excludeUnpermitted: e.target.checked })}
                    className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500 mt-0.5"
                  />
                  <div>
                    <p className="font-bold text-slate-700 text-sm flex items-center gap-1">
                      استبعاد الأطفال الممنوع تصويرهم <ShieldAlert className="w-3 h-3 text-red-500" />
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      إذا كان بالصورة أطفال لا يُسمح بنشر صورهم، سيتم إرسالها للأهل مع ميزة "الخصوصية" لطمس الوجوه
                      الأخرى (تتطلب معالجة إضافية).
                    </p>
                  </div>
                </label>
              </div>

              <button
                onClick={processAndUploadPhotos}
                disabled={selectedFiles.length === 0}
                className="w-full py-3.5 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" /> حفظ وإضافة ({selectedFiles.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AlbumPhotosView;
