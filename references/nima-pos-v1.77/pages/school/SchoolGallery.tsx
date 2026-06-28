import React from 'react';
import { Camera, Image as ImageIcon, Folder, ShieldCheck, Plus } from 'lucide-react';

import { useSchoolGallery } from '../../components/school/gallery/useSchoolGallery';
import { CreateAlbumModal } from '../../components/school/gallery/CreateAlbumModal';
import { PermissionsTab } from '../../components/school/gallery/PermissionsTab';
import { AlbumPhotosView } from '../../components/school/gallery/AlbumPhotosView';

export const SchoolGallery = () => {
  const {
    activeTab,
    setActiveTab,
    selectedAlbum,
    setSelectedAlbum,
    isCreateModalOpen,
    setIsCreateModalOpen,
    albumForm,
    setAlbumForm,
    isUploadMode,
    setIsUploadMode,
    fileInputRef,
    selectedFiles,
    uploadConfig,
    setUploadConfig,
    classes,
    students,
    albums,
    allPhotos,
    handleToggleStudentPermission,
    handleCreateAlbum,
    handleFileChange,
    processAndUploadPhotos,
  } = useSchoolGallery();

  return (
    <div className="p-6" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-pink-100 p-3 rounded-2xl">
            <Camera className="w-8 h-8 text-pink-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">معرض الصور والألبومات</h1>
            <p className="text-slate-500 font-medium">إدارة الصور، الألبومات، ومشاركتها مع أولياء الأمور</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 hide-scrollbar">
        <button
          onClick={() => {
            setActiveTab('albums');
            setSelectedAlbum(null);
          }}
          className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'albums' && !selectedAlbum
              ? 'bg-pink-600 text-white shadow-md shadow-pink-200'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Folder className="w-4 h-4" /> الألبومات
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'permissions' ? 'bg-pink-600 text-white shadow-md shadow-pink-200' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> إعدادات الخصوصية للأطفال
        </button>
      </div>

      {activeTab === 'albums' && !selectedAlbum && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <select className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500 outline-none">
              <option value="">جميع الألبومات</option>
              <option value="نشاط">أنشطة</option>
              <option value="رحلة">رحلات</option>
              <option value="حفلة">حفلات</option>
            </select>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-pink-700 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> ألبوم جديد
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {albums.map((album) => {
              const albumPhotos = allPhotos.filter((p) => p.albumId === album.id);
              const coverPhoto = albumPhotos[albumPhotos.length - 1]?.dataUrl;

              return (
                <button
                  key={album.id}
                  onClick={() => setSelectedAlbum(album)}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition group text-right flex flex-col cursor-pointer"
                >
                  <div className="h-40 bg-slate-100 flex items-center justify-center relative overflow-hidden w-full">
                    {coverPhoto ? (
                      <img
                        src={coverPhoto}
                        alt="Cover"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Folder className="w-12 h-12 text-slate-300" />
                    )}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-slate-700 border border-slate-200">
                      {albumPhotos.length} صورة
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between w-full">
                    <div>
                      <h3 className="font-bold text-slate-800 line-clamp-1">{album.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">{album.type}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-medium">
                      <span>{album.date}</span>
                      {album.classroomId && (
                        <span>الفصل: {classes.find((c) => c.id === album.classroomId)?.name}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
            {albums.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">لا توجد ألبومات حتى الآن</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'albums' && selectedAlbum && (
        <AlbumPhotosView
          selectedAlbum={selectedAlbum}
          setSelectedAlbum={setSelectedAlbum}
          isUploadMode={isUploadMode}
          setIsUploadMode={setIsUploadMode}
          fileInputRef={fileInputRef}
          selectedFiles={selectedFiles}
          uploadConfig={uploadConfig}
          setUploadConfig={setUploadConfig}
          allPhotos={allPhotos}
          handleFileChange={handleFileChange}
          processAndUploadPhotos={processAndUploadPhotos}
        />
      )}

      {activeTab === 'permissions' && (
        <PermissionsTab
          students={students}
          classes={classes}
          handleToggleStudentPermission={handleToggleStudentPermission}
        />
      )}

      <CreateAlbumModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        albumForm={albumForm}
        setAlbumForm={setAlbumForm}
        handleCreateAlbum={handleCreateAlbum}
        classes={classes}
      />
    </div>
  );
};

export default SchoolGallery;
