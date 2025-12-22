import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import { useAuth } from "../../../../context/auth";
import { roomsApi } from "../../../../api/rooms";
import { friendsApi } from "../../../../api/friends";
import {
  LuSend,
  LuUsers,
  LuTrash2,
  LuLogOut,
  LuAlertCircle,
  LuCheckCircle,
  LuClock,
  LuMessageSquare,
  LuUserPlus,
  LuBan,
  LuLock,
  LuReply,
  LuX,
  LuArrowLeft,
  LuCheck,
  LuSmile,
  LuImage,
} from "@qwikest/icons/lucide";
import { EmojiPicker } from "../../../../components/ui/EmojiPicker.jsx";
import { ImageUpload } from "../../../../components/ui/ImageUpload.jsx";

// Utility functions moved outside component for better organization
const getGenderColor = (gender) => {
  switch (gender?.toLowerCase()) {
    case "male":
      return "text-blue-600";
    case "female":
      return "text-pink-600";
    case "lesbian":
      return "text-green-400";
    case "gay":
      return "text-gray-600";
    default:
      return "text-gray-600";
  }
};

const getGenderBorderColor = (gender) => {
  switch (gender?.toLowerCase()) {
    case "male":
      return "#2563eb"; // blue-600
    case "female":
      return "#db2777"; // pink-600
    case "lesbian":
      return "#4ade80"; // green-400
    case "gay":
      return "#4b5563"; // gray-600
    default:
      return "#9ca3af"; // gray-400
  }
};

const formatTimeLeft = (ms) => {
  if (!ms || ms <= 0) return "Expired";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Reusable UI Components
export const RoomHeader = component$(
  ({
    room,
    timeLeft,
    hasJoined,
    showMembers,
    members,
    canDelete,
    onBack,
    onToggleMembers,
    onDeleteRoom,
    onLeaveRoom,
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

            <div class="w-8 h-8 bg-gradient-to-br from-pink-600 to-pink-800 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
              {room?.name.charAt(0).toUpperCase()}
            </div>

            <div class="flex-1 min-w-0">
              <h2 class="font-semibold text-gray-900 text-sm truncate">
                {room?.name}
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
              <span>{members.filter(m => m.is_online).length}</span>
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
  },
);

export const MessageBubble = component$(
  ({
    msg,
    isOwn,
    isSystem,
    isSecret,
    showTime,
    auth,
    onAvatarClick,
    onUsernameClick,
    onMessageClick,
    getGenderColor,
    getGenderBorderColor,
  }) => {
    if (isSystem) {
      return (
        <div key={msg.id} class="flex justify-center my-2">
          <div class="inline-block bg-yellow-50 text-yellow-800 px-3 py-1.5 rounded-lg text-xs border border-yellow-100">
            {msg.content}
          </div>
        </div>
      );
    }

    // FOR OWN MESSAGES: Show on right side with time on left
    if (isOwn) {
      return (
        <div key={msg.id} class="group">
          <div class="flex items-center justify-end gap-2 px-2 py-1.5 hover:bg-gray-50 rounded">
            {/* Time (left side for own messages) */}
            <span class="text-xs text-gray-500 flex-shrink-0">
              {showTime ? formatTime(msg.created_at) : ""}
            </span>

            {/* Content (right side for own messages) */}
            <div class="flex-1 min-w-0 flex items-center justify-end gap-2">
              <div class="flex items-center gap-2 flex-1 min-w-0 justify-end">
                {/* Message text (clickable to show time) */}
                <span
                  onClick$={() => onMessageClick(msg.id)}
                  class="text-sm text-gray-900 cursor-pointer flex-1 min-w-0 text-right"
                >
                  {msg.content}
                </span>

                {/* Username (right side for own messages) */}
                <button
                  onClick$={() => onUsernameClick(msg)}
                  class={`font-bold text-sm hover:underline flex-shrink-0 ${getGenderColor(msg.sender_gender)}`}
                >
                  {msg.sender_username}
                </button>
              </div>
            </div>

            {/* Avatar (far right for own messages) */}
            <button
              onClick$={(e) =>
                !isOwn &&
                onAvatarClick(
                  e,
                  msg.sender_id,
                  msg.sender_username,
                  msg.sender_gender,
                )
              }
              disabled={isOwn}
              class={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 bg-white ${
                isOwn
                  ? "border-pink-600 text-pink-600 cursor-default"
                  : "hover:border-pink-400 cursor-pointer transition-colors"
              }`}
              style={
                !isOwn
                  ? `color: ${getGenderBorderColor(msg.sender_gender)}; border-color: ${getGenderBorderColor(msg.sender_gender)};`
                  : ""
              }
            >
              {msg.sender_username.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
      );
    }

    // FOR OTHERS' MESSAGES: Original layout
    return (
      <div key={msg.id} class="group">
        <div class="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded">
          {/* Avatar */}
          <button
            onClick$={(e) =>
              onAvatarClick(
                e,
                msg.sender_id,
                msg.sender_username,
                msg.sender_gender,
              )
            }
            disabled={isOwn}
            class={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 bg-white ${
              isOwn
                ? "border-pink-600 text-pink-600 cursor-default"
                : "hover:border-pink-400 cursor-pointer transition-colors"
            }`}
            style={
              !isOwn
                ? `color: ${getGenderBorderColor(msg.sender_gender)}; border-color: ${getGenderBorderColor(msg.sender_gender)};`
                : ""
            }
          >
            {msg.sender_username.charAt(0).toUpperCase()}
          </button>

          {/* Content */}
          <div class="flex-1 min-w-0 flex items-center gap-2">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              {/* Username (clickable for reply) */}
              <button
                onClick$={() => onUsernameClick(msg)}
                class={`font-bold text-sm hover:underline flex-shrink-0 ${getGenderColor(msg.sender_gender)}`}
              >
                {msg.sender_username}
              </button>

              {/* Secret indicator */}
              {isSecret && (
                <span class="flex items-center gap-1 text-xs text-blue-600 flex-shrink-0">
                  <LuLock class="w-2.5 h-2.5" />
                  <span class={getGenderColor(msg.recipient_gender)}>
                    {msg.recipient_username}
                  </span>
                </span>
              )}

              {/* Message text (clickable to show time) */}
              <span
                onClick$={() => onMessageClick(msg.id)}
                class="text-sm text-gray-900 cursor-pointer flex-1 min-w-0"
              >
                {msg.content}
              </span>
            </div>

            {/* Time (shown when message is clicked) */}
            {showTime && (
              <span class="text-xs text-gray-500 flex-shrink-0">
                {formatTime(msg.created_at)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  },
);

export const ReplyPreview = component$(
  ({ replyingTo, secretReplyTo, onCancel, getGenderColor }) => {
    if (!replyingTo && !secretReplyTo) return null;

    return (
      <div class="flex-shrink-0 px-3 py-2 bg-pink-50 border-t border-pink-100 flex items-center justify-between">
        <div class="flex items-center gap-2 text-xs">
          {secretReplyTo ? (
            <>
              <LuLock class="w-3 h-3 text-pink-600" />
              <span class="text-gray-600">Secret reply to</span>
              <span
                class={`font-semibold ${getGenderColor(secretReplyTo.gender)}`}
              >
                {secretReplyTo.username}
              </span>
            </>
          ) : (
            <>
              <LuReply class="w-3 h-3 text-pink-600" />
              <span class="text-gray-600">Replying to</span>
              <span
                class={`font-semibold ${getGenderColor(replyingTo.gender)}`}
              >
                {replyingTo.username}
              </span>
              {/* Show preview of the message being replied to with gender color */}
              {replyingTo.content && (
                <span
                  class={`text-xs truncate ${getGenderColor(replyingTo.gender)}`}
                >
                  : {replyingTo.content}
                </span>
              )}
            </>
          )}
        </div>
        <button onClick$={onCancel} class="text-gray-400 hover:text-gray-600">
          <LuX class="w-3.5 h-3.5" />
        </button>
      </div>
    );
  },
);

export const MembersSidebar = component$(
  ({ showMembers, members, auth, onClose, onAvatarClick, getGenderColor }) => {
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
                  onAvatarClick(
                    e,
                    member.user_id,
                    member.username,
                    member.gender,
                  )
                }
                disabled={member.user_id === auth.user.value?.id}
                class="w-full flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left disabled:cursor-default disabled:hover:bg-transparent"
              >
                <div class="relative">
                  <div
                    class={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 bg-white ${
                      member.user_id === auth.user.value?.id
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
  },
);

export const UserMenu = component$(
  ({
    showUserMenu,
    userMenuPosition,
    selectedUser,
    auth,
    onClose,
    onDirectMessage,
    onSecretReply,
    onSendFriendRequest,
    onBlockUser,
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
  },
);

export default component$(() => {
  const location = useLocation();
  const nav = useNavigate();
  const auth = useAuth();

  const roomId = location.params.roomId;

  // Room state
  const room = useSignal(null);
  const messages = useSignal([]);
  const members = useSignal([]);
  const newMessage = useSignal("");
  const loading = useSignal(true);
  const error = useSignal("");
  const successMessage = useSignal("");
  const hasJoined = useSignal(false);
  const timeLeft = useSignal(null);
  const showMembers = useSignal(false);
  const messageContainerRef = useSignal(null);
  const showEmojiPicker = useSignal(false);
  const showImagePreview = useSignal(false);
  const selectedMessageId = useSignal(null);

  // User interaction state
  const selectedUser = useSignal(null);
  const showUserMenu = useSignal(false);
  const userMenuPosition = useSignal({ top: 0, left: 0 });
  const replyingTo = useSignal(null);
  const secretReplyTo = useSignal(null);

  // Track if user is at bottom for smart scrolling
  const isAtBottom = useSignal(true);
  const previousMessagesLength = useSignal(0);

  // Smart auto-scroll function
  const scrollToBottom = $(() => {
    if (messageContainerRef.value) {
      messageContainerRef.value.scrollTop =
        messageContainerRef.value.scrollHeight;
      isAtBottom.value = true;
    }
  });

  // Check if user is near bottom
  const checkIfAtBottom = $(() => {
    if (!messageContainerRef.value) return;

    const container = messageContainerRef.value;
    const threshold = 100; // pixels from bottom to consider "near bottom"
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    isAtBottom.value = distanceFromBottom <= threshold;
  });

  // Handle message updates with smart scrolling
  useVisibleTask$(({ track }) => {
    track(() => messages.value);

    if (!messageContainerRef.value || messages.value.length === 0) return;

    const isUserScrollingUp = !isAtBottom.value;
    const isNewMessage = messages.value.length > previousMessagesLength.value;
    const isInitialLoad = previousMessagesLength.value === 0;

    // Always scroll to bottom on initial load
    if (isInitialLoad) {
      scrollToBottom();
    }
    // Only auto-scroll if user is at bottom OR it's a new message from current user
    else if (!isUserScrollingUp || isNewMessage) {
      scrollToBottom();
    }

    previousMessagesLength.value = messages.value.length;
  });

  // Load room data
  const loadRoomData = $(async () => {
    try {
      const [roomData, messagesData, membersData] = await Promise.all([
        roomsApi.getRoom(roomId),
        roomsApi.getMessages(roomId),
        roomsApi.getMembers(roomId),
      ]);

      room.value = roomData.room;
      messages.value = messagesData.messages || [];
      members.value = membersData.members || [];
      hasJoined.value = members.value.some(
        (m) => m.user_id === auth.user.value?.id,
      );

      if (room.value.will_expire) {
        timeLeft.value = room.value.time_left_ms;
      }

      loading.value = false;
    } catch (err) {
      error.value = err.message;
      loading.value = false;
    }
  });

  // Countdown timer
  useVisibleTask$(async ({ cleanup }) => {
    await loadRoomData();

    const interval = setInterval(() => {
      if (room.value?.will_expire && timeLeft.value > 0) {
        timeLeft.value = Math.max(0, timeLeft.value - 1000);

        if (timeLeft.value <= 0) {
          alert("This room has been deleted.");
          nav("/rooms");
        }
      }
    }, 1000);

    const messageInterval = setInterval(async () => {
      try {
        const messagesData = await roomsApi.getMessages(roomId);
        messages.value = messagesData.messages || [];
      } catch (err) {
        console.error("Failed to refresh messages:", err);
      }
    }, 3000);

    cleanup(() => {
      clearInterval(interval);
      clearInterval(messageInterval);
    });
  });

  // Room actions
  const handleJoinRoom = $(async () => {
    try {
      await roomsApi.joinRoom(roomId);
      hasJoined.value = true;
      await loadRoomData();
    } catch (err) {
      error.value = err.message;
    }
  });

  const handleLeaveRoom = $(async () => {
    try {
      await roomsApi.leaveRoom(roomId);
      nav("/rooms");
    } catch (err) {
      error.value = err.message;
    }
  });

  const handleDeleteRoom = $(async () => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    try {
      await roomsApi.deleteRoom(roomId);
      nav("/rooms");
    } catch (err) {
      error.value = err.message;
    }
  });

  // Message actions
  const handleSendMessage = $(async () => {
    if (!newMessage.value.trim()) return;

    try {
      let messageContent = newMessage.value;

      if (replyingTo.value) {
        messageContent = `@${replyingTo.value.username}: ${messageContent}`;
        replyingTo.value = null;
      }

      await roomsApi.sendMessage(roomId, messageContent);
      newMessage.value = "";

      const messagesData = await roomsApi.getMessages(roomId);
      messages.value = messagesData.messages || [];

      // After sending a message, we should scroll to bottom
      scrollToBottom();
    } catch (err) {
      error.value = err.message;
    }
  });

  const handleSendSecretReply = $(async () => {
    if (!newMessage.value.trim() || !secretReplyTo.value) return;

    try {
      await roomsApi.sendMessage(
        roomId,
        newMessage.value,
        "secret",
        secretReplyTo.value.user_id,
      );

      newMessage.value = "";
      secretReplyTo.value = null;

      const messagesData = await roomsApi.getMessages(roomId);
      messages.value = messagesData.messages || [];

      // After sending a message, we should scroll to bottom
      scrollToBottom();
    } catch (err) {
      error.value = err.message;
    }
  });

  const handleKeyPress = $((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      secretReplyTo.value ? handleSendSecretReply() : handleSendMessage();
    }
  });

  // User interaction handlers
  const handleAvatarClick = $((event, userId, username, gender) => {
    if (userId === auth.user.value?.id) return;

    const rect = event.target.getBoundingClientRect();
    userMenuPosition.value = {
      top: rect.bottom + 5,
      left: rect.left,
    };

    selectedUser.value = { user_id: userId, username, gender };
    showUserMenu.value = true;
  });

  const handleUsernameClick = $((message) => {
    if (message.sender_id === auth.user.value?.id) return;

    replyingTo.value = {
      username: message.sender_username,
      content: message.content,
      gender: message.sender_gender, // Add gender for color
    };
  });

  const handleMessageClick = $((messageId) => {
    selectedMessageId.value =
      selectedMessageId.value === messageId ? null : messageId;
  });

  const handleSendFriendRequest = $(async () => {
    if (auth.user.value?.is_guest) {
      error.value = "Guest users cannot send friend requests";
      showUserMenu.value = false;
      return;
    }

    try {
      await friendsApi.sendRequest(selectedUser.value.user_id);
      successMessage.value = "Friend request sent!";
      setTimeout(() => (successMessage.value = ""), 3000);
      showUserMenu.value = false;
    } catch (err) {
      error.value = err.message;
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
      error.value = "Guest users cannot block users";
      showUserMenu.value = false;
      return;
    }

    if (
      !confirm(`Are you sure you want to block ${selectedUser.value.username}?`)
    ) {
      showUserMenu.value = false;
      return;
    }

    try {
      await friendsApi.blockUser(selectedUser.value.user_id);
      successMessage.value = "User blocked";
      setTimeout(() => (successMessage.value = ""), 3000);
      showUserMenu.value = false;
    } catch (err) {
      error.value = err.message;
      showUserMenu.value = false;
    }
  });

  // UI Handlers - properly wrapped with $()
  const handleEmojiSelect = $((emoji) => {
    newMessage.value = newMessage.value + emoji;
    showEmojiPicker.value = false;
  });

  const toggleEmojiPicker = $(() => {
    showEmojiPicker.value = !showEmojiPicker.value;
  });

  const handleImageSend = $(async (imageData) => {
    try {
      console.log("Image data to send:", {
        fileName: imageData.name,
        fileSize: imageData.size,
        fileType: imageData.type,
        caption: imageData.caption,
      });

      if (imageData.caption) {
        await roomsApi.sendMessage(roomId, `📷 Image: ${imageData.caption}`);
      } else {
        await roomsApi.sendMessage(roomId, "📷 Sent an image");
      }

      const messagesData = await roomsApi.getMessages(roomId);
      messages.value = messagesData.messages || [];

      showImagePreview.value = false;

      alert("Image upload feature is ready! Connect it to your backend API.");

      // Scroll to bottom after sending image
      scrollToBottom();
    } catch (err) {
      error.value = err.message;
    }
  });

  // Create QRL-wrapped handlers for child components
  const handleUserMenuClose = $(() => {
    showUserMenu.value = false;
  });

  const handleMembersSidebarClose = $(() => {
    showMembers.value = false;
  });

  const handleReplyCancel = $(() => {
    replyingTo.value = null;
    secretReplyTo.value = null;
  });

  const handleBackToRooms = $(() => {
    nav("/rooms");
  });

  const handleToggleMembers = $(() => {
    showMembers.value = !showMembers.value;
  });

  const canDelete =
    auth.user.value?.role === "admin" ||
    room.value?.creator_id === auth.user.value?.id;

  const renderMessages = () => {
    if (messages.value.length === 0) {
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

    return messages.value.map((msg) => {
      const isOwn = msg.sender_id === auth.user.value?.id;
      const isSystem = msg.type === "system";
      const isSecret = msg.type === "secret";
      const showTime = selectedMessageId.value === msg.id;

      return (
        <MessageBubble
          key={msg.id}
          msg={msg}
          isOwn={isOwn}
          isSystem={isSystem}
          isSecret={isSecret}
          showTime={showTime}
          auth={auth}
          onAvatarClick={handleAvatarClick}
          onUsernameClick={handleUsernameClick}
          onMessageClick={handleMessageClick}
          getGenderColor={getGenderColor}
          getGenderBorderColor={getGenderBorderColor}
        />
      );
    });
  };

  return (
    <div class="fixed inset-0 top-16 flex flex-col sm:flex-row sm:gap-3 sm:p-3 bg-gray-50 sm:bg-transparent">
      {loading.value ? (
        <div class="flex-1 bg-white sm:border sm:border-gray-200 sm:rounded-lg flex items-center justify-center">
          <div class="text-center">
            <div class="w-6 h-6 border-2 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
            <p class="text-xs text-gray-500">Loading room...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Main Room Area */}
          <div class="flex-1 bg-white sm:border sm:border-gray-200 sm:rounded-lg flex flex-col overflow-hidden h-full">
            <RoomHeader
              room={room.value}
              timeLeft={timeLeft.value}
              hasJoined={hasJoined.value}
              showMembers={showMembers.value}
              members={members.value}
              canDelete={canDelete}
              onBack={handleBackToRooms}
              onToggleMembers={handleToggleMembers}
              onDeleteRoom={handleDeleteRoom}
              onLeaveRoom={handleLeaveRoom}
            />

            {error.value && (
              <div class="flex-shrink-0 mx-3 mt-2 flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded-lg">
                <LuAlertCircle class="w-4 h-4 text-red-500 flex-shrink-0" />
                <p class="text-xs text-red-600 flex-1">{error.value}</p>
                <button
                  onClick$={() => (error.value = "")}
                  class="text-red-400 hover:text-red-600"
                >
                  <LuX class="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {successMessage.value && (
              <div class="flex-shrink-0 mx-3 mt-2 flex items-center gap-2 p-2 bg-green-50 border border-green-100 rounded-lg">
                <LuCheckCircle class="w-4 h-4 text-green-500 flex-shrink-0" />
                <p class="text-xs text-green-600">{successMessage.value}</p>
              </div>
            )}

            {!hasJoined.value ? (
              <div class="flex-1 flex items-center justify-center p-4">
                <div class="text-center">
                  <div class="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <LuMessageSquare class="w-5 h-5 text-pink-600" />
                  </div>
                  <h3 class="text-sm font-medium text-gray-900 mb-1">
                    Join to chat
                  </h3>
                  <p class="text-xs text-gray-500 mb-4">
                    Join this room to start messaging
                  </p>
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
                  {renderMessages()}

                  {/* "Scroll to bottom" button when user scrolls up */}
                  {!isAtBottom.value && messages.value.length > 0 && (
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

                <ReplyPreview
                  replyingTo={replyingTo.value}
                  secretReplyTo={secretReplyTo.value}
                  onCancel={handleReplyCancel}
                  getGenderColor={getGenderColor}
                />

                {/* Message Input */}
                <div class="flex-shrink-0 px-3 py-2.5 border-t border-gray-200 bg-white">
                  <div class="flex items-end gap-2">
                    <div class="flex-1 relative flex items-center border border-gray-200 rounded-lg focus-within:ring-1 focus-within:ring-pink-500 focus-within:border-transparent">
                      <input
                        type="text"
                        bind:value={newMessage}
                        onKeyPress$={handleKeyPress}
                        placeholder={
                          secretReplyTo.value
                            ? "Send secret message..."
                            : "Type a message..."
                        }
                        class="flex-1 px-3 py-2 text-xs focus:outline-none rounded-lg"
                      />

                      <div class="relative">
                        <button
                          onClick$={toggleEmojiPicker}
                          class="p-2 text-gray-400 hover:text-pink-600 transition-colors"
                          aria-label="Add emoji"
                        >
                          <LuSmile class="w-4 h-4" />
                        </button>

                        <EmojiPicker
                          show={showEmojiPicker.value}
                          onEmojiSelect={handleEmojiSelect}
                          onClose={$(() => (showEmojiPicker.value = false))}
                        />
                      </div>

                      <ImageUpload
                        show={showImagePreview.value}
                        onImageSend={handleImageSend}
                        onClose={$(() => (showImagePreview.value = false))}
                      />
                    </div>

                    <button
                      onClick$={
                        secretReplyTo.value
                          ? handleSendSecretReply
                          : handleSendMessage
                      }
                      disabled={!newMessage.value.trim()}
                      class={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                        secretReplyTo.value
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-pink-600 hover:bg-pink-700 text-white"
                      }`}
                    >
                      <LuSend class="w-3.5 h-3.5" />
                      <span class="text-xs font-medium hidden sm:inline">
                        Send
                      </span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <MembersSidebar
            showMembers={showMembers.value}
            members={members.value}
            auth={auth}
            onClose={handleMembersSidebarClose}
            onAvatarClick={handleAvatarClick}
            getGenderColor={getGenderColor}
          />
        </>
      )}

      <UserMenu
        showUserMenu={showUserMenu.value}
        userMenuPosition={userMenuPosition.value}
        selectedUser={selectedUser.value}
        auth={auth}
        onClose={handleUserMenuClose}
        onDirectMessage={handleDirectMessage}
        onSecretReply={handleSecretReply}
        onSendFriendRequest={handleSendFriendRequest}
        onBlockUser={handleBlockUser}
      />
    </div>
  );
});

export const head = {
  title: "Room Chat - Anonymous Chat",
};
