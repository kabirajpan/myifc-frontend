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
  LuZoomOut,
  LuPlay,
  LuPause,
  LuVolume2,
  LuVolumeX
} from "@qwikest/icons/lucide";
import { getGenderColor, getGenderBorderColor } from "../../utils/helpers";
import { EmojiPicker } from "./EmojiPicker";

export const MediaViewer = component$(({
  mediaUrl,
  mediaType = "image", // "image" | "gif" | "audio"
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
  if (!isOpen || !mediaUrl) return null;

  // Image/GIF states
  const rotation = useSignal(0);
  const isFullscreen = useSignal(false);
  const isHoveringImage = useSignal(false);
  const zoomLevel = useSignal(1);
  const isPanning = useSignal(false);
  const panOffset = useSignal({ x: 0, y: 0 });
  const panStart = useSignal({ x: 0, y: 0 });

  // Audio states
  const audioRef = useSignal(null);
  const isPlaying = useSignal(false);
  const currentTime = useSignal(0);
  const duration = useSignal(0);
  const volume = useSignal(1);
  const isMuted = useSignal(false);
  const waveformData = useSignal([]);

  // Common states
  const showEmojiPicker = useSignal(false);
  const showReportDialog = useSignal(false);
  const reportReason = useSignal("");
  const reportDetails = useSignal("");
  const isReporting = useSignal(false);

  const isAudio = mediaType === "audio";
  const isImageOrGif = mediaType === "image" || mediaType === "gif";

  // Audio Controls
  const togglePlayPause = $(() => {
    if (!audioRef.value) return;

    if (isPlaying.value) {
      audioRef.value.pause();
    } else {
      audioRef.value.play();
    }
  });

  const handleTimeUpdate = $(() => {
    if (audioRef.value) {
      currentTime.value = audioRef.value.currentTime;
    }
  });

  const handleLoadedMetadata = $(() => {
    if (audioRef.value) {
      duration.value = audioRef.value.duration;
    }
  });

  const handleSeek = $((e) => {
    if (!audioRef.value) return;
    const rect = e.target.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.value.currentTime = percent * duration.value;
  });

  const toggleMute = $(() => {
    if (!audioRef.value) return;
    isMuted.value = !isMuted.value;
    audioRef.value.muted = isMuted.value;
  });

  const handleVolumeChange = $((e) => {
    if (!audioRef.value) return;
    const newVolume = parseFloat(e.target.value);
    volume.value = newVolume;
    audioRef.value.volume = newVolume;
    isMuted.value = newVolume === 0;
  });

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate waveform data from audio
  const generateWaveform = $(async (audioUrl) => {
    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const rawData = audioBuffer.getChannelData(0);
      const samples = 60; // Number of bars
      const blockSize = Math.floor(rawData.length / samples);
      const filteredData = [];
      
      for (let i = 0; i < samples; i++) {
        let blockStart = blockSize * i;
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[blockStart + j]);
        }
        filteredData.push(sum / blockSize);
      }
      
      // Normalize the data
      const max = Math.max(...filteredData);
      const normalizedData = filteredData.map(n => (n / max) * 100);
      
      waveformData.value = normalizedData;
    } catch (err) {
      console.error('Failed to generate waveform:', err);
      // Fallback to simple bars if waveform generation fails
      waveformData.value = Array.from({ length: 60 }, () => Math.random() * 60 + 20);
    }
  });

  // Image Controls
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
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  });

  const handleShare = $(async (e) => {
    e.stopPropagation();

    if (onShare && messageData?.id) {
      await onShare(messageData.id);
    } else {
      try {
        await navigator.clipboard.writeText(mediaUrl);
        alert('Media URL copied to clipboard!');
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
    if (!isFullscreen.value) {
      zoomLevel.value = 1;
      panOffset.value = { x: 0, y: 0 };
    }
  });

  // Keyboard controls
  useVisibleTask$(() => {
    const handleKeyDown = (e) => {
      if (showReportDialog.value) return;

      switch (e.key) {
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
        case ' ':
          if (isAudio) {
            e.preventDefault();
            togglePlayPause();
          }
          break;
        case 'r':
        case 'R':
          if (isImageOrGif) {
            rotation.value = (rotation.value + 90) % 360;
          }
          break;
        case 'f':
        case 'F':
          if (isImageOrGif) {
            isFullscreen.value = !isFullscreen.value;
            if (!isFullscreen.value) {
              zoomLevel.value = 1;
              panOffset.value = { x: 0, y: 0 };
            }
          }
          break;
        case '+':
        case '=':
          if (isImageOrGif && isFullscreen.value && zoomLevel.value < 3) {
            zoomLevel.value = Math.min(3, zoomLevel.value + 0.25);
          }
          break;
        case '-':
        case '_':
          if (isImageOrGif && isFullscreen.value && zoomLevel.value > 1) {
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

  // Audio event listeners
  useVisibleTask$(() => {
    if (!isAudio || !audioRef.value) return;

    const audio = audioRef.value;

    audio.addEventListener('play', () => { isPlaying.value = true; });
    audio.addEventListener('pause', () => { isPlaying.value = false; });
    audio.addEventListener('ended', () => { isPlaying.value = false; });

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  });

  // Generate waveform when audio URL is available
  useVisibleTask$(({ track }) => {
    track(() => mediaUrl);
    track(() => isAudio);
    
    if (isAudio && mediaUrl) {
      generateWaveform(mediaUrl);
    }
  });

  // Fullscreen mode for images/gifs
  if (isFullscreen.value && isImageOrGif) {
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
        <img
          src={mediaUrl}
          alt="Full size preview"
          class="max-w-full max-h-full object-contain transition-transform duration-300"
          style={`
            transform: rotate(${rotation.value}deg) scale(${zoomLevel.value}) translate(${panOffset.value.x / zoomLevel.value}px, ${panOffset.value.y / zoomLevel.value}px);
            cursor: ${zoomLevel.value > 1 ? (isPanning.value ? 'grabbing' : 'grab') : 'default'};
          `}
          onClick$={(e) => e.stopPropagation()}
          onMouseDown$={handleMouseDown}
        />

        {isHoveringImage.value && (
          <>
            <div class="absolute top-4 right-4 flex items-center gap-2">
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

            {hasPrevious && onPrevious && (
              <button
                onClick$={(e) => {
                  e.stopPropagation();
                  onPrevious();
                  zoomLevel.value = 1;
                  panOffset.value = { x: 0, y: 0 };
                }}
                class="absolute left-4 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors backdrop-blur-sm"
                title="Previous (←)"
              >
                <LuChevronLeft class="w-6 h-6" />
              </button>
            )}

            {hasNext && onNext && (
              <button
                onClick$={(e) => {
                  e.stopPropagation();
                  onNext();
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
        {/* Close Button */}
        <button
          onClick$={onClose}
          class="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
          title="Close (Esc)"
        >
          <LuX class="w-6 h-6" />
        </button>

        {/* Sender Info */}
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

            {messageData.caption && (
              <div class="max-w-2xl text-center">
                <p class="text-sm text-white/90">{messageData.caption}</p>
              </div>
            )}
          </div>
        )}

        {/* Media Container */}
        <div class="flex-1 flex items-center justify-center px-4 py-6 relative">
          <div onClick$={(e) => e.stopPropagation()}>
            {isAudio ? (
              /* Audio Player - Minimalistic Design */
              <div class="w-full max-w-2xl bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                {/* Audio Element */}
                <audio
                  ref={audioRef}
                  src={mediaUrl}
                  onTimeUpdate$={handleTimeUpdate}
                  onLoadedMetadata$={handleLoadedMetadata}
                  class="hidden"
                />

                {/* Waveform Progress Bar */}
                <div class="mb-6">
                  <div
                    class="w-full h-16 bg-white/10 rounded cursor-pointer overflow-hidden relative"
                    onClick$={handleSeek}
                  >
                    {/* Waveform bars */}
                    <div class="absolute inset-0 flex items-center justify-around px-1">
                      {waveformData.value.length > 0 ? (
                        waveformData.value.map((height, i) => {
                          const progress = duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0;
                          const barProgress = (i / waveformData.value.length) * 100;
                          const isActive = barProgress <= progress;
                          
                          return (
                            <div
                              key={i}
                              class="w-1 rounded-full transition-all duration-150"
                              style={`height: ${Math.max(height, 10)}%; background-color: ${isActive ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)'}`}
                            />
                          );
                        })
                      ) : (
                        // Loading placeholder
                        <div class="text-white/40 text-sm">Loading waveform...</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Time Display */}
                  <div class="flex justify-between text-sm text-white/60 mt-3">
                    <span>{formatTime(currentTime.value)}</span>
                    <span>{formatTime(duration.value)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div class="flex items-center justify-between">
                  {/* Play/Pause Button */}
                  <button
                    onClick$={togglePlayPause}
                    class="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
                  >
                    {isPlaying.value ? (
                      <LuPause class="w-6 h-6 text-white" />
                    ) : (
                      <LuPlay class="w-6 h-6 text-white ml-0.5" />
                    )}
                  </button>

                  {/* Volume Control */}
                  <div class="flex items-center gap-3 flex-1 max-w-xs ml-6">
                    <button
                      onClick$={toggleMute}
                      class="text-white/60 hover:text-white transition-colors"
                    >
                      {isMuted.value || volume.value === 0 ? (
                        <LuVolumeX class="w-5 h-5" />
                      ) : (
                        <LuVolume2 class="w-5 h-5" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume.value}
                      onInput$={handleVolumeChange}
                      class="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                      style="accent-color: rgba(255, 255, 255, 0.8);"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Image/GIF */
              <img
                src={mediaUrl}
                alt="Full size preview"
                class="max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl transition-transform duration-300"
                style={`transform: rotate(${rotation.value}deg)`}
              />
            )}
          </div>
        </div>

        {/* Emoji Reactions */}
        <div class="flex items-center justify-center gap-3 pb-4 px-4">
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

          {messageData && onReact && (
            <>
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

              {showEmojiPicker.value && (
                <div
                  class="fixed inset-0 z-[150] flex items-center justify-center"
                  onClick$={(e) => {
                    e.stopPropagation();
                    showEmojiPicker.value = false;
                  }}
                >
                  <div onClick$={(e) => e.stopPropagation()}>
                    <EmojiPicker
                      show={true}
                      onEmojiSelect={handleEmojiSelect}
                      onClose={$(() => (showEmojiPicker.value = false))}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Controls */}
        <div class="flex items-center justify-center gap-3 pb-6 px-4">
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

          {isImageOrGif && (
            <>
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
            </>
          )}

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
              <h3 class="text-lg font-semibold mb-4">Report Media</h3>

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