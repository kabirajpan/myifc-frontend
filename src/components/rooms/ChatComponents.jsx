import { component$, $, useSignal } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { useAuth } from "../../context/auth";
import { getGenderColor, getGenderBorderColor, formatTime } from "../../utils/helpers";
import {
  LuUsers,
  LuSearch,
  LuAlertCircle,
  LuX,
  LuCheck,
  LuArrowLeft,
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
  LuMessageSquare,
} from '@qwikest/icons/lucide';

// ============================
// ROOM HEADER COMPONENT
// ============================
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
  const formatTimeLeft = (ms) => {
    if (!ms || ms <= 0) return "Expired";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

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

// ============================
// MESSAGE BUBBLE COMPONENT
// ============================
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

              {/* Reactions below image */}
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
                            onRemoveReaction(msg.id, userReactionWithThisEmoji.id);
                          } else {
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

              {/* Quick react buttons + emoji picker */}
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
                            onRemoveReaction(msg.id, existingReaction.id);
                          } else {
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

                  {/* Plus button to open emoji picker */}
                  <button
                    onClick$={(e) => {
                      e.stopPropagation();
                      onOpenReactionPicker(msg.id);
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

// ============================
// MEMBERS SIDEBAR COMPONENT
// ============================
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
// USER MENU COMPONENT
// ============================
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