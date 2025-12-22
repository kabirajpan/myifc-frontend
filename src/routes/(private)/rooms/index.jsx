import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { useAuth } from "../../../context/auth";
import { roomsApi } from "../../../api/rooms";
import { 
  LuHome, 
  LuPlus, 
  LuUsers,
  LuAlertCircle,
  LuClock,
  LuX,
  LuSearch
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
    <div class="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Chat Rooms</h1>
          <p class="text-sm text-gray-500 mt-1">
            {loading.value ? 'Loading...' : `${rooms.value.length} active rooms`}
          </p>
        </div>

        {!auth.user.value?.is_guest && (
          <button
            onClick$={() => showCreateModal.value = true}
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <LuPlus class="w-4 h-4" />
            Create Room
          </button>
        )}
      </div>

      {/* Error Message */}
      {error.value && (
        <div class="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-lg">
          <LuAlertCircle class="w-5 h-5 text-red-500 flex-shrink-0" />
          <p class="text-sm text-red-600">{error.value}</p>
        </div>
      )}

      {/* Guest Notice */}
      {auth.user.value?.is_guest && (
        <div class="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
          <LuAlertCircle class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-yellow-800">Guest Limitation</p>
            <p class="text-sm text-yellow-700 mt-1">
              You can join rooms but cannot create them. Register to create your own!
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div class="relative">
        <LuSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search rooms..."
          value={searchQuery.value}
          onInput$={(e) => (searchQuery.value = e.target.value)}
          class="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Loading State */}
      {loading.value && (
        <div class="flex items-center justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <div class="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm text-gray-500">Loading rooms...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading.value && filteredRooms.length === 0 && (
        <div class="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-xl">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <LuHome class="w-8 h-8 text-gray-400" />
          </div>
          <h3 class="text-base font-medium text-gray-900 mb-1">
            {searchQuery.value ? "No rooms found" : "No active rooms"}
          </h3>
          <p class="text-sm text-gray-500">
            {searchQuery.value ? "Try adjusting your search" : "Be the first to create one!"}
          </p>
        </div>
      )}

      {/* Rooms List */}
      {!loading.value && filteredRooms.length > 0 && (
        <div class="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              onClick$={() => handleJoinRoom(room.id)}
              class="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0 mr-4">
                  <h3 class="font-medium text-gray-900 truncate">{room.name}</h3>
                  {room.description && (
                    <p class="text-xs text-gray-500 truncate mt-0.5">{room.description}</p>
                  )}
                  <div class="flex items-center gap-3 mt-1.5">
                    <span class="text-xs text-gray-500 flex items-center gap-1">
                      <LuUsers class="w-3 h-3" />
                      {room.member_count}
                    </span>
                    <span class="text-xs text-gray-400">•</span>
                    <span class="text-xs text-gray-500">by {room.creator_username}</span>
                  </div>
                </div>

                {room.will_expire && (
                  <div class="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded text-xs">
                    <LuClock class="w-3 h-3" />
                    <span>{room.time_left_minutes}m</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateModal.value && (
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-xl font-semibold text-gray-900">Create New Room</h2>
              <button
                onClick$={() => {
                  showCreateModal.value = false;
                  newRoomName.value = "";
                  newRoomDescription.value = "";
                }}
                class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LuX class="w-5 h-5" />
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Room Name *
                </label>
                <input
                  type="text"
                  bind:value={newRoomName}
                  placeholder="Enter room name"
                  class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  bind:value={newRoomDescription}
                  placeholder="Enter room description"
                  rows={3}
                  class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div class="flex gap-3 mt-6">
              <button
                onClick$={handleCreateRoom}
                class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                Create
              </button>
              <button
                onClick$={() => {
                  showCreateModal.value = false;
                  newRoomName.value = "";
                  newRoomDescription.value = "";
                }}
                class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
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
