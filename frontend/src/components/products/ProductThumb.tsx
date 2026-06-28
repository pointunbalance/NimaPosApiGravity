import React, { useState } from 'react';
import { Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductThumbProps {
  src?: string;
  images?: string[];
  productName?: string;
}

const ProductThumb: React.FC<ProductThumbProps> = ({ src, images = [], productName }) => {
  const [error, setError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const allImages = images && images.length > 0 ? images : (src ? [src] : []);

  if (error || !src) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-slate-100 text-slate-300">
        <ImageIcon className="w-6 h-6" />
      </div>
    );
  }

  const handleOpenLightbox = (e: React.MouseEvent) => {
    if (allImages.length > 1) {
      e.preventDefault();
      e.stopPropagation();
      setLightboxOpen(true);
    }
  };

  return (
    <>
      <div className="relative w-full h-full group cursor-pointer" onClick={handleOpenLightbox}>
        <img 
          src={src} 
          alt="" 
          onError={() => setError(true)} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
        />
        {allImages.length > 1 && (
          <div className="absolute bottom-1 right-1 bg-slate-900/80 backdrop-blur-xs text-white text-[8px] font-bold px-1 py-0.2 rounded-md flex items-center gap-0.5 shadow">
            <span className="font-mono">{allImages.length}</span>
            <span>صور</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightboxOpen && (
          <div 
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
            className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-6 cursor-default"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex justify-between items-center w-full" onClick={(e) => e.stopPropagation()}>
              <div>
                <h3 className="text-white text-lg font-black">{productName || "معاينة الصور"}</h3>
                <p className="text-xs text-slate-400 font-bold">معرض الصور للمنتج</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main viewer */}
            <div className="flex-1 flex items-center justify-center relative my-4" onClick={(e) => e.stopPropagation()}>
              {allImages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIdx((prev) => (prev + 1) % allImages.length);
                  }}
                  className="absolute right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-10"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}

              <motion.img 
                key={activeIdx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                src={allImages[activeIdx]} 
                className="max-w-full max-h-[60vh] object-contain rounded-2xl shadow-2xl"
                alt=""
              />

              {allImages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIdx((prev) => (prev - 1 + allImages.length) % allImages.length);
                  }}
                  className="absolute left-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Horizontal selector thumbnails */}
            <div className="flex justify-center gap-3.5 overflow-x-auto py-4 w-full" onClick={(e) => e.stopPropagation()}>
              {allImages.map((img, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setActiveIdx(index); }}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 bg-slate-900 transition-all shrink-0 ${
                    index === activeIdx ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-500/20' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProductThumb;
