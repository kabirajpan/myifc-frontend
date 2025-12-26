import { 
  createContextId, 
  useContext,
  useStore,
  useSignal,
} from "@builder.io/qwik";

// Create context
export const ChatContext = createContextId('chat-context');

// Chat Store Provider - Only state, no functions (for 1-on-1 chats)
export const useChatStore = () => {
  // State
  const state = useStore({
    // Chat sessions (1-on-1 only)
    chatList: [],
    currentSessionId: null,
    
    // Messages
    messages: [],
    
    // Reactions (keyed by message_id)
    // Structure: { "msg_123": [{ id, user_id, username, gender, emoji, created_at }] }
    reactions: {},
    
    // UI State
    loading: false,
    error: null,
    successMessage: null,
    
    // Other user info
    otherUserGender: "",
    
    // Reply state
    replyingTo: null,
    
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
  const showChatList = useSignal(true);
  const showOnlineUsers = useSignal(false);
  const selectedMessageId = useSignal(null);
  const showEmojiPicker = useSignal(false);

  return {
    state,
    showChatList,
    showOnlineUsers,
    selectedMessageId,
    showEmojiPicker,
  };
};

// Hook to use chat context
export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
};