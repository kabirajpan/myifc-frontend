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
          class="fixed inset-0 bg-black/30 z-40"
          onClick$={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        class={`fixed top-0 left-0 h-full bg-white shadow-lg z-50 transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style="width: 280px;"
      >
        {/* Header */}
        <div class="flex items-center justify-between px-3 py-2 border-b border-gray-200">
          <h2 class="text-sm font-semibold text-gray-900">Messages</h2>
          <button
            onClick$={onClose}
            class="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close sidebar"
          >
            <LuX class="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div class="h-[calc(100%-45px)] overflow-y-auto">
          {loading && rooms.length === 0 && chats.length === 0 ? (
            <div class="flex items-center justify-center py-8">
              <div class="text-center">
                <div class="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p class="text-xs text-gray-500">Loading...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Rooms Section */}
              {sortedRooms.value.length > 0 && (
                <div class="mb-3">
                  <div class="px-3 py-1.5 bg-gray-50">
                    <div class="flex items-center gap-1.5">
                      <LuHash class="w-3 h-3 text-purple-600" />
                      <h3 class="text-xs font-medium text-gray-600">
                        Rooms ({sortedRooms.value.length})
                      </h3>
                    </div>
                  </div>
                  <div>
                    {sortedRooms.value.map((room) => {
                      const isActive = currentRoomId === room.id;
                      return (
                        <div
                          key={room.id}
                          onClick$={() => handleRoomClick(room)}
                          class={`px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors ${
                            isActive ? "bg-purple-50 border-l-2 border-purple-600" : ""
                          }`}
                        >
                          <div class="flex items-center gap-2">
                            {/* Room Icon */}
                            <div class="flex-shrink-0">
                              <div class="w-7 h-7 rounded bg-purple-600 flex items-center justify-center">
                                <LuHash class="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>

                            {/* Room Info */}
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center justify-between gap-1 mb-0.5">
                                <span class="font-medium text-xs text-gray-900 truncate">
                                  {room.name}
                                </span>
                                {room.last_message_time && (
                                  <span class="text-[10px] text-gray-400 flex-shrink-0">
                                    {formatTime(room.last_message_time)}
                                  </span>
                                )}
                              </div>
                              <div class="flex items-center justify-between gap-1">
                                <p class="text-[10px] text-gray-500 truncate flex items-center gap-1">
                                  {room.last_message === 'Image' && <LuImage class="w-2.5 h-2.5 flex-shrink-0" />}
                                  {(room.last_message === 'GIF' || room.last_message === '🎬 GIF') && <LuFilm class="w-2.5 h-2.5 flex-shrink-0" />}
                                  {(room.last_message === 'Voice message' || room.last_message === '🎵 Voice message') && <LuMic class="w-2.5 h-2.5 flex-shrink-0" />}
                                  <span class="truncate">{room.last_message || "No messages"}</span>
                                </p>
                                <div class="flex items-center gap-1.5 flex-shrink-0">
                                  <div class="flex items-center gap-0.5 text-[10px] text-gray-400">
                                    <LuUsers class="w-2.5 h-2.5" />
                                    <span>{room.member_count || 0}</span>
                                  </div>
                                  {room.unread_count > 0 && (
                                    <span class="bg-purple-600 text-white text-[10px] px-1 py-0.5 rounded-full font-medium min-w-[16px] text-center">
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
                  <div class="px-3 py-1.5 bg-gray-50">
                    <div class="flex items-center gap-1.5">
                      <LuMessageSquare class="w-3 h-3 text-pink-600" />
                      <h3 class="text-xs font-medium text-gray-600">
                        Chats ({sortedChats.value.length})
                      </h3>
                    </div>
                  </div>
                  <div>
                    {sortedChats.value.map((chat) => {
                      const isActive = currentChatId === chat.session_id;
                      return (
                        <div
                          key={chat.session_id}
                          onClick$={() => handleChatClick(chat)}
                          class={`px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors ${
                            isActive ? "bg-pink-50 border-l-2 border-pink-600" : ""
                          }`}
                        >
                          <div class="flex items-center gap-2">
                            {/* User Avatar */}
                            <div class="flex-shrink-0 relative">
                              <div
                                class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium border bg-white"
                                style={`color: ${getGenderBorderColor(chat.other_user_gender)}; border-color: ${getGenderBorderColor(chat.other_user_gender)};`}
                              >
                                {chat.other_user_name.charAt(0).toUpperCase()}
                              </div>
                              {chat.other_user_online && (
                                <span class="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
                              )}
                            </div>

                            {/* Chat Info */}
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center justify-between gap-1 mb-0.5">
                                <span
                                  class={`font-medium text-xs truncate ${getGenderColor(chat.other_user_gender)}`}
                                >
                                  {chat.other_user_name}
                                </span>
                                {chat.last_message_time && (
                                  <span class="text-[10px] text-gray-400 flex-shrink-0">
                                    {formatTime(chat.last_message_time)}
                                  </span>
                                )}
                              </div>
                              <div class="flex items-center justify-between gap-1">
                                <p class="text-[10px] text-gray-500 truncate flex items-center gap-1">
                                  {chat.last_message === 'Image' && <LuImage class="w-2.5 h-2.5 flex-shrink-0" />}
                                  {(chat.last_message === 'GIF' || chat.last_message === '🎬 GIF') && <LuFilm class="w-2.5 h-2.5 flex-shrink-0" />}
                                  {(chat.last_message === 'Voice message' || chat.last_message === '🎵 Voice message') && <LuMic class="w-2.5 h-2.5 flex-shrink-0" />}
                                  <span class="truncate">{chat.last_message || "No messages"}</span>
                                </p>
                                {chat.unread_count > 0 && (
                                  <span class="bg-pink-600 text-white text-[10px] px-1 py-0.5 rounded-full font-medium min-w-[16px] text-center flex-shrink-0">
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
                <div class="flex flex-col items-center justify-center py-8 px-3">
                  <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <LuMessageSquare class="w-5 h-5 text-gray-400" />
                  </div>
                  <p class="text-xs text-gray-600 text-center mb-0.5">No conversations</p>
                  <p class="text-[10px] text-gray-400 text-center">
                    Start chatting or join a room
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