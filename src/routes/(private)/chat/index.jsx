import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import { useAuth } from "../../../context/auth";
import { chatApi } from "../../../api/chat";
import { authApi } from "../../../api/auth";
import { friendsApi } from "../../../api/friends";
import { wsService } from "../../../api/websocket";
import {
  LuMessageSquare,
  LuSend,
  LuUsers,
  LuSearch,
  LuAlertCircle,
  LuX,
  LuClock,
  LuCheck,
  LuArrowLeft,
  LuMenu,
  LuSmile,
  LuImage,
  LuLock,
  LuReply,
  LuCheckCircle,
  LuUserPlus,
  LuBan,
  LuCornerUpLeft,
} from "@qwikest/icons/lucide";
import { EmojiPicker } from "../../../components/ui/EmojiPicker.jsx";
import { ImageUpload } from "../../../components/ui/ImageUpload.jsx";

// Utility functions (same as room chat)
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

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// User Menu Component - FOR CHAT HEADER AVATAR ONLY
export const UserMenu = component$(
  ({
    showUserMenu,
    userMenuPosition,
    selectedUser,
    auth,
    onClose,
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

// Reusable MessageBubble component with reply preview
export const MessageBubble = component$(
  ({
    msg,
    isOwn,
    showTime,
    onMessageClick,
    onUsernameClick,
    getGenderColor,
    getGenderBorderColor,
  }) => {
    // Check if message has a reply reference
    const hasReply = msg.reply_to_message_id && msg.reply_to_message_content;

    return (
      <div key={msg.id} class="group">
        {/* FOR OWN MESSAGES: Show on right side */}
        {isOwn ? (
          <div class="flex items-center justify-end gap-2 px-2 py-1.5 hover:bg-gray-50 rounded">
            {/* Content (right side for own messages) */}
            <div class="flex-1 min-w-0 flex flex-col items-end gap-1">
              {/* Reply preview for own messages - SEPARATE FROM MESSAGE ROW */}
              {hasReply && (
                <div class="w-full max-w-[80%] bg-pink-50 border-l-2 border-pink-300 rounded-r p-1.5 mb-1">
                  <div class="flex items-start gap-1.5">
                    <LuCornerUpLeft class="w-3 h-3 text-pink-500 mt-0.5 flex-shrink-0" />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-1.5 mb-0.5">
                        <div
                          class={`text-xs font-medium ${getGenderColor(msg.reply_to_message_gender)}`}
                        >
                          {msg.reply_to_message_sender}
                        </div>
                        <div class="text-xs text-gray-500">
                          {formatTime(msg.reply_to_message_time)}
                        </div>
                      </div>
                      <p class="text-xs text-gray-700 truncate">
                        {msg.reply_to_message_content}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Message row - INCLUDES TIME IN THE ROW */}
              <div class="flex items-center justify-end gap-2 w-full">
                {/* Time (LEFT side for own messages) - shows when clicked */}
                {showTime && (
                  <span class="text-xs text-gray-500 flex-shrink-0">
                    {formatTime(msg.created_at)}
                  </span>
                )}

                <div class="flex-1 min-w-0 flex items-center justify-end gap-2">
                  <div class="flex items-center gap-2 flex-1 min-w-0 justify-end">
                    {/* Message text (clickable to show time ONLY) */}
                    <span
                      onClick$={() => onMessageClick(msg.id)}
                      class="text-sm text-gray-900 cursor-pointer flex-1 min-w-0 text-right"
                    >
                      {msg.content}
                    </span>

                    {/* Username (clickable for reply) */}
                    <button
                      onClick$={() => onUsernameClick(msg)}
                      class={`font-bold text-sm hover:underline flex-shrink-0 ${getGenderColor(msg.sender_gender)}`}
                    >
                      {msg.sender_username}
                    </button>
                  </div>
                </div>

                {/* Avatar (far right for own messages) */}
                <div
                  class={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 bg-white border-pink-600 text-pink-600 cursor-default`}
                >
                  {msg.sender_username?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* FOR OTHER USER'S MESSAGES: Show on left side */
          <div class="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded">
            {/* Avatar - NOT CLICKABLE (no menu) */}
            <div
              class={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 bg-white`}
              style={`color: ${getGenderBorderColor(msg.sender_gender)}; border-color: ${getGenderBorderColor(msg.sender_gender)};`}
            >
              {msg.sender_username?.charAt(0).toUpperCase()}
            </div>

            <div class="flex-1 min-w-0 flex flex-col gap-1">
              {/* Reply preview for other user's messages - SEPARATE FROM MESSAGE ROW */}
              {hasReply && (
                <div class="w-full max-w-[80%] bg-gray-100 border-l-2 border-gray-300 rounded-r p-1.5">
                  <div class="flex items-start gap-1.5">
                    <LuCornerUpLeft class="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-1.5 mb-0.5">
                        <div
                          class={`text-xs font-medium ${getGenderColor(msg.reply_to_message_gender)}`}
                        >
                          {msg.reply_to_message_sender}
                        </div>
                        <div class="text-xs text-gray-500">
                          {formatTime(msg.reply_to_message_time)}
                        </div>
                      </div>
                      <p class="text-xs text-gray-700 truncate">
                        {msg.reply_to_message_content}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Message row - SEPARATE FROM REPLY PREVIEW */}
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-1 min-w-0">
                  {/* Username (clickable for reply) */}
                  <button
                    onClick$={() => onUsernameClick(msg)}
                    class={`font-bold text-sm hover:underline flex-shrink-0 ${getGenderColor(msg.sender_gender)}`}
                  >
                    {msg.sender_username}
                  </button>

                  {/* Message text (clickable to show time ONLY) */}
                  <span
                    onClick$={() => onMessageClick(msg.id)}
                    class="text-sm text-gray-900 cursor-pointer flex-1 min-w-0"
                  >
                    {msg.content}
                  </span>
                </div>

                {/* Time (RIGHT side for other user's messages) - shows when clicked */}
                {showTime && (
                  <span class="text-xs text-gray-500 flex-shrink-0">
                    {formatTime(msg.created_at)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Read receipt for own messages */}
        {isOwn && msg.is_read && (
          <div class="flex justify-end pr-2 mt-0.5">
            <LuCheck class="w-3 h-3 text-pink-600" />
          </div>
        )}
      </div>
    );
  },
);

export default component$(() => {
  const location = useLocation();
  const nav = useNavigate();
  const auth = useAuth();

  const otherUserId = location.url.searchParams.get("user");
  const otherUserName = location.url.searchParams.get("name");

  const currentSessionId = useSignal(null);
  const messages = useSignal([]);
  const newMessage = useSignal("");
  const showOnlineUsers = useSignal(false);
  const showChatList = useSignal(true);
  const loading = useSignal(true);
  const error = useSignal("");
  const successMessage = useSignal("");
  const chatList = useSignal([]);
  const onlineUsers = useSignal([]);
  const searchQuery = useSignal("");
  const messageContainerRef = useSignal(null);
  const showEmojiPicker = useSignal(false);
  const showImagePreview = useSignal(false);
  const selectedMessageId = useSignal(null);

  // Track other user's gender
  const otherUserGender = useSignal("");

  // Reply state
  const replyingTo = useSignal(null);

  // User menu state - ONLY FOR CHAT HEADER AVATAR
  const selectedUser = useSignal(null);
  const showUserMenu = useSignal(false);
  const userMenuPosition = useSignal({ top: 0, left: 0 });

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
    const threshold = 100;
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

    if (isInitialLoad) {
      scrollToBottom();
    } else if (!isUserScrollingUp || isNewMessage) {
      scrollToBottom();
    }

    previousMessagesLength.value = messages.value.length;
  });

  const loadChats = $(async () => {
    try {
      const sessionsData = await chatApi.getSessions();
      chatList.value = sessionsData.chats || [];

      const usersData = await authApi.getOnlineUsers();
      onlineUsers.value = (usersData.users || []).filter(
        (u) => u.id !== auth.user.value?.id,
      );
    } catch (err) {
      error.value = err.message;
    }
  });

  const loadMessages = $(async (sessionId) => {
    try {
      const messagesData = await chatApi.getMessages(sessionId);
      messages.value = (messagesData.messages || []).map((msg) => ({
        ...msg,
        isOwn: msg.sender_id === auth.user.value?.id,
      }));

      if (messages.value.length > 0) {
        const otherUserMessage = messages.value.find((m) => !m.isOwn);
        if (otherUserMessage && otherUserMessage.sender_gender) {
          otherUserGender.value = otherUserMessage.sender_gender;
        }
      }

      await chatApi.markAsRead(sessionId);
    } catch (err) {
      error.value = err.message;
    }
  });

  useVisibleTask$(async ({ cleanup }) => {
    try {
      loading.value = true;

      wsService.connect();

      const unsubscribe = wsService.onMessage((data) => {
        if (data.type === "new_message") {
          if (data.data.session_id === currentSessionId.value) {
            const newMsg = {
              ...data.data.message,
              isOwn: data.data.message.sender_id === auth.user.value?.id,
            };

            messages.value = [...messages.value, newMsg];

            if (!newMsg.isOwn && newMsg.sender_gender) {
              otherUserGender.value = newMsg.sender_gender;
            }

            chatApi.markAsRead(currentSessionId.value);
          }

          loadChats();
        }
      });

      await loadChats();

      if (otherUserId) {
        const sessionData = await chatApi.createSession(otherUserId);
        currentSessionId.value = sessionData.session.id;
        await loadMessages(currentSessionId.value);
        showChatList.value = false;
      }

      loading.value = false;

      return () => {
        unsubscribe();
        wsService.disconnect();
      };
    } catch (err) {
      error.value = err.message;
      loading.value = false;
    }
  });

  const handleSendMessage = $(async () => {
    if (!newMessage.value.trim() || !currentSessionId.value) return;

    try {
      let messageContent = newMessage.value;
      let replyToId = null;

      // If replying to a message, get the reply ID
      if (replyingTo.value) {
        replyToId = replyingTo.value.id;
      }

      // FIXED: Correct parameter order for chatApi.sendMessage
      const messageData = await chatApi.sendMessage(
        currentSessionId.value,
        messageContent,
        "text", // type parameter (3rd)
        replyToId, // replyToId parameter (4th)
      );

      // Create message with reply data if exists
      const newMessageObj = {
        id: messageData.data.id,
        sender_id: auth.user.value.id,
        sender_username: auth.user.value.username,
        sender_gender: auth.user.value.gender,
        content: messageData.data.content,
        created_at: messageData.data.created_at,
        isOwn: true,
        is_read: false,
        reply_to_message_id: replyToId,
        ...(replyingTo.value && {
          reply_to_message_content: replyingTo.value.content,
          reply_to_message_sender: replyingTo.value.username,
          reply_to_message_gender: replyingTo.value.gender,
          reply_to_message_time: replyingTo.value.created_at,
        }),
      };

      messages.value = [...messages.value, newMessageObj];
      newMessage.value = "";
      replyingTo.value = null; // Clear reply state
      await loadChats();
      scrollToBottom();
    } catch (err) {
      error.value = err.message;
    }
  });

  const handleKeyPress = $((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  const handleChatSelect = $(async (chat) => {
    try {
      loading.value = true;
      currentSessionId.value = chat.session_id;

      if (chat.other_user_gender) {
        otherUserGender.value = chat.other_user_gender;
      }

      await loadMessages(chat.session_id);
      await nav(
        `/chat?user=${chat.other_user_id}&name=${chat.other_user_name}`,
      );

      showChatList.value = false;
      loading.value = false;
    } catch (err) {
      error.value = err.message;
      loading.value = false;
    }
  });

  const handleStartChat = $(async (user) => {
    showOnlineUsers.value = false;
    await nav(`/chat?user=${user.id}&name=${user.username}`);
    window.location.reload();
  });

  const handleBackToList = $(() => {
    showChatList.value = true;
  });

  const handleMessageClick = $((messageId) => {
    selectedMessageId.value =
      selectedMessageId.value === messageId ? null : messageId;
  });

  // Username click for reply
  const handleUsernameClick = $((message) => {
    if (message.sender_id === auth.user.value?.id) return;

    replyingTo.value = {
      id: message.id,
      username: message.sender_username,
      content: message.content,
      gender: message.sender_gender,
      created_at: message.created_at,
      sender_username: message.sender_username,
      sender_gender: message.sender_gender,
    };
  });

  // Message text click for reply (alternative)
  // const handleMessageTextClick = $((message) => {
  //   if (message.sender_id === auth.user.value?.id) return;

  //   replyingTo.value = {
  //     id: message.id,
  //     username: message.sender_username,
  //     content: message.content,
  //     gender: message.sender_gender,
  //     created_at: message.created_at,
  //     sender_username: message.sender_username,
  //     sender_gender: message.sender_gender,
  //   };
  // });

  // Chat header avatar click - SHOWS MENU ONLY HERE
  const handleChatHeaderAvatarClick = $((event, userId, username, gender) => {
    if (userId === auth.user.value?.id) return;

    const rect = event.target.getBoundingClientRect();
    userMenuPosition.value = {
      top: rect.bottom + 5,
      left: rect.left,
    };

    selectedUser.value = { user_id: userId, username, gender };
    showUserMenu.value = true;
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

  const handleEmojiSelect = $((emoji) => {
    newMessage.value = newMessage.value + emoji;
    showEmojiPicker.value = false;
  });

  const toggleEmojiPicker = $(() => {
    showEmojiPicker.value = !showEmojiPicker.value;
  });

  const handleImageSend = $(async (imageData) => {
    if (!currentSessionId.value) return;

    try {
      if (imageData.caption) {
        await chatApi.sendMessage(
          currentSessionId.value,
          `📷 Image: ${imageData.caption}`,
          "text", // Add type parameter
        );
      } else {
        await chatApi.sendMessage(
          currentSessionId.value,
          "📷 Sent an image",
          "text", // Add type parameter
        );
      }

      await loadMessages(currentSessionId.value);
      showImagePreview.value = false;
      scrollToBottom();

      successMessage.value = "Image sent!";
      setTimeout(() => (successMessage.value = ""), 3000);
    } catch (err) {
      error.value = err.message;
    }
  });

  // QRL-wrapped handlers
  const handleCloseError = $(() => {
    error.value = "";
  });

  const handleCloseOnlineUsers = $(() => {
    showOnlineUsers.value = false;
  });

  const handleUserMenuClose = $(() => {
    showUserMenu.value = false;
  });

  const handleReplyCancel = $(() => {
    replyingTo.value = null;
  });

  // Filter chat list
  const filteredChats = chatList.value.filter((chat) => {
    return chat.other_user_name
      .toLowerCase()
      .includes(searchQuery.value.toLowerCase());
  });

  const onlineUsersCount = onlineUsers.value.length;

  const getCurrentOtherUserGender = () => {
    if (otherUserGender.value) return otherUserGender.value;

    const onlineUser = onlineUsers.value.find((u) => u.id === otherUserId);
    if (onlineUser?.gender) return onlineUser.gender;

    const chat = chatList.value.find((c) => c.other_user_id === otherUserId);
    if (chat?.other_user_gender) return chat.other_user_gender;

    return "";
  };

  const currentOtherUserGender = getCurrentOtherUserGender();

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
      const isOwn = msg.isOwn;
      const showTime = selectedMessageId.value === msg.id;

      return (
        <MessageBubble
          key={msg.id}
          msg={msg}
          isOwn={isOwn}
          showTime={showTime}
          onMessageClick={handleMessageClick} // This only toggles time
          onUsernameClick={handleUsernameClick} // This triggers reply
          getGenderColor={getGenderColor}
          getGenderBorderColor={getGenderBorderColor}
        />
      );
    });
  };

  return (
    <div class="fixed inset-0 top-16 flex flex-col sm:flex-row sm:gap-3 sm:p-3 bg-gray-50 sm:bg-transparent">
      {/* Chat List Sidebar */}
      <div
        class={`${showChatList.value ? "flex" : "hidden"} sm:flex w-full sm:w-72 lg:w-80 bg-white sm:border sm:border-gray-200 sm:rounded-lg flex-col overflow-hidden h-full`}
      >
        {/* Sidebar Header */}
        <div class="px-3 py-3 border-b border-gray-200">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-base font-semibold text-gray-900">Messages</h2>
            <span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {chatList.value.length}
            </span>
          </div>

          <div class="relative">
            <LuSearch class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery.value}
              onInput$={(e) => (searchQuery.value = e.target.value)}
              class="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Chat List - NO MENU ON AVATARS */}
        <div class="flex-1 overflow-y-auto">
          {loading.value && chatList.value.length === 0 && (
            <div class="flex items-center justify-center py-8">
              <div class="text-center">
                <div class="w-6 h-6 border-2 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                <p class="text-xs text-gray-500">Loading...</p>
              </div>
            </div>
          )}

          {!loading.value && filteredChats.length === 0 && (
            <div class="flex flex-col items-center justify-center py-8 px-3">
              <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <LuMessageSquare class="w-5 h-5 text-gray-400" />
              </div>
              <p class="text-xs text-gray-500 text-center">
                {searchQuery.value ? "No chats found" : "No conversations yet"}
              </p>
            </div>
          )}

          <div class="divide-y divide-gray-100">
            {filteredChats.map((chat) => (
              <div
                key={chat.session_id}
                onClick$={() => handleChatSelect(chat)}
                class={`px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors ${
                  currentSessionId.value === chat.session_id ? "bg-pink-50" : ""
                }`}
              >
                <div class="flex items-start gap-2">
                  {/* Avatar with gender border color - NOT CLICKABLE */}
                  <div class="relative flex-shrink-0">
  <div
    class={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium border-2 bg-white`}
    style={`color: ${getGenderBorderColor(chat.other_user_gender)}; border-color: ${getGenderBorderColor(chat.other_user_gender)};`}
  >
    {chat.other_user_name.charAt(0).toUpperCase()}
  </div>
  {/* Show green dot when online (1), gray dot when offline (0) */}
  <span class={`absolute bottom-0 right-0 w-2.5 h-2.5 ${chat.other_user_online ? 'bg-green-500' : 'bg-gray-400'} rounded-full border-2 border-white`}></span>
</div>

                  {/* Chat Info */}
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-0.5">
                      {/* Username - NOT CLICKABLE */}
                      <span
                        class={`font-medium text-xs truncate ${getGenderColor(chat.other_user_gender)}`}
                      >
                        {chat.other_user_name}
                      </span>
                      <span class="text-xs text-gray-500 flex-shrink-0 ml-1">
                        {formatTime(chat.last_message_time)}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <p class="text-xs text-gray-600 truncate flex-1">
                        {chat.last_message || "No messages"}
                      </p>
                      {chat.unread_count > 0 && (
                        <span class="ml-1 bg-pink-600 text-white text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                          {chat.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div
        class={`${!showChatList.value ? "flex" : "hidden"} sm:flex flex-1 bg-white sm:border sm:border-gray-200 sm:rounded-lg flex-col overflow-hidden h-full`}
      >
        {!currentSessionId.value ? (
          <div class="flex-1 flex items-center justify-center p-4">
            <div class="text-center">
              <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <LuMessageSquare class="w-6 h-6 text-gray-400" />
              </div>
              <h3 class="text-sm font-medium text-gray-900 mb-1">
                No chat selected
              </h3>
              <p class="text-xs text-gray-500">
                Choose a conversation to start
              </p>
            </div>
          </div>
        ) : (
          <div class="flex flex-col h-full">
            {/* Chat Header - WITH CLICKABLE AVATAR ONLY */}
            <div class="flex-shrink-0 px-3 py-2.5 border-b border-gray-200 flex items-center justify-between bg-white">
              <div class="flex items-center gap-2">
                <button
                  onClick$={handleBackToList}
                  class="sm:hidden p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                  aria-label="Back to chats"
                >
                  <LuArrowLeft class="w-4 h-4" />
                </button>

                {/* Avatar with gender border color - CLICKABLE FOR MENU */}
                <button
                  onClick$={(e) =>
                    handleChatHeaderAvatarClick(
                      e,
                      otherUserId,
                      otherUserName,
                      currentOtherUserGender,
                    )
                  }
                  class={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 bg-white hover:border-pink-400 transition-colors`}
                  style={`color: ${getGenderBorderColor(currentOtherUserGender)}; border-color: ${getGenderBorderColor(currentOtherUserGender)};`}
                >
                  {otherUserName?.charAt(0).toUpperCase()}
                </button>
                <div>
                  {/* Username - NOT CLICKABLE */}
                  <h2
                    class={`font-semibold text-sm ${getGenderColor(currentOtherUserGender)}`}
                  >
                    {otherUserName || "Chat"}
                  </h2>
                  <p class="text-xs text-gray-500">Direct message</p>
                </div>
              </div>

              <button
                onClick$={() =>
                  (showOnlineUsers.value = !showOnlineUsers.value)
                }
                class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LuUsers class="w-3.5 h-3.5" />
                <span>{onlineUsersCount}</span>
              </button>
            </div>

            {/* Error Message */}
            {error.value && (
              <div class="flex-shrink-0 mx-3 mt-2 flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded-lg">
                <LuAlertCircle class="w-4 h-4 text-red-500 flex-shrink-0" />
                <p class="text-xs text-red-600 flex-1">{error.value}</p>
                <button
                  onClick$={handleCloseError}
                  class="text-red-400 hover:text-red-600"
                >
                  <LuX class="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Success Message */}
            {successMessage.value && (
              <div class="flex-shrink-0 mx-3 mt-2 flex items-center gap-2 p-2 bg-green-50 border border-green-100 rounded-lg">
                <LuCheckCircle class="w-4 h-4 text-green-500 flex-shrink-0" />
                <p class="text-xs text-green-600">{successMessage.value}</p>
              </div>
            )}

            {/* Messages Area */}
            <div
              ref={messageContainerRef}
              onScroll$={checkIfAtBottom}
              class="flex-1 overflow-y-auto p-3 space-y-1"
            >
              {loading.value && messages.value.length === 0 && (
                <div class="flex items-center justify-center py-8">
                  <div class="text-center">
                    <div class="w-6 h-6 border-2 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                    <p class="text-xs text-gray-500">Loading...</p>
                  </div>
                </div>
              )}

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

            {/* Reply Preview - POSITIONED ABOVE INPUT */}
            {replyingTo.value && (
              <div class="flex-shrink-0 px-3 py-2 bg-pink-50 border-t border-pink-100 flex items-start justify-between">
                <div class="flex items-start gap-2 flex-1 min-w-0">
                  <LuReply class="w-3 h-3 text-pink-600 mt-0.5 flex-shrink-0" />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5 mb-0.5">
                      <span class="text-xs text-gray-600">Replying to</span>
                      <span
                        class={`text-xs font-semibold ${getGenderColor(replyingTo.value.gender)}`}
                      >
                        {replyingTo.value.username}
                      </span>
                      <span class="text-xs text-gray-500">
                        {formatTime(replyingTo.value.created_at)}
                      </span>
                    </div>
                    <p class="text-xs text-gray-700 truncate">
                      {replyingTo.value.content}
                    </p>
                  </div>
                </div>
                <button
                  onClick$={handleReplyCancel}
                  class="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
                >
                  <LuX class="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Message Input */}
            <div class="flex-shrink-0 px-3 py-2.5 border-t border-gray-200 bg-white">
              <div class="flex items-end gap-2">
                <div class="flex-1 relative flex items-center border border-gray-200 rounded-lg focus-within:ring-1 focus-within:ring-pink-500 focus-within:border-transparent">
                  <input
                    type="text"
                    bind:value={newMessage}
                    onKeyPress$={handleKeyPress}
                    placeholder={
                      replyingTo.value
                        ? `Reply to ${replyingTo.value.username}...`
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
                  onClick$={handleSendMessage}
                  disabled={!newMessage.value.trim()}
                  class="px-3 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                  <LuSend class="w-3.5 h-3.5" />
                  <span class="text-xs font-medium hidden sm:inline">Send</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Online Users Sidebar - NO CLICKABLE AVATARS (for menu) */}
      {showOnlineUsers.value && (
        <>
          <div
            class="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick$={handleCloseOnlineUsers}
          />

          <div class="fixed top-16 right-0 bottom-0 w-72 bg-white shadow-2xl z-50 lg:relative lg:top-0 lg:w-64 lg:border lg:border-gray-200 lg:rounded-lg p-3 overflow-hidden flex flex-col">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <LuUsers class="w-4 h-4" />
                Online Now
              </h3>
              <button
                onClick$={handleCloseOnlineUsers}
                class="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <LuX class="w-4 h-4" />
              </button>
            </div>

            {onlineUsers.value.length === 0 && (
              <div class="flex-1 flex items-center justify-center">
                <p class="text-xs text-gray-500">No one online</p>
              </div>
            )}

            <div class="flex-1 overflow-y-auto space-y-2">
              {onlineUsers.value.map((user) => (
                <div
                  key={user.id}
                  class="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div class="flex items-center gap-2 flex-1">
                    <div class="relative">
                      {/* Avatar with gender border color - NOT CLICKABLE */}
                      <div
                        class={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 bg-white`}
                        style={`color: ${getGenderBorderColor(user.gender)}; border-color: ${getGenderBorderColor(user.gender)};`}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                    </div>
                    <div class="flex-1 min-w-0">
                      {/* Username - NOT CLICKABLE */}
                      <span
                        class={`text-xs font-medium block truncate ${getGenderColor(user.gender)}`}
                      >
                        {user.username}
                      </span>
                      <span class="text-xs text-gray-500">
                        {user.is_guest ? "Guest" : "User"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick$={() => handleStartChat(user)}
                    class="p-1.5 text-pink-600 hover:bg-pink-50 rounded-lg transition-colors flex-shrink-0"
                    title="Start chat"
                  >
                    <LuMessageSquare class="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* User Menu - ONLY FOR CHAT HEADER AVATAR */}
      <UserMenu
        showUserMenu={showUserMenu.value}
        userMenuPosition={userMenuPosition.value}
        selectedUser={selectedUser.value}
        auth={auth}
        onClose={handleUserMenuClose}
        onSendFriendRequest={handleSendFriendRequest}
        onBlockUser={handleBlockUser}
      />
    </div>
  );
});

export const head = {
  title: "Chat",
};
