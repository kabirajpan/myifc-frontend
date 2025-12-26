import { component$ } from "@builder.io/qwik";
import { LuSearch, LuPlus, LuDoorOpen, LuUsers, LuHash } from "@qwikest/icons/lucide";
import { formatTime } from "../../utils/helpers.js";

export const RoomList = component$(({ 
  rooms, 
  currentRoomId, 
  searchQuery,
  loading,
  onSearchChange, 
  onRoomSelect, 
  onCreateClick, 
  onJoinClick 
}) => {
  
  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div class="w-full sm:w-72 lg:w-80 bg-white sm:border sm:border-gray-200 sm:rounded-lg flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div class="px-3 py-3 border-b border-gray-200">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-semibold text-gray-900">Rooms</h2>
          <span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {rooms.length}
          </span>
        </div>

        {/* Action Buttons */}
        <div class="flex gap-2 mb-3">
          <button
            onClick$={onCreateClick}
            class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <LuPlus class="w-3.5 h-3.5" />
            Create Room
          </button>
          <button
            onClick$={onJoinClick}
            class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-white text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <LuDoorOpen class="w-3.5 h-3.5" />
            Join Room
          </button>
        </div>

        {/* Search */}
        <div class="relative">
          <LuSearch class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search rooms..."
            value={searchQuery}
            onInput$={(e) => onSearchChange(e.target.value)}
            class="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Room List */}
      <div class="flex-1 overflow-y-auto">
        {loading && rooms.length === 0 ? (
          // Loading State
          <div class="flex items-center justify-center py-8">
            <div class="text-center">
              <div class="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
              <p class="text-xs text-gray-500">Loading rooms...</p>
            </div>
          </div>
        ) : filteredRooms.length === 0 ? (
          // Empty State
          <div class="flex flex-col items-center justify-center py-8 px-3">
            <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
              <LuHash class="w-5 h-5 text-gray-400" />
            </div>
            <p class="text-xs text-gray-500 text-center mb-1">
              {searchQuery ? "No rooms found" : "No rooms joined yet"}
            </p>
            {!searchQuery && (
              <>
                <p class="text-xs text-gray-400 text-center mb-3">
                  Join or create a room to get started
                </p>
                <div class="flex gap-2">
                  <button
                    onClick$={onCreateClick}
                    class="px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    Create Room
                  </button>
                  <button
                    onClick$={onJoinClick}
                    class="px-3 py-1.5 text-xs font-medium bg-white text-purple-600 border border-purple-600 rounded hover:bg-purple-50 transition-colors"
                  >
                    Join Room
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          // Rooms List
          <div class="divide-y divide-gray-100">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                onClick$={() => onRoomSelect(room)}
                class={`px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors ${
                  currentRoomId === room.id ? "bg-purple-50" : ""
                }`}
              >
                <div class="flex items-start gap-2">
                  <div class="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                    <LuHash class="w-5 h-5 text-white" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-0.5">
                      <span class="font-medium text-xs text-gray-900 truncate">
                        {room.name}
                      </span>
                      {room.last_message_time && (
                        <span class="text-xs text-gray-500 flex-shrink-0 ml-1">
                          {formatTime(room.last_message_time)}
                        </span>
                      )}
                    </div>
                    <div class="flex items-center justify-between">
                      <p class="text-xs text-gray-600 truncate flex-1">
                        {room.last_message || "No messages yet"}
                      </p>
                      {room.unread_count > 0 && (
                        <span class="ml-1 bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                          {room.unread_count}
                        </span>
                      )}
                    </div>
                    <div class="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <LuUsers class="w-3 h-3" />
                      <span>{room.member_count || 0} members</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});