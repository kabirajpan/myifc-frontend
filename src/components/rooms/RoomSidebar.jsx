import { component$, $ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { useRoomContext } from "../../store/room.store";
import { useAuth } from "../../context/auth";
import {
  LuSearch,
  LuPlus,
  LuMessageSquare,
  LuUsers,
  LuClock,
  LuLock,
  LuEye,
} from '@qwikest/icons/lucide';

export const RoomListItem = component$(({ room, isSelected, onSelect }) => {
  const getRoomIconColor = (room) => {
    if (room.is_private) return "border-purple-600 text-purple-600";
    if (room.member_count >= 50) return "border-red-600 text-red-600";
    return "border-green-600 text-green-600";
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <div
      onClick$={() => onSelect(room)}
      class={`px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? "bg-pink-50 border-r-2 border-pink-500" : ""
        }`}
    >
      <div class="flex items-start gap-2">
        <div class="relative flex-shrink-0">
          <div
            class={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium border-2 bg-white ${getRoomIconColor(room)}`}
          >
            {room.name.charAt(0).toUpperCase()}
          </div>
          {room.is_private && (
            <LuLock class="absolute -bottom-1 -right-1 w-3 h-3 text-purple-600 bg-white rounded-full p-0.5" />
          )}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-0.5">
            <span class={`font-medium text-xs truncate ${room.is_private ? 'text-purple-700' : 'text-gray-900'}`}>
              {room.name}
            </span>
            <span class="text-xs text-gray-500 flex-shrink-0 ml-1">
              {formatTime(room.last_message_time)}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <p class="text-xs text-gray-600 truncate flex-1">
              {room.last_message || "No messages yet"}
            </p>
            <div class="flex items-center gap-1.5">
              <span class="text-xs text-gray-500 flex items-center gap-0.5">
                <LuUsers class="w-3 h-3" />
                {room.member_count || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const RoomSidebar = component$(({ showCreateModal, onToggleCreateModal, selectedRoomId }) => {
  const nav = useNavigate();
  const auth = useAuth();
  const room = useRoomContext();

  const handleRoomSelect = $((room) => {
    nav(`/rooms/${room.id}`);
  });

  const handleBrowseRooms = $(() => {
    nav('/rooms/browse');
  });

  return (
    <>
      <div class="px-3 py-3 border-b border-gray-200">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-base font-semibold text-gray-900">Rooms</h2>
          {!auth.user.value?.is_guest && (
            <button
              onClick$={onToggleCreateModal}
              class="p-1.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              title="Create room"
            >
              <LuPlus class="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div class="relative">
          <LuSearch class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search rooms..."
            value={room.state.searchQuery}
            onInput$={(e) => (room.state.searchQuery = e.target.value)}
            class="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto">
        {room.state.loading && room.state.rooms?.length === 0 && (
          <div class="flex items-center justify-center py-8">
            <div class="text-center">
              <div class="w-6 h-6 border-2 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
              <p class="text-xs text-gray-500">Loading rooms...</p>
            </div>
          </div>
        )}

        {!room.state.loading && room.state.rooms?.length === 0 && (
          <div class="flex flex-col items-center justify-center py-8 px-3">
            <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
              <LuMessageSquare class="w-5 h-5 text-gray-400" />
            </div>
            <p class="text-xs text-gray-500 text-center mb-1">No rooms available</p>
            <p class="text-xs text-gray-400 text-center mb-3">Join or create one</p>
            <div class="flex flex-col gap-2 w-full px-4">
              {!auth.user.value?.is_guest && (
                <button
                  onClick$={onToggleCreateModal}
                  class="px-3 py-1.5 bg-pink-600 text-white text-xs rounded-lg hover:bg-pink-700 transition-colors"
                >
                  Create Room
                </button>
              )}
              <button
                onClick$={handleBrowseRooms}
                class="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300 transition-colors"
              >
                Browse Rooms
              </button>
            </div>
          </div>
        )}

        {room.state.rooms?.length > 0 && (
          <div class="divide-y divide-gray-100">
            {room.state.rooms.map((roomItem) => (
              <RoomListItem
                key={roomItem.id}
                room={roomItem}
                isSelected={selectedRoomId === roomItem.id}
                onSelect={handleRoomSelect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom buttons for mobile */}
      <div class="border-t border-gray-200 p-3 sm:hidden">
        <div class="flex gap-2">
          <button
            onClick$={handleBrowseRooms}
            class="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
          >
            <LuEye class="w-3.5 h-3.5" />
            <span>Browse</span>
          </button>
          {!auth.user.value?.is_guest && (
            <button
              onClick$={onToggleCreateModal}
              class="flex-1 px-3 py-2 bg-pink-600 text-white text-xs rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-1"
            >
              <LuPlus class="w-3.5 h-3.5" />
              <span>Create</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
});