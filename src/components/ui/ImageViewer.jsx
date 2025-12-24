import { component$, $, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import {
  LuX,
  LuRotateCw,
  LuFlag,
  LuChevronLeft,
  LuChevronRight,
  LuSmile,
  LuMaximize,
  LuMinimize,
  LuZoomIn,
  LuZoomOut
} from "@qwikest/icons/lucide";
import { getGenderColor, getGenderBorderColor } from "../../utils/helpers";
import { EmojiPicker } from "./EmojiPicker";

export const ImageViewer = component$(({
  imageUrl,
  isOpen,
  onClose,
  messageData = null,
  onPrevious = null,
  onNext = null,
  hasPrevious = false,
  hasNext = false,
  onReact = null,
  onReport = null,
  onShare = null,
}) => {
  if (!isOpen || !imageUrl) return null;

  const rotation = useSignal(0);
  const showEmojiPicker = useSignal(false);
  const showReportDialog = useSignal(false);
  const reportReason = useSignal("");
  const reportDetails = useSignal("");
  const isReporting = useSignal(false);
  const isFullscreen = useSignal(false);
  const isHoveringImage = useSignal(false);
  const zoomLevel = useSignal(1); // 1 = 100%
  const isPanning = useSignal(false);
  const panOffset = useSignal({ x: 0, y: 0 });
  const panStart = useSignal({ x: 0, y: 0 });

  const handleRotate = $((e) => {
    e?.stopPropagation();
    rotation.value = (rotation.value + 90) % 360;
  });

  const handleZoomIn = $((e) => {
    e?.stopPropagation();
    if (zoomLevel.value < 3) {
      zoomLevel.value = Math.min(3, zoomLevel.value + 0.25);
    }
  });

  const handleZoomOut = $((e) => {
    e?.stopPropagation();
    if (zoomLevel.value > 1) {
      zoomLevel.value = Math.max(1, zoomLevel.value - 0.25);
      // Reset pan when zooming out to 100%
      if (zoomLevel.value === 1) {
        panOffset.value = { x: 0, y: 0 };
      }
    }
  });

  const handleMouseDown = $((e) => {
    if (zoomLevel.value > 1) {
      isPanning.value = true;
      panStart.value = {
        x: e.clientX - panOffset.value.x,
        y: e.clientY - panOffset.value.y
      };
    }
  });

  const handleMouseMove = $((e) => {
    if (isPanning.value && zoomLevel.value > 1) {
      panOffset.value = {
        x: e.clientX - panStart.value.x,
        y: e.clientY - panStart.value.y
      };
    }
  });

  const handleMouseUp = $(() => {
    isPanning.value = false;
  });

  const handleWheel = $((e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      // Scroll up - zoom in
      handleZoomIn();
    } else {
      // Scroll down - zoom out
      handleZoomOut();
    }
  });

  const handleShare = $(async (e) => {
    e.stopPropagation();

    if (onShare && messageData?.id) {
      await onShare(messageData.id);
    } else {
      try {
        await navigator.clipboard.writeText(imageUrl);
        alert('Image URL copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  });

  const handleReportSubmit = $(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!reportReason.value.trim()) {
      alert('Please select a reason for reporting');
      return;
    }

    if (onReport && messageData?.id) {
      isReporting.value = true;
      try {
        await onReport(messageData.id, reportReason.value, reportDetails.value);
        showReportDialog.value = false;
        reportReason.value = "";
        reportDetails.value = "";
        alert('Report submitted successfully');
      } catch (err) {
        alert('Failed to submit report');
      } finally {
        isReporting.value = false;
      }
    }
  });

  const handleEmojiSelect = $((emoji) => {
    if (onReact && messageData?.id) {
      onReact(messageData.id, emoji);
    }
    showEmojiPicker.value = false;
  });

  const toggleFullscreen = $((e) => {
    e?.stopPropagation();
    isFullscreen.value = !isFullscreen.value;
    // Reset zoom and pan when exiting fullscreen
    if (!isFullscreen.value) {
      zoomLevel.value = 1;
      panOffset.value = { x: 0, y: 0 };
    }
  });

  // Keyboard controls
  useVisibleTask$(() => {
    const handleKeyDown = (e) => {
      if (showReportDialog.value) return;

      switch(e.key) {
        case 'Escape':
          if (isFullscreen.value) {
            isFullscreen.value = false;
            zoomLevel.value = 1;
            panOffset.value = { x: 0, y: 0 };
          } else {
            onClose();
          }
          break;
        case 'ArrowLeft':
          if (hasPrevious && onPrevious) {
            onPrevious();
          }
          break;
        case 'ArrowRight':
          if (hasNext && onNext) {
            onNext();
          }
          break;
        case 'r':
        case 'R':
          rotation.value = (rotation.value + 90) % 360;
          break;
        case 'f':
        case 'F':
          isFullscreen.value = !isFullscreen.value;
          if (!isFullscreen.value) {
            zoomLevel.value = 1;
            panOffset.value = { x: 0, y: 0 };
          }
          break;
        case '+':
        case '=':
          if (isFullscreen.value && zoomLevel.value < 3) {
            zoomLevel.value = Math.min(3, zoomLevel.value + 0.25);
          }
          break;
        case '-':
        case '_':
          if (isFullscreen.value && zoomLevel.value > 1) {
            zoomLevel.value = Math.max(1, zoomLevel.value - 0.25);
            if (zoomLevel.value === 1) {
              panOffset.value = { x: 0, y: 0 };
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Fullscreen mode - completely covers screen
  if (isFullscreen.value) {
    return (
      <div
        class="fixed inset-0 top-0 bg-black z-[200] flex items-center justify-center overflow-hidden"
        onClick$={onClose}
        onMouseEnter$={() => (isHoveringImage.value = true)}
        onMouseLeave$={() => (isHoveringImage.value = false)}
        onMouseMove$={handleMouseMove}
        onMouseUp$={handleMouseUp}
        onWheel$={handleWheel}
      >
        {/* Image */}
        <img
          src={imageUrl}
          alt="Full size preview"
          class="max-w-full max-h-full object-contain transition-transform duration-300"
          style={`
            transform: rotate(${rotation.value}deg) scale(${zoomLevel.value}) translate(${panOffset.value.x / zoomLevel.value}px, ${panOffset.value.y / zoomLevel.value}px);
            cursor: ${zoomLevel.value > 1 ? (isPanning.value ? 'grabbing' : 'grab') : 'default'};
          `}
          onClick$={(e) => e.stopPropagation()}
          onMouseDown$={handleMouseDown}
        />

        {/* Hover Controls */}
        {isHoveringImage.value && (
          <>
            {/* Top Controls */}
            <div class="absolute top-4 right-4 flex items-center gap-2">
              {/* Zoom Controls */}
              <div class="flex items-center gap-1 bg-black/50 rounded-full p-1 backdrop-blur-sm">
                <button
                  onClick$={handleZoomOut}
                  disabled={zoomLevel.value <= 1}
                  class="p-2 hover:bg-white/20 rounded-full text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Zoom Out (-)"
                >
                  <LuZoomOut class="w-4 h-4" />
                </button>
                <span class="text-white text-xs px-2 min-w-[3rem] text-center">
                  {Math.round(zoomLevel.value * 100)}%
                </span>
                <button
                  onClick$={handleZoomIn}
                  disabled={zoomLevel.value >= 3}
                  class="p-2 hover:bg-white/20 rounded-full text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Zoom In (+)"
                >
                  <LuZoomIn class="w-4 h-4" />
                </button>
              </div>

              <button
                onClick$={handleRotate}
                class="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors backdrop-blur-sm"
                title="Rotate (R)"
              >
                <LuRotateCw class="w-5 h-5" />
              </button>
              <button
                onClick$={toggleFullscreen}
                class="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors backdrop-blur-sm"
                title="Exit Fullscreen (F or Esc)"
              >
                <LuMinimize class="w-5 h-5" />
              </button>
            </div>

            {/* Left Navigation */}
            {hasPrevious && onPrevious && (
              <button
                onClick$={(e) => {
                  e.stopPropagation();
                  onPrevious();
                  // Reset zoom when changing images
                  zoomLevel.value = 1;
                  panOffset.value = { x: 0, y: 0 };
                }}
                class="absolute left-4 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors backdrop-blur-sm"
                title="Previous (←)"
              >
                <LuChevronLeft class="w-6 h-6" />
              </button>
            )}

            {/* Right Navigation */}
            {hasNext && onNext && (
              <button
                onClick$={(e) => {
                  e.stopPropagation();
                  onNext();
                  // Reset zoom when changing images
                  zoomLevel.value = 1;
                  panOffset.value = { x: 0, y: 0 };
                }}
                class="absolute right-4 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors backdrop-blur-sm"
                title="Next (→)"
              >
                <LuChevronRight class="w-6 h-6" />
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  // Normal mode
  return (
    <>
      <div
        class="fixed inset-0 top-16 bg-black/95 z-[100] flex flex-col"
        onClick$={onClose}
      >
        {/* Close Button - Top Right */}
        <button
          onClick$={onClose}
          class="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
          title="Close (Esc)"
        >
          <LuX class="w-6 h-6" />
        </button>

        {/* Sender Name - Top Center */}
        {messageData && (
          <div class="flex flex-col items-center pt-6 pb-3 px-4">
            <div class="flex items-center gap-2 mb-2">
              <div
                class="w-[1.5rem] h-[1.5rem] rounded-full flex items-center justify-center text-sm font-semibold border-2 bg-white"
                style={`color: ${getGenderBorderColor(messageData.sender_gender)}; border-color: ${getGenderBorderColor(messageData.sender_gender)};`}
              >
                {messageData.sender_username?.charAt(0).toUpperCase()}
              </div>
              <div class="text-center">
                <div class="text-base font-semibold text-white">
                  {messageData.sender_username}
                </div>
              </div>
            </div>

            {/* Caption/Message */}
            {messageData.caption && (
              <div class="max-w-2xl text-center">
                <p class="text-sm text-white/90">{messageData.caption}</p>
              </div>
            )}
          </div>
        )}

        {/* Image Container */}
        <div class="flex-1 flex items-center justify-center px-4 py-6 relative">
          <div onClick$={(e) => e.stopPropagation()}>
            <img
              src={imageUrl}
              alt="Full size preview"
              class="max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl transition-transform duration-300"
              style={`transform: rotate(${rotation.value}deg)`}
            />
          </div>
        </div>

        {/* Emoji Reactions - Center */}
        <div class="flex flex-col items-center gap-3 pb-4 px-4">
          {/* Emoji Picker Button */}
          {messageData && onReact && (
            <div class="relative">
              <button
                onClick$={(e) => {
                  e.stopPropagation();
                  showEmojiPicker.value = !showEmojiPicker.value;
                }}
                class="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                title="React with emoji"
              >
                <LuSmile class="w-6 h-6" />
              </button>
              <EmojiPicker
                show={showEmojiPicker.value}
                onEmojiSelect={handleEmojiSelect}
                onClose={$(() => (showEmojiPicker.value = false))}
              />
            </div>
          )}

          {/* Reactions Display */}
          {messageData?.reactions && messageData.reactions.length > 0 && (
            <div class="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
              {messageData.reactions.slice(0, 5).map((reaction) => (
                <span key={reaction.id} class="text-xl">
                  {reaction.emoji}
                </span>
              ))}
              {messageData.reactions.length > 5 && (
                <span class="text-sm text-white/60">+{messageData.reactions.length - 5}</span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Controls: Report | Rotate | Fullscreen | Previous | Next */}
        <div class="flex items-center justify-center gap-3 pb-6 px-4">
          {/* Report */}
          {messageData && (
            <button
              onClick$={(e) => {
                e.stopPropagation();
                showReportDialog.value = true;
              }}
              class="flex flex-col items-center gap-1 p-2 text-white/80 hover:text-red-400 transition-colors group"
              title="Report"
            >
              <div class="p-2 bg-white/10 group-hover:bg-red-500/20 rounded-full transition-colors">
                <LuFlag class="w-5 h-5" />
              </div>
              <span class="text-xs">Report</span>
            </button>
          )}

          {/* Rotate */}
          <button
            onClick$={handleRotate}
            class="flex flex-col items-center gap-1 p-2 text-white/80 hover:text-white transition-colors group"
            title="Rotate (R)"
          >
            <div class="p-2 bg-white/10 group-hover:bg-white/20 rounded-full transition-colors">
              <LuRotateCw class="w-5 h-5" />
            </div>
            <span class="text-xs">Rotate</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick$={toggleFullscreen}
            class="flex flex-col items-center gap-1 p-2 text-white/80 hover:text-white transition-colors group"
            title="Fullscreen (F)"
          >
            <div class="p-2 bg-white/10 group-hover:bg-white/20 rounded-full transition-colors">
              <LuMaximize class="w-5 h-5" />
            </div>
            <span class="text-xs">Fullscreen</span>
          </button>

          {/* Previous */}
          <button
            onClick$={(e) => {
              e.stopPropagation();
              if (hasPrevious && onPrevious) onPrevious();
            }}
            disabled={!hasPrevious}
            class="flex flex-col items-center gap-1 p-2 text-white/80 hover:text-white transition-colors group disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous (←)"
          >
            <div class="p-2 bg-white/10 group-hover:bg-white/20 rounded-full transition-colors">
              <LuChevronLeft class="w-5 h-5" />
            </div>
            <span class="text-xs">Previous</span>
          </button>

          {/* Next */}
          <button
            onClick$={(e) => {
              e.stopPropagation();
              if (hasNext && onNext) onNext();
            }}
            disabled={!hasNext}
            class="flex flex-col items-center gap-1 p-2 text-white/80 hover:text-white transition-colors group disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next (→)"
          >
            <div class="p-2 bg-white/10 group-hover:bg-white/20 rounded-full transition-colors">
              <LuChevronRight class="w-5 h-5" />
            </div>
            <span class="text-xs">Next</span>
          </button>
        </div>

        {/* Report Dialog */}
        {showReportDialog.value && (
          <div
            class="absolute inset-0 flex items-center justify-center p-4 bg-black/50 z-50"
            onClick$={(e) => e.stopPropagation()}
          >
            <div class="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
              <h3 class="text-lg font-semibold mb-4">Report Image</h3>

              <form onSubmit$={handleReportSubmit}>
                <div class="mb-4">
                  <label class="block text-sm font-medium mb-2">Reason</label>
                  <select
                    bind:value={reportReason}
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="spam">Spam</option>
                    <option value="harassment">Harassment</option>
                    <option value="inappropriate">Inappropriate content</option>
                    <option value="violence">Violence</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div class="mb-4">
                  <label class="block text-sm font-medium mb-2">Additional details (optional)</label>
                  <textarea
                    bind:value={reportDetails}
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    rows={3}
                    placeholder="Provide more information..."
                  />
                </div>

                <div class="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick$={(e) => {
                      e.stopPropagation();
                      showReportDialog.value = false;
                    }}
                    class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isReporting.value}
                    class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isReporting.value ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
});