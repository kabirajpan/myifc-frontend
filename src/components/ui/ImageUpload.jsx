import { component$, useSignal, $ } from "@builder.io/qwik";
import { LuX, LuImage, LuSend } from '@qwikest/icons/lucide';

export const ImageUpload = component$(({ onImageSend, onClose, show }) => {
  const selectedImage = useSignal(null);
  const imagePreview = useSignal(null);
  const caption = useSignal("");
  const fileInputRef = useSignal();

  const handleFileSelect = $((event) => {
    const file = event.target.files[0];
    
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('Image size should be less than 5MB');
      return;
    }

    selectedImage.value = file;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  const handleSend = $(async () => {
    if (!selectedImage.value) return;

    const imageData = {
      file: selectedImage.value,
      preview: imagePreview.value,
      caption: caption.value,
      name: selectedImage.value.name,
      size: selectedImage.value.size,
      type: selectedImage.value.type
    };

    await onImageSend(imageData);
    
    // Reset
    selectedImage.value = null;
    imagePreview.value = null;
    caption.value = "";
    if (fileInputRef.value) {
      fileInputRef.value.value = "";
    }
  });

  const handleCancel = $(() => {
    selectedImage.value = null;
    imagePreview.value = null;
    caption.value = "";
    if (fileInputRef.value) {
      fileInputRef.value.value = "";
    }
    onClose();
  });

  const triggerFileInput = $(() => {
    fileInputRef.value?.click();
  });

  return (
    <>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange$={handleFileSelect}
        class="hidden"
      />

      {/* Trigger Button - rendered externally via slot but we expose the trigger */}
      {!show && (
        <button
          onClick$={triggerFileInput}
          class="p-2 text-gray-400 hover:text-pink-600 transition-colors"
          aria-label="Add image"
        >
          <LuImage class="w-4 h-4" />
        </button>
      )}

      {/* Preview Modal */}
      {show && imagePreview.value && (
        <>
          {/* Backdrop */}
          <div 
            class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick$={handleCancel}
          >
            {/* Modal */}
            <div 
              class="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden"
              onClick$={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h3 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <LuImage class="w-4 h-4" />
                  Send Image
                </h3>
                <button
                  onClick$={handleCancel}
                  class="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  <LuX class="w-5 h-5" />
                </button>
              </div>

              {/* Image Preview */}
              <div class="p-4">
                <div class="relative bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview.value}
                    alt="Preview"
                    class="w-full h-auto max-h-96 object-contain"
                  />
                </div>

                {/* Image Info */}
                <div class="mt-3 text-xs text-gray-500">
                  <p>{selectedImage.value?.name}</p>
                  <p>{(selectedImage.value?.size / 1024).toFixed(2)} KB</p>
                </div>

                {/* Caption Input */}
                <div class="mt-4">
                  <label class="block text-xs font-medium text-gray-700 mb-1">
                    Add a caption (optional)
                  </label>
                  <textarea
                    bind:value={caption}
                    placeholder="Write a caption..."
                    rows={3}
                    class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div class="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick$={handleCancel}
                  class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick$={handleSend}
                  class="px-4 py-2 text-sm font-medium bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2"
                >
                  <LuSend class="w-4 h-4" />
                  Send Image
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
});
