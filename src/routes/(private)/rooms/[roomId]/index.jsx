import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import { useAuth } from "../../../../context/auth";
import { roomsApi } from "../../../../api/rooms";
import { friendsApi } from "../../../../api/friends";
import { mediaApi } from "../../../../api/media.js";
import { wsService } from "../../../../api/websocket";
import { useRoomContext } from "../../../../store/room.store";
import { useUserContext } from "../../../../store/user.store";
import { MediaUpload } from "../../../../components/ui/MediaUpload.jsx";
import { ImageViewer } from "../../../../components/ui/ImageViewer.jsx";
import { EmojiPicker } from "../../../../components/ui/EmojiPicker.jsx";
import { getGenderColor, getGenderBorderColor, formatTime } from "../../../../utils/helpers";

// Import shared components
import { 
  RoomSidebar,
  RoomListItem 
} from "../../../../components/rooms/RoomSidebar";
import { 
  RoomsLayout,
  RoomsSidebarContainer,
  RoomsChatContainer 
} from "../../../../components/rooms/RoomsLayout";
import { 
  RoomHeader,
  MessageBubble,
  MembersSidebar,
  UserMenu 
} from "../../../../components/rooms/ChatComponents"; // We'll create this

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

  // Use stores
  const room = useRoomContext();
  const users = useUserContext();

  const roomId = location.params.roomId;

  // Room state
  const currentRoom = useSignal(null);
  const members = useSignal([]);
  const timeLeft = useSignal(null);

  // Local UI state
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
  const showRoomList = useSignal(false); // Hide sidebar on mobile by default when room is open
  const activeReactionMessageId = useSignal(null);

  // Scroll functions
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

  // Auto-scroll on new messages
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

      room.state.messages = (messagesData.messages || []).map(msg => ({
        ...msg,
        isOwn: msg.sender_id === auth.user.value?.id,
      }));

      // Load user's rooms for sidebar
      const roomsData = await roomsApi.getUserRooms();
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

  // WebSocket handler
  const handleWebSocketMessage = $((data) => {
    if (data.type === "new_message") {
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

    if (data.type === "user_joined_room" || data.type === "user_left_room") {
      if (data.data?.room_id === roomId) {
        loadRoomData();
      }
    }
  });

  useVisibleTask$(async ({ track, cleanup }) => {
    // Track roomId changes
    track(() => roomId);

    if (!roomId) return;

    try {
      room.state.loading = true;

      // Reset state when switching rooms
      room.state.messages = [];
      room.state.imageViewer = {
        isOpen: false,
        images: [],
        currentIndex: 0,
        isBuilt: false,
      };
      replyingTo.value = null;
      secretReplyTo.value = null;
      selectedMedia.value = null;

      wsService.connect();
      const unsubscribe = wsService.onMessage(handleWebSocketMessage);

      await loadRoomData();

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

      cleanup(() => {
        unsubscribe();
        clearInterval(interval);
      });
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

  // Message sending
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
        onOpenReactionPicker={$((messageId) => activeReactionMessageId.value = messageId)}
      />
    ));
  };

  const canDelete = auth.user.value?.role === "admin" ||
    currentRoom.value?.creator_id === auth.user.value?.id;

  const toggleRoomList = $(() => {
    showRoomList.value = !showRoomList.value;
  });

  return (
    <RoomsLayout>
      {/* Sidebar */}
      <RoomsSidebarContainer showRoomList={showRoomList.value}>
        <RoomSidebar 
          showCreateModal={false}
          onToggleCreateModal={$(() => {})}
          selectedRoomId={roomId}
        />
      </RoomsSidebarContainer>

      {/* Main Chat Area */}
      <RoomsChatContainer showRoomList={showRoomList.value}>
        {!currentRoom.value ? (
          <div class="flex-1 flex items-center justify-center p-4">
            <div class="text-center">
              <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <LuMessageSquare class="w-6 h-6 text-gray-400" />
              </div>
              <h3 class="text-sm font-medium text-gray-900 mb-1">Loading room...</h3>
              <p class="text-xs text-gray-500">Please wait</p>
            </div>
          </div>
        ) : (
          <div class="flex flex-col h-full">
            {/* Room Header */}
            <div class="flex-shrink-0 px-3 py-2.5 border-b border-gray-200 bg-white">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 flex-1 min-w-0">
                  <button
                    onClick$={toggleRoomList}
                    class="sm:hidden p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                    aria-label="Back to rooms"
                  >
                    <LuArrowLeft class="w-4 h-4" />
                  </button>

                  <div class={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 ${currentRoom.value?.is_private ? 'bg-purple-600' : 'bg-pink-600'}`}>
                    {currentRoom.value?.name.charAt(0).toUpperCase()}
                  </div>

                  <div class="flex-1 min-w-0">
                    <h2 class="font-semibold text-gray-900 text-sm truncate">
                      {currentRoom.value?.name}
                      {currentRoom.value?.is_private && <LuLock class="w-3 h-3 text-purple-600 inline ml-1" />}
                    </h2>
                    <p class="text-xs text-gray-500 truncate">
                      {currentRoom.value?.description || `by ${currentRoom.value?.creator_username}`}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-1">
                  <button
                    onClick$={() => (showMembers.value = !showMembers.value)}
                    class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <LuUsers class="w-3.5 h-3.5" />
                    <span>{members.value.length}</span>
                  </button>

                  {canDelete && (
                    <button
                      onClick$={handleDeleteRoom}
                      class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete room"
                    >
                      <LuTrash2 class="w-3.5 h-3.5" />
                    </button>
                  )}

                  {hasJoined.value && (
                    <button
                      onClick$={handleLeaveRoom}
                      class="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Leave room"
                    >
                      <LuLogOut class="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {currentRoom.value?.will_expire && timeLeft.value > 0 && (
                <div class="mt-2 flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded-lg">
                  <LuAlertCircle class="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium text-red-800">
                      Room closing in:{" "}
                      <span class="font-semibold">{formatTimeLeft(timeLeft.value)}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {room.state.error && (
              <div class="flex-shrink-0 mx-3 mt-2 flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded-lg">
                <LuAlertCircle class="w-4 h-4 text-red-500 flex-shrink-0" />
                <p class="text-xs text-red-600 flex-1">{room.state.error}</p>
                <button onClick$={() => (room.state.error = null)} class="text-red-400 hover:text-red-600">
                  <LuX class="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Success Message */}
            {room.state.successMessage && (
              <div class="flex-shrink-0 mx-3 mt-2 flex items-center gap-2 p-2 bg-green-50 border border-green-100 rounded-lg">
                <LuCheckCircle class="w-4 h-4 text-green-500 flex-shrink-0" />
                <p class="text-xs text-green-600">{room.state.successMessage}</p>
              </div>
            )}

            {/* Join Room Prompt */}
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
                        <p class="text-xs text-gray-500">Loading messages...</p>
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
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-medium text-gray-700">
                        {selectedMedia.value.type === 'image' ? 'Image' : 
                         selectedMedia.value.type === 'gif' ? 'GIF' : 'Audio'} ready
                      </span>
                      <button
                        onClick$={() => (selectedMedia.value = null)}
                        class="text-gray-400 hover:text-gray-600"
                      >
                        <LuX class="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {selectedMedia.value.type === 'image' || selectedMedia.value.type === 'gif' ? (
                      <img
                        src={selectedMedia.value.preview}
                        alt="Preview"
                        class="max-w-full max-h-32 rounded-lg"
                      />
                    ) : (
                      <div class="flex items-center gap-2 bg-gray-100 rounded-lg p-2">
                        <div class="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center">
                          <LuPlay class="w-4 h-4 text-white" />
                        </div>
                        <span class="text-xs text-gray-600">Audio message</span>
                      </div>
                    )}
                    {selectedMedia.value.uploading && (
                      <div class="flex items-center gap-2 text-xs text-gray-600 mt-2">
                        <div class="w-3 h-3 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Uploading...</span>
                      </div>
                    )}
                    {selectedMedia.value.publicId && !selectedMedia.value.uploading && (
                      <div class="flex items-center gap-1 text-xs text-green-600 mt-2">
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
                        {showEmojiPicker.value && (
                          <div class="absolute bottom-full right-0 mb-2 z-10">
                            <EmojiPicker
                              show={showEmojiPicker.value}
                              onEmojiSelect={$((emoji) => {
                                newMessage.value = newMessage.value + emoji;
                                showEmojiPicker.value = false;
                              })}
                              onClose={$(() => (showEmojiPicker.value = false))}
                            />
                          </div>
                        )}
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

        {/* Members Sidebar */}
        {showMembers.value && (
          <div class="fixed inset-0 top-16 z-40 flex sm:relative sm:inset-auto sm:top-0">
            <div 
              class="flex-1 bg-black/50 sm:hidden"
              onClick$={() => showMembers.value = false}
            />
            <div class="w-72 bg-white shadow-xl sm:shadow-none sm:border sm:border-gray-200 sm:rounded-lg sm:absolute sm:right-3 sm:top-3 sm:bottom-3 z-50 p-3 overflow-hidden flex flex-col">
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-semibold text-gray-900 text-sm flex items-center gap-2">
                  <LuUsers class="w-4 h-4" />
                  Members ({members.value.length})
                </h3>
                <button
                  onClick$={() => showMembers.value = false}
                  class="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  <LuX class="w-4 h-4" />
                </button>
              </div>

              <div class="flex-1 overflow-y-auto space-y-2">
                {members.value.filter((member) => member.is_online).map((member) => (
                  <button
                    key={member.id}
                    onClick$={(e) =>
                      member.user_id !== auth.user.value?.id &&
                      handleAvatarClick(e, member)
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
          </div>
        )}

        {/* User Menu */}
        {showUserMenu.value && selectedUser.value && (
          <>
            <div class="fixed inset-0 z-50" onClick$={() => showUserMenu.value = false} />
            <div
              class="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[160px]"
              style={`top: ${userMenuPosition.value.top}px; left: ${userMenuPosition.value.left}px;`}
            >
              <button
                onClick$={handleDirectMessage}
                class="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors text-left"
              >
                <LuMessageSquare class="w-3.5 h-3.5 text-gray-600" />
                <span>Direct Message</span>
              </button>

              <button
                onClick$={handleSecretReply}
                class="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-blue-50 text-blue-600 transition-colors text-left"
              >
                <LuLock class="w-3.5 h-3.5" />
                <span>Secret Reply</span>
              </button>

              {!auth.user.value?.is_guest && (
                <>
                  <button
                    onClick$={handleSendFriendRequest}
                    class="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors text-left"
                  >
                    <LuUserPlus class="w-3.5 h-3.5 text-gray-600" />
                    <span>Add Friend</span>
                  </button>

                  <button
                    onClick$={handleBlockUser}
                    class="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-50 text-red-600 transition-colors text-left"
                  >
                    <LuBan class="w-3.5 h-3.5" />
                    <span>Block User</span>
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </RoomsChatContainer>
    </RoomsLayout>
  );
});

export const head = {
  title: "Room Chat",
};