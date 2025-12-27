import { component$, useSignal, $ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { useRoomContext } from "../../../store/room.store";
import { ChatSidebar } from "../../../components/chat/ChatSidebar.jsx";
import { CreateRoomModal } from "../../../components/rooms/CreateRoomModal";
import { JoinRoomModal } from "../../../components/rooms/JoinRoomModal";
import { roomsApi } from "../../../api/rooms";
import { LuHash } from "@qwikest/icons/lucide";

export default component$(() => {
  const room = useRoomContext();
  const nav = useNavigate();

  // Modal states
  const showCreateModal = useSignal(false);
  const showJoinModal = useSignal(false);
  const publicRooms = useSignal([]);

  // Load public rooms for joining
  const loadPublicRooms = $(async () => {
    try {
      const response = await roomsApi.getPublicRooms();
      publicRooms.value = response.rooms || [];
    } catch (err) {
      room.state.error = err.message || "Failed to load public rooms";
    }
  });

  // Handlers
  const handleCreateRoom = $(async (data) => {
    try {
      const response = await roomsApi.createRoom(data.name, data.description, data.isAdminRoom);
      
      showCreateModal.value = false;
      room.state.successMessage = "Room created successfully!";
      setTimeout(() => (room.state.successMessage = null), 3000);

      // Add to room list
      if (response.room) {
        const exists = room.state.rooms.some(r => r.id === response.room.id);
        if (!exists) {
          room.state.rooms = [...room.state.rooms, response.room];
        }
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

      // Reload room list to include new room
      const response = await roomsApi.getUserRooms();
      room.state.rooms = response.rooms || [];

      await nav(`/rooms/${roomId}`);
    } catch (err) {
      room.state.error = err.message || "Failed to join room";
    }
  });

  const handleRoomSelect = $(async (selectedRoom) => {
    await nav(`/rooms/${selectedRoom.id}`);
  });

  return (
    <div class="fixed inset-0 top-16 flex flex-col sm:flex-row sm:gap-3 sm:p-3 bg-gray-50 sm:bg-transparent">
      {/* Room List Sidebar */}
      <ChatSidebar
        mode="room"
        items={room.state.rooms}
        currentItemId={null}
        searchQuery={room.state.searchQuery}
        loading={!room.state.roomsLoaded}
        onSearchChange={$((query) => (room.state.searchQuery = query))}
        onItemSelect={handleRoomSelect}
        onPrimaryAction={$(() => (showCreateModal.value = true))}
        onSecondaryAction={$(async () => {
          await loadPublicRooms();
          showJoinModal.value = true;
        })}
      />

      {/* Main Chat Area - Empty State */}
      <div class="flex-1 bg-white sm:border sm:border-gray-200 sm:rounded-lg flex flex-col overflow-hidden h-full">
        <div class="flex-1 flex items-center justify-center p-4">
          <div class="text-center">
            <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <LuHash class="w-6 h-6 text-gray-400" />
            </div>
            <h3 class="text-sm font-medium text-gray-900 mb-1">No room selected</h3>
            <p class="text-xs text-gray-500">Choose a room to start chatting</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateRoomModal
        isOpen={showCreateModal.value}
        onClose={$(() => (showCreateModal.value = false))}
        onSubmit={handleCreateRoom}
      />

      <JoinRoomModal
        isOpen={showJoinModal.value}
        onClose={$(() => (showJoinModal.value = false))}
        onJoin={handleJoinRoom}
        publicRooms={publicRooms.value}
      />
    </div>
  );
});

export const head = {
  title: "Rooms",
};