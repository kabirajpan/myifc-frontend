import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import { useRoomContext } from "../../../../store/room.store";
import { useAuth } from "../../../../context/auth";
import { RoomChat } from "../../../../components/rooms/RoomChat";
import { RoomMembersList } from "../../../../components/rooms/RoomMembersList";
import { ImageViewer } from "../../../../components/ui/ImageViewer";
import { roomsApi } from "../../../../api/rooms";
import { wsService } from "../../../../api/websocket";
import { mediaApi } from "../../../../api/media";

export default component$(() => {
  const auth = useAuth();
  const room = useRoomContext();
  const location = useLocation();
  const nav = useNavigate();

  // Get room ID from URL - Keep as string, don't parse to int
  const roomId = location.params.roomId;

  // Debug log
  console.log('🔍 Room ID from URL:', roomId);

  // Load room messages
  const loadRoomMessages = $(async (id) => {
    try {
      room.state.loading = true;
      const response = await roomsApi.getMessages(id);
      room.state.messages = (response.messages || []).map(msg => ({
        ...msg,
        isOwn: msg.sender_id === auth.user.value?.id,
      }));
      room.state.loading = false;
    } catch (err) {
      room.state.error = err.message || "Failed to load messages";
      room.state.loading = false;
    }
  });

  // Load room members
  const loadRoomMembers = $(async (id) => {
    try {
      const response = await roomsApi.getMembers(id);
      room.state.members = response.members || [];
    } catch (err) {
      console.error("Failed to load members:", err);
    }
  });

  // Load room details
  const loadRoomDetails = $(async (id) => {
    try {
      const response = await roomsApi.getRoom(id);
      room.state.currentRoom = response.room;
    } catch (err) {
      room.state.error = err.message || "Room not found";
      // Redirect back to rooms list if room doesn't exist
      setTimeout(() => nav("/rooms"), 2000);
    }
  });

  // Initialize and load data
  useVisibleTask$(async ({ cleanup, track }) => {
    // Track location changes
    track(() => location.params.roomId);

    // Validate room ID
    if (!roomId) {
      console.error('❌ No room ID provided');
      room.state.error = "No room ID provided";
      setTimeout(() => nav("/rooms"), 2000);
      return;
    }

    try {
      console.log('✅ Loading room:', roomId);
      room.state.loading = true;

      // Reset state
      room.state.currentRoomId = roomId;
      room.state.messages = [];
      room.state.members = [];
      room.state.imageViewer.isOpen = false;
      room.state.imageViewer.images = [];
      room.state.imageViewer.currentIndex = 0;
      room.state.imageViewer.isBuilt = false;

      // Connect WebSocket
      wsService.connect();

      // Subscribe to WebSocket events
      const unsubscribe = wsService.onMessage((data) => {
        console.log('📨 WebSocket room event:', data);

        // New room message
        if (data.type === "new_message" && data.data?.room_id === roomId) {
          const message = data.data.message;
          const newMsg = {
            ...message,
            isOwn: message.sender_id === auth.user.value?.id,
          };

          const exists = room.state.messages.some(m => m.id === newMsg.id);
          if (!exists) {
            room.state.messages = [...room.state.messages, newMsg];

            // Update image viewer if open
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
          }
        }

        // User joined room
        if (data.type === "user_joined_room" && data.room_id === roomId) {
          loadRoomMembers(roomId);
        }

        // User left room
        if (data.type === "user_left_room" && data.room_id === roomId) {
          room.state.members = room.state.members.filter(m => m.id !== data.user_id);
        }

        // Message reactions
        if (data.type === "message_reacted" && data.room_id === roomId) {
          room.state.messages = room.state.messages.map(m => {
            if (m.id === data.message_id) {
              const reactions = m.reactions || [];
              return { ...m, reactions: [...reactions, data.reaction] };
            }
            return m;
          });
        }

        if (data.type === "reaction_removed" && data.room_id === roomId) {
          room.state.messages = room.state.messages.map(m => {
            if (m.id === data.message_id) {
              const reactions = (m.reactions || []).filter(r => r.id !== data.reaction_id);
              return { ...m, reactions };
            }
            return m;
          });
        }
      });

      // Load room data
      await Promise.all([
        loadRoomDetails(roomId),
        loadRoomMessages(roomId),
        loadRoomMembers(roomId)
      ]);

      room.state.loading = false;

      // Cleanup on unmount
      return () => {
        unsubscribe();
      };
    } catch (err) {
      console.error('❌ Error loading room:', err);
      room.state.error = err.message || "Failed to load room";
      room.state.loading = false;
    }
  });

  const handleSendMessage = $(async (data) => {
    if (!roomId) return;

    // Create temp message for instant UI feedback
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      sender_id: auth.user.value.id,
      sender_username: auth.user.value.username,
      sender_gender: auth.user.value.gender,
      content: data.type === 'text' ? data.content : data.content,
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

    // Add to UI immediately
    room.state.messages = [...room.state.messages, tempMessage];

    // Clear reply state
    const replyId = room.state.replyingTo?.id || null;
    room.state.replyingTo = null;

    try {
      // Send to backend
      const response = await roomsApi.sendMessage(
        roomId,
        data.content,
        data.type,
        replyId,
        null,
        data.caption
      );

      // Replace temp message with real one
      room.state.messages = room.state.messages.map(m =>
        m.id === tempId ? { ...response.message, isOwn: true } : m
      );

    } catch (err) {
      // Remove temp message on error
      room.state.messages = room.state.messages.filter(m => m.id !== tempId);
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
      room.state.messages = room.state.messages.filter((m) => m.id !== messageId);
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
      room.state.imageViewer.images = room.state.messages
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
      
      room.state.messages = room.state.messages.map(m => {
        if (m.id === messageId) {
          const reactions = m.reactions || [];
          return { ...m, reactions: [...reactions, { id: Date.now(), emoji, user_id: auth.user.value.id }] };
        }
        return m;
      });

      const imgIndex = room.state.imageViewer.currentIndex;
      const currentImg = room.state.imageViewer.images[imgIndex];
      if (currentImg) {
        const reactions = currentImg.reactions || [];
        room.state.imageViewer.images[imgIndex] = {
          ...currentImg,
          reactions: [...reactions, { id: Date.now(), emoji, user_id: auth.user.value.id }]
        };
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

  const handleBack = $(() => {
    nav("/rooms");
  });

  const handleShowMembers = $(() => {
    room.showMembers.value = !room.showMembers.value;
  });

  const handleCancelReply = $(() => {
    room.state.replyingTo = null;
  });

  const handleClearError = $(() => {
    room.state.error = null;
  });

  const handleClearSuccess = $(() => {
    room.state.successMessage = null;
  });

  const handleMembersClose = $(() => {
    room.showMembers.value = false;
  });

  // Show loading while room ID is being validated
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
    <div class="fixed inset-0 top-16 flex sm:gap-3 sm:p-3 bg-gray-50 sm:bg-transparent">
      {/* Main Chat Area */}
      <div class="flex-1 flex">
        <RoomChat
          currentRoom={room.state.currentRoom}
          messages={room.state.messages}
          onBack={handleBack}
          onShowMembers={handleShowMembers}
          onSendMessage={handleSendMessage}
          onMessageClick={handleMessageClick}
          onUsernameClick={handleUsernameClick}
          onDeleteMessage={handleDeleteMessage}
          onImageClick={handleImageClick}
          selectedMessageId={room.selectedMessageId.value}
          deletingMessageId={room.state.deletingMessageId}
          replyingTo={room.state.replyingTo}
          onCancelReply={handleCancelReply}
          successMessage={room.state.successMessage}
          error={room.state.error}
          onClearError={handleClearError}
          onClearSuccess={handleClearSuccess}
          currentUserId={auth.user.value?.id}
        />
      </div>

      {/* Members List Sidebar */}
      {room.showMembers.value && (
        <RoomMembersList
          isOpen={room.showMembers.value}
          onClose={handleMembersClose}
          members={room.state.members}
          currentUserId={auth.user.value?.id}
        />
      )}

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