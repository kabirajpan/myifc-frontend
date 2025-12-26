import { component$, useSignal, $ } from "@builder.io/qwik";
import {
  LuCornerUpLeft,
  LuImage,
  LuMic,
  LuTrash2,
  LuAlertCircle,
  LuPlay,
  LuPause,
  LuDownload,
  LuCheck,
} from "@qwikest/icons/lucide";
import { getGenderColor, getGenderBorderColor, formatTime } from "../../utils/helpers";

export const RoomMessageBubble = component$(
  ({
    msg,
    isOwn,
    showTime,
    onMessageClick,
    onUsernameClick,
    onDeleteMessage,
    onImageClick,
    deletingMessageId,
  }) => {
    const hasReply = msg.reply_to_message_id && msg.reply_to_message_content;
    const isMediaMessage = ["image", "gif", "audio"].includes(msg.type);
    const audioRef = useSignal(null);
    const isPlaying = useSignal(false);

    const toggleAudio = $(() => {
      if (!audioRef.value) return;
      if (isPlaying.value) {
        audioRef.value.pause();
        isPlaying.value = false;
      } else {
        audioRef.value.play();
        isPlaying.value = true;
      }
    });

    const renderMediaContent = () => {
      if (msg.type === "image" || msg.type === "gif") {
        return (
          <div class="mb-2">
            {/* Button bar above image */}
            <div class="flex items-center gap-2 mb-2">
              <button
                onClick$={() => onImageClick(msg.id, msg.content)}
                class="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                title="View full size"
              >
                <LuImage class="w-3 h-3" />
                <span>View</span>
              </button>

              {!isOwn && (
                <button
                  class="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors flex items-center gap-1"
                  title="Report"
                >
                  <LuAlertCircle class="w-3 h-3" />
                  <span>Report</span>
                </button>
              )}

              {isOwn && (
                <button
                  onClick$={() => onDeleteMessage(msg.id)}
                  disabled={deletingMessageId === msg.id}
                  class="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                  title="Delete"
                >
                  {deletingMessageId === msg.id ? (
                    <div class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <LuTrash2 class="w-3 h-3" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Image */}
            <div class={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <img
                src={msg.content}
                alt={msg.type}
                class="max-w-[150px] max-h-[100px] rounded-lg shadow-sm cursor-pointer hover:opacity-90 transition-opacity object-cover"
                onClick$={() => onImageClick(msg.id, msg.content)}
              />
            </div>
          </div>
        );
      }

      if (msg.type === "audio") {
        return (
          <div class="mb-2">
            {msg.caption && <p class="text-sm text-gray-700 mb-2">{msg.caption}</p>}
            <div class="flex items-center gap-2 bg-gray-100 rounded-lg p-2 max-w-xs">
              <button
                onClick$={toggleAudio}
                class="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
              >
                {isPlaying.value ? <LuPause class="w-4 h-4" /> : <LuPlay class="w-4 h-4" />}
              </button>
              <audio
                ref={audioRef}
                src={msg.content}
                onEnded$={() => (isPlaying.value = false)}
                class="hidden"
              />
              <span class="text-xs text-gray-600">Audio message</span>
              <a
                href={msg.content}
                download
                class="ml-auto p-1.5 text-gray-600 hover:text-purple-600 transition-colors"
                onClick$={(e) => e.stopPropagation()}
              >
                <LuDownload class="w-4 h-4" />
              </a>
            </div>
          </div>
        );
      }
      return null;
    };

    return (
      <div key={msg.id} class="group">
        {isOwn ? (
          // Own Message (Right aligned)
          <div class="flex items-start justify-end gap-2 px-2 py-1.5 hover:bg-gray-50 rounded">
            <div class="flex-1 min-w-0 flex flex-col items-end gap-1">
              {/* Reply Preview */}
              {hasReply && (
                <div class="w-full max-w-[80%] sm:max-w-[65%] md:max-w-[50%] lg:max-w-[40%] xl:max-w-[30%] bg-purple-50 border-l-2 border-purple-300 rounded-r p-1.5 mb-1">
                  <div class="flex items-start gap-1.5">
                    <LuCornerUpLeft class="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0" />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-1.5 mb-0.5">
                        <div class={`text-xs font-medium ${getGenderColor(msg.reply_to_message_gender)}`}>
                          {msg.reply_to_message_sender}
                        </div>
                        <div class="text-xs text-gray-500">{formatTime(msg.reply_to_message_time)}</div>
                      </div>
                      {(msg.reply_to_message_type === "image" || msg.reply_to_message_type === "gif") && (
                        <div class="flex items-center gap-1 mb-0.5">
                          <LuImage class="w-3 h-3 text-gray-500" />
                          <span class="text-xs text-gray-700">Image</span>
                        </div>
                      )}
                      {msg.reply_to_message_type === "audio" && (
                        <div class="flex items-center gap-1 mb-0.5">
                          <LuMic class="w-3 h-3 text-gray-500" />
                          <span class="text-xs text-gray-700">Voice message</span>
                        </div>
                      )}
                      {msg.reply_to_message_caption && (
                        <p class="text-xs text-gray-700">{msg.reply_to_message_caption}</p>
                      )}
                      {msg.reply_to_message_type === "text" && (
                        <p class="text-xs text-gray-700 truncate">{msg.reply_to_message_content}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div class="flex items-start gap-2 justify-end">
                {/* Time on left */}
                {showTime && (
                  <span class="text-xs text-gray-500 flex-shrink-0 self-end">
                    {formatTime(msg.created_at)}
                  </span>
                )}

                <div class="flex-1 min-w-0">
                  {/* Message text */}
                  {msg.type === "text" && (
                    <span
                      onClick$={() => onMessageClick(msg.id)}
                      class="text-sm text-gray-900 cursor-pointer break-words whitespace-pre-wrap inline-block text-right w-full"
                    >
                      {msg.content}
                    </span>
                  )}

                  {/* Media caption */}
                  {isMediaMessage && msg.caption && (
                    <span class="text-sm text-gray-900 break-words whitespace-pre-wrap inline-block text-right w-full">
                      {msg.caption}
                    </span>
                  )}
                </div>

                {/* Avatar on right */}
                <div class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[12px] font-semibold border-2 bg-white border-purple-600 text-purple-600 cursor-default mt-0.5">
                  {msg.sender_username?.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Media content */}
              {isMediaMessage && renderMediaContent()}
            </div>
          </div>
        ) : (
          // Other's Message (Left aligned)
          <div class="flex items-start gap-2 px-2 py-1.5 hover:bg-gray-50 rounded">
            <div class="flex-1 min-w-0 flex flex-col gap-1">
              {/* Reply Preview */}
              {hasReply && (
                <div class="w-full max-w-[80%] sm:max-w-[65%] md:max-w-[50%] lg:max-w-[40%] xl:max-w-[30%] bg-gray-100 border-l-2 border-gray-300 rounded-r p-1.5">
                  <div class="flex items-start gap-1.5">
                    <LuCornerUpLeft class="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-1.5 mb-0.5">
                        <div class={`text-xs font-medium ${getGenderColor(msg.reply_to_message_gender)}`}>
                          {msg.reply_to_message_sender}
                        </div>
                        <div class="text-xs text-gray-500">{formatTime(msg.reply_to_message_time)}</div>
                      </div>
                      {(msg.reply_to_message_type === "image" || msg.reply_to_message_type === "gif") && (
                        <div class="flex items-center gap-1 mb-0.5">
                          <LuImage class="w-3 h-3 text-gray-500" />
                          <span class="text-xs text-gray-700">Image</span>
                        </div>
                      )}
                      {msg.reply_to_message_type === "audio" && (
                        <div class="flex items-center gap-1 mb-0.5">
                          <LuMic class="w-3 h-3 text-gray-500" />
                          <span class="text-xs text-gray-700">Voice message</span>
                        </div>
                      )}
                      {msg.reply_to_message_caption && (
                        <p class="text-xs text-gray-700">{msg.reply_to_message_caption}</p>
                      )}
                      {msg.reply_to_message_type === "text" && (
                        <p class="text-xs text-gray-700 truncate">{msg.reply_to_message_content}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div class="flex items-start gap-2">
                {/* Avatar */}
                <div
                  class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[12px] font-semibold border-2 bg-white mt-0.5"
                  style={`color: ${getGenderBorderColor(msg.sender_gender)}; border-color: ${getGenderBorderColor(msg.sender_gender)};`}
                >
                  {msg.sender_username?.charAt(0).toUpperCase()}
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-baseline gap-x-1.5">
                    {/* Message text with username */}
                    {msg.type === "text" && (
                      <span
                        onClick$={() => onMessageClick(msg.id)}
                        class="text-sm text-gray-900 cursor-pointer break-words whitespace-pre-wrap flex-1 min-w-0"
                      >
                        <button
                          onClick$={() => onUsernameClick(msg)}
                          class={`font-bold text-sm hover:underline flex-shrink-0 ${getGenderColor(msg.sender_gender)}`}
                        >
                          {msg.sender_username}:{" "}
                        </button>
                        {msg.content}
                      </span>
                    )}

                    {/* Media caption */}
                    {isMediaMessage && msg.caption && (
                      <span class="text-sm text-gray-900 break-words whitespace-pre-wrap flex-1 min-w-0">
                        {msg.caption}
                      </span>
                    )}

                    {/* Time on right */}
                    {showTime && (
                      <span class="text-xs text-gray-500 flex-shrink-0 ml-auto">
                        {formatTime(msg.created_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Media content */}
              {isMediaMessage && renderMediaContent()}
            </div>
          </div>
        )}

        {/* Read indicator */}
        {isOwn && msg.is_read && (
          <div class="flex justify-end pr-2 mt-0.5">
            <LuCheck class="w-3 h-3 text-purple-600" />
          </div>
        )}
      </div>
    );
  }
);