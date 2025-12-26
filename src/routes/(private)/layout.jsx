import { component$, Slot, useVisibleTask$, useContextProvider } from "@builder.io/qwik";
import { useNavigate, Link } from "@builder.io/qwik-city";
import { useAuth } from "../../context/auth";
import { useChatStore, ChatContext } from "../../store/chat.store";
import { useUserStore, UserContext } from "../../store/user.store";
import { useRoomStore, RoomContext } from "../../store/room.store"; // ADD THIS
import Header from "../../components/layout/private-navbar";

export default component$(() => {
  const auth = useAuth();
  const nav = useNavigate();

  // Initialize stores (only state, no functions)
  const chatStore = useChatStore();
  const userStore = useUserStore();
  const roomStore = useRoomStore(); // ADD THIS

  // Provide contexts to all child components
  useContextProvider(ChatContext, chatStore);
  useContextProvider(UserContext, userStore);
  useContextProvider(RoomContext, roomStore); // ADD THIS

  // Protect private routes - only check authentication
  useVisibleTask$(({ track }) => {
    track(() => auth.loading.value);
    track(() => auth.isAuthenticated.value);
    
    if (!auth.loading.value && !auth.isAuthenticated.value) {
      setTimeout(() => {
        nav("/auth/login");
      }, 2000);
    }
  });

  // Show loading while checking auth
  if (auth.loading.value) {
    return (
      <div class="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center">
        <div class="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  // Show unauthorized page if not authenticated
  if (!auth.isAuthenticated.value) {
    return (
      <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div class="text-center max-w-md">
          <div class="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h1 class="text-3xl font-semibold text-gray-900 mb-2">Authentication Required</h1>
          <p class="text-gray-600 mb-8">
            Please sign in to access this page
          </p>
          
          <div class="flex flex-col gap-3">
            <Link
              href="/auth/login"
              class="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              class="bg-white text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Create Account
            </Link>
            <Link
              href="/"
              class="text-gray-600 hover:text-gray-900 text-sm mt-2"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show private layout with header (for users, guests, and moderators)
  return (
    <div class="min-h-screen bg-gray-50">
      <Header />
      <Slot />
    </div>
  );
});