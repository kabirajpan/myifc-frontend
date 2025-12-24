import { 
  createContextId, 
  useContext,
  useStore,
  useSignal,
} from "@builder.io/qwik";

// Create context
export const ChatContext = createContextId('chat-context');

// Chat Store Provider - Only state, no functions
export const useChatStore = () => {
  // State
  const state = useStore({
    // Chat sessions
    chatList: [],
    currentSessionId: null,
    
    // Messages
    messages: [],
    
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
  });

  // Signals for UI-specific state
  const showChatList = useSignal(true);
  const showOnlineUsers = useSignal(false);
  const selectedMessageId = useSignal(null);

  return {
    state,
    showChatList,
    showOnlineUsers,
    selectedMessageId,
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


