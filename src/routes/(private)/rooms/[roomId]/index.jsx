import { component$, useSignal, $, useVisibleTask$, useComputed$ } from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import {
  useRoomContext,
  getCachedRoom,
  isCacheStale,
  setCachedRoom,
  updateRoomInList,
  addMessage,
  removeMessage,
  updateMessage
} from "../../../../store/room.store";
import { useAuth } from "../../../../context/auth";
import { RoomList } from "../../../../components/rooms/RoomList";
import { RoomChat } from "../../../../components/rooms/RoomChat";
import { RoomMembersList } from "../../../../components/rooms/RoomMembersList";
import { ImageViewer } from "../../../../components/ui/ImageViewer";
import { CreateRoomModal } from "../../../../components/rooms/CreateRoomModal";
import { JoinRoomModal } from "../../../../components/rooms/JoinRoomModal";
import { roomsApi } from "../../../../api/rooms";

export default component$(() => {
  const auth = useAuth();
  const room = useRoomContext();
  const location = useLocation();
  const nav = useNavigate();

  const roomId = location.params.roomId;

  // Modal states
  const showCreateModal = useSignal(false);
  const showJoinModal = useSignal(false);
  const publicRooms = useSignal([]);

  // Computed values from cache
  // Computed values from cache - track roomId changes
  const cachedRoom = useComputed$(() => {
    const id = location.params.roomId;
    return room.state.roomsCache[id];
  });
  const messages = useComputed$(() => {
    const id = location.params.roomId;
    return room.state.roomsCache[id]?.messages || [];
  });
  const members = useComputed$(() => {
    const id = location.params.roomId;
    return room.state.roomsCache[id]?.members || [];
  });
  const currentRoom = useComputed$(() => {
    const id = location.params.roomId;
    return room.state.roomsCache[id]?.room || null;
  });

  // Load room data (with smart caching)
  const loadRoomData = $(async (id) => {
    try {
      console.log('🔄 Loading room:', id);
      room.state.loading = true;
      room.state.activeRoomId = id;

      // Check cache first
      const cached = getCachedRoom(room.state, id);
      const isStale = isCacheStale(room.state, id);

      if (cached && !isStale) {
        console.log('✅ Using cached data for room:', id);
        room.state.loading = false;
        return;
      }

      console.log('📡 Fetching fresh data for room:', id);

      // Load in parallel
      const [roomResponse, messagesResponse, membersResponse] = await Promise.all([
        roomsApi.getRoom(id),
        roomsApi.getMessages(id),
        roomsApi.getMembers(id)
      ]);

      // Map messages with ownership
      const mappedMessages = (messagesResponse.messages || []).map(msg => ({
        ...msg,
        isOwn: msg.sender_id === auth.user.value?.id,
      }));

      // Update cache
      setCachedRoom(room.state, id, {
        room: roomResponse.room,
        messages: mappedMessages,
        members: membersResponse.members || [],
        hasJoined: true,
      });

      // Reset unread count for this room
      updateRoomInList(room.state, id, { unread_count: 0 });

      room.state.loading = false;
      console.log('✅ Room data loaded and cached');

    } catch (err) {
      console.error('❌ Error loading room:', err);
      room.state.error = err.message || "Failed to load room";
      room.state.loading = false;
      setTimeout(() => nav("/rooms"), 2000);
    }
  });

  // Load public rooms
  const loadPublicRooms = $(async () => {
    try {
      const response = await roomsApi.getPublicRooms();
      publicRooms.value = response.rooms || [];
    } catch (err) {
      room.state.error = err.message || "Failed to load public rooms";
    }
  });

  // Initialize room
  useVisibleTask$(async ({ track, cleanup }) => {
    const currentRoomId = track(() => location.params.roomId);

    if (!currentRoomId) {
      console.error('❌ No room ID provided');
      room.state.error = "No room ID provided";
      setTimeout(() => nav("/rooms"), 2000);
      return;
    }

    console.log('🎯 Room changed to:', currentRoomId);

    // Reset UI state
    room.state.error = null;
    room.state.replyingTo = null;
    room.state.imageViewer.isOpen = false;
    room.state.imageViewer.isBuilt = false;

    // Load room data (uses cache if available)
    await loadRoomData(currentRoomId);

    // Cleanup
    cleanup(() => {
      console.log('🧹 Room cleanup:', currentRoomId);
      room.state.activeRoomId = null;
    });
  });

  // Handlers
  const handleCreateRoom = $(async (data) => {
    try {
      const response = await roomsApi.createRoom(data.name, data.description, data.isAdminRoom);

      showCreateModal.value = false;
      room.state.successMessage = "Room created successfully!";
      setTimeout(() => (room.state.successMessage = null), 3000);

      // Add to room list
      if (response.room) {
        const exists = room.state.rooms.some(r => r.id === response.room.id);
        if (!exists) {
          room.state.rooms = [...room.state.rooms, response.room];
        }
        await nav(`/rooms/${response.room.id}`);
      }
    } catch (err) {
      room.state.error = err.message || "Failed to create room";
    }
  });

  const handleJoinRoom = $(async (joinRoomId) => {
    try {
      await roomsApi.joinRoom(joinRoomId);

      showJoinModal.value = false;
      room.state.successMessage = "Joined room successfully!";
      setTimeout(() => (room.state.successMessage = null), 3000);

      // Reload room list to include new room
      const response = await roomsApi.getUserRooms();
      room.state.rooms = response.rooms || [];

      await nav(`/rooms/${joinRoomId}`);
    } catch (err) {
      room.state.error = err.message || "Failed to join room";
    }
  });

  const handleRoomSelect = $(async (selectedRoom) => {
    console.log('🎯 Room selected:', selectedRoom.id);

    // Close mobile room list
    if (room.showRoomList) {
      room.showRoomList.value = false;
    }

    await nav(`/rooms/${selectedRoom.id}`);
  });

  const handleSearchChange = $((query) => {
    room.state.searchQuery = query;
  });

  const handleSendMessage = $(async (data) => {
    if (!roomId) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      sender_id: auth.user.value.id,
      sender_username: auth.user.value.username,
      sender_gender: auth.user.value.gender,
      content: data.content,
      type: data.type,
      caption: data.caption,
      created_at: new Date().toISOString(),
      isOwn: true,
      is_read: false,
      sending: true,
      reply_to_message_id: room.state.replyingTo?.id || null,
      ...(room.state.replyingTo && {
        reply_to_message_content: room.state.replyingTo.content,
        reply_to_message_sender: room.state.replyingTo.username,
        reply_to_message_gender: room.state.replyingTo.gender,
        reply_to_message_time: room.state.replyingTo.created_at,
        reply_to_message_type: room.state.replyingTo.type || "text",
        reply_to_message_caption: room.state.replyingTo.caption || null,
      }),
    };

    // Add optimistically
    addMessage(room.state, roomId, tempMessage);

    const replyId = room.state.replyingTo?.id || null;
    room.state.replyingTo = null;

    try {
      const response = await roomsApi.sendMessage(
        roomId,
        data.content,
        data.type,
        replyId,
        null,
        data.caption
      );

      // Update with real message
      updateMessage(room.state, roomId, tempId, {
        ...response.message,
        isOwn: true,
        sending: false
      });
    } catch (err) {
      // Remove failed message
      removeMessage(room.state, roomId, tempId);
      room.state.error = err.message || "Failed to send message";
    }
  });

  const handleMessageClick = $((messageId) => {
    room.selectedMessageId.value =
      room.selectedMessageId.value === messageId ? null : messageId;
  });

  const handleUsernameClick = $((message) => {
    if (message.sender_id === auth.user.value?.id) return;

    let contentForReply = message.content;
    if (message.type === 'image' || message.type === 'gif') {
      contentForReply = message.caption || 'Image';
    } else if (message.type === 'audio') {
      contentForReply = message.caption || 'Voice message';
    }

    room.state.replyingTo = {
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
      removeMessage(room.state, roomId, messageId);
      room.state.successMessage = "Message deleted";
      setTimeout(() => (room.state.successMessage = null), 3000);
    } catch (err) {
      room.state.error = err.message || "Failed to delete message";
    } finally {
      room.state.deletingMessageId = null;
    }
  });

  const handleImageClick = $((messageId, url) => {
    if (!room.state.imageViewer.isBuilt) {
      room.state.imageViewer.images = messages.value
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
      room.state.imageViewer.isBuilt = true;
    }

    const index = room.state.imageViewer.images.findIndex(img => img.id === messageId);
    if (index !== -1) {
      room.state.imageViewer.currentIndex = index;
      room.state.imageViewer.isOpen = true;
    }
  });

  const handleImageClose = $(() => {
    room.state.imageViewer.isOpen = false;
  });

  const handleImagePrevious = $(() => {
    if (room.state.imageViewer.currentIndex > 0) {
      room.state.imageViewer.currentIndex--;
    }
  });

  const handleImageNext = $(() => {
    if (room.state.imageViewer.currentIndex < room.state.imageViewer.images.length - 1) {
      room.state.imageViewer.currentIndex++;
    }
  });

  const handleImageReact = $(async (messageId, emoji) => {
    try {
      await roomsApi.reactToMessage(roomId, messageId, emoji);

      // Find message first, then update
      const message = room.state.roomsCache[roomId]?.messages?.find(m => m.id === messageId);
      if (message) {
        updateMessage(room.state, roomId, messageId, {
          reactions: [...(message.reactions || []), {
            id: Date.now(),
            emoji,
            user_id: auth.user.value.id
          }]
        });
      }

      room.state.successMessage = "Reaction added!";
      setTimeout(() => (room.state.successMessage = null), 2000);
    } catch (err) {
      room.state.error = err.message || "Failed to add reaction";
    }
  });

  const handleImageReport = $(async (messageId, reason, details) => {
    try {
      await roomsApi.reportMessage(roomId, messageId, reason, details);
      room.state.successMessage = "Report submitted successfully";
      setTimeout(() => (room.state.successMessage = null), 3000);
    } catch (err) {
      room.state.error = err.message || "Failed to submit report";
    }
  });

  const handleImageShare = $(async (messageId) => {
    try {
      const currentImg = room.state.imageViewer.images[room.state.imageViewer.currentIndex];
      await navigator.clipboard.writeText(currentImg.url);
      room.state.successMessage = "Image URL copied!";
      setTimeout(() => (room.state.successMessage = null), 2000);
    } catch (err) {
      room.state.error = "Failed to copy URL";
    }
  });

  if (!roomId) {
    return (
      <div class="fixed inset-0 top-16 flex items-center justify-center bg-gray-50">
        <div class="text-center">
          <p class="text-sm text-red-600 mb-2">No room ID provided</p>
          <p class="text-xs text-gray-500">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="fixed inset-0 top-16 flex flex-col sm:flex-row sm:gap-3 sm:p-3 bg-gray-50 sm:bg-transparent">
      {/* Room List Sidebar */}
      <div class={`${room.showRoomList?.value === false ? "hidden" : "flex"} sm:flex w-full sm:w-72 lg:w-80 bg-white sm:border sm:border-gray-200 sm:rounded-lg flex-col overflow-hidden h-full`}>
        <RoomList
          rooms={room.state.rooms}
          currentRoomId={roomId}
          searchQuery={room.state.searchQuery}
          loading={room.state.loading && room.state.rooms.length === 0}
          onSearchChange={handleSearchChange}
          onRoomSelect={handleRoomSelect}
          onCreateClick={$(() => showCreateModal.value = true)}
          onJoinClick={$(async () => {
            await loadPublicRooms();
            showJoinModal.value = true;
          })}
        />
      </div>

      {/* Main Chat Area */}
      <div class={`${room.showRoomList?.value === false ? "flex" : "hidden"} sm:flex flex-1 bg-white sm:border sm:border-gray-200 sm:rounded-lg flex-col overflow-hidden h-full`}>
        <RoomChat
          currentRoom={currentRoom.value}
          messages={messages.value}
          onBack={$(() => room.showRoomList ? room.showRoomList.value = true : null)}
          onShowMembers={$(() => room.showMembers.value = !room.showMembers.value)}
          onSendMessage={handleSendMessage}
          onMessageClick={handleMessageClick}
          onUsernameClick={handleUsernameClick}
          onDeleteMessage={handleDeleteMessage}
          onImageClick={handleImageClick}
          selectedMessageId={room.selectedMessageId.value}
          deletingMessageId={room.state.deletingMessageId}
          replyingTo={room.state.replyingTo}
          onCancelReply={$(() => room.state.replyingTo = null)}
          successMessage={room.state.successMessage}
          error={room.state.error}
          onClearError={$(() => room.state.error = null)}
          onClearSuccess={$(() => room.state.successMessage = null)}
          currentUserId={auth.user.value?.id}
        />
      </div>

      {/* Members List Sidebar */}
      {room.showMembers.value && (
        <RoomMembersList
          isOpen={room.showMembers.value}
          onClose={$(() => room.showMembers.value = false)}
          members={members.value}
          currentUserId={auth.user.value?.id}
        />
      )}

      {/* Modals */}
      <CreateRoomModal
        isOpen={showCreateModal.value}
        onClose={$(() => showCreateModal.value = false)}
        onSubmit={handleCreateRoom}
      />

      <JoinRoomModal
        isOpen={showJoinModal.value}
        onClose={$(() => showJoinModal.value = false)}
        onJoin={handleJoinRoom}
        publicRooms={publicRooms.value}
      />

      {/* Image Viewer */}
      <ImageViewer
        imageUrl={
          room.state.imageViewer.isOpen && room.state.imageViewer.images[room.state.imageViewer.currentIndex]
            ? room.state.imageViewer.images[room.state.imageViewer.currentIndex].url
            : null
        }
        isOpen={room.state.imageViewer.isOpen}
        onClose={handleImageClose}
        messageData={
          room.state.imageViewer.isOpen && room.state.imageViewer.images[room.state.imageViewer.currentIndex]
            ? room.state.imageViewer.images[room.state.imageViewer.currentIndex]
            : null
        }
        onPrevious={handleImagePrevious}
        onNext={handleImageNext}
        hasPrevious={room.state.imageViewer.currentIndex > 0}
        hasNext={room.state.imageViewer.currentIndex < room.state.imageViewer.images.length - 1}
        onReact={handleImageReact}
        onReport={handleImageReport}
        onShare={handleImageShare}
      />
    </div>
  );
});

export const head = {
  title: "Room Chat",
};