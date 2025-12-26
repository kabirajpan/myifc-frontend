import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { useAuth } from "../../../../context/auth";
import { roomsApi } from "../../../../api/rooms";
import { useRoomContext } from "../../../../store/room.store";
import { wsService } from "../../../../api/websocket";
import { 
  LuPlus, 
  LuAlertCircle,
  LuX,
  LuSearch,
  LuMessageSquare,
  LuUsers,
  LuClock,
  LuLock,
  LuArrowLeft,
} from '@qwikest/icons/lucide';

export default component$(() => {
  const nav = useNavigate();
  const auth = useAuth();
  const room = useRoomContext();
  
  // Local UI state
  const showCreateModal = useSignal(false);
  const newRoomName = useSignal("");
  const newRoomDescription = useSignal("");
  const isPrivate = useSignal(false);

  // Load ALL rooms for browsing (not just user's rooms)
  const loadAllRooms = $(async () => {
    console.log('🔍 [BROWSE ROOMS] Loading all rooms...');
    
    try {
      room.state.loading = true;
      room.state.error = null;
      
      console.log('🔍 [BROWSE ROOMS] Calling roomsApi.getAllRooms()...');
      const data = await roomsApi.getAllRooms();
      
      console.log('✅ [BROWSE ROOMS] API Response received:', {
        hasData: !!data,
        roomsArray: data?.rooms,
        roomsCount: data?.rooms?.length || 0
      });
      
      room.state.rooms = data.rooms || [];
      
      console.log('✅ [BROWSE ROOMS] State updated:', {
        roomsInState: room.state.rooms.length,
        rooms: room.state.rooms
      });
      
      room.state.loading = false;
      console.log('✅ [BROWSE ROOMS] Loading complete!');
      
    } catch (err) {
      console.error('❌ [BROWSE ROOMS] Failed to load rooms:', {
        error: err,
        message: err.message,
        status: err.status,
        data: err.data
      });
      room.state.error = err.message || 'Failed to load rooms';
      room.state.loading = false;
    }
  });

  // WebSocket handler for real-time room updates
  const handleWebSocketMessage = $((data) => {
    console.log('📡 [BROWSE WS] Message received:', data);
    
    // Handle room creation
    if (data.type === "room_created") {
      const newRoom = data.data?.room;
      console.log('🆕 [BROWSE WS] Room created:', newRoom);
      
      if (newRoom && !room.state.rooms.some(r => r.id === newRoom.id)) {
        room.state.rooms = [...room.state.rooms, newRoom];
        console.log('✅ [BROWSE WS] Room added to list');
      }
    }

    // Handle room deletion
    if (data.type === "room_deleted") {
      const roomId = data.data?.room_id;
      console.log('🗑️ [BROWSE WS] Room deleted:', roomId);
      
      if (roomId) {
        room.state.rooms = room.state.rooms.filter(r => r.id !== roomId);
        console.log('✅ [BROWSE WS] Room removed from list');
      }
    }

    // Handle member count updates
    if (data.type === "user_joined_room" || data.type === "user_left_room") {
      const roomId = data.data?.room_id;
      const memberCount = data.data?.member_count;
      
      console.log('👥 [BROWSE WS] Member count update:', { roomId, memberCount });
      
      if (roomId && memberCount !== undefined) {
        room.state.rooms = room.state.rooms.map(r => 
          r.id === roomId ? { ...r, member_count: memberCount } : r
        );
        console.log('✅ [BROWSE WS] Member count updated');
      }
    }
  });

  // Initialize - Load rooms and setup WebSocket
  useVisibleTask$(async ({ cleanup }) => {
    console.log('🚀 [BROWSE ROOMS] Component initializing...');
    console.log('🚀 [BROWSE ROOMS] Auth user:', auth.user.value);
    
    try {
      // Connect WebSocket
      console.log('📡 [BROWSE ROOMS] Connecting WebSocket...');
      wsService.connect();
      const unsubscribe = wsService.onMessage(handleWebSocketMessage);
      console.log('✅ [BROWSE ROOMS] WebSocket connected');

      // Load all rooms for browsing
      console.log('📥 [BROWSE ROOMS] Loading all rooms data...');
      await loadAllRooms();

      cleanup(() => {
        console.log('🧹 [BROWSE ROOMS] Cleaning up...');
        unsubscribe();
      });
    } catch (err) {
      console.error('❌ [BROWSE ROOMS] Initialization error:', err);
      room.state.error = 'Failed to initialize';
    }
  });

  // Create room
  const handleCreateRoom = $(async () => {
    const name = newRoomName.value.trim();
    
    console.log('🆕 [BROWSE CREATE ROOM] Starting...', { name, isPrivate: isPrivate.value });
    
    if (!name) {
      room.state.error = "Room name is required";
      console.log('❌ [BROWSE CREATE ROOM] Name is empty');
      return;
    }

    if (name.length < 3) {
      room.state.error = "Room name must be at least 3 characters";
      console.log('❌ [BROWSE CREATE ROOM] Name too short:', name.length);
      return;
    }

    if (name.length > 50) {
      room.state.error = "Room name must be less than 50 characters";
      console.log('❌ [BROWSE CREATE ROOM] Name too long:', name.length);
      return;
    }

    try {
      room.state.loading = true;
      room.state.error = null;

      console.log('📤 [BROWSE CREATE ROOM] Calling API...');
      await roomsApi.createRoom(
        name, 
        newRoomDescription.value.trim() || null,
        isPrivate.value
      );
      console.log('✅ [BROWSE CREATE ROOM] API call successful');

      // Close modal and reset
      showCreateModal.value = false;
      newRoomName.value = "";
      newRoomDescription.value = "";
      isPrivate.value = false;

      // Reload rooms
      console.log('🔄 [BROWSE CREATE ROOM] Reloading rooms...');
      await loadAllRooms();

      room.state.successMessage = "Room created successfully!";
      setTimeout(() => room.state.successMessage = null, 3000);

    } catch (err) {
      console.error('❌ [BROWSE CREATE ROOM] Failed:', {
        error: err,
        message: err.message,
        status: err.status
      });
      room.state.error = err.message || 'Failed to create room';
    } finally {
      room.state.loading = false;
    }
  });

  // Join room (navigate to room chat)
  const handleJoinRoom = $(async (roomId) => {
    await nav(`/rooms/${roomId}`);
  });

  // Go back to main rooms interface
  const handleBackToRooms = $(() => {
    nav('/rooms');
  });

  // Filter rooms based on search
  const filteredRooms = room.state.rooms.filter((r) => {
    const query = room.state.searchQuery.toLowerCase();
    return r.name.toLowerCase().includes(query) ||
           r.description?.toLowerCase().includes(query) ||
           r.creator_username?.toLowerCase().includes(query);
  });

  // Sort rooms: active/recent first
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    // Prioritize rooms with more members
    if (a.member_count !== b.member_count) {
      return b.member_count - a.member_count;
    }
    // Then by last message time
    return new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0);
  });

  return (
    <div class="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <button
            onClick$={handleBackToRooms}
            class="sm:hidden p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
            aria-label="Back to rooms"
          >
            <LuArrowLeft class="w-4 h-4" />
          </button>
          <div>
            <h1 class="text-lg sm:text-xl font-bold text-gray-900">Browse All Rooms</h1>
            <p class="text-xs text-gray-500 mt-0.5">
              {room.state.loading ? 'Loading...' : `${room.state.rooms.length} rooms available`}
            </p>
          </div>
        </div>

        {!auth.user.value?.is_guest && (
          <button
            onClick$={() => showCreateModal.value = true}
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 transition-colors rounded"
          >
            <LuPlus class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span class="hidden sm:inline">Create Room</span>
            <span class="sm:hidden">Create</span>
          </button>
        )}
      </div>

      {/* Back button for desktop */}
      <div class="hidden sm:block">
        <button
          onClick$={handleBackToRooms}
          class="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded transition-colors"
        >
          <LuArrowLeft class="w-4 h-4" />
          <span>Back to Chat Interface</span>
        </button>
      </div>

      {/* Success Message */}
      {room.state.successMessage && (
        <div class="flex items-start gap-2 p-2.5 bg-green-50 border border-green-200 rounded">
          <LuAlertCircle class="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
          <p class="text-xs text-green-600">{room.state.successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {room.state.error && (
        <div class="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded">
          <LuAlertCircle class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="text-xs text-red-600">{room.state.error}</p>
          </div>
          <button 
            onClick$={() => room.state.error = null}
            class="text-red-400 hover:text-red-600"
          >
            <LuX class="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Guest Notice */}
      {auth.user.value?.is_guest && (
        <div class="flex items-start gap-2 p-2.5 bg-yellow-50 border border-yellow-200 rounded">
          <LuAlertCircle class="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-xs font-medium text-yellow-800">Guest Limitation</p>
            <p class="text-xs text-yellow-700 mt-0.5">
              You can join rooms but cannot create them. Register to create your own!
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div class="relative max-w-md">
        <LuSearch class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="Search rooms..."
          value={room.state.searchQuery}
          onInput$={(e) => (room.state.searchQuery = e.target.value)}
          class="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-transparent"
        />
      </div>

      {/* Loading State */}
      {room.state.loading && room.state.rooms.length === 0 && (
        <div class="flex flex-col items-center gap-2 py-12">
          <div class="w-5 h-5 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-xs text-gray-500">Loading rooms...</p>
        </div>
      )}

      {/* Empty State */}
      {!room.state.loading && sortedRooms.length === 0 && (
        <div class="flex flex-col items-center justify-center text-center py-12">
          <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
            <LuMessageSquare class="w-5 h-5 text-gray-400" />
          </div>
          <h3 class="text-sm font-medium text-gray-900 mb-1">
            {room.state.searchQuery ? "No rooms found" : "No rooms available"}
          </h3>
          <p class="text-xs text-gray-500 mb-3">
            {room.state.searchQuery ? "Try adjusting your search" : "Be the first to create one!"}
          </p>
          {!auth.user.value?.is_guest && !room.state.searchQuery && (
            <button
              onClick$={() => showCreateModal.value = true}
              class="px-4 py-2 text-xs font-medium text-white bg-pink-600 hover:bg-pink-700 transition-colors rounded"
            >
              Create First Room
            </button>
          )}
        </div>
      )}

      {/* Rooms Grid - Mobile: 2 cols, Tablet: 3 cols, Desktop: 4-6 cols */}
      {!room.state.loading && sortedRooms.length > 0 && (
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
          {sortedRooms.map((r) => (
            <div
              key={r.id}
              onClick$={() => handleJoinRoom(r.id)}
              class={`${r.is_private ? 'bg-purple-600 hover:bg-purple-700' : 'bg-pink-600 hover:bg-pink-700'} py-2 px-3 cursor-pointer transition-all relative rounded`}
            >
              {/* Private badge */}
              {r.is_private && (
                <div class="absolute top-1.5 right-1.5">
                  <LuLock class="w-3 h-3 text-white/80" />
                </div>
              )}

              <div class="flex items-center justify-between gap-2">
                <h3 class="text-base font-semibold text-white truncate flex-1 pr-4">{r.name}</h3>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <LuUsers class="w-3 h-3 text-white/80" />
                  <span class="text-sm font-medium text-white">{r.member_count || 0}</span>
                </div>
              </div>
              
              {r.description && (
                <p class="text-xs text-white/80 mt-1 line-clamp-1">{r.description}</p>
              )}

              {r.will_expire && r.time_left_minutes > 0 && (
                <div class="flex items-center justify-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-xs mt-2 rounded">
                  <LuClock class="w-2.5 h-2.5" />
                  <span>{r.time_left_minutes}m left</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateModal.value && (
        <>
          <div 
            class="fixed inset-0 bg-black/50 z-40"
            onClick$={() => {
              showCreateModal.value = false;
              newRoomName.value = "";
              newRoomDescription.value = "";
              isPrivate.value = false;
              room.state.error = null;
            }}
          />
          <div class="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div class="bg-white border border-gray-200 p-4 sm:p-6 max-w-md w-full rounded-lg">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-base sm:text-lg font-bold text-gray-900">Create New Room</h2>
                <button
                  onClick$={() => {
                    showCreateModal.value = false;
                    newRoomName.value = "";
                    newRoomDescription.value = "";
                    isPrivate.value = false;
                    room.state.error = null;
                  }}
                  class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors rounded"
                >
                  <LuX class="w-4 h-4" />
                </button>
              </div>

              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">
                    Room Name *
                  </label>
                  <input
                    type="text"
                    bind:value={newRoomName}
                    placeholder="Enter room name (3-50 characters)"
                    maxLength={50}
                    class="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    bind:value={newRoomDescription}
                    placeholder="Enter room description"
                    rows={3}
                    maxLength={200}
                    class="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-transparent resize-none"
                  />
                </div>

                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="private-room"
                    bind:checked={isPrivate}
                    class="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <label for="private-room" class="text-xs text-gray-700 flex items-center gap-1">
                    <LuLock class="w-3 h-3" />
                    Make this room private
                  </label>
                </div>
              </div>

              <div class="flex gap-2 mt-4">
                <button
                  onClick$={handleCreateRoom}
                  disabled={room.state.loading}
                  class="flex-1 px-4 py-2 text-xs font-medium text-white bg-pink-600 hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
                >
                  {room.state.loading ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick$={() => {
                    showCreateModal.value = false;
                    newRoomName.value = "";
                    newRoomDescription.value = "";
                    isPrivate.value = false;
                    room.state.error = null;
                  }}
                  disabled={room.state.loading}
                  class="flex-1 px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

export const head = {
  title: "Browse Rooms - Discover Chat Rooms",
  meta: [
    {
      name: "description",
      content: "Browse and discover all available chat rooms. Join conversations on various topics with people from around the world.",
    },
  ],
};