import { component$, $, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { useAuth } from "../../context/auth";
import { useRoomContext } from "../../store/room.store";
import { roomsApi } from "../../api/rooms";
import { wsService } from "../../api/websocket";
import {
  LuMessageSquare,
  LuUsers,
  LuPlus,
  LuEye,
  LuArrowLeft,
} from '@qwikest/icons/lucide';

// Empty State Component
const EmptyChatState = component$(({ hasJoinedRooms, onBrowseRooms, onCreateRoom, isGuest }) => {
  return (
    <div class="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <LuMessageSquare class="w-8 h-8 text-gray-400" />
      </div>
      
      {hasJoinedRooms ? (
        <>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Select a room</h3>
          <p class="text-sm text-gray-500 max-w-md mb-6">
            Choose a room from the sidebar to start chatting with other members
          </p>
        </>
      ) : (
        <>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No rooms yet</h3>
          <p class="text-sm text-gray-500 max-w-md mb-6">
            Join existing rooms or create your own to start chatting with the community
          </p>
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              onClick$={onBrowseRooms}
              class="px-4 py-2.5 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
            >
              <LuEye class="w-4 h-4" />
              Browse Rooms
            </button>
            {!isGuest && (
              <button
                onClick$={onCreateRoom}
                class="px-4 py-2.5 border-2 border-pink-600 text-pink-600 text-sm font-medium rounded-lg hover:bg-pink-50 transition-colors flex items-center justify-center gap-2"
              >
                <LuPlus class="w-4 h-4" />
                Create Room
              </button>
            )}
          </div>
        </>
      )}
      
      <div class="mt-8 pt-6 border-t border-gray-200 w-full max-w-sm">
        <div class="flex items-center justify-center gap-4 text-xs text-gray-500">
          <div class="flex items-center gap-1.5">
            <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <LuUsers class="w-3 h-3 text-green-600" />
            </div>
            <span>Active rooms</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <LuMessageSquare class="w-3 h-3 text-blue-600" />
            </div>
            <span>Real-time chat</span>
          </div>
        </div>
      </div>
    </div>
  );
});

// Loading State Component
const LoadingState = component$(() => {
  return (
    <div class="flex-1 flex flex-col items-center justify-center">
      <div class="w-10 h-10 border-3 border-pink-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p class="text-sm text-gray-600">Loading room...</p>
    </div>
  );
});

// Full Chat Interface (to be imported from existing [roomId]/index.jsx)
const FullChatInterface = component$(({ roomId }) => {
  // This will be the existing chat logic from [roomId]/index.jsx
  // For now, placeholder
  return (
    <div class="h-full flex flex-col">
      <div class="px-4 py-3 border-b border-gray-200">
        <div class="flex items-center gap-2">
          <button
            onClick$={() => window.history.back()}
            class="sm:hidden p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <LuArrowLeft class="w-4 h-4" />
          </button>
          <div class="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            R
          </div>
          <div>
            <h3 class="font-medium text-gray-900">Loading Room...</h3>
            <p class="text-xs text-gray-500">Connecting to chat</p>
          </div>
        </div>
      </div>
      <div class="flex-1 flex items-center justify-center">
        <p class="text-sm text-gray-500">Chat interface will load here</p>
      </div>
    </div>
  );
});

// Main ChatPanel Component
export const ChatPanel = component$(({ roomId }) => {
  const nav = useNavigate();
  const auth = useAuth();
  const room = useRoomContext();
  
  const hasJoinedRooms = useSignal(false);
  const isLoading = useSignal(false);

  useVisibleTask$(async ({ track }) => {
    track(() => room.state.rooms);
    
    // Check if user has joined any rooms
    const joinedRooms = room.state.rooms.filter(r => 
      r.member_count > 0 || r.has_joined // Adjust based on your API response
    );
    hasJoinedRooms.value = joinedRooms.length > 0;
  });

  const handleBrowseRooms = $(() => {
    nav('/rooms/browse');
  });

  const handleCreateRoom = $(() => {
    // This will trigger the create modal via parent
    // For now, navigate to create page or trigger modal
    console.log('Create room clicked');
  });

  // If roomId is provided, show full chat interface
  if (roomId) {
    return <FullChatInterface roomId={roomId} />;
  }

  // Show loading while checking rooms
  if (isLoading.value) {
    return <LoadingState />;
  }

  // Show empty state (no room selected)
  return (
    <EmptyChatState
      hasJoinedRooms={hasJoinedRooms.value}
      onBrowseRooms={handleBrowseRooms}
      onCreateRoom={handleCreateRoom}
      isGuest={auth.user.value?.is_guest || false}
    />
  );
});