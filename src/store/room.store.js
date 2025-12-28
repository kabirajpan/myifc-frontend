import {
  createContextId,
  useContext,
  useStore,
  useSignal,
} from "@builder.io/qwik";

// Create context
export const RoomContext = createContextId('room-context');

// Room Store Provider with Caching
export const useRoomStore = () => {
  // App-level state (persists across routes)
  const state = useStore({
    // Room list (global, loaded once)
    rooms: [],
    publicRooms: [],
    roomsLoaded: false,

    // Room cache (keep last 5 rooms)
    roomsCache: {},
    maxCachedRooms: 5,

    // Currently active room
    activeRoomId: null,

    // UI State
    loading: false,
    error: null,
    successMessage: null,

    // Reply state
    replyingTo: null,
    secretReplyTo: null,

    // Delete state
    deletingMessageId: null,

    // Search
    searchQuery: "",

    // Image Viewer State
    imageViewer: {
      isOpen: false,
      images: [],
      currentIndex: 0,
      isBuilt: false,
    },
  });

  // Signals for UI-specific state
  const showRoomList = useSignal(true);
  const showMembers = useSignal(false);
  const selectedMessageId = useSignal(null);
  const showEmojiPicker = useSignal(false);

  return {
    state,
    showRoomList,
    showMembers,
    selectedMessageId,
    showEmojiPicker,
  };
};

// Helper functions (use these in components, don't pass through context)
export const getCachedRoom = (state, roomId) => {
  return state.roomsCache[roomId] || null;
};

export const setCachedRoom = (state, roomId, data) => {
  const cacheKeys = Object.keys(state.roomsCache);
  if (cacheKeys.length >= state.maxCachedRooms && !state.roomsCache[roomId]) {
    const oldestKey = cacheKeys.reduce((oldest, key) => {
      const oldestTime = state.roomsCache[oldest]?.lastFetch || 0;
      const currentTime = state.roomsCache[key]?.lastFetch || 0;
      return currentTime < oldestTime ? key : oldest;
    }, cacheKeys[0]);
    delete state.roomsCache[oldestKey];
    console.log('🗑️ Evicted room from cache:', oldestKey);
  }

  state.roomsCache[roomId] = {
    ...state.roomsCache[roomId],
    ...data,
    lastFetch: Date.now(),
    // ✅ UPDATED: Initialize oldMessages array
    oldMessages: data.oldMessages || state.roomsCache[roomId]?.oldMessages || [],
    // ✅ UPDATED: Initialize pagination state with new fields
    pagination: data.pagination || state.roomsCache[roomId]?.pagination || {
      hasOldMessages: false,
      oldMessageCount: 0,
      oldMessagesLoaded: false,
      isLoadingOld: false,
      totalCount: 0,
    },
  };
  console.log('💾 Cached room:', roomId, 'Total cached:', Object.keys(state.roomsCache).length);
};

export const isCacheStale = (state, roomId, maxAge = 5 * 60 * 1000) => {
  const cached = state.roomsCache[roomId];
  if (!cached || !cached.lastFetch) return true;
  return Date.now() - cached.lastFetch > maxAge;
};

export const clearCache = (state) => {
  state.roomsCache = {};
  console.log('🗑️ Cache cleared');
};

export const updateRoomInList = (state, roomId, updates) => {
  state.rooms = state.rooms.map(room =>
    room.id === roomId ? { ...room, ...updates } : room
  );
};

// ✅ DEPRECATED: Use addMessageToNew instead (kept for backward compatibility)
export const addMessage = (state, roomId, message) => {
  if (state.roomsCache[roomId]) {
    const exists = state.roomsCache[roomId].messages?.some(m => m.id === message.id);
    if (!exists) {
      state.roomsCache[roomId].messages = [
        ...(state.roomsCache[roomId].messages || []),
        message
      ];
    }
  }
};

// ✅ UPDATED: Add message to NEW section (with 100-message shift logic)
export const addMessageToNew = (state, roomId, message) => {
  if (!state.roomsCache[roomId]) return;

  const cache = state.roomsCache[roomId];
  const newMessages = cache.messages || [];

  // Check if message already exists (avoid duplicates)
  const exists = newMessages.some(m => m.id === message.id);
  if (exists) {
    console.log('⚠️ Message already exists, skipping:', message.id);
    return;
  }

  // Add new message to NEW section
  const updatedNewMessages = [...newMessages, message];

  // ✅ CRITICAL: If NEW section reaches 100, shift ALL to OLD
  // NEW section represents messages 101+, so when it reaches 100 messages,
  // we have messages 101-200. Now shift 101-200 → OLD, keep 201+ as NEW
  if (updatedNewMessages.length >= 100) {
    console.log('🔄 NEW section reached 100 messages, shifting to OLD');

    // Take first 100 messages from NEW and move to OLD
    const messagesToShift = updatedNewMessages.slice(0, 100);
    const remainingNew = updatedNewMessages.slice(100);

    // Add shifted messages to OLD section (append to end)
    const oldMessages = cache.oldMessages || [];
    cache.oldMessages = [...oldMessages, ...messagesToShift.map(m => ({
      ...m,
      section: 'old'
    }))];

    // Keep remaining messages in NEW
    cache.messages = remainingNew;

    // Update pagination counts
    if (cache.pagination) {
      cache.pagination.oldMessageCount = cache.oldMessages.length;
      cache.pagination.hasOldMessages = true;
    }

    console.log(`✅ Shifted: OLD=${cache.oldMessages.length}, NEW=${remainingNew.length}`);
  } else {
    // Just add to NEW section (no shift needed)
    cache.messages = updatedNewMessages;
  }
};

// ✅ UPDATED: Remove message from both OLD and NEW sections
export const removeMessage = (state, roomId, messageId) => {
  if (state.roomsCache[roomId]) {
    // Remove from NEW section
    state.roomsCache[roomId].messages =
      state.roomsCache[roomId].messages?.filter(m => m.id !== messageId) || [];

    // Remove from OLD section
    if (state.roomsCache[roomId].oldMessages) {
      state.roomsCache[roomId].oldMessages =
        state.roomsCache[roomId].oldMessages.filter(m => m.id !== messageId) || [];
    }
  }
};

// ✅ UPDATED: Update message in both OLD and NEW sections
export const updateMessage = (state, roomId, messageId, updates) => {
  if (!state.roomsCache[roomId]) return;

  // Update in NEW section
  if (state.roomsCache[roomId].messages) {
    state.roomsCache[roomId].messages = state.roomsCache[roomId].messages.map(m =>
      m.id === messageId ? { ...m, ...updates } : m
    );
  }

  // Update in OLD section
  if (state.roomsCache[roomId].oldMessages) {
    state.roomsCache[roomId].oldMessages = state.roomsCache[roomId].oldMessages.map(m =>
      m.id === messageId ? { ...m, ...updates } : m
    );
  }
};

// ✅ NEW: Update pagination state for a room
export const updatePagination = (state, roomId, updates) => {
  if (state.roomsCache[roomId]) {
    state.roomsCache[roomId].pagination = {
      ...state.roomsCache[roomId].pagination,
      ...updates
    };
  }
};

// ✅ NEW: Set OLD messages separately
export const setOldMessages = (state, roomId, oldMessages) => {
  if (state.roomsCache[roomId]) {
    state.roomsCache[roomId].oldMessages = oldMessages;

    // Update pagination state
    if (state.roomsCache[roomId].pagination) {
      state.roomsCache[roomId].pagination.oldMessagesLoaded = true;
      state.roomsCache[roomId].pagination.isLoadingOld = false;
    }

    console.log(`✅ Loaded ${oldMessages.length} OLD messages for room ${roomId}`);
  }
};

// ✅ DEPRECATED: Use setOldMessages instead (kept for backward compatibility)
export const prependOldMessages = (state, roomId, oldMessages) => {
  if (state.roomsCache[roomId]) {
    const existingMessages = state.roomsCache[roomId].messages || [];

    // Remove duplicates and prepend
    const existingIds = new Set(existingMessages.map(m => m.id));
    const uniqueOldMessages = oldMessages.filter(m => !existingIds.has(m.id));

    state.roomsCache[roomId].messages = [...uniqueOldMessages, ...existingMessages];

    console.log(`📥 Prepended ${uniqueOldMessages.length} old messages to room ${roomId}`);

    // Mark that older messages have been loaded
    if (state.roomsCache[roomId].pagination) {
      state.roomsCache[roomId].pagination.olderMessagesLoaded = true;
      state.roomsCache[roomId].pagination.isLoadingOlder = false;
    }
  }
};

// Hook to use room context
export const useRoomContext = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoomContext must be used within RoomProvider');
  }
  return context;
};