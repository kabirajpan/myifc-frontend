import { component$, useSignal, useComputed$, $ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { LuHash, LuMessageSquare, LuUsers, LuX, LuImage, LuFilm, LuMic } from "@qwikest/icons/lucide";
import { formatTime, getGenderColor, getGenderBorderColor } from "../../utils/helpers.js";

export const UnifiedSidebar = component$(({
  isOpen,
  onClose,
  rooms = [],
  chats = [],
  currentRoomId = null,
  currentChatId = null,
  loading = false,
}) => {
  const nav = useNavigate();

  // Sort rooms by last activity
  const sortedRooms = useComputed$(() => {
    return [...rooms].sort((a, b) => {
      const timeA = a.last_message_time || 0;
      const timeB = b.last_message_time || 0;
      return timeB - timeA;
    });
  });

  // Sort chats by last activity
  const sortedChats = useComputed$(() => {
    return [...chats].sort((a, b) => {
      const timeA = a.last_message_time || 0;
      const timeB = b.last_message_time || 0;
      return timeB - timeA;
    });
  });

  const handleRoomClick = $((room) => {
    onClose();
    nav(`/rooms/${room.id}`);
  });

  const handleChatClick = $((chat) => {
    onClose();
    nav(`/chat?user=${chat.other_user_id}&name=${chat.other_user_name}`);
  });

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          class="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick$={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        class={`fixed top-0 left-0 h-full bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style="width: 360px; max-width: 50vw;"
      >
        {/* Header */}
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <h2 class="text-lg font-semibold text-gray-900">Messages</h2>
          <button
            onClick$={onClose}
            class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <LuX class="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div class="h-[calc(100%-60px)] overflow-y-auto">
          {loading && rooms.length === 0 && chats.length === 0 ? (
            <div class="flex items-center justify-center py-12">
              <div class="text-center">
                <div class="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p class="text-sm text-gray-500">Loading...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Rooms Section */}
              {sortedRooms.value.length > 0 && (
                <div class="mb-4">
                  <div class="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <div class="flex items-center gap-2">
                      <LuHash class="w-4 h-4 text-purple-600" />
                      <h3 class="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Rooms ({sortedRooms.value.length})
                      </h3>
                    </div>
                  </div>
                  <div class="divide-y divide-gray-100">
                    {sortedRooms.value.map((room) => {
                      const isActive = currentRoomId === room.id;
                      return (
                        <div
                          key={room.id}
                          onClick$={() => handleRoomClick(room)}
                          class={`px-4 py-3 hover:bg-purple-50 cursor-pointer transition-colors ${
                            isActive ? "bg-purple-100 border-l-4 border-purple-600" : ""
                          }`}
                        >
                          <div class="flex items-start gap-3">
                            {/* Room Icon */}
                            <div class="flex-shrink-0">
                              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-sm">
                                <LuHash class="w-5 h-5 text-white" />
                              </div>
                            </div>

                            {/* Room Info */}
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center justify-between gap-2 mb-1">
                                <span class="font-medium text-sm text-gray-900 truncate">
                                  {room.name}
                                </span>
                                {room.last_message_time && (
                                  <span class="text-xs text-gray-500 flex-shrink-0">
                                    {formatTime(room.last_message_time)}
                                  </span>
                                )}
                              </div>
                              <div class="flex items-center justify-between gap-2">
                                <p class="text-xs text-gray-600 truncate flex items-center gap-1">
                                  {room.last_message === 'Image' && <LuImage class="w-3 h-3 flex-shrink-0" />}
                                  {(room.last_message === 'GIF' || room.last_message === '🎬 GIF') && <LuFilm class="w-3 h-3 flex-shrink-0" />}
                                  {(room.last_message === 'Voice message' || room.last_message === '🎵 Voice message') && <LuMic class="w-3 h-3 flex-shrink-0" />}
                                  <span class="truncate">{room.last_message || "No messages yet"}</span>
                                </p>
                                <div class="flex items-center gap-2 flex-shrink-0">
                                  <div class="flex items-center gap-1 text-xs text-gray-500">
                                    <LuUsers class="w-3 h-3" />
                                    <span>{room.member_count || 0}</span>
                                  </div>
                                  {room.unread_count > 0 && (
                                    <span class="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                                      {room.unread_count}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Chats Section */}
              {sortedChats.value.length > 0 && (
                <div>
                  <div class="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <div class="flex items-center gap-2">
                      <LuMessageSquare class="w-4 h-4 text-pink-600" />
                      <h3 class="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Chats ({sortedChats.value.length})
                      </h3>
                    </div>
                  </div>
                  <div class="divide-y divide-gray-100">
                    {sortedChats.value.map((chat) => {
                      const isActive = currentChatId === chat.session_id;
                      return (
                        <div
                          key={chat.session_id}
                          onClick$={() => handleChatClick(chat)}
                          class={`px-4 py-3 hover:bg-pink-50 cursor-pointer transition-colors ${
                            isActive ? "bg-pink-100 border-l-4 border-pink-600" : ""
                          }`}
                        >
                          <div class="flex items-start gap-3">
                            {/* User Avatar */}
                            <div class="flex-shrink-0 relative">
                              <div
                                class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 bg-white shadow-sm"
                                style={`color: ${getGenderBorderColor(chat.other_user_gender)}; border-color: ${getGenderBorderColor(chat.other_user_gender)};`}
                              >
                                {chat.other_user_name.charAt(0).toUpperCase()}
                              </div>
                              {chat.other_user_online && (
                                <span class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                              )}
                            </div>

                            {/* Chat Info */}
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center justify-between gap-2 mb-1">
                                <span
                                  class={`font-medium text-sm truncate ${getGenderColor(chat.other_user_gender)}`}
                                >
                                  {chat.other_user_name}
                                </span>
                                {chat.last_message_time && (
                                  <span class="text-xs text-gray-500 flex-shrink-0">
                                    {formatTime(chat.last_message_time)}
                                  </span>
                                )}
                              </div>
                              <div class="flex items-center justify-between gap-2">
                                <p class="text-xs text-gray-600 truncate flex items-center gap-1">
                                  {chat.last_message === 'Image' && <LuImage class="w-3 h-3 flex-shrink-0" />}
                                  {(chat.last_message === 'GIF' || chat.last_message === '🎬 GIF') && <LuFilm class="w-3 h-3 flex-shrink-0" />}
                                  {(chat.last_message === 'Voice message' || chat.last_message === '🎵 Voice message') && <LuMic class="w-3 h-3 flex-shrink-0" />}
                                  <span class="truncate">{chat.last_message || "No messages yet"}</span>
                                </p>
                                {chat.unread_count > 0 && (
                                  <span class="bg-pink-600 text-white text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                                    {chat.unread_count}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {sortedRooms.value.length === 0 && sortedChats.value.length === 0 && !loading && (
                <div class="flex flex-col items-center justify-center py-12 px-4">
                  <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <LuMessageSquare class="w-8 h-8 text-gray-400" />
                  </div>
                  <p class="text-sm text-gray-600 text-center mb-1">No conversations yet</p>
                  <p class="text-xs text-gray-400 text-center">
                    Start chatting or join a room to get started
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
});