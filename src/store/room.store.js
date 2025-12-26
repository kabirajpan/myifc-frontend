import { 
    createContextId, 
    useContext,
    useStore,
    useSignal,
  } from "@builder.io/qwik";
  
  // Create context
  export const RoomContext = createContextId('room-context');
  
  // Room Store Provider - Only state, no functions (follows chat.store.js pattern)
  export const useRoomStore = () => {
    // State
    const state = useStore({
      // Room list
      rooms: [],
      publicRooms: [],
      
      // Current room
      currentRoomId: null,
      currentRoom: null,
      currentUserId: null,
      
      // Room members
      members: [],
      
      // Room messages
      messages: [],
      
      // Reactions (keyed by message_id)
      // Structure: { "msg_123": [{ id, user_id, username, gender, emoji, created_at }] }
      reactions: {},
      
      // UI State
      loading: false,
      error: null,
      successMessage: null,
      
      // Reply state
      replyingTo: null,
      
      // Secret reply state
      secretReplyTo: null,
      
      // Delete state
      deletingMessageId: null,
      
      // Search
      searchQuery: "",
      
      // Room timer (for expiring rooms)
      timeLeft: null,
      
      // Membership
      hasJoined: false,
      
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
  
  // Hook to use room context
  export const useRoomContext = () => {
    const context = useContext(RoomContext);
    if (!context) {
      throw new Error('useRoomContext must be used within RoomProvider');
    }
    return context;
  };