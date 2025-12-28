import { component$, useSignal, $, useVisibleTask$, useComputed$ } from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import {
  useRoomContext,
  getCachedRoom,
  isCacheStale,
  setCachedRoom,
  updateRoomInList,
  addMessageToNew,
  addMessage,
  removeMessage,
  updateMessage,
  updatePagination,
  setOldMessages,
  prependOldMessages
} from "../../../../store/room.store";
import { useAuth } from "../../../../context/auth";
import { ChatSidebar } from "../../../../components/chat/ChatSidebar.jsx";
import { ChatContainer } from "../../../../components/chat/ChatContainer.jsx";
import { UserList } from "../../../../components/chat/UserList.jsx";
import { ImageViewer } from "../../../../components/ui/ImageViewer";
import { CreateRoomModal } from "../../../../components/rooms/CreateRoomModal";
import { JoinRoomModal } from "../../../../components/rooms/JoinRoomModal";
import { UnifiedSidebar } from "../../../../components/chat/UnifiedSidebar.jsx";
import { useUnifiedSidebar } from "../../../../utils/useUnifiedSidebar.js";
import { roomsApi } from "../../../../api/rooms";
import { chatApi } from "../../../../api/chat-enhanced";
import { wsService } from "../../../../api/websocket";

export default component$(() => {
  const auth = useAuth();
  const room = useRoomContext();
  const location = useLocation();
  const nav = useNavigate();

  // Unified sidebar
  const unifiedSidebar = useUnifiedSidebar();

  const roomId = location.params.roomId;

  // Modal states
  const showCreateModal = useSignal(false);
  const showJoinModal = useSignal(false);
  const publicRooms = useSignal([]);

  const messageContainerRef = useSignal(null);

  // ✅ UPDATED: Combine OLD + NEW messages for display
  const messages = useComputed$(() => {
    const id = location.params.roomId;
    const cache = room.state.roomsCache[id];

    if (!cache) return [];

    const oldMessages = cache.oldMessages || [];
    const newMessages = cache.messages || [];

    // Combine: OLD messages first, then NEW messages
    return [...oldMessages, ...newMessages];
  });

  const members = useComputed$(() => {
    const id = location.params.roomId;
    return room.state.roomsCache[id]?.members || [];
  });

  const currentRoom = useComputed$(() => {
    const id = location.params.roomId;
    return room.state.roomsCache[id]?.room || null;
  });

  const pagination = useComputed$(() => {
    const id = location.params.roomId;
    return room.state.roomsCache[id]?.pagination || {
      hasOldMessages: false,
      oldMessageCount: 0,
      oldMessagesLoaded: false,
      isLoadingOld: false,
      totalCount: 0,
    };
  });

  const loadRoomData = $(async (id) => {
    try {
      console.log('🔄 Loading room:', id);
      room.state.loading = true;
      room.state.activeRoomId = id;

      const cached = getCachedRoom(room.state, id);
      const isStale = isCacheStale(room.state, id);

      if (cached && !isStale) {
        console.log('✅ Using cached data for room:', id);
        room.state.loading = false;
        return;
      }

      console.log('📡 Fetching fresh data for room:', id);

      // Get total message count
      const countResponse = await roomsApi.getMessageCount(id);
      const totalCount = countResponse.count || 0;
      console.log(`📊 Room has ${totalCount} total messages`);

      let newMessagesToLoad;
      let offset;
      let hasOldMessages;
      let oldMessageCount;

      if (totalCount === 0) {
        // No messages
        newMessagesToLoad = 0;
        offset = 0;
        hasOldMessages = false;
        oldMessageCount = 0;
        console.log('📭 No messages in room');
      } else if (totalCount <= 100) {
        // Total ≤ 100: All are NEW, no OLD
        newMessagesToLoad = totalCount;
        offset = 0;
        hasOldMessages = false;
        oldMessageCount = 0;
        console.log(`📥 Loading all ${totalCount} messages as NEW (no OLD messages)`);
      } else {
        // Total > 100: Load messages AFTER the first 100 as NEW
        // Example: 150 total → Load messages 101-150 (50 messages)
        newMessagesToLoad = totalCount - 100;
        offset = 0; // offset=0 gives newest messages in DESC order
        hasOldMessages = true;
        oldMessageCount = 100; // First 100 messages are OLD
        console.log(`📥 Loading ${newMessagesToLoad} NEW messages (messages ${101}-${totalCount})`);
        console.log(`📦 ${oldMessageCount} OLD messages available (messages 1-100)`);
      }

      // Fetch room details and NEW messages
      const [roomResponse, messagesResponse] = await Promise.all([
        roomsApi.getRoom(id),
        newMessagesToLoad > 0
          ? roomsApi.getMessages(id, newMessagesToLoad, offset)
          : Promise.resolve({ messages: [] })
      ]);

      // Map NEW messages with ownership
      const newMessages = (messagesResponse.messages || []).map(msg => ({
        ...msg,
        isOwn: msg.sender_id === auth.user.value?.id,
        section: 'new', // ✅ Mark as NEW
      }));

      console.log(`✅ Loaded ${newMessages.length} NEW messages`);

      // Cache the data (OLD messages empty initially)
      setCachedRoom(room.state, id, {
        room: roomResponse.room,
        messages: newMessages,      // NEW section (messages 101+)
        oldMessages: [],            // OLD section (empty, load on demand)
        members: [],
        hasJoined: true,
        pagination: {
          hasOldMessages: hasOldMessages,
          oldMessageCount: oldMessageCount,
          oldMessagesLoaded: false,
          isLoadingOld: false,
          totalCount: totalCount,
        }
      });

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


  // ✅ PHASE 1: Lazy load members (only when needed)
  const loadMembers = $(async (id) => {
    try {
      const cached = getCachedRoom(room.state, id);

      // If already loaded, skip
      if (cached?.members && cached.members.length > 0) {
        console.log('✅ Members already loaded');
        return;
      }

      console.log('📥 Loading members...');
      const membersResponse = await roomsApi.getMembers(id);

      // Update cache with members
      if (room.state.roomsCache[id]) {
        room.state.roomsCache[id].members = membersResponse.members || [];
        console.log(`✅ Loaded ${membersResponse.members?.length || 0} members`);
      }
    } catch (err) {
      console.error('❌ Error loading members:', err);
      room.state.error = err.message || "Failed to load members";
    }
  });

  // ✅ PHASE 2: Check for new messages and update cache incrementally
  const checkForNewMessages = $(async (id) => {
    try {
      const cached = getCachedRoom(room.state, id);

      if (!cached || !cached.lastFetch) {
        console.log('⚠️ No cache, skipping incremental update');
        return;
      }

      console.log('🔄 Checking for new messages...');

      // Get messages after last fetch timestamp
      const response = await roomsApi.getNewMessages(id, cached.lastFetch);

      if (response.messages && response.messages.length > 0) {
        console.log(`📥 Found ${response.messages.length} new messages`);

        // Map messages with ownership
        const newMessages = response.messages.map(msg => ({
          ...msg,
          isOwn: msg.sender_id === auth.user.value?.id,
        }));

        // Append new messages to cache
        newMessages.forEach(msg => {
          addMessage(room.state, id, msg);
        });

        // Update last fetch time
        if (room.state.roomsCache[id]) {
          room.state.roomsCache[id].lastFetch = Date.now();
        }

        console.log('✅ Cache updated with new messages');
      } else {
        console.log('✅ No new messages');
      }
    } catch (err) {
      console.error('❌ Error checking for new messages:', err);
      // Don't show error to user, just log it
    }
  });

  // ✅ FIXED: Load OLD messages (first 100 messages)
  const loadOlderMessages = $(async () => {
    if (!roomId) return;

    const cached = getCachedRoom(room.state, roomId);
    const paginationState = pagination.value;

    if (!paginationState.hasOldMessages ||
      paginationState.isLoadingOld ||
      paginationState.oldMessagesLoaded) {
      console.log('⚠️ No OLD messages to load or already loaded');
      return;
    }

    try {
      console.log('📥 Loading OLD messages...');

      const totalCount = paginationState.totalCount || 0;
      const oldCount = paginationState.oldMessageCount || 100;

      if (oldCount === 0 || totalCount <= 100) {
        console.log('✅ No OLD messages available');
        updatePagination(room.state, roomId, {
          oldMessagesLoaded: true,
        });
        return;
      }

      // ✅ CRITICAL FIX: Calculate correct offset
      // Backend returns DESC (newest first)
      // To get OLDEST 100 messages (1-100), we need to skip the newest ones
      // Example: 150 total → skip 50 newest (101-150), get next 100 (1-100)
      const newMessagesCount = totalCount - 100; // How many NEW messages we loaded initially
      const offset = newMessagesCount; // Skip the NEW messages to get OLD ones

      console.log(`📊 Total: ${totalCount}, NEW: ${newMessagesCount}, Loading OLD: ${oldCount} (offset: ${offset})`);

      // Save scroll position
      const container = messageContainerRef.value;
      const oldScrollHeight = container?.scrollHeight || 0;

      updatePagination(room.state, roomId, { isLoadingOld: true });

      // ✅ Fetch OLD messages
      const response = await roomsApi.getMessages(roomId, oldCount, offset);

      // Map OLD messages
      const oldMessages = (response.messages || []).map(msg => ({
        ...msg,
        isOwn: msg.sender_id === auth.user.value?.id,
        section: 'old', // ✅ Mark as OLD
      }));

      console.log(`✅ Loaded ${oldMessages.length} OLD messages`);

      // Store OLD messages separately
      setOldMessages(room.state, roomId, oldMessages);

      console.log(`📊 OLD section: ${oldMessages.length} messages loaded`);

      // Restore scroll position (prevent jumping to top)
      setTimeout(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          const heightDifference = newScrollHeight - oldScrollHeight;
          container.scrollTop = heightDifference;
        }
      }, 50);

    } catch (err) {
      console.error('❌ Error loading OLD messages:', err);
      room.state.error = err.message || "Failed to load OLD messages";
      updatePagination(room.state, roomId, { isLoadingOld: false });
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

  // Add a ref for message container
  // const messageContainerRef = useSignal(null);

  // Add this function to scroll to bottom
  const scrollToBottom = $(() => {
    if (messageContainerRef.value) {
      messageContainerRef.value.scrollTop = messageContainerRef.value.scrollHeight;
    }
  });

  useVisibleTask$(async ({ track, cleanup }) => {
    const currentRoomId = track(() => location.params.roomId);

    if (!currentRoomId) {
      console.error('❌ No room ID provided');
      room.state.error = "No room ID provided";
      setTimeout(() => nav("/rooms"), 2000);
      return;
    }

    console.log('🎯 Room changed to:', currentRoomId);
    room.state.loading = true;

    // Reset UI state
    room.state.error = null;
    room.state.replyingTo = null;
    room.state.imageViewer.isOpen = false;
    room.state.imageViewer.isBuilt = false;

    // Load unified sidebar data
    try {
      const [roomsResponse, chatsResponse] = await Promise.all([
        roomsApi.getUserRooms(),
        chatApi.getSessions(false),
      ]);
      unifiedSidebar.rooms.value = roomsResponse.rooms || [];
      unifiedSidebar.chats.value = chatsResponse.chats || [];
    } catch (err) {
      console.error('Failed to load unified sidebar:', err);
    }

    // Load room data
    const cached = getCachedRoom(room.state, currentRoomId);
    const isStale = isCacheStale(room.state, currentRoomId);

    if (cached && !isStale) {
      console.log('✅ Using cached data, checking for updates...');
      room.state.loading = false;
      room.state.activeRoomId = currentRoomId;
      await checkForNewMessages(currentRoomId);

      // ✅ Scroll to bottom after data loads
      setTimeout(() => scrollToBottom(), 100);
    } else if (cached && isStale) {
      console.log('⚠️ Cache stale, showing cached data and updating...');
      room.state.loading = false;
      room.state.activeRoomId = currentRoomId;
      await checkForNewMessages(currentRoomId);

      const updatedCache = getCachedRoom(room.state, currentRoomId);
      if (!updatedCache || updatedCache.messages.length < 10) {
        console.log('🔄 Incremental update insufficient, doing full reload...');
        await loadRoomData(currentRoomId);
      }

      // ✅ Scroll to bottom after data loads
      setTimeout(() => scrollToBottom(), 100);
    } else {
      console.log('📡 No cache, loading room data...');
      await loadRoomData(currentRoomId);

      // ✅ Scroll to bottom after data loads
      setTimeout(() => scrollToBottom(), 100);
    }

    room.state.loading = false;

    // ✅ NEW: WebSocket handler for ROOM MESSAGES (this is what you were missing!)
    const handleRoomMessages = $((data) => {
      console.log('📡 [ROOM WS] Message received:', data);

      // Handle new messages
      if (data.type === "new_message") {
        const msgRoomId = data.data?.room_id;
        const newMsg = data.data?.message;

        if (msgRoomId === currentRoomId && newMsg) {
          console.log('📥 [ROOM WS] Adding new message:', newMsg.id);

          // Check if message already exists (avoid duplicates)
          const cached = getCachedRoom(room.state, currentRoomId);
          const exists = cached?.messages?.some(m => m.id === newMsg.id);

          if (!exists) {
            const mappedMsg = {
              ...newMsg,
              isOwn: newMsg.sender_id === auth.user.value?.id,
              section: 'new', // ✅ Add section marker
            };

            // ✅ Use new function (handles 100-message shift automatically)
            addMessageToNew(room.state, currentRoomId, mappedMsg);
            console.log('✅ [ROOM WS] Message added to cache');

            // ✅ Update image viewer if it's built and message is media
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
          } else {
            console.log('⚠️ [ROOM WS] Message already exists, skipping');
          }
        }
      }

      // Handle message deletion
      if (data.type === "message_deleted") {
        const msgRoomId = data.data?.room_id;
        const messageId = data.data?.message_id;

        if (msgRoomId === currentRoomId && messageId) {
          console.log('🗑️ [ROOM WS] Removing deleted message:', messageId);
          removeMessage(room.state, currentRoomId, messageId);

          // Remove from image viewer if exists
          if (room.state.imageViewer.isBuilt) {
            room.state.imageViewer.images = room.state.imageViewer.images.filter(
              img => img.id !== messageId
            );
          }
        }
      }

      // Handle reactions
      if (data.type === "message_reacted") {
        const msgRoomId = data.data?.room_id;
        const messageId = data.data?.message_id;
        const reaction = data.data?.reaction;

        if (msgRoomId === currentRoomId && messageId && reaction) {
          console.log('❤️ [ROOM WS] Reaction added:', reaction);
          const cached = getCachedRoom(room.state, currentRoomId);
          const message = cached?.messages?.find(m => m.id === messageId);

          if (message) {
            // Check if reaction already exists
            const reactionExists = message.reactions?.some(r => r.id === reaction.id);
            if (!reactionExists) {
              updateMessage(room.state, currentRoomId, messageId, {
                reactions: [...(message.reactions || []), reaction]
              });

              // Update image viewer if message is in viewer
              if (room.state.imageViewer.isBuilt) {
                const imgIndex = room.state.imageViewer.images.findIndex(img => img.id === messageId);
                if (imgIndex !== -1) {
                  room.state.imageViewer.images[imgIndex] = {
                    ...room.state.imageViewer.images[imgIndex],
                    reactions: [...(room.state.imageViewer.images[imgIndex].reactions || []), reaction]
                  };
                }
              }
            }
          }
        }
      }

      // Handle reaction removal
      if (data.type === "reaction_removed") {
        const msgRoomId = data.data?.room_id;
        const messageId = data.data?.message_id;
        const reactionId = data.data?.reaction_id;

        if (msgRoomId === currentRoomId && messageId && reactionId) {
          console.log('🗑️ [ROOM WS] Reaction removed:', reactionId);
          const cached = getCachedRoom(room.state, currentRoomId);
          const message = cached?.messages?.find(m => m.id === messageId);

          if (message) {
            updateMessage(room.state, currentRoomId, messageId, {
              reactions: (message.reactions || []).filter(r => r.id !== reactionId)
            });

            // Update image viewer if message is in viewer
            if (room.state.imageViewer.isBuilt) {
              const imgIndex = room.state.imageViewer.images.findIndex(img => img.id === messageId);
              if (imgIndex !== -1) {
                room.state.imageViewer.images[imgIndex] = {
                  ...room.state.imageViewer.images[imgIndex],
                  reactions: room.state.imageViewer.images[imgIndex].reactions.filter(r => r.id !== reactionId)
                };
              }
            }
          }
        }
      }

      // Handle member updates
      if (data.type === "room_presence") {
        const msgRoomId = data.data?.room_id;

        if (msgRoomId === currentRoomId) {
          console.log('👥 [ROOM WS] Member presence changed, reloading members...');
          // Only reload members if they're currently visible
          if (room.showMembers.value) {
            loadMembers(currentRoomId);
          }
        }
      }
    });

    // ✅ Subscribe to WebSocket for room messages
    wsService.connect();
    const unsubscribeRoomMessages = wsService.onMessage(handleRoomMessages);

    // Setup WebSocket listener for unified sidebar
    const unsubscribeWs = wsService.onMessage((data) => {
      if (data.type === "new_message" && data.data.room_id) {
        const room = unifiedSidebar.rooms.value.find(r => r.id === data.data.room_id);
        if (room) {
          let lastMessage = data.data.message.content;
          if (data.data.message.type === 'image') lastMessage = 'Image';
          else if (data.data.message.type === 'gif') lastMessage = 'GIF';
          else if (data.data.message.type === 'audio') lastMessage = 'Voice message';
          else if (data.data.message.caption) lastMessage = data.data.message.caption;

          unifiedSidebar.rooms.value = unifiedSidebar.rooms.value.map(r =>
            r.id === data.data.room_id
              ? {
                ...r,
                last_message: lastMessage,
                last_message_time: data.data.message.created_at,
                unread_count: data.data.message.sender_id === auth.user.value?.id
                  ? r.unread_count
                  : r.unread_count + 1,
              }
              : r
          );
        }
      }
    });

    // Cleanup
    cleanup(() => {
      console.log('🧹 Room cleanup:', currentRoomId);
      room.state.activeRoomId = null;
      unsubscribeRoomMessages(); // ✅ IMPORTANT: Unsubscribe room messages
      unsubscribeWs();
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

        // Update unified sidebar rooms list
        unifiedSidebar.rooms.value = [...unifiedSidebar.rooms.value, response.room];

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

      // Reload room list
      const response = await roomsApi.getUserRooms();
      room.state.rooms = response.rooms || [];

      // Update unified sidebar rooms list
      unifiedSidebar.rooms.value = response.rooms || [];

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
      section: 'new', // ✅ NEW: Mark as NEW section
      reactions: [],
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

    // ✅ Add optimistically (user sees it immediately)
    addMessageToNew(room.state, roomId, tempMessage);
    console.log('✅ [SEND] Temp message added:', tempId);

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

      console.log('✅ [SEND] API response:', response);

      // ✅ Replace temp message with real message from API
      const realMessage = {
        ...response.data,
        isOwn: true,
        sending: false,
        section: 'new', // ✅ NEW: Mark as NEW section
        reactions: []
      };

      updateMessage(room.state, roomId, tempId, realMessage);
      console.log('✅ [SEND] Temp message replaced with real:', realMessage.id);

      // ✅ Update image viewer if it's a media message
      if (room.state.imageViewer.isBuilt && (data.type === 'image' || data.type === 'gif')) {
        room.state.imageViewer.images = [
          ...room.state.imageViewer.images,
          {
            id: realMessage.id,
            url: realMessage.content,
            sender_username: realMessage.sender_username,
            sender_gender: realMessage.sender_gender,
            caption: realMessage.caption,
            created_at: realMessage.created_at,
            reactions: [],
          }
        ];
      }

      room.state.successMessage = data.type === 'text' ? "Message sent!" : `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} sent!`;
      setTimeout(() => (room.state.successMessage = null), 3000);
    } catch (err) {
      console.error('❌ [SEND] Failed:', err);
      // ✅ Remove failed message
      removeMessage(room.state, roomId, tempId);
      room.state.error = err.message || "Failed to send message";
    }
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

  const handleImageReact = $(async (messageId, emoji) => {
    try {
      await roomsApi.reactToMessage(roomId, messageId, emoji);

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
      {/* Unified Sidebar */}
      <UnifiedSidebar
        isOpen={unifiedSidebar.isOpen.value}
        onClose={$(() => { unifiedSidebar.isOpen.value = false; })}
        rooms={unifiedSidebar.rooms.value}
        chats={unifiedSidebar.chats.value}
        currentRoomId={roomId}
        currentChatId={null}
        loading={false}
      />

      {/* Room List Sidebar */}
      <div class={`${room.showRoomList?.value === false ? "hidden" : "flex"} sm:flex`}>
        <ChatSidebar
          mode="room"
          items={room.state.rooms}
          currentItemId={roomId}
          searchQuery={room.state.searchQuery}
          loading={room.state.loading && room.state.rooms.length === 0}
          onSearchChange={$((query) => (room.state.searchQuery = query))}
          onItemSelect={handleRoomSelect}
          onPrimaryAction={$(() => (showCreateModal.value = true))}
          onSecondaryAction={$(async () => {
            await loadPublicRooms();
            showJoinModal.value = true;
          })}
        />
      </div>

      {/* Main Chat Container */}
      <div class={`${room.showRoomList?.value === false ? "flex" : "hidden"} sm:flex flex-1`}>
        <ChatContainer
          mode="room"
          currentChat={currentRoom.value}
          messages={messages.value}
          currentUserId={auth.user.value?.id}
          onBack={$(() => room.showRoomList ? room.showRoomList.value = true : null)}
          onShowUsers={$(async () => {
            if (!room.showMembers.value) {
              await loadMembers(roomId);
            }
            room.showMembers.value = !room.showMembers.value;
          })}
          onSendMessage={handleSendMessage}
          onMessageClick={$((id) => (room.selectedMessageId.value = room.selectedMessageId.value === id ? null : id))}
          onUsernameClick={handleUsernameClick}
          onDeleteMessage={handleDeleteMessage}
          onImageClick={handleImageClick}
          selectedMessageId={room.selectedMessageId.value}
          deletingMessageId={room.state.deletingMessageId}
          replyingTo={room.state.replyingTo}
          onCancelReply={$(() => (room.state.replyingTo = null))}
          successMessage={room.state.successMessage}
          error={room.state.error}
          onClearError={$(() => (room.state.error = null))}
          onClearSuccess={$(() => (room.state.successMessage = null))}
          hasOlderMessages={pagination.value.hasOldMessages}
          isLoadingOlder={pagination.value.isLoadingOld}  // ✅ CHANGED: isLoadingOlder → isLoadingOld
          olderMessagesLoaded={pagination.value.oldMessagesLoaded}
          onLoadOlderMessages={loadOlderMessages}
          pagination={pagination.value}  // ✅ NEW: Pass full pagination object
          onToggleUnifiedSidebar={$(() => { unifiedSidebar.isOpen.value = !unifiedSidebar.isOpen.value; })}
          messageContainerRef={messageContainerRef}
          onScrollToBottom={scrollToBottom}
        />
      </div>

      {/* Members List */}
      {room.showMembers.value && (
        <UserList
          isOpen={room.showMembers.value}
          onClose={$(() => (room.showMembers.value = false))}
          users={members.value}
          currentUserId={auth.user.value?.id}
          mode="room"
          title="Members"
        />
      )}

      {/* Modals */}
      <CreateRoomModal
        isOpen={showCreateModal.value}
        onClose={$(() => (showCreateModal.value = false))}
        onSubmit={handleCreateRoom}
      />

      <JoinRoomModal
        isOpen={showJoinModal.value}
        onClose={$(() => (showJoinModal.value = false))}
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
        onClose={$(() => (room.state.imageViewer.isOpen = false))}
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