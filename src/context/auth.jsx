import { 
  createContextId, 
  useContextProvider, 
  useContext, 
  useSignal,
  useVisibleTask$,
  component$,
  Slot,
  $
} from "@builder.io/qwik";
import { getToken, setToken, removeToken } from "../api/client";
import { authApi } from "../api/auth";

// Create context
export const AuthContext = createContextId("auth-context");

// Auth Provider Component
export const AuthProvider = component$(() => {
  const user = useSignal(null);
  const token = useSignal(null);
  const isAuthenticated = useSignal(false);
  const loading = useSignal(true);

  // Load user from localStorage on mount
  useVisibleTask$(() => {
    const storedToken = getToken();
    const storedUser = localStorage.getItem("user");
    
    if (storedToken && storedUser) {
      token.value = storedToken;
      user.value = JSON.parse(storedUser);
      isAuthenticated.value = true;
    }
    
    loading.value = false;
  });

  // Function to set auth data
  const setAuth = $((authData) => {
    if (authData && authData.token && authData.user) {
      token.value = authData.token;
      user.value = authData.user;
      isAuthenticated.value = true;
      
      // Save to localStorage
      setToken(authData.token);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(authData.user));
      }
    }
  });

  // Function to clear auth data
  const clearAuth = $(() => {
    token.value = null;
    user.value = null;
    isAuthenticated.value = false;
    removeToken();
  });

  // Logout function - calls backend and clears auth
  const logout = $(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
    }
  });

  // Provide context value
  useContextProvider(AuthContext, {
    user,
    token,
    isAuthenticated,
    loading,
    setAuth,
    clearAuth,
    logout,  // ✅ Added this
  });

  return <Slot />;
});

// Hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};
