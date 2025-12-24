import { 
  createContextId, 
  useContext,
  useStore,
} from "@builder.io/qwik";

// Create context
export const UserContext = createContextId('user-context');

// User Store Provider - Only state, no functions
export const useUserStore = () => {
  // State
  const state = useStore({
    onlineUsers: [],
    loading: false,
    error: null,
  });

  return {
    state,
  };
};

// Hook to use user context
export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within UserProvider');
  }
  return context;
};


