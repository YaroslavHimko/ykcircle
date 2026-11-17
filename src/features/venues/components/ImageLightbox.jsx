import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
export function ImageLightbox({ images, index, onClose, onNavigate, onImageError }) {
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') onNavigate((index + 1) % images.length);
      if (event.key === 'ArrowLeft') onNavigate((index - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [images.length, index, onClose, onNavigate]);
  const current = images[index];
  if (!current) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Venue photo"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 sm:p-8"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center border border-white/30 text-white"
      >
        <X className="h-5 w-5" />
      </button>
      {images.length > 1 && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onNavigate((index - 1 + images.length) % images.length);
          }}
          aria-label="Previous photo"
          className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/30 text-white sm:left-4"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      <img
        src={current.src}
        alt={current.caption || ''}
        className="max-h-full max-w-full object-contain"
        onClick={(event) => event.stopPropagation()}
        onError={onImageError}
      />
      {images.length > 1 && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onNavigate((index + 1) % images.length);
          }}
          aria-label="Next photo"
          className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/30 text-white sm:right-4"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
      {current.caption && (
        <p className="absolute bottom-6 left-1/2 max-w-lg -translate-x-1/2 px-3 text-center text-sm text-white/80">
          {current.caption}
        </p>
      )}
      {images.length > 1 && (
        <p className="absolute bottom-6 right-6 text-sm text-white/60">
          {index + 1} / {images.length}
        </p>
      )}
    </div>
  );
}
