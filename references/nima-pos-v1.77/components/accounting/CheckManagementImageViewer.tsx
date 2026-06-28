import React from 'react';
import { X } from 'lucide-react';

interface CheckManagementImageViewerProps {
  image: string | null;
  onClose: () => void;
}

const CheckManagementImageViewer: React.FC<CheckManagementImageViewerProps> = ({ image, onClose }) => {
  if (!image) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <div className="relative max-w-4xl max-h-[90vh]">
        <img src={image} className="max-w-full max-h-full rounded-lg shadow-2xl" />
        <button className="absolute -top-4 -right-4 bg-white text-black p-2 rounded-full shadow-lg hover:bg-gray-200" onClick={onClose}>
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default CheckManagementImageViewer;
