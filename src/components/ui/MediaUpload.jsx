import { component$, $ } from "@builder.io/qwik";
import { LuX, LuImage, LuMusic, LuFileImage } from '@qwikest/icons/lucide';

export const MediaUpload = component$(({ onMediaSelect }) => {
  // Validate file based on type
  const validateFile = $((file, type) => {
    const maxSizes = {
      image: 10 * 1024 * 1024,
      gif: 10 * 1024 * 1024,
      audio: 5 * 1024 * 1024
    };

    const allowedTypes = {
      image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'],
      gif: ['image/gif'],
      audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm']
    };

    if (!allowedTypes[type].includes(file.type)) {
      return { valid: false, error: `Invalid ${type} format` };
    }

    if (file.size > maxSizes[type]) {
      return { valid: false, error: `${type === 'image' ? 'Image' : type === 'gif' ? 'GIF' : 'Audio'} must be less than ${maxSizes[type] / (1024 * 1024)}MB` };
    }

    return { valid: true };
  });

  const handleFileSelect = $(async (event, type) => {
    const file = event.target.files[0];
    
    if (!file) return;

    // Validate file
    const validation = await validateFile(file, type);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Create preview for images/gifs - WAIT for FileReader to finish
    if (type === 'image' || type === 'gif') {
      const reader = new FileReader();
      reader.onload = (e) => {
        // NOW notify parent with the loaded preview
        if (onMediaSelect) {
          onMediaSelect({
            file,
            type,
            preview: e.target.result
          });
        }
      };
      reader.readAsDataURL(file);
    } else {
      // For audio, notify immediately (no preview needed)
      if (onMediaSelect) {
        onMediaSelect({
          file,
          type,
          preview: null
        });
      }
    }
  });

  const triggerFileInput = $((type) => {
    const input = document.createElement('input');
    input.type = 'file';
    
    if (type === 'image') {
      input.accept = 'image/jpeg,image/jpg,image/png,image/webp,image/avif';
    } else if (type === 'gif') {
      input.accept = 'image/gif';
    } else if (type === 'audio') {
      input.accept = 'audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm';
    }
    
    input.onchange = (e) => handleFileSelect(e, type);
    input.click();
  });

  return (
    <div class="flex items-center gap-1">
      <button
        onClick$={() => triggerFileInput('image')}
        class="p-2 text-gray-400 hover:text-pink-600 transition-colors"
        aria-label="Upload image"
        title="Upload image"
      >
        <LuImage class="w-4 h-4" />
      </button>
      
      <button
        onClick$={() => triggerFileInput('gif')}
        class="p-2 text-gray-400 hover:text-pink-600 transition-colors"
        aria-label="Upload GIF"
        title="Upload GIF"
      >
        <LuFileImage class="w-4 h-4" />
      </button>
      
      <button
        onClick$={() => triggerFileInput('audio')}
        class="p-2 text-gray-400 hover:text-pink-600 transition-colors"
        aria-label="Upload audio"
        title="Upload audio"
      >
        <LuMusic class="w-4 h-4" />
      </button>
    </div>
  );
});

// Media Preview Component - Shows above input like Telegram/WhatsApp
export const MediaPreview = component$(({ file, preview, type, onRemove }) => {
  if (!file) return null;

  return (
    <div class="flex-shrink-0 px-3 py-2.5 bg-gradient-to-b from-gray-50 to-white border-t border-gray-200">
      <div class="flex items-start gap-3">
        {/* Image/GIF Preview */}
        {(type === 'image' || type === 'gif') && preview ? (
          <div class="relative group">
            <img
              src={preview}
              alt="Preview"
              class="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
            />
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <button
                onClick$={onRemove}
                class="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg transform hover:scale-110"
                aria-label="Remove media"
              >
                <LuX class="w-4 h-4" />
              </button>
            </div>
            {type === 'gif' && (
              <span class="absolute top-2 right-2 px-2 py-0.5 bg-pink-600 text-white text-xs font-bold rounded">
                GIF
              </span>
            )}
          </div>
        ) : type === 'audio' ? (
          /* Audio Preview */
          <div class="relative flex items-center gap-3 bg-white rounded-lg border-2 border-gray-200 px-4 py-3 flex-1 shadow-sm">
            <div class="p-2 bg-pink-100 rounded-full">
              <LuMusic class="w-5 h-5 text-pink-600" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-700 truncate">{file.name}</p>
              <p class="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB • Audio</p>
            </div>
            <button
              onClick$={onRemove}
              class="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
              aria-label="Remove audio"
            >
              <LuX class="w-5 h-5" />
            </button>
          </div>
        ) : null}
        
        {/* Info Text */}
        {(type === 'image' || type === 'gif') && (
          <div class="flex-1 min-w-0 flex flex-col justify-center">
            <p class="text-sm font-medium text-gray-700">
              {type === 'image' ? 'Image ready to send' : 'GIF ready to send'}
            </p>
            <p class="text-xs text-gray-500 mt-0.5">
              {file.name} • {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <p class="text-xs text-pink-600 mt-1">
              Add a caption below (optional)
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
