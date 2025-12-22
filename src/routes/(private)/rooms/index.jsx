import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { useAuth } from "../../../context/auth";
import { roomsApi } from "../../../api/rooms";
import { 
  LuPlus, 
  LuAlertCircle,
  LuX,
  LuSearch,
  LuMessageSquare
} from '@qwikest/icons/lucide';

export default component$(() => {
  const nav = useNavigate();
  const auth = useAuth();
  
  const rooms = useSignal([]);
  const loading = useSignal(true);
  const error = useSignal("");
  const showCreateModal = useSignal(false);
  const newRoomName = useSignal("");
  const newRoomDescription = useSignal("");
  const searchQuery = useSignal("");

  // Load rooms
  const loadRooms = $(async () => {
    try {
      loading.value = true;
      const data = await roomsApi.getAllRooms();
      rooms.value = data.rooms || [];
      loading.value = false;
    } catch (err) {
      error.value = err.message;
      loading.value = false;
    }
  });

  useVisibleTask$(async () => {
    await loadRooms();
  });

  // Create room
  const handleCreateRoom = $(async () => {
    if (!newRoomName.value.trim()) {
      error.value = "Room name is required";
      return;
    }

    try {
      await roomsApi.createRoom(newRoomName.value, newRoomDescription.value);
      showCreateModal.value = false;
      newRoomName.value = "";
      newRoomDescription.value = "";
      await loadRooms();
    } catch (err) {
      error.value = err.message;
    }
  });

  // Join room
  const handleJoinRoom = $(async (roomId) => {
    await nav(`/rooms/${roomId}`);
  });

  // Filter rooms
  const filteredRooms = rooms.value.filter((room) => {
    return room.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
           room.description?.toLowerCase().includes(searchQuery.value.toLowerCase());
  });

  return (
    <div class="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg sm:text-xl font-bold text-gray-900">Chat Rooms</h1>
          <p class="text-xs text-gray-500 mt-0.5">
            {loading.value ? 'Loading...' : `${rooms.value.length} active rooms`}
          </p>
        </div>

        {!auth.user.value?.is_guest && (
          <button
            onClick$={() => showCreateModal.value = true}
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 transition-colors"
            style="border-radius: 4px;"
          >
            <LuPlus class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span class="hidden sm:inline">Create Room</span>
            <span class="sm:hidden">Create</span>
          </button>
        )}
      </div>

      {/* Error Message */}
      {error.value && (
        <div class="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200" style="border-radius: 4px;">
          <LuAlertCircle class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p class="text-xs text-red-600">{error.value}</p>
        </div>
      )}

      {/* Guest Notice */}
      {auth.user.value?.is_guest && (
        <div class="flex items-start gap-2 p-2.5 bg-yellow-50 border border-yellow-200" style="border-radius: 4px;">
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
          value={searchQuery.value}
          onInput$={(e) => (searchQuery.value = e.target.value)}
          class="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-transparent"
          style="border-radius: 4px;"
        />
      </div>

      {/* Loading State */}
      {loading.value && (
        <div class="flex flex-col items-center gap-2 py-12">
          <div class="w-5 h-5 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-xs text-gray-500">Loading rooms...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading.value && filteredRooms.length === 0 && (
        <div class="flex flex-col items-center justify-center text-center py-12">
          <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
            <LuMessageSquare class="w-5 h-5 text-gray-400" />
          </div>
          <h3 class="text-sm font-medium text-gray-900 mb-1">
            {searchQuery.value ? "No rooms found" : "No active rooms"}
          </h3>
          <p class="text-xs text-gray-500">
            {searchQuery.value ? "Try adjusting your search" : "Be the first to create one!"}
          </p>
        </div>
      )}

      {/* Rooms Grid - Mobile: 2 cols, Tablet: 3 cols, Desktop: 4-6 cols */}
      {!loading.value && filteredRooms.length > 0 && (
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              onClick$={() => handleJoinRoom(room.id)}
              class="bg-pink-600 hover:bg-pink-700 py-2 px-3 cursor-pointer transition-all"
              style="border-radius: 4px;"
            >
              <div class="flex items-center justify-between gap-2">
                <h3 class="text-base font-semibold text-white truncate flex-1">{room.name}</h3>
                <span class="text-sm font-medium text-white flex-shrink-0">{room.member_count}</span>
              </div>
              
              {room.will_expire && (
                <div class="flex items-center justify-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-xs mt-2" style="border-radius: 4px;">
                  {room.time_left_minutes}m
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateModal.value && (
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white border border-gray-200 p-4 sm:p-6 max-w-md w-full" style="border-radius: 4px;">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-base sm:text-lg font-bold text-gray-900">Create New Room</h2>
              <button
                onClick$={() => {
                  showCreateModal.value = false;
                  newRoomName.value = "";
                  newRoomDescription.value = "";
                  error.value = "";
                }}
                class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                style="border-radius: 4px;"
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
                  placeholder="Enter room name"
                  class="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-transparent"
                  style="border-radius: 4px;"
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
                  class="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-transparent resize-none"
                  style="border-radius: 4px;"
                />
              </div>
            </div>

            <div class="flex gap-2 mt-4">
              <button
                onClick$={handleCreateRoom}
                class="flex-1 px-4 py-2 text-xs font-medium text-white bg-pink-600 hover:bg-pink-700 transition-colors"
                style="border-radius: 4px;"
              >
                Create
              </button>
              <button
                onClick$={() => {
                  showCreateModal.value = false;
                  newRoomName.value = "";
                  newRoomDescription.value = "";
                  error.value = "";
                }}
                class="flex-1 px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                style="border-radius: 4px;"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export const head = {
  title: "Rooms - Anonymous Chat",
};
