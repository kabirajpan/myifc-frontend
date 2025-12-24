import { component$, $ } from "@builder.io/qwik";
import { LuX, LuDownload } from "@qwikest/icons/lucide";

export const ImageViewer = component$(({ imageUrl, isOpen, onClose }) => {
  if (!isOpen || !imageUrl) return null;

  const handleDownload = $((e) => {
    e.stopPropagation();
  });

  return (
    <>
      {/* Backdrop with blur effect */}
      <div 
        class="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick$={onClose}
      >
        {/* Top Controls Bar */}
        <div class="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
          <div class="text-white text-sm font-medium">Image Viewer</div>
          
          <div class="flex items-center gap-2">
            {/* Download button */}
            <a
              href={imageUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              onClick$={handleDownload}
              class="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              aria-label="Download image"
              title="Download image"
            >
              <LuDownload class="w-5 h-5" />
            </a>

            {/* Close button */}
            <button
              onClick$={onClose}
              class="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              aria-label="Close viewer"
              title="Close (Esc)"
            >
              <LuX class="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div 
          class="relative max-w-7xl max-h-[90vh] flex items-center justify-center"
          onClick$={(e) => e.stopPropagation()}
        >
          <img
            src={imageUrl}
            alt="Full size preview"
            class="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        </div>

        {/* Bottom hint */}
        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
          Click outside to close
        </div>
      </div>
    </>
  );
});
