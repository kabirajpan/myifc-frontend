import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import { useAuth } from "../../../../context/auth";
import { roomsApi } from "../../../../api/rooms";
import { friendsApi } from "../../../../api/friends";
import { mediaApi } from "../../../../api/media.js";
import { wsService } from "../../../../api/websocket";
import { useRoomContext } from "../../../../store/room.store";
import { useUserContext } from "../../../../store/user.store";
import { MediaUpload, MediaPreview } from "../../../../components/ui/MediaUpload.jsx";
import { ImageViewer } from "../../../../components/ui/ImageViewer.jsx";
import { EmojiPicker } from "../../../../components/ui/EmojiPicker.jsx";
import { getGenderColor, getGenderBorderColor, formatTime } from "../../../../utils/helpers";

import {
  LuMessageSquare,
  LuSend,
  LuUsers,
  LuSearch,
  LuAlertCircle,
  LuX,
  LuCheck,
  LuArrowLeft,
  LuSmile,
  LuReply,
  LuCheckCircle,
  LuUserPlus,
  LuBan,
  LuCornerUpLeft,
  LuTrash2,
  LuDownload,
  LuPlay,
  LuPause,
  LuImage,
  LuFilm,
  LuMic,
  LuLogOut,
  LuLock,
  LuCrown,
  LuBell,
  LuBellOff,
  LuPlus,
  LuEye,
} from "@qwikest/icons/lucide";

// ============================
// REUSABLE COMPONENTS (SAME STYLE AS CHAT)
// ============================

// Room List Item Component (Same as Chat List Item)
export const RoomListItem = component$(({
  room,
  isSelected,
  unreadCount,
  onSelect,
}) => {
  const getRoomIconColor = (room) => {
    if (room.is_private) return "border-purple-600 text-purple-600";
    if (room.member_count >= 50) return "border-red-600 text-red-600";
    if (room.member_count <= 5) return "border-gray-600 text-gray-600";
    return "border-green-600 text-green-600";
  };

  return (
    <div
      onClick$={() => onSelect(room)}
      class={`px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? "bg-pink-50" : ""
        }`}
    >
      <div class="flex items-start gap-2">
        <div class="relative flex-shrink-0">
          <div
            class={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium border-2 bg-white ${getRoomIconColor(room)}`}
          >
            {room.name.charAt(0).toUpperCase()}
          </div>
          {room.is_private && (
            <LuLock class="absolute -bottom-1 -right-1 w-3.5 h-3.5 text-purple-600 bg-white rounded-full p-0.5" />
          )}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-0.5">
            <span class={`font-medium text-xs truncate ${room.is_private ? 'text-purple-700' : 'text-gray-900'}`}>
              {room.name}
            </span>
            <span class="text-xs text-gray-500 flex-shrink-0 ml-1">
              {formatTime(room.last_message_time)}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <p class="text-xs text-gray-600 truncate flex-1 flex items-center gap-1">
              {room.last_message_type === 'image' && <LuImage class="w-3 h-3 flex-shrink-0" />}
              {room.last_message_type === 'gif' && <LuFilm class="w-3 h-3 flex-shrink-0" />}
              {room.last_message_type === 'audio' && <LuMic class="w-3 h-3 flex-shrink-0" />}
              <span class="truncate">{room.last_message || "No messages"}</span>
            </p>
            <div class="flex items-center gap-1.5">
              <span class="text-xs text-gray-500 flex items-center gap-0.5">
                <LuUsers class="w-3 h-3" />
                {room.member_count}
              </span>
              {unreadCount > 0 && (
                <span class="ml-1 bg-pink-600 text-white text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// User Menu Component (Same as Chat)
export const UserMenu = component$(({
  showUserMenu,
  userMenuPosition,
  selectedUser,
  auth,
  onClose,
  onSendFriendRequest,
  onBlockUser,
  onDirectMessage,
  onSecretReply,
}) => {
  if (!showUserMenu || !selectedUser) return null;

  return (
    <>
      <div class="fixed inset-0 z-50" onClick$={onClose} />
      <div
        class="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[160px]"
        style={`top: ${userMenuPosition.top}px; left: ${userMenuPosition.left}px;`}
      >
        <button
          onClick$={onDirectMessage}
          class="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors text-left"
        >
          <LuMessageSquare class="w-3.5 h-3.5 text-gray-600" />
          <span>Direct Message</span>
        </button>

        <button
          onClick$={onSecretReply}
          class="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-blue-50 text-blue-600 transition-colors text-left"
        >
          <LuLock class="w-3.5 h-3.5" />
          <span>Secret Reply</span>
        </button>

        {!auth.user.value?.is_guest && (
          <>
            <button
              onClick$={onSendFriendRequest}
              class="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors text-left"
            >
              <LuUserPlus class="w-3.5 h-3.5 text-gray-600" />
              <span>Add Friend</span>
            </button>

            <button
              onClick$={onBlockUser}
              class="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-50 text-red-600 transition-colors text-left"
            >
              <LuBan class="w-3.5 h-3.5" />
              <span>Block User</span>
            </button>
          </>
        )}
      </div>
    </>
  );
});


// MessageBubble component (Same as Chat but adapted for rooms)
export const MessageBubble = component$(({
  msg,
  isOwn,
  showTime,
  onMessageClick,
  onUsernameClick,
  onAvatarClick,
  onDeleteMessage,
  onImageClick,
  deletingMessageId,
  auth,
  onReactToMessage,
  onRemoveReaction,
  onOpenReactionPicker,
}) => {

  const hasReply = msg.reply_to_message_id && msg.reply_to_message_content;
  const isMediaMessage = ["image", "gif", "audio"].includes(msg.type);
  const isSystem = msg.type === "system";
  const isSecret = msg.type === "secret";
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

          <div class={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <div class="inline-block">
              <img
                src={msg.content}
                alt={msg.type}
                class="max-w-[150px] max-h-[100px] rounded-lg shadow-sm cursor-pointer hover:opacity-90 transition-opacity object-cover"
                onClick$={() => onImageClick(msg.id, msg.content)}
              />

              {/* ✅ ADD REACTIONS BELOW IMAGE */}
              {msg.reactions && msg.reactions.length > 0 && (
                <div class="flex flex-wrap gap-1 mt-1">
                  {/* Group reactions by emoji */}
                  {Object.entries(
                    msg.reactions.reduce((acc, reaction) => {
                      if (!acc[reaction.emoji]) {
                        acc[reaction.emoji] = [];
                      }
                      acc[reaction.emoji].push(reaction);
                      return acc;
                    }, {})
                  ).map(([emoji, reactions]) => {

                    const userReactionWithThisEmoji = reactions.find(r => r.user_id === auth.user.value?.id);
                    const hasUserReactedWithThisEmoji = !!userReactionWithThisEmoji;

                    return (
                      <button
                        key={emoji}
                        onClick$={() => {
                          if (hasUserReactedWithThisEmoji) {
                            // Remove reaction - user already reacted with this emoji
                            onRemoveReaction(msg.id, userReactionWithThisEmoji.id);
                          } else {
                            // Add reaction - user hasn't reacted with this emoji yet
                            onReactToMessage(msg.id, emoji);
                          }
                        }}
                        class={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-all ${hasUserReactedWithThisEmoji
                          ? 'bg-pink-100 border border-pink-300 text-pink-700'
                          : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'
                          }`}
                        title={reactions.map(r => r.username || 'User').join(', ')}
                      >
                        <span>{emoji}</span>
                        <span class="font-medium">{reactions.length}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ✅ QUICK REACT BUTTONS + EMOJI PICKER */}
              <div class="relative">
                <div class="flex gap-1 mt-1">
                  {['❤️', '👍', '😂', '😮', '😢'].map(emoji => {
                    // Check if user already reacted with this emoji
                    const existingReaction = (msg.reactions || []).find(
                      r => r.emoji === emoji && r.user_id === auth.user.value?.id
                    );

                    return (
                      <button
                        key={emoji}
                        onClick$={() => {
                          if (existingReaction) {
                            // Remove if already reacted
                            onRemoveReaction(msg.id, existingReaction.id);
                          } else {
                            // Add if not reacted
                            onReactToMessage(msg.id, emoji);
                          }
                        }}
                        class={`w-6 h-6 flex items-center justify-center rounded transition-colors text-sm ${existingReaction
                          ? 'bg-pink-100 border border-pink-300'
                          : 'hover:bg-gray-100'
                          }`}
                        title={`React with ${emoji}`}
                      >
                        {emoji}
                      </button>
                    );
                  })}

                  {/* ✅ Plus button to open emoji picker */}
                  <button
                    onClick$={(e) => {
                      e.stopPropagation();
                      onOpenReactionPicker(msg.id); // ✅ CHANGED
                    }}
                    class="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded transition-colors text-gray-500 border border-gray-300"
                    title="More reactions"
                  >
                    <LuPlus class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (msg.type === "audio") {
      return (
        <div class="mb-2">
          {msg.caption && (
            <p class="text-sm text-gray-700 mb-2">{msg.caption}</p>
          )}
          <div class="flex items-center gap-2 bg-gray-100 rounded-lg p-2 max-w-xs">
            <button
              onClick$={toggleAudio}
              class="p-2 bg-pink-600 text-white rounded-full hover:bg-pink-700 transition-colors"
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
              class="ml-auto p-1.5 text-gray-600 hover:text-pink-600 transition-colors"
              onClick$={(e) => e.stopPropagation()}
            >
              <LuDownload class="w-4 h-4" />
            </a>
          </div>
        </div >
      );
    }
    return null;
  };

  // System message
  if (isSystem) {
    return (
      <div key={msg.id} class="flex justify-center my-2">
        <div class="inline-block bg-yellow-50 text-yellow-800 px-3 py-1.5 rounded-lg text-xs border border-yellow-100">
          {msg.content}
        </div>
      </div>
    );
  }

  // For OWN messages: Show on right side
  if (isOwn) {
    return (
      <div key={msg.id} class="group">
        <div class="flex items-start justify-end gap-2 px-2 py-1.5 hover:bg-gray-50 rounded">
          <div class="flex-1 min-w-0 flex flex-col items-end gap-1">
            {hasReply && (
              <div class={`w-full max-w-[80%] sm:max-w-[65%] md:max-w-[50%] lg:max-w-[40%] xl:max-w-[30%] bg-pink-50 border-l-2 border-pink-300 rounded-r p-1.5 mb-1`}>
                <div class="flex items-start gap-1.5">
                  <LuCornerUpLeft class="w-3 h-3 text-pink-500 mt-0.5 flex-shrink-0" />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5 mb-0.5">
                      <div class={`text-xs font-medium ${getGenderColor(msg.reply_to_message_gender)}`}>
                        {msg.reply_to_message_sender}
                      </div>
                      <div class="text-xs text-gray-500">{formatTime(msg.reply_to_message_time)}</div>
                    </div>
                    {(msg.reply_to_message_type === 'image' || msg.reply_to_message_type === 'gif') && (
                      <div class="flex items-center gap-1 mb-0.5">
                        <LuImage class="w-3 h-3 text-gray-500" />
                        <span class="text-xs text-gray-700">Image</span>
                      </div>
                    )}
                    {msg.reply_to_message_type === 'audio' && (
                      <div class="flex items-center gap-1 mb-0.5">
                        <LuMic class="w-3 h-3 text-gray-500" />
                        <span class="text-xs text-gray-700">Voice message</span>
                      </div>
                    )}
                    {msg.reply_to_message_caption && (
                      <p class="text-xs text-gray-700">{msg.reply_to_message_caption}</p>
                    )}
                    {msg.reply_to_message_type === 'text' && (
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
                {/* Message text only */}
                {msg.type === "text" && (
                  <span
                    onClick$={() => onMessageClick(msg.id)}
                    class="text-sm text-gray-900 cursor-pointer break-words whitespace-pre-wrap inline-block text-right w-full"
                  >
                    {msg.content}
                  </span>
                )}

                {/* Media caption only */}
                {isMediaMessage && msg.caption && (
                  <span class="text-sm text-gray-900 break-words whitespace-pre-wrap inline-block text-right w-full">
                    {msg.caption}
                  </span>
                )}
              </div>

              {/* Avatar on right */}
              <div class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[12px] font-semibold border-2 bg-white border-pink-600 text-pink-600 cursor-default mt-0.5">
                {msg.sender_username?.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Media AFTER username */}
            {isMediaMessage && renderMediaContent()}
          </div>
        </div>
      </div>
    );
  }

  // For OTHERS' messages: Original layout
  return (
    <div key={msg.id} class="group">
      <div class="flex items-start gap-2 px-2 py-1.5 hover:bg-gray-50 rounded">
        {/* Avatar */}
        <div
          class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[12px] font-semibold border-2 bg-white mt-0.5 cursor-pointer"
          style={`color: ${getGenderBorderColor(msg.sender_gender)}; border-color: ${getGenderBorderColor(msg.sender_gender)};`}
          onClick$={() => onAvatarClick(msg)}
        >
          {msg.sender_username?.charAt(0).toUpperCase()}
        </div>

        <div class="flex-1 min-w-0 flex flex-col gap-1">
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
                  {(msg.reply_to_message_type === 'image' || msg.reply_to_message_type === 'gif') && (
                    <div class="flex items-center gap-1 mb-0.5">
                      <LuImage class="w-3 h-3 text-gray-500" />
                      <span class="text-xs text-gray-700">Image</span>
                    </div>
                  )}
                  {msg.reply_to_message_type === 'audio' && (
                    <div class="flex items-center gap-1 mb-0.5">
                      <LuMic class="w-3 h-3 text-gray-500" />
                      <span class="text-xs text-gray-700">Voice message</span>
                    </div>
                  )}
                  {msg.reply_to_message_caption && (
                    <p class="text-xs text-gray-700">{msg.reply_to_message_caption}</p>
                  )}
                  {msg.reply_to_message_type === 'text' && (
                    <p class="text-xs text-gray-700 truncate">{msg.reply_to_message_content}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div class="flex items-start gap-2">
            <div class="flex-1 min-w-0">
              {/* Flexible container */}
              <div class="flex flex-wrap items-baseline gap-x-1.5">
                {/* Message text */}
                {msg.type === "text" && (
                  <span
                    onClick$={() => onMessageClick(msg.id)}
                    class="text-sm text-gray-900 cursor-pointer break-words whitespace-pre-wrap flex-1 min-w-0"
                  >
                    {/* Username with colon */}
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

                {/* Time on the right */}
                {showTime && (
                  <span class="text-xs text-gray-500 flex-shrink-0 ml-auto">
                    {formatTime(msg.created_at)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Media FIRST for receiver */}
          {isMediaMessage && renderMediaContent()}

          {/* Secret reply indicator */}
          {isSecret && (
            <div class="flex items-center gap-1 mt-1 text-xs text-blue-600">
              <LuLock class="w-2.5 h-2.5" />
              <span>Secret to {msg.recipient_username}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Room Header Component
export const RoomHeader = component$(({
  room,
  timeLeft,
  hasJoined,
  membersCount,
  onBack,
  onToggleMembers,
  onLeaveRoom,
  onDeleteRoom,
  canDelete,
}) => {
  return (
    <div class="flex-shrink-0 px-3 py-2.5 border-b border-gray-200 bg-white">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick$={onBack}
            class="sm:hidden p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
            aria-label="Back to rooms"
          >
            <LuArrowLeft class="w-4 h-4" />
          </button>

          <div class={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 ${room?.is_private ? 'bg-purple-600' : 'bg-pink-600'}`}>
            {room?.name.charAt(0).toUpperCase()}
          </div>

          <div class="flex-1 min-w-0">
            <h2 class="font-semibold text-gray-900 text-sm truncate">
              {room?.name}
              {room?.is_private && <LuLock class="w-3 h-3 text-purple-600 inline ml-1" />}
            </h2>
            <p class="text-xs text-gray-500 truncate">
              {room?.description || `by ${room?.creator_username}`}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-1">
          <button
            onClick$={onToggleMembers}
            class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LuUsers class="w-3.5 h-3.5" />
            <span>{membersCount}</span>
          </button>

          {canDelete && (
            <button
              onClick$={onDeleteRoom}
              class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete room"
            >
              <LuTrash2 class="w-3.5 h-3.5" />
            </button>
          )}

          {hasJoined && (
            <button
              onClick$={onLeaveRoom}
              class="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Leave room"
            >
              <LuLogOut class="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {room?.will_expire && timeLeft > 0 && (
        <div class="mt-2 flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded-lg">
          <LuAlertCircle class="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-red-800">
              Room closing in:{" "}
              <span class="font-semibold">{formatTimeLeft(timeLeft)}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

// Members Sidebar Component
export const MembersSidebar = component$(({
  showMembers,
  members,
  auth,
  onClose,
  onAvatarClick,
}) => {
  if (!showMembers) return null;

  return (
    <>
      <div
        class="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick$={onClose}
      />

      <div class="fixed top-16 right-0 bottom-0 w-72 bg-white shadow-2xl z-50 lg:relative lg:top-0 lg:w-64 lg:border lg:border-gray-200 lg:rounded-lg p-3 overflow-hidden flex flex-col">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <LuUsers class="w-4 h-4" />
            Members
          </h3>
          <button
            onClick$={onClose}
            class="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors lg:hidden"
          >
            <LuX class="w-4 h-4" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto space-y-2">
          {members.filter((member) => member.is_online).map((member) => (
            <button
              key={member.id}
              onClick$={(e) =>
                member.user_id !== auth.user.value?.id &&
                onAvatarClick(e, member)
              }
              disabled={member.user_id === auth.user.value?.id}
              class="w-full flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left disabled:cursor-default disabled:hover:bg-transparent"
            >
              <div class="relative">
                <div
                  class={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 bg-white ${member.user_id === auth.user.value?.id
                    ? "border-pink-600 text-pink-600"
                    : ""
                    }`}
                  style={
                    member.user_id !== auth.user.value?.id
                      ? `color: ${getGenderBorderColor(member.gender)}; border-color: ${getGenderBorderColor(member.gender)};`
                      : ""
                  }
                >
                  {member.username.charAt(0).toUpperCase()}
                </div>
                {member.is_online && (
                  <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                )}
              </div>
              <div class="flex-1 min-w-0">
                <span
                  class={`text-xs font-medium block truncate ${getGenderColor(member.gender)}`}
                >
                  {member.username}
                  {member.user_id === auth.user.value?.id && " (You)"}
                </span>
                <span class="text-xs text-gray-500">
                  {member.is_guest ? "Guest" : "User"}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
});

// ============================
// MAIN ROOM CHAT COMPONENT
// ============================

const buildImageViewerData = (messages) => {
  return messages
    .filter(m => m.type === 'image' || m.type === 'gif')
    .map(m => ({
      id: m.id,
      url: m.content,
      sender_username: m.sender_username,
      sender_gender: m.sender_gender,
      caption: m.caption,
      created_at: m.created_at,
      reactions: m.reactions || [],
    }));
};

const findImageIndex = (images, messageId) => {
  return images.findIndex(img => img.id === messageId);
};

const formatTimeLeft = (ms) => {
  if (!ms || ms <= 0) return "Expired";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default component$(() => {
  const location = useLocation();
  const nav = useNavigate();
  const auth = useAuth();

  // Use stores (same as chat)
  const room = useRoomContext();
  const users = useUserContext();

  const roomId = location.params.roomId;

  // Room state
  const currentRoom = useSignal(null);
  const members = useSignal([]);
  const timeLeft = useSignal(null);

  // Local UI state (same as chat)
  const newMessage = useSignal("");
  const messageContainerRef = useSignal(null);
  const showEmojiPicker = useSignal(false);
  const isAtBottom = useSignal(true);
  const previousMessagesLength = useSignal(0);
  const viewerImage = useSignal(null);
  const showImageViewer = useSignal(false);
  const selectedUser = useSignal(null);
  const showUserMenu = useSignal(false);
  const userMenuPosition = useSignal({ top: 0, left: 0 });
  const selectedMedia = useSignal(null);
  const replyingTo = useSignal(null);
  const secretReplyTo = useSignal(null);
  const hasJoined = useSignal(false);
  const showMembers = useSignal(false);
  const showRoomList = useSignal(true);
  const activeReactionMessageId = useSignal(null);


  // Scroll functions (same as chat)
  const scrollToBottom = $(() => {
    if (messageContainerRef.value) {
      messageContainerRef.value.scrollTop = messageContainerRef.value.scrollHeight;
      isAtBottom.value = true;
    }
  });

  const checkIfAtBottom = $(() => {
    if (!messageContainerRef.value) return;
    const container = messageContainerRef.value;
    const threshold = 100;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    isAtBottom.value = distanceFromBottom <= threshold;
  });

  // Auto-scroll on new messages (same as chat)
  useVisibleTask$(({ track }) => {
    track(() => room.state.messages);
    if (!messageContainerRef.value || room.state.messages.length === 0) return;

    const isUserScrollingUp = !isAtBottom.value;
    const isNewMessage = room.state.messages.length > previousMessagesLength.value;
    const isInitialLoad = previousMessagesLength.value === 0;

    if (isInitialLoad || (!isUserScrollingUp && isNewMessage)) {
      scrollToBottom();
    }
    previousMessagesLength.value = room.state.messages.length;
  });

  // Load room data and setup WebSocket
  const loadRoomData = $(async () => {
    try {
      const [roomData, messagesData, membersData] = await Promise.all([
        roomsApi.getRoom(roomId),
        roomsApi.getMessages(roomId),
        roomsApi.getMembers(roomId),
      ]);

      currentRoom.value = roomData.room;
      members.value = membersData.members || [];
      hasJoined.value = members.value.some(m => m.user_id === auth.user.value?.id);

      // Convert messages to same format as chat
      room.state.messages = (messagesData.messages || []).map(msg => ({
        ...msg,
        isOwn: msg.sender_id === auth.user.value?.id,
      }));

      // Load room list for sidebar
      const roomsData = await roomsApi.getAllRooms();
      room.state.rooms = roomsData.rooms || [];

      if (currentRoom.value.will_expire) {
        timeLeft.value = currentRoom.value.time_left_ms;
      }

      room.state.loading = false;
    } catch (err) {
      room.state.error = err.message;
      room.state.loading = false;
    }
  });

  // WebSocket message handler (adapted for rooms)
  const handleWebSocketMessage = $((data) => {
    if (data.type === "new_message") {
      // For rooms, we need to check if message belongs to current room
      if (data.data?.room_id === roomId) {
        const newMsg = {
          ...data.data.message,
          isOwn: data.data.message.sender_id === auth.user.value?.id,
        };

        const exists = room.state.messages.some(m => m.id === newMsg.id);
        if (!exists) {
          room.state.messages = [...room.state.messages, newMsg];

          if (room.state.imageViewer.isBuilt && (newMsg.type === 'image' || newMsg.type === 'gif')) {
            room.state.imageViewer.images = [
              ...room.state.imageViewer.images,
              {
                id: newMsg.id,
                url: newMsg.content,
                sender_username: newMsg.sender_username,
                sender_gender: newMsg.sender_gender,
                caption: newMsg.caption,
                created_at: newMsg.created_at,
                reactions: newMsg.reactions || [],
              }
            ];
          }

          if (isAtBottom.value) {
            setTimeout(() => scrollToBottom(), 50);
          }
        }
      }
    }

    // Handle member updates
    if (data.type === "user_joined_room" || data.type === "user_left_room") {
      if (data.data?.room_id === roomId) {
        // Update members list
        loadRoomData();
      }
    }
  });

  // Initialize
  useVisibleTask$(async ({ cleanup }) => {
    try {
      room.state.loading = true;

      wsService.connect();
      const unsubscribe = wsService.onMessage(handleWebSocketMessage);

      await loadRoomData();

      // Countdown timer for expiring rooms
      const interval = setInterval(() => {
        if (currentRoom.value?.will_expire && timeLeft.value > 0) {
          timeLeft.value = Math.max(0, timeLeft.value - 1000);
          if (timeLeft.value <= 0) {
            room.state.error = "This room has expired";
            nav("/rooms");
          }
        }
      }, 1000);

      room.state.loading = false;

      return () => {
        unsubscribe();
        wsService.disconnect();
        clearInterval(interval);
      };
    } catch (err) {
      room.state.error = err.message;
      room.state.loading = false;
    }
  });

  // Room actions
  const handleJoinRoom = $(async () => {
    try {
      await roomsApi.joinRoom(roomId);
      hasJoined.value = true;
      await loadRoomData();
      room.state.successMessage = "Joined room!";
      setTimeout(() => (room.state.successMessage = null), 3000);
    } catch (err) {
      room.state.error = err.message;
    }
  });

  const handleLeaveRoom = $(async () => {
    if (!confirm("Are you sure you want to leave this room?")) return;

    try {
      await roomsApi.leaveRoom(roomId);
      nav("/rooms");
    } catch (err) {
      room.state.error = err.message;
    }
  });

  const handleDeleteRoom = $(async () => {
    if (!confirm("Are you sure you want to delete this room? This cannot be undone.")) return;

    try {
      await roomsApi.deleteRoom(roomId);
      nav("/rooms");
    } catch (err) {
      room.state.error = err.message;
    }
  });

  // Message sending (same as chat but adapted for rooms)
  const handleMediaSend = $(async (messageText) => {
    if (!roomId) return;
    if (!selectedMedia.value) return;

    if (selectedMedia.value.uploading) {
      room.state.error = 'Please wait for upload to complete';
      return;
    }

    if (!selectedMedia.value.publicId) {
      room.state.error = 'Upload failed, please try again';
      selectedMedia.value = null;
      return;
    }

    const mediaType = selectedMedia.value.type;
    const publicId = selectedMedia.value.publicId;
    const caption = messageText && messageText.trim() ? messageText.trim() : null;

    // Create temp message
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      sender_id: auth.user.value.id,
      sender_username: auth.user.value.username,
      sender_gender: auth.user.value.gender,
      content: selectedMedia.value.preview,
      type: mediaType,
      caption: caption,
      created_at: new Date().toISOString(),
      isOwn: true,
      is_read: false,
      sending: true,
      reply_to_message_id: replyingTo.value?.id || null,
      ...(replyingTo.value && {
        reply_to_message_content: replyingTo.value.content,
        reply_to_message_sender: replyingTo.value.username,
        reply_to_message_gender: replyingTo.value.gender,
        reply_to_message_time: replyingTo.value.created_at,
        reply_to_message_type: replyingTo.value.type || "text",
        reply_to_message_caption: replyingTo.value.caption || null,
      }),
    };

    room.state.messages = [...room.state.messages, tempMessage];
    const replyId = replyingTo.value?.id || null;
    selectedMedia.value = null;
    replyingTo.value = null;
    newMessage.value = "";

    scrollToBottom();

    try {
      // Send to backend - use publicId as content
      await roomsApi.sendMessage(roomId, publicId, mediaType, replyId, null, caption);

      // Refresh messages
      const messagesData = await roomsApi.getMessages(roomId);
      room.state.messages = (messagesData.messages || []).map(msg => ({
        ...msg,
        isOwn: msg.sender_id === auth.user.value?.id,
      }));

      room.state.successMessage = `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} sent!`;
      setTimeout(() => (room.state.successMessage = null), 3000);
    } catch (err) {
      room.state.messages = room.state.messages.filter(m => m.id !== tempId);
      room.state.error = err.message || 'Failed to send media';
    }
  });

  const handleSendMessage = $(async () => {
    // Handle media message
    if (selectedMedia.value) {
      await handleMediaSend(newMessage.value);
      return;
    }

    // Validate text message
    const messageText = newMessage.value?.trim();
    if (!messageText) return;

    if (!roomId) {
      room.state.error = 'No room selected';
      return;
    }

    // Create temp message
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      sender_id: auth.user.value.id,
      sender_username: auth.user.value.username,
      sender_gender: auth.user.value.gender,
      content: messageText,
      created_at: new Date().toISOString(),
      isOwn: true,
      is_read: false,
      type: "text",
      sending: true,
      reply_to_message_id: replyingTo.value?.id || null,
      ...(replyingTo.value && {
        reply_to_message_content: replyingTo.value.content,
        reply_to_message_sender: replyingTo.value.username,
        reply_to_message_gender: replyingTo.value.gender,
        reply_to_message_time: replyingTo.value.created_at,
        reply_to_message_type: replyingTo.value.type || "text",
        reply_to_message_caption: replyingTo.value.caption || null,
      }),
    };

    room.state.messages = [...room.state.messages, tempMessage];
    const replyId = replyingTo.value?.id || null;
    replyingTo.value = null;
    newMessage.value = "";

    setTimeout(() => scrollToBottom(), 50);

    try {
      // Send to backend
      await roomsApi.sendMessage(roomId, messageText, "text", replyId, secretReplyTo.value?.user_id);

      // Refresh messages
      const messagesData = await roomsApi.getMessages(roomId);
      room.state.messages = (messagesData.messages || []).map(msg => ({
        ...msg,
        isOwn: msg.sender_id === auth.user.value?.id,
      }));

      secretReplyTo.value = null;
    } catch (err) {
      room.state.messages = room.state.messages.filter(m => m.id !== tempId);
      room.state.error = err.message || 'Failed to send message';
    }
  });

  const handleKeyPress = $((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  // User interaction handlers
  const handleAvatarClick = $((e, user) => {
    if (user.user_id === auth.user.value?.id) return;

    const rect = e.target.getBoundingClientRect();
    userMenuPosition.value = { top: rect.bottom + 5, left: rect.left };
    selectedUser.value = user;
    showUserMenu.value = true;
  });

  const handleUsernameClick = $((message) => {
    if (message.sender_id === auth.user.value?.id) return;

    let contentForReply = message.content;
    if (message.type === 'image' || message.type === 'gif') {
      contentForReply = message.caption || 'Image';
    } else if (message.type === 'audio') {
      contentForReply = message.caption || 'Voice message';
    }

    replyingTo.value = {
      id: message.id,
      username: message.sender_username,
      content: contentForReply,
      gender: message.sender_gender,
      created_at: message.created_at,
      type: message.type,
      caption: message.caption,
    };
  });

  const handleDeleteMessage = $(async (messageId) => {
    if (!confirm("Delete this message? This cannot be undone.")) return;

    try {
      room.state.deletingMessageId = messageId;
      await roomsApi.deleteMessage(roomId, messageId);
      room.state.messages = room.state.messages.filter((m) => m.id !== messageId);
      room.state.successMessage = "Message deleted";
      setTimeout(() => (room.state.successMessage = null), 3000);
    } catch (err) {
      room.state.error = err.message;
    } finally {
      room.state.deletingMessageId = null;
    }
  });

  const handleReactToMessage = $(async (messageId, emoji) => {
    // 1️⃣ Create temporary reaction for instant UI update
    const tempReaction = {
      id: `temp-${Date.now()}`,
      emoji,
      user_id: auth.user.value.id,
      username: auth.user.value.username,
      created_at: Date.now()
    };

    // 2️⃣ Optimistically update UI immediately
    room.state.messages = room.state.messages.map(m => {
      if (m.id === messageId) {
        return { ...m, reactions: [...(m.reactions || []), tempReaction] };
      }
      return m;
    });

    try {
      // 3️⃣ Call API in background
      const response = await roomsApi.reactToMessage(roomId, messageId, emoji);
      const realReaction = response.data;

      // 4️⃣ Replace temp with real reaction
      room.state.messages = room.state.messages.map(m => {
        if (m.id === messageId) {
          const reactions = m.reactions.filter(r => r.id !== tempReaction.id);
          return { ...m, reactions: [...reactions, realReaction] };
        }
        return m;
      });

    } catch (err) {
      // 5️⃣ Rollback on error
      room.state.messages = room.state.messages.map(m => {
        if (m.id === messageId) {
          const reactions = m.reactions.filter(r => r.id !== tempReaction.id);
          return { ...m, reactions };
        }
        return m;
      });
      room.state.error = err.message || "Failed to add reaction";
    }
  });

  const handleRemoveReaction = $(async (messageId, reactionId) => {
    // 1️⃣ Find the reaction to remove
    const msg = room.state.messages.find(m => m.id === messageId);
    const reactionToRemove = msg?.reactions?.find(r => r.id === reactionId);

    if (!reactionToRemove) return;

    // 2️⃣ Optimistically remove from UI immediately
    room.state.messages = room.state.messages.map(m => {
      if (m.id === messageId) {
        const reactions = m.reactions.filter(r => r.id !== reactionId);
        return { ...m, reactions };
      }
      return m;
    });

    try {
      // 3️⃣ Call API in background
      await roomsApi.removeReaction(roomId, reactionId);

    } catch (err) {
      // 4️⃣ Rollback on error - add reaction back
      room.state.messages = room.state.messages.map(m => {
        if (m.id === messageId) {
          return { ...m, reactions: [...(m.reactions || []), reactionToRemove] };
        }
        return m;
      });
      room.state.error = err.message || "Failed to remove reaction";
    }
  });

  const handleSendFriendRequest = $(async () => {
    if (auth.user.value?.is_guest) {
      room.state.error = "Guest users cannot send friend requests";
      showUserMenu.value = false;
      return;
    }

    try {
      await friendsApi.sendRequest(selectedUser.value.user_id);
      room.state.successMessage = "Friend request sent!";
      setTimeout(() => (room.state.successMessage = null), 3000);
      showUserMenu.value = false;
    } catch (err) {
      room.state.error = err.message;
      showUserMenu.value = false;
    }
  });

  const handleDirectMessage = $(async () => {
    const userId = selectedUser.value.user_id;
    const username = selectedUser.value.username;
    showUserMenu.value = false;
    await nav(`/chat?user=${userId}&name=${username}`);
  });

  const handleSecretReply = $(() => {
    secretReplyTo.value = selectedUser.value;
    showUserMenu.value = false;
  });

  const handleBlockUser = $(async () => {
    if (auth.user.value?.is_guest) {
      room.state.error = "Guest users cannot block users";
      showUserMenu.value = false;
      return;
    }

    if (!confirm(`Are you sure you want to block ${selectedUser.value.username}?`)) {
      showUserMenu.value = false;
      return;
    }

    try {
      await friendsApi.blockUser(selectedUser.value.user_id);
      room.state.successMessage = "User blocked";
      setTimeout(() => (room.state.successMessage = null), 3000);
      showUserMenu.value = false;
    } catch (err) {
      room.state.error = err.message;
      showUserMenu.value = false;
    }
  });

  const renderMessages = () => {
    if (room.state.messages.length === 0) {
      return (
        <div class="flex flex-col items-center justify-center py-8">
          <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
            <LuMessageSquare class="w-5 h-5 text-gray-400" />
          </div>
          <p class="text-xs text-gray-500">No messages yet</p>
          <p class="text-xs text-gray-400 mt-0.5">Start the conversation!</p>
        </div>
      );
    }

    return room.state.messages.map((msg) => (
      <MessageBubble
        key={msg.id}
        msg={msg}
        isOwn={msg.isOwn}
        showTime={room.selectedMessageId.value === msg.id}
        onMessageClick={$((id) => (room.selectedMessageId.value = room.selectedMessageId.value === id ? null : id))}
        onUsernameClick={handleUsernameClick}
        onAvatarClick={$((msg) => handleAvatarClick({ target: document.createElement('div') }, {
          user_id: msg.sender_id,
          username: msg.sender_username,
          gender: msg.sender_gender
        }))}
        onDeleteMessage={handleDeleteMessage}
        onImageClick={$((messageId, url) => {
          if (!room.state.imageViewer.isBuilt) {
            room.state.imageViewer.images = buildImageViewerData(room.state.messages);
            room.state.imageViewer.isBuilt = true;
          }
          const index = findImageIndex(room.state.imageViewer.images, messageId);
          if (index !== -1) {
            room.state.imageViewer.currentIndex = index;
            room.state.imageViewer.isOpen = true;
          }
        })}
        deletingMessageId={room.state.deletingMessageId}
        auth={auth}
        onReactToMessage={handleReactToMessage}
        onRemoveReaction={handleRemoveReaction}
        onOpenReactionPicker={$((messageId) => activeReactionMessageId.value = messageId)} // ✅ ADD THIS
      />
    ));
  };

  const canDelete = auth.user.value?.role === "admin" ||
    currentRoom.value?.creator_id === auth.user.value?.id;

  return (
    <div class="fixed inset-0 top-16 flex flex-col sm:flex-row sm:gap-3 sm:p-3 bg-gray-50 sm:bg-transparent">
      {/* Room List Sidebar (Same as Chat List) */}
      <div class={`${showRoomList.value ? "flex" : "hidden"} sm:flex w-full sm:w-72 lg:w-80 bg-white sm:border sm:border-gray-200 sm:rounded-lg flex-col overflow-hidden h-full`}>
        <div class="px-3 py-3 border-b border-gray-200">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-base font-semibold text-gray-900">Rooms</h2>
            <button
              onClick$={() => nav("/rooms/create")}
              class="p-1.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              title="Create room"
            >
              <LuPlus class="w-3.5 h-3.5" />
            </button>
          </div>
          <div class="relative">
            <LuSearch class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={room.state.searchQuery}
              onInput$={(e) => (room.state.searchQuery = e.target.value)}
              class="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          {room.state.loading && room.state.rooms?.length === 0 && (
            <div class="flex items-center justify-center py-8">
              <div class="text-center">
                <div class="w-6 h-6 border-2 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                <p class="text-xs text-gray-500">Loading...</p>
              </div>
            </div>
          )}

          {!room.state.loading && room.state.rooms?.length === 0 && (
            <div class="flex flex-col items-center justify-center py-8 px-3">
              <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <LuMessageSquare class="w-5 h-5 text-gray-400" />
              </div>
              <p class="text-xs text-gray-500 text-center">No rooms available</p>
              <button
                onClick$={() => nav("/rooms/create")}
                class="mt-2 px-3 py-1.5 bg-pink-600 text-white text-xs rounded-lg hover:bg-pink-700 transition-colors"
              >
                Create Room
              </button>
            </div>
          )}

          <div class="divide-y divide-gray-100">
            {room.state.rooms?.map((roomItem) => (
              <RoomListItem
                key={roomItem.id}
                room={roomItem}
                isSelected={roomId === roomItem.id}
                unreadCount={roomItem.unread_count || 0}
                onSelect={$(() => {
                  showRoomList.value = false; // ✅ ADD THIS
                  nav(`/rooms/${roomItem.id}`);
                })}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Room Area */}
      <div class={`${!showRoomList.value ? "flex" : "hidden"} sm:flex flex-1 bg-white sm:border sm:border-gray-200 sm:rounded-lg flex-col overflow-hidden h-full`}>
        {!currentRoom.value ? (
          <div class="flex-1 flex items-center justify-center p-4">
            <div class="text-center">
              <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <LuMessageSquare class="w-6 h-6 text-gray-400" />
              </div>
              <h3 class="text-sm font-medium text-gray-900 mb-1">No room selected</h3>
              <p class="text-xs text-gray-500">Choose a room to start chatting</p>
            </div>
          </div>
        ) : (
          <div class="flex flex-col h-full">
            <RoomHeader
              room={currentRoom.value}
              timeLeft={timeLeft.value}
              hasJoined={hasJoined.value}
              membersCount={members.value.length}
              onBack={$(() => (showRoomList.value = true))}
              onToggleMembers={$(() => (showMembers.value = !showMembers.value))}
              onLeaveRoom={handleLeaveRoom}
              onDeleteRoom={handleDeleteRoom}
              canDelete={canDelete}
            />

            {room.state.error && (
              <div class="flex-shrink-0 mx-3 mt-2 flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded-lg">
                <LuAlertCircle class="w-4 h-4 text-red-500 flex-shrink-0" />
                <p class="text-xs text-red-600 flex-1">{room.state.error}</p>
                <button onClick$={() => (room.state.error = null)} class="text-red-400 hover:text-red-600">
                  <LuX class="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {room.state.successMessage && (
              <div class="flex-shrink-0 mx-3 mt-2 flex items-center gap-2 p-2 bg-green-50 border border-green-100 rounded-lg">
                <LuCheckCircle class="w-4 h-4 text-green-500 flex-shrink-0" />
                <p class="text-xs text-green-600">{room.state.successMessage}</p>
              </div>
            )}

            {!hasJoined.value ? (
              <div class="flex-1 flex items-center justify-center p-4">
                <div class="text-center">
                  <div class="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <LuMessageSquare class="w-5 h-5 text-pink-600" />
                  </div>
                  <h3 class="text-sm font-medium text-gray-900 mb-1">Join to chat</h3>
                  <p class="text-xs text-gray-500 mb-4">Join this room to start messaging</p>
                  <button
                    onClick$={handleJoinRoom}
                    class="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-xs font-medium"
                  >
                    Join Room
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Messages Area */}
                <div
                  ref={messageContainerRef}
                  onScroll$={checkIfAtBottom}
                  class="flex-1 overflow-y-auto p-3 space-y-1"
                >
                  {room.state.loading && room.state.messages.length === 0 && (
                    <div class="flex items-center justify-center py-8">
                      <div class="text-center">
                        <div class="w-6 h-6 border-2 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                        <p class="text-xs text-gray-500">Loading...</p>
                      </div>
                    </div>
                  )}

                  {renderMessages()}

                  {!isAtBottom.value && room.state.messages.length > 0 && (
                    <div class="sticky bottom-4 flex justify-center">
                      <button
                        onClick$={scrollToBottom}
                        class="px-3 py-1.5 bg-pink-600 text-white text-xs font-medium rounded-full shadow-lg hover:bg-pink-700 transition-colors flex items-center gap-1"
                      >
                        <LuArrowLeft class="w-3 h-3 rotate-90" />
                        Scroll to latest
                      </button>
                    </div>
                  )}
                </div>

                {/* Reply Preview */}
                {(replyingTo.value || secretReplyTo.value) && (
                  <div class="flex-shrink-0 px-3 py-2 bg-pink-50 border-t border-pink-100 flex items-start justify-between">
                    <div class="flex items-start gap-2 flex-1 min-w-0">
                      <LuReply class="w-3 h-3 text-pink-600 mt-0.5 flex-shrink-0" />
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-1.5 mb-0.5">
                          <span class="text-xs text-gray-600">
                            {secretReplyTo.value ? "Secret reply to" : "Replying to"}
                          </span>
                          <span class={`text-xs font-semibold ${getGenderColor(
                            secretReplyTo.value ? secretReplyTo.value.gender : replyingTo.value.gender
                          )}`}>
                            {secretReplyTo.value ? secretReplyTo.value.username : replyingTo.value.username}
                          </span>
                          {replyingTo.value?.created_at && (
                            <span class="text-xs text-gray-500">{formatTime(replyingTo.value.created_at)}</span>
                          )}
                        </div>
                        {replyingTo.value?.content && (
                          <p class="text-xs text-gray-700 truncate">{replyingTo.value.content}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick$={() => {
                        replyingTo.value = null;
                        secretReplyTo.value = null;
                      }}
                      class="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
                    >
                      <LuX class="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Media Preview */}
                {selectedMedia.value && (
                  <div class="flex-shrink-0 px-3 py-2 border-t border-gray-200 bg-gray-50">
                    <MediaPreview
                      file={selectedMedia.value.file}
                      preview={selectedMedia.value.preview}
                      type={selectedMedia.value.type}
                      onRemove={$(() => (selectedMedia.value = null))}
                    />
                    {selectedMedia.value.uploading && (
                      <div class="flex items-center gap-2 text-xs text-gray-600 mt-1">
                        <div class="w-3 h-3 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Uploading...</span>
                      </div>
                    )}
                    {selectedMedia.value.publicId && !selectedMedia.value.uploading && (
                      <div class="flex items-center gap-1 text-xs text-green-600 mt-1">
                        <LuCheckCircle class="w-3 h-3" />
                        <span>Ready to send</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Message Input */}
                <div class="flex-shrink-0 px-3 py-2.5 border-t border-gray-200 bg-white">
                  <div class="flex items-end gap-2">
                    <div class="flex-1 relative flex items-end border border-gray-200 rounded-lg focus-within:ring-1 focus-within:ring-pink-500 focus-within:border-transparent">
                      <textarea
                        value={newMessage.value}
                        onInput$={(e) => {
                          newMessage.value = e.target.value;
                          if (e.target.value.includes('\n')) {
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                          } else {
                            e.target.style.height = '28px';
                          }
                        }}
                        onKeyDown$={handleKeyPress}
                        placeholder={
                          selectedMedia.value
                            ? "Add a message (optional)..."
                            : secretReplyTo.value
                              ? `Secret reply to ${secretReplyTo.value.username}...`
                              : replyingTo.value
                                ? `Reply to ${replyingTo.value.username}...`
                                : "Type a message..."
                        }
                        class="flex-1 px-3 py-1.5 text-xs focus:outline-none rounded-lg resize-none h-[28px] min-h-[28px] max-h-[120px] overflow-y-auto leading-[1.2] placeholder:leading-[1.2]"
                        rows="1"
                      />
                      <div class="relative">
                        <button
                          onClick$={() => (showEmojiPicker.value = !showEmojiPicker.value)}
                          class="p-2 text-gray-400 hover:text-pink-600 transition-colors"
                          aria-label="Add emoji"
                        >
                          <LuSmile class="w-4 h-4" />
                        </button>
                        <EmojiPicker
                          show={showEmojiPicker.value}
                          onEmojiSelect={$((emoji) => {
                            newMessage.value = newMessage.value + emoji;
                            showEmojiPicker.value = false;
                          })}
                          onClose={$(() => (showEmojiPicker.value = false))}
                        />
                      </div>
                      <MediaUpload
                        onMediaSelect={$(async (media) => {
                          selectedMedia.value = {
                            ...media,
                            uploading: true,
                            publicId: null
                          };

                          try {
                            let uploadResult;
                            if (media.type === 'image') {
                              uploadResult = await mediaApi.uploadImage(media.file);
                            } else if (media.type === 'gif') {
                              uploadResult = await mediaApi.uploadGif(media.file);
                            } else if (media.type === 'audio') {
                              uploadResult = await mediaApi.uploadAudio(media.file);
                            }

                            selectedMedia.value = {
                              ...selectedMedia.value,
                              uploading: false,
                              publicId: uploadResult.data.public_id
                            };
                          } catch (err) {
                            room.state.error = 'Failed to upload media';
                            selectedMedia.value = null;
                          }
                        })}
                        onClose={$(() => { })}
                      />
                    </div>
                    <button
                      onClick$={handleSendMessage}
                      disabled={selectedMedia.value?.uploading || (!selectedMedia.value && !newMessage.value?.trim())}
                      class="px-3 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                    >
                      <LuSend class="w-3.5 h-3.5" />
                      <span class="text-xs font-medium hidden sm:inline">Send</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <MembersSidebar
        showMembers={showMembers.value}
        members={members.value}
        auth={auth}
        onClose={$(() => (showMembers.value = false))}
        onAvatarClick={handleAvatarClick}
      />

      <UserMenu
        showUserMenu={showUserMenu.value}
        userMenuPosition={userMenuPosition.value}
        selectedUser={selectedUser.value}
        auth={auth}
        onClose={$(() => (showUserMenu.value = false))}
        onSendFriendRequest={handleSendFriendRequest}
        onBlockUser={handleBlockUser}
        onDirectMessage={handleDirectMessage}
        onSecretReply={handleSecretReply}
      />

      <ImageViewer
        imageUrl={
          room.state.imageViewer.isOpen && room.state.imageViewer.images[room.state.imageViewer.currentIndex]
            ? room.state.imageViewer.images[room.state.imageViewer.currentIndex].url
            : null
        }
        isOpen={room.state.imageViewer.isOpen}
        onClose={$(() => {
          room.state.imageViewer.isOpen = false;
        })}
        messageData={
          room.state.imageViewer.isOpen && room.state.imageViewer.images[room.state.imageViewer.currentIndex]
            ? room.state.imageViewer.images[room.state.imageViewer.currentIndex]
            : null
        }
        onPrevious={$(() => {
          if (room.state.imageViewer.currentIndex > 0) {
            room.state.imageViewer.currentIndex--;
          }
        })}
        onNext={$(() => {
          if (room.state.imageViewer.currentIndex < room.state.imageViewer.images.length - 1) {
            room.state.imageViewer.currentIndex++;
          }
        })}
        hasPrevious={room.state.imageViewer.currentIndex > 0}
        hasNext={room.state.imageViewer.currentIndex < room.state.imageViewer.images.length - 1}
        onReact={$(async (messageId, emoji) => {
          // Same optimistic approach
          const tempReaction = {
            id: `temp-${Date.now()}`,
            emoji,
            user_id: auth.user.value.id,
            username: auth.user.value.username,
            created_at: Date.now()
          };

          // Update messages
          room.state.messages = room.state.messages.map(m => {
            if (m.id === messageId) {
              return { ...m, reactions: [...(m.reactions || []), tempReaction] };
            }
            return m;
          });

          // Update image viewer
          const imgIndex = room.state.imageViewer.currentIndex;
          const currentImg = room.state.imageViewer.images[imgIndex];
          if (currentImg) {
            room.state.imageViewer.images[imgIndex] = {
              ...currentImg,
              reactions: [...(currentImg.reactions || []), tempReaction]
            };
          }

          try {
            const response = await roomsApi.reactToMessage(roomId, messageId, emoji);
            const realReaction = response.data;

            // Replace temp with real in messages
            room.state.messages = room.state.messages.map(m => {
              if (m.id === messageId) {
                const reactions = m.reactions.filter(r => r.id !== tempReaction.id);
                return { ...m, reactions: [...reactions, realReaction] };
              }
              return m;
            });

            // Replace temp with real in image viewer
            if (currentImg) {
              const reactions = room.state.imageViewer.images[imgIndex].reactions.filter(r => r.id !== tempReaction.id);
              room.state.imageViewer.images[imgIndex] = {
                ...room.state.imageViewer.images[imgIndex],
                reactions: [...reactions, realReaction]
              };
            }

            room.state.successMessage = "Reaction added!";
            setTimeout(() => (room.state.successMessage = null), 2000);
          } catch (err) {
            // Rollback both
            room.state.messages = room.state.messages.map(m => {
              if (m.id === messageId) {
                const reactions = m.reactions.filter(r => r.id !== tempReaction.id);
                return { ...m, reactions };
              }
              return m;
            });

            if (currentImg) {
              const reactions = room.state.imageViewer.images[imgIndex].reactions.filter(r => r.id !== tempReaction.id);
              room.state.imageViewer.images[imgIndex] = {
                ...room.state.imageViewer.images[imgIndex],
                reactions
              };
            }

            room.state.error = err.message || "Failed to add reaction";
          }
        })}
        onReport={$(async (messageId, reason, details) => {
          try {
            await roomsApi.reportMessage(roomId, messageId, reason, details);
            room.state.successMessage = "Report submitted successfully";
            setTimeout(() => (room.state.successMessage = null), 3000);
          } catch (err) {
            room.state.error = err.message || "Failed to submit report";
          }
        })}
        onShare={$(async (messageId) => {
          try {
            const currentImg = room.state.imageViewer.images[room.state.imageViewer.currentIndex];
            await navigator.clipboard.writeText(currentImg.url);
            room.state.successMessage = "Image URL copied!";
            setTimeout(() => (room.state.successMessage = null), 2000);
          } catch (err) {
            room.state.error = "Failed to copy URL";
          }
        })}
      />

      {/* ✅ ADD THIS - Global Emoji Picker for Reactions (Outside all containers) */}
      {activeReactionMessageId.value !== null && (
        <div
          class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20"
          onClick$={() => activeReactionMessageId.value = null}
        >
          <div onClick$={(e) => e.stopPropagation()}>
            <EmojiPicker
              show={true}
              onEmojiSelect={$((emoji) => {
                const msg = room.state.messages.find(m => m.id === activeReactionMessageId.value);
                if (msg) {
                  const existingReaction = (msg.reactions || []).find(
                    r => r.emoji === emoji && r.user_id === auth.user.value?.id
                  );
                  if (existingReaction) {
                    handleRemoveReaction(activeReactionMessageId.value, existingReaction.id);
                  } else {
                    handleReactToMessage(activeReactionMessageId.value, emoji);
                  }
                }
                activeReactionMessageId.value = null;
              })}
              onClose={$(() => activeReactionMessageId.value = null)}
            />
          </div>
        </div>
      )}
    </div>
  );
});

export const head = {
  title: "Room Chat",
};