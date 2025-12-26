import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
import { useNavigate, useLocation } from "@builder.io/qwik-city";
import { useAuth } from "../../../context/auth";
import { roomsApi } from "../../../api/rooms";
import { useRoomContext } from "../../../store/room.store";
import { wsService } from "../../../api/websocket";
import { 
  RoomSidebar,
  RoomListItem 
} from "../../../components/rooms/RoomSidebar.jsx";
import { 
  RoomsLayout,
  RoomsSidebarContainer,
  RoomsChatContainer 
} from "../../../components/rooms/RoomsLayout.jsx";
import { ChatPanel } from "../../../components/rooms/ChatPanel.jsx";
import {
  LuPlus,
  LuAlertCircle,
  LuX,
  LuLock,
} from '@qwikest/icons/lucide';

console.log('🔥 ROOMS ROUTE FILE LOADED');

export default component$(() => {
  const nav = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const room = useRoomContext();
  
  // Check if we have a roomId from query params (optional fallback)
  const urlParams = new URLSearchParams(location.url.search);
  const roomIdFromQuery = urlParams.get('room');
  
  // Local UI state
  const showCreateModal = useSignal(false);
  const newRoomName = useSignal("");
  const newRoomDescription = useSignal("");
  const isPrivate = useSignal(false);
  const showRoomList = useSignal(false);

  // Load rooms from API
  const loadRooms = $(async () => {
    console.log('🔍 [ROOMS] Loading rooms for sidebar...');
    
    try {
      room.state.loading = true;
      room.state.error = null;
      
      // Load user's rooms (joined rooms)
      const data = await roomsApi.getUserRooms();
      
      room.state.rooms = data.rooms || [];
      
      console.log('✅ [ROOMS] Loaded rooms:', {
        count: room.state.rooms.length,
        rooms: room.state.rooms.map(r => ({ id: r.id, name: r.name }))
      });
      
      room.state.loading = false;
      
    } catch (err) {
      console.error('❌ [ROOMS] Failed to load rooms:', err);
      room.state.error = err.message || 'Failed to load rooms';
      room.state.loading = false;
    }
  });

  // WebSocket handler for real-time updates
  const handleWebSocketMessage = $((data) => {
    console.log('📡 [ROOMS WS] Message received:', data);
    
    if (data.type === "room_created") {
      const newRoom = data.data?.room;
      if (newRoom && !room.state.rooms.some(r => r.id === newRoom.id)) {
        room.state.rooms = [...room.state.rooms, newRoom];
      }
    }

    if (data.type === "room_deleted") {
      const roomId = data.data?.room_id;
      if (roomId) {
        room.state.rooms = room.state.rooms.filter(r => r.id !== roomId);
      }
    }

    if (data.type === "user_joined_room" || data.type === "user_left_room") {
      const roomId = data.data?.room_id;
      const memberCount = data.data?.member_count;
      
      if (roomId && memberCount !== undefined) {
        room.state.rooms = room.state.rooms.map(r => 
          r.id === roomId ? { ...r, member_count: memberCount } : r
        );
      }
    }
  });

  // Initialize
  useVisibleTask$(async ({ cleanup }) => {
    console.log('🚀 [ROOMS PAGE] Initializing...');
    
    try {
      // Connect WebSocket
      wsService.connect();
      const unsubscribe = wsService.onMessage(handleWebSocketMessage);

      // Load rooms
      await loadRooms();

      cleanup(() => {
        unsubscribe();
      });
    } catch (err) {
      console.error('❌ [ROOMS PAGE] Initialization error:', err);
      room.state.error = 'Failed to initialize';
    }
  });

  // Create room
  const handleCreateRoom = $(async () => {
    const name = newRoomName.value.trim();
    
    if (!name) {
      room.state.error = "Room name is required";
      return;
    }

    if (name.length < 3) {
      room.state.error = "Room name must be at least 3 characters";
      return;
    }

    if (name.length > 50) {
      room.state.error = "Room name must be less than 50 characters";
      return;
    }

    try {
      room.state.loading = true;
      room.state.error = null;

      await roomsApi.createRoom(
        name, 
        newRoomDescription.value.trim() || null,
        isPrivate.value
      );

      // Close modal and reset
      showCreateModal.value = false;
      newRoomName.value = "";
      newRoomDescription.value = "";
      isPrivate.value = false;

      // Reload rooms
      await loadRooms();

      room.state.successMessage = "Room created successfully!";
      setTimeout(() => room.state.successMessage = null, 3000);

    } catch (err) {
      console.error('❌ [CREATE ROOM] Failed:', err);
      room.state.error = err.message || 'Failed to create room';
    } finally {
      room.state.loading = false;
    }
  });

  // Handle room selection (if using query params approach)
  const handleRoomSelect = $((room) => {
    // Navigate to room-specific URL for SEO
    nav(`/rooms/${room.id}`);
  });

  // Toggle sidebar on mobile
  const toggleRoomList = $(() => {
    showRoomList.value = !showRoomList.value;
  });

  return (
    <RoomsLayout>
      {/* Sidebar */}
      <RoomsSidebarContainer showRoomList={showRoomList.value}>
        <RoomSidebar 
          showCreateModal={showCreateModal.value}
          onToggleCreateModal={$(() => showCreateModal.value = true)}
          selectedRoomId={roomIdFromQuery}
        />
      </RoomsSidebarContainer>

      {/* Main Chat Panel */}
      <RoomsChatContainer showRoomList={showRoomList.value}>
        <ChatPanel 
          roomId={roomIdFromQuery} 
          onToggleSidebar={toggleRoomList}
        />
      </RoomsChatContainer>

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

              {/* Error Display */}
              {room.state.error && (
                <div class="mt-3 flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded">
                  <LuAlertCircle class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p class="text-xs text-red-600">{room.state.error}</p>
                </div>
              )}

              <div class="flex gap-2 mt-4">
                <button
                  onClick$={handleCreateRoom}
                  disabled={room.state.loading}
                  class="flex-1 px-4 py-2 text-xs font-medium text-white bg-pink-600 hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
                >
                  {room.state.loading ? 'Creating...' : 'Create Room'}
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
    </RoomsLayout>
  );
});

export const head = {
  title: "Rooms - Chat Interface",
  meta: [
    {
      name: "description",
      content: "Browse and join chat rooms to connect with others in real-time conversations.",
    },
  ],
};