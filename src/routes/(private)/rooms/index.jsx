import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { useRoomContext } from "../../../store/room.store";
import { useAuth } from "../../../context/auth";
import { CreateRoomModal } from "../../../components/rooms/CreateRoomModal";
import { JoinRoomModal } from "../../../components/rooms/JoinRoomModal";
import { RoomList } from "../../../components/rooms/RoomList";
import { roomsApi } from "../../../api/rooms";
import { wsService } from "../../../api/websocket";

export default component$(() => {
  const auth = useAuth();
  const room = useRoomContext();
  const nav = useNavigate();

  // Modal states
  const showCreateModal = useSignal(false);
  const showJoinModal = useSignal(false);

  // Available public rooms for joining
  const publicRooms = useSignal([]);

  // Load user's joined rooms
  const loadUserRooms = $(async () => {
    try {
      const response = await roomsApi.getUserRooms();
      room.state.rooms = response.rooms || [];
    } catch (err) {
      room.state.error = err.message || "Failed to load rooms";
    }
  });

  // Load public rooms for joining
  const loadPublicRooms = $(async () => {
    try {
      const response = await roomsApi.getPublicRooms();
      publicRooms.value = response.rooms || [];
    } catch (err) {
      room.state.error = err.message || "Failed to load public rooms";
    }
  });

  // Initialize and load data
  useVisibleTask$(async ({ cleanup }) => {
    try {
      room.state.loading = true;

      // Connect WebSocket
      wsService.connect();

      // Subscribe to WebSocket events for room list updates
      const unsubscribe = wsService.onMessage((data) => {
        console.log('📨 WebSocket room list event:', data);

        // Update room list when new message arrives
        if (data.type === "new_message" && data.data?.room_id) {
          const roomId = data.data.room_id;
          const message = data.data.message;

          room.state.rooms = room.state.rooms.map(r => {
            if (r.id === roomId) {
              let lastMessage = message.content;
              if (message.type === 'image') lastMessage = 'Image';
              else if (message.type === 'gif') lastMessage = 'GIF';
              else if (message.type === 'audio') lastMessage = 'Voice message';
              else if (message.caption) lastMessage = message.caption;

              return {
                ...r,
                last_message: lastMessage,
                last_message_time: message.created_at,
                unread_count: message.sender_id === auth.user.value?.id ? r.unread_count : r.unread_count + 1
              };
            }
            return r;
          });
        }
      });

      // Load user's joined rooms
      await loadUserRooms();

      room.state.loading = false;

      // Cleanup on unmount
      return () => {
        unsubscribe();
      };
    } catch (err) {
      room.state.error = err.message || "Failed to load rooms";
      room.state.loading = false;
    }
  });

  // Handlers
  const handleCreateRoom = $(async (data) => {
    try {
      const response = await roomsApi.createRoom(data.name, data.description, data.isAdminRoom);
      
      showCreateModal.value = false;
      room.state.successMessage = "Room created successfully!";
      setTimeout(() => (room.state.successMessage = null), 3000);

      // Reload rooms list
      await loadUserRooms();

      // Navigate to the newly created room
      if (response.room) {
        await nav(`/rooms/${response.room.id}`);
      }
    } catch (err) {
      room.state.error = err.message || "Failed to create room";
    }
  });

  const handleJoinRoom = $(async (roomId) => {
    try {
      await roomsApi.joinRoom(roomId);
      
      showJoinModal.value = false;
      room.state.successMessage = "Joined room successfully!";
      setTimeout(() => (room.state.successMessage = null), 3000);

      // Reload rooms list
      await loadUserRooms();

      // Navigate to the joined room
      await nav(`/rooms/${roomId}`);
    } catch (err) {
      room.state.error = err.message || "Failed to join room";
    }
  });

  const handleRoomSelect = $(async (selectedRoom) => {
    // Navigate to the room
    await nav(`/rooms/${selectedRoom.id}`);
  });

  const handleSearchChange = $((query) => {
    room.state.searchQuery = query;
  });

  const handleCreateClick = $(() => {
    showCreateModal.value = true;
  });

  const handleJoinClick = $(async () => {
    await loadPublicRooms();
    showJoinModal.value = true;
  });

  const handleCreateModalClose = $(() => {
    showCreateModal.value = false;
  });

  const handleJoinModalClose = $(() => {
    showJoinModal.value = false;
  });

  return (
    <div class="fixed inset-0 top-16 flex items-center justify-center p-3 bg-gray-50">
      {/* Full Width Room List */}
      <div class="w-full max-w-2xl">
        <RoomList
          rooms={room.state.rooms}
          currentRoomId={null}
          searchQuery={room.state.searchQuery}
          loading={room.state.loading}
          onSearchChange={handleSearchChange}
          onRoomSelect={handleRoomSelect}
          onCreateClick={handleCreateClick}
          onJoinClick={handleJoinClick}
        />
      </div>

      {/* Modals */}
      <CreateRoomModal
        isOpen={showCreateModal.value}
        onClose={handleCreateModalClose}
        onSubmit={handleCreateRoom}
      />

      <JoinRoomModal
        isOpen={showJoinModal.value}
        onClose={handleJoinModalClose}
        onJoin={handleJoinRoom}
        publicRooms={publicRooms.value}
      />
    </div>
  );
});

export const head = {
  title: "Rooms",
};