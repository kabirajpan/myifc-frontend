import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { useAuth } from "../../../context/auth";
import { adminApi } from "../../../api/admin";
import { 
  LuSearch, 
  LuRefreshCw, 
  LuUsers, 
  LuMessageSquare, 
  LuTrash2, 
  LuX, 
  LuAlertCircle,
  LuShield,
  LuUser,
  LuClock
} from '@qwikest/icons/lucide';

export default component$(() => {
  const auth = useAuth();
  const rooms = useSignal([]);
  const loading = useSignal(true);
  const error = useSignal(null);
  const selectedRoom = useSignal(null);
  const roomDetails = useSignal(null);
  const showCreateModal = useSignal(false);
  const newRoomName = useSignal("");
  const newRoomDesc = useSignal("");
  const searchQuery = useSignal("");
  const filterType = useSignal("all");

  const isAdminOrMod = auth.user.value?.role === 'admin' || auth.user.value?.role === 'moderator';
  const isAdmin = auth.user.value?.role === 'admin';

  // Load rooms
  const loadRooms = $(async () => {
    try {
      loading.value = true;
      const data = await adminApi.getRooms();
      rooms.value = data.rooms;
      error.value = null;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  });

  useVisibleTask$(async () => {
    if (isAdminOrMod) {
      await loadRooms();
    }
  });

  // Load room details
  const loadRoomDetails = $(async (roomId) => {
    try {
      const data = await adminApi.getRoomDetails(roomId);
      roomDetails.value = data;
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  });

  // View room
  const handleViewRoom = $(async (room) => {
    selectedRoom.value = room;
    await loadRoomDetails(room.id);
  });

  // Create admin room
  const handleCreateRoom = $(async () => {
    if (!newRoomName.value.trim()) {
      alert("Room name is required");
      return;
    }

    try {
      await adminApi.createRoom(newRoomName.value, newRoomDesc.value);
      showCreateModal.value = false;
      newRoomName.value = "";
      newRoomDesc.value = "";
      await loadRooms();
      alert("Admin room created");
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  });

  // Delete room
  const handleDeleteRoom = $(async (roomId) => {
    if (!confirm("Delete this room? All messages and members will be removed!")) return;

    try {
      await adminApi.deleteRoom(roomId);
      selectedRoom.value = null;
      await loadRooms();
      alert("Room deleted");
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  });

  // Kick user from room
  const handleKickUser = $(async (roomId, userId, username) => {
    if (!confirm(`Kick ${username} from room?`)) return;

    try {
      await adminApi.kickUserFromRoom(roomId, userId);
      await loadRoomDetails(roomId);
      alert("User kicked");
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  });

  // Delete room message
  const handleDeleteMessage = $(async (messageId) => {
    if (!confirm("Delete this message?")) return;

    try {
      await adminApi.deleteRoomMessage(messageId);
      await loadRoomDetails(selectedRoom.value.id);
      alert("Message deleted");
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  });

  // Filter rooms
  const filteredRooms = rooms.value.filter((room) => {
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesFilter = 
      filterType.value === "all" ||
      (filterType.value === "admin" && room.is_admin_room) ||
      (filterType.value === "user" && !room.is_admin_room);
    return matchesSearch && matchesFilter;
  });

  if (!isAdminOrMod) {
    return (
      <div class="flex items-center justify-center min-h-[60vh]">
        <div class="text-center">
          <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <LuAlertCircle class="w-8 h-8 text-red-500" />
          </div>
          <h2 class="text-lg font-semibold text-gray-900">Access Denied</h2>
          <p class="text-sm text-gray-500 mt-1">You don't have permission to view this page</p>
        </div>
      </div>
    );
  }

  return (
    <div class="space-y-5">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Rooms</h1>
          <p class="text-sm text-gray-500 mt-1">Manage chat rooms and members</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            onClick$={loadRooms}
            class="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LuRefreshCw class="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              onClick$={() => (showCreateModal.value = true)}
              class="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              New Room
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div class="flex items-center gap-3">
        <div class="flex-1 relative">
          <LuSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search rooms..."
            value={searchQuery.value}
            onInput$={(e) => (searchQuery.value = e.target.value)}
            class="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div class="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick$={() => (filterType.value = "all")}
            class={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterType.value === "all"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All
          </button>
          <button
            onClick$={() => (filterType.value = "admin")}
            class={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterType.value === "admin"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Admin
          </button>
          <button
            onClick$={() => (filterType.value = "user")}
            class={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterType.value === "user"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            User
          </button>
        </div>
      </div>

      {/* Error State */}
      {error.value && (
        <div class="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-lg">
          <LuAlertCircle class="w-5 h-5 text-red-500 flex-shrink-0" />
          <p class="text-sm text-red-600">{error.value}</p>
        </div>
      )}

      {/* Rooms Grid */}
      {loading.value ? (
        <div class="flex items-center justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <div class="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm text-gray-500">Loading rooms...</p>
          </div>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div class="flex flex-col items-center justify-center py-20">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <LuMessageSquare class="w-8 h-8 text-gray-400" />
          </div>
          <h3 class="text-base font-medium text-gray-900">No rooms found</h3>
          <p class="text-sm text-gray-500 mt-1">
            {searchQuery.value ? "Try adjusting your search" : "Create a new room to get started"}
          </p>
        </div>
      ) : (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              class="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-purple-200 transition-all cursor-pointer"
              onClick$={() => handleViewRoom(room)}
            >
              {/* Room Header */}
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                  <h3 class="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                    {room.name}
                  </h3>
                  <p class="text-xs text-gray-500 mt-1 line-clamp-2">
                    {room.description || "No description"}
                  </p>
                </div>
                <span
                  class={`px-2 py-1 text-xs font-medium rounded-md flex-shrink-0 ml-2 flex items-center gap-1 ${
                    room.is_admin_room
                      ? "bg-purple-50 text-purple-700"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  {room.is_admin_room ? <LuShield class="w-3 h-3" /> : <LuUser class="w-3 h-3" />}
                  {room.is_admin_room ? "Admin" : "User"}
                </span>
              </div>

              {/* Room Stats */}
              <div class="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <div class="flex items-center gap-1.5">
                  <LuUsers class="w-4 h-4" />
                  <span>{room.members}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <LuMessageSquare class="w-4 h-4" />
                  <span>{room.messages}</span>
                </div>
              </div>

              {/* Room Footer */}
              <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                <span class="text-xs text-gray-500">
                  by {room.creator_name}
                </span>
                <button
                  onClick$={(e) => {
                    e.stopPropagation();
                    handleDeleteRoom(room.id);
                  }}
                  class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <LuTrash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Room Details Modal */}
      {selectedRoom.value && roomDetails.value && (
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div class="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h2 class="text-xl font-semibold text-gray-900">
                    {roomDetails.value.room.name}
                  </h2>
                  <span
                    class={`px-2 py-0.5 text-xs font-medium rounded flex items-center gap-1 ${
                      roomDetails.value.room.is_admin_room
                        ? "bg-purple-50 text-purple-700"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {roomDetails.value.room.is_admin_room ? <LuShield class="w-3 h-3" /> : <LuUser class="w-3 h-3" />}
                    {roomDetails.value.room.is_admin_room ? "Admin" : "User"}
                  </span>
                </div>
                <p class="text-sm text-gray-500">
                  {roomDetails.value.room.description || "No description"}
                </p>
              </div>
              <button
                onClick$={() => {
                  selectedRoom.value = null;
                  roomDetails.value = null;
                }}
                class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LuX class="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div class="overflow-y-auto max-h-[calc(85vh-200px)] px-6 py-5">
              {/* Members Section */}
              <div class="mb-6">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <LuUsers class="w-4 h-4" />
                    Members
                  </h3>
                  <span class="text-xs text-gray-500">
                    {roomDetails.value.members.length} total
                  </span>
                </div>
                <div class="space-y-2">
                  {roomDetails.value.members.map((member) => (
                    <div
                      key={member.id}
                      class="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div class="flex items-center gap-3">
                        <div class={`w-2 h-2 rounded-full ${member.is_online ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span class="text-sm font-medium text-gray-900">
                          {member.username}
                        </span>
                        {member.is_online && (
                          <span class="text-xs text-green-600">Online</span>
                        )}
                      </div>
                      <button
                        onClick$={() =>
                          handleKickUser(selectedRoom.value.id, member.user_id, member.username)
                        }
                        class="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        Kick
                      </button>
                    </div>
                  ))}
                  {roomDetails.value.members.length === 0 && (
                    <p class="text-sm text-gray-500 text-center py-8">No members yet</p>
                  )}
                </div>
              </div>

              {/* Messages Section */}
              <div>
                <div class="flex items-center justify-between mb-3">
                  <h3 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <LuMessageSquare class="w-4 h-4" />
                    Recent Messages
                  </h3>
                  <span class="text-xs text-gray-500">
                    Last {roomDetails.value.recent_messages.length}
                  </span>
                </div>
                <div class="space-y-3">
                  {roomDetails.value.recent_messages.map((msg) => (
                    <div key={msg.id} class="group p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                      <div class="flex items-start justify-between mb-2">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="text-sm font-semibold text-purple-600">
                            {msg.sender_name}
                          </span>
                          <span class="text-xs text-gray-400 flex items-center gap-1">
                            <LuClock class="w-3 h-3" />
                            {new Date(msg.created_at).toLocaleDateString()} at {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.type === "secret" && (
                            <span class="px-2 py-0.5 text-xs bg-orange-50 text-orange-600 rounded">
                              Secret
                            </span>
                          )}
                        </div>
                        <button
                          onClick$={() => handleDeleteMessage(msg.id)}
                          class="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all"
                        >
                          <LuTrash2 class="w-4 h-4" />
                        </button>
                      </div>
                      <p class="text-sm text-gray-700 leading-relaxed">{msg.content}</p>
                    </div>
                  ))}
                  {roomDetails.value.recent_messages.length === 0 && (
                    <p class="text-sm text-gray-500 text-center py-8">No messages yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div class="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick$={() => handleDeleteRoom(selectedRoom.value.id)}
                class="w-full px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <LuTrash2 class="w-4 h-4" />
                Delete Room Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateModal.value && (
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 class="text-xl font-semibold text-gray-900 mb-5">Create Admin Room</h2>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoomName.value}
                  onInput$={(e) => (newRoomName.value = e.target.value)}
                  placeholder="General Discussion"
                  class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newRoomDesc.value}
                  onInput$={(e) => (newRoomDesc.value = e.target.value)}
                  placeholder="Main chat room for community discussions..."
                  class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div class="flex gap-3 pt-2">
                <button
                  onClick$={handleCreateRoom}
                  class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  Create Room
                </button>
                <button
                  onClick$={() => {
                    showCreateModal.value = false;
                    newRoomName.value = "";
                    newRoomDesc.value = "";
                  }}
                  class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
