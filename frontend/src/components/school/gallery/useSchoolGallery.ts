import { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { format } from 'date-fns';

export const useSchoolGallery = () => {
  const [activeTab, setActiveTab] = useState<'albums' | 'permissions'>('albums');
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [albumForm, setAlbumForm] = useState({ title: '', date: format(new Date(), 'yyyy-MM-dd'), type: 'عام', classroomId: '' });
  
  // Upload Photos State
  const [isUploadMode, setIsUploadMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadConfig, setUploadConfig] = useState({ isShared: true, taggedStudents: [] as number[], excludeUnpermitted: true });

  const classes = useLiveQuery(() => db.schoolClassesList?.toArray()) || [];
  const students = useLiveQuery(() => db.schoolStudents?.toArray()) || [];
  const albums = useLiveQuery(() => db.schoolAlbums?.toArray()) || [];
  const allPhotos = useLiveQuery(() => db.schoolPhotos?.toArray()) || [];

  const handleToggleStudentPermission = async (studentId: number, field: 'photographyAllowed' | 'publishingAllowed', val: boolean) => {
    await db.schoolStudents.update(studentId, { [field]: val });
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.schoolAlbums.add({
      ...albumForm,
      classroomId: albumForm.classroomId ? Number(albumForm.classroomId) : undefined
    });
    setIsCreateModalOpen(false);
    setAlbumForm({ title: '', date: format(new Date(), 'yyyy-MM-dd'), type: 'عام', classroomId: '' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const processAndUploadPhotos = async () => {
    if (!selectedAlbum || selectedFiles.length === 0) return;

    // Convert files to base64
    for (const file of selectedFiles) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        await db.schoolPhotos.add({
          albumId: selectedAlbum.id,
          date: format(new Date(), 'yyyy-MM-dd'),
          dataUrl: base64Data,
          isShared: uploadConfig.isShared,
          taggedStudents: uploadConfig.taggedStudents
        });
      };
      reader.readAsDataURL(file);
    }

    setSelectedFiles([]);
    setIsUploadMode(false);
  };

  return {
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
    setSelectedFiles,
    uploadConfig,
    setUploadConfig,
    classes,
    students,
    albums,
    allPhotos,
    handleToggleStudentPermission,
    handleCreateAlbum,
    handleFileChange,
    processAndUploadPhotos
  };
};

export default useSchoolGallery;
