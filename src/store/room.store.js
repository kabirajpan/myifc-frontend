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

export const removeMessage = (state, roomId, messageId) => {
  if (state.roomsCache[roomId]) {
    state.roomsCache[roomId].messages = 
      state.roomsCache[roomId].messages?.filter(m => m.id !== messageId) || [];
  }
};

export const updateMessage = (state, roomId, messageId, updates) => {
  if (state.roomsCache[roomId]?.messages) {
    state.roomsCache[roomId].messages = 
      state.roomsCache[roomId].messages.map(m => 
        m.id === messageId ? { ...m, ...updates } : m
      );
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