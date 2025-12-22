import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import { useAuth } from "../../../../context/auth";
import { roomsApi } from "../../../../api/rooms";
import { friendsApi } from "../../../../api/friends";
import { 
  LuSend, 
  LuUsers, 
  LuTrash2, 
  LuLogOut,
  LuAlertCircle,
  LuCheckCircle,
  LuClock,
  LuMessageSquare,
  LuUser,
  LuUserPlus,
  LuBan,
  LuLock,
  LuReply,
  LuX
} from '@qwikest/icons/lucide';

export default component$(() => {
  const location = useLocation();
  const nav = useNavigate();
  const auth = useAuth();
  
  const roomId = location.params.roomId;
  
  // Room state
  const room = useSignal(null);
  const messages = useSignal([]);
  const members = useSignal([]);
  const newMessage = useSignal("");
  const loading = useSignal(true);
  const error = useSignal("");
  const successMessage = useSignal("");
  const hasJoined = useSignal(false);
  const timeLeft = useSignal(null);
  const showMembers = useSignal(false);
  
  // User interaction state
  const selectedUser = useSignal(null);
  const showUserMenu = useSignal(false);
  const replyingTo = useSignal(null);
  const secretReplyTo = useSignal(null);

  // Format time left
  const formatTimeLeft = (ms) => {
    if (!ms || ms <= 0) return "Expired";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Load room data
  const loadRoomData = $(async () => {
    try {
      const [roomData, messagesData, membersData] = await Promise.all([
        roomsApi.getRoom(roomId),
        roomsApi.getMessages(roomId),
        roomsApi.getMembers(roomId)
      ]);

      room.value = roomData.room;
      messages.value = messagesData.messages || [];
      members.value = membersData.members || [];

      hasJoined.value = members.value.some(m => m.user_id === auth.user.value?.id);

      if (room.value.will_expire) {
        timeLeft.value = room.value.time_left_ms;
      }

      loading.value = false;
    } catch (err) {
      error.value = err.message;
      loading.value = false;
    }
  });

  // Countdown timer
  useVisibleTask$(async ({ cleanup }) => {
    await loadRoomData();

    const interval = setInterval(() => {
      if (room.value?.will_expire && timeLeft.value > 0) {
        timeLeft.value = Math.max(0, timeLeft.value - 1000);
        
        if (timeLeft.value <= 0) {
          alert("This room has been deleted.");
          nav("/rooms");
        }
      }
    }, 1000);

    const messageInterval = setInterval(async () => {
      try {
        const messagesData = await roomsApi.getMessages(roomId);
        messages.value = messagesData.messages || [];
      } catch (err) {
        console.error("Failed to refresh messages:", err);
      }
    }, 3000);

    cleanup(() => {
      clearInterval(interval);
      clearInterval(messageInterval);
    });
  });

  // Join room
  const handleJoinRoom = $(async () => {
    try {
      await roomsApi.joinRoom(roomId);
      hasJoined.value = true;
      await loadRoomData();
    } catch (err) {
      error.value = err.message;
    }
  });

  // Leave room
  const handleLeaveRoom = $(async () => {
    try {
      await roomsApi.leaveRoom(roomId);
      nav("/rooms");
    } catch (err) {
      error.value = err.message;
    }
  });

  // Send message
  const handleSendMessage = $(async () => {
    if (!newMessage.value.trim()) return;

    try {
      let messageContent = newMessage.value;
      
      if (replyingTo.value) {
        messageContent = `@${replyingTo.value.username}: ${messageContent}`;
        replyingTo.value = null;
      }

      await roomsApi.sendMessage(roomId, messageContent);
      newMessage.value = "";
      
      const messagesData = await roomsApi.getMessages(roomId);
      messages.value = messagesData.messages || [];
    } catch (err) {
      error.value = err.message;
    }
  });

  const handleSendSecretReply = $(async () => {
    if (!newMessage.value.trim() || !secretReplyTo.value) return;

    try {
      await roomsApi.sendMessage(roomId, newMessage.value, 'secret', secretReplyTo.value.user_id);
      
      newMessage.value = "";
      secretReplyTo.value = null;
      
      const messagesData = await roomsApi.getMessages(roomId);
      messages.value = messagesData.messages || [];
    } catch (err) {
      error.value = err.message;
    }
  });

  const handleKeyPress = $((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      secretReplyTo.value ? handleSendSecretReply() : handleSendMessage();
    }
  });

  // Delete room
  const handleDeleteRoom = $(async () => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    try {
      await roomsApi.deleteRoom(roomId);
      nav("/rooms");
    } catch (err) {
      error.value = err.message;
    }
  });

  // User interaction handlers
  const handleUserClick = $((userId, username) => {
    if (userId === auth.user.value?.id) return;
    
    selectedUser.value = { user_id: userId, username };
    showUserMenu.value = true;
  });

  const handleSendFriendRequest = $(async () => {
    if (auth.user.value?.is_guest) {
      error.value = "Guest users cannot send friend requests";
      showUserMenu.value = false;
      return;
    }

    try {
      await friendsApi.sendRequest(selectedUser.value.user_id);
      successMessage.value = "Friend request sent!";
      setTimeout(() => successMessage.value = "", 3000);
      showUserMenu.value = false;
    } catch (err) {
      error.value = err.message;
      showUserMenu.value = false;
    }
  });

  const handleDirectMessage = $(async () => {
    const userId = selectedUser.value.user_id;
    const username = selectedUser.value.username;
    showUserMenu.value = false;
    await nav(`/chat?user=${userId}&name=${username}`);
  });

  const handleSecretReply = $(async () => {
    secretReplyTo.value = selectedUser.value;
    showUserMenu.value = false;
  });

  const handleBlockUser = $(async () => {
    if (auth.user.value?.is_guest) {
      error.value = "Guest users cannot block users";
      showUserMenu.value = false;
      return;
    }

    if (!confirm(`Are you sure you want to block ${selectedUser.value.username}?`)) {
      showUserMenu.value = false;
      return;
    }

    try {
      await friendsApi.blockUser(selectedUser.value.user_id);
      successMessage.value = "User blocked";
      setTimeout(() => successMessage.value = "", 3000);
      showUserMenu.value = false;
    } catch (err) {
      error.value = err.message;
      showUserMenu.value = false;
    }
  });

  const handleReplyTo = $((message) => {
    replyingTo.value = {
      username: message.sender_username,
      content: message.content
    };
  });

  const canDelete = auth.user.value?.role === 'admin' || 
                    room.value?.creator_id === auth.user.value?.id;

  return (
    <>
      {loading.value ? (
        <div class="flex items-center justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <div class="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm text-gray-500">Loading room...</p>
          </div>
        </div>
      ) : (
        <div class="flex gap-4 h-[calc(100vh-12rem)]">
          {/* Main Room Area */}
          <div class="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden">
            {/* Room Header */}
            <div class="px-5 py-4 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <h2 class="text-lg font-semibold text-gray-900 truncate">{room.value?.name}</h2>
                  {room.value?.description && (
                    <p class="text-xs text-gray-500 truncate mt-0.5">{room.value.description}</p>
                  )}
                  <p class="text-xs text-gray-400 mt-1">
                    by {room.value?.creator_username}
                  </p>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    onClick$={() => showMembers.value = !showMembers.value}
                    class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <LuUsers class="w-4 h-4" />
                    <span>{members.value.length}</span>
                  </button>

                  {canDelete && (
                    <button
                      onClick$={handleDeleteRoom}
                      class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete room"
                    >
                      <LuTrash2 class="w-4 h-4" />
                    </button>
                  )}

                  {hasJoined.value && (
                    <button
                      onClick$={handleLeaveRoom}
                      class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Leave room"
                    >
                      <LuLogOut class="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Expiry Warning */}
              {room.value?.will_expire && timeLeft.value > 0 && (
                <div class="mt-3 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <LuAlertCircle class="w-4 h-4 text-red-600 flex-shrink-0" />
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium text-red-800">Room closing in:</p>
                    <p class="text-sm font-semibold text-red-900">{formatTimeLeft(timeLeft.value)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Messages */}
            {error.value && (
              <div class="mx-5 mt-3 flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                <LuAlertCircle class="w-5 h-5 text-red-500 flex-shrink-0" />
                <p class="text-sm text-red-600 flex-1">{error.value}</p>
                <button onClick$={() => error.value = ""} class="text-red-400 hover:text-red-600">
                  <LuX class="w-4 h-4" />
                </button>
              </div>
            )}

            {successMessage.value && (
              <div class="mx-5 mt-3 flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                <LuCheckCircle class="w-5 h-5 text-green-500 flex-shrink-0" />
                <p class="text-sm text-green-600">{successMessage.value}</p>
              </div>
            )}

            {!hasJoined.value ? (
              <div class="flex-1 flex items-center justify-center">
                <div class="text-center">
                  <div class="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LuMessageSquare class="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 class="text-base font-medium text-gray-900 mb-1">Join to chat</h3>
                  <p class="text-sm text-gray-500 mb-6">Join this room to start messaging</p>
                  <button
                    onClick$={handleJoinRoom}
                    class="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    Join Room
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Messages Area */}
                <div class="flex-1 overflow-y-auto p-5 space-y-3">
                  {messages.value.length === 0 && (
                    <div class="flex flex-col items-center justify-center py-12">
                      <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <LuMessageSquare class="w-6 h-6 text-gray-400" />
                      </div>
                      <p class="text-sm text-gray-500">No messages yet</p>
                    </div>
                  )}

                  {messages.value.map((msg) => {
                    const isOwn = msg.sender_id === auth.user.value?.id;
                    const isSystem = msg.type === 'system';
                    const isSecret = msg.type === 'secret';

                    if (isSystem) {
                      return (
                        <div key={msg.id} class="flex justify-center">
                          <div class="inline-block bg-yellow-50 text-yellow-800 px-3 py-1.5 rounded-lg text-xs">
                            {msg.content}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} class={`flex items-start gap-2.5 ${isSecret ? 'bg-blue-50 p-3 rounded-lg' : ''}`}>
                        {/* Avatar */}
                        <button
                          onClick$={() => !isOwn && handleUserClick(msg.sender_id, msg.sender_username)}
                          class={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${
                            isOwn ? 'bg-purple-600' : 'bg-blue-600 hover:ring-2 hover:ring-blue-300'
                          }`}
                        >
                          {msg.sender_username.charAt(0).toUpperCase()}
                        </button>

                        <div class="flex-1 min-w-0">
                          {/* Header */}
                          <div class="flex items-center gap-2 mb-1">
                            <button
                              onClick$={() => !isOwn && handleUserClick(msg.sender_id, msg.sender_username)}
                              class={`text-xs font-semibold ${
                                isOwn ? 'text-purple-600' : 'text-blue-600 hover:underline'
                              }`}
                            >
                              {msg.sender_username}
                            </button>
                            {isSecret && (
                              <>
                                <span class="text-xs text-gray-400">→</span>
                                <span class="text-xs font-semibold text-blue-600">{msg.recipient_username}</span>
                                <span class="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                  <LuLock class="w-3 h-3" />
                                  Secret
                                </span>
                              </>
                            )}
                            <span class="text-xs text-gray-400">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Content */}
                          <div class={`inline-block px-3 py-1.5 rounded-lg text-sm ${
                            isSecret ? 'bg-blue-100 border border-blue-200' : 'bg-gray-100'
                          }`}>
                            <p class="text-gray-800">{msg.content}</p>
                          </div>

                          {/* Reply Button */}
                          {!isOwn && !isSecret && (
                            <button
                              onClick$={() => handleReplyTo(msg)}
                              class="flex items-center gap-1 mt-1 text-xs text-gray-500 hover:text-purple-600"
                            >
                              <LuReply class="w-3 h-3" />
                              Reply
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Preview */}
                {(replyingTo.value || secretReplyTo.value) && (
                  <div class="px-5 py-2 bg-purple-50 border-t border-purple-100 flex items-center justify-between">
                    <div class="flex items-center gap-2 text-xs">
                      {secretReplyTo.value ? (
                        <>
                          <LuLock class="w-3 h-3 text-purple-600" />
                          <span class="text-gray-600">Secret reply to</span>
                          <span class="font-semibold text-purple-600">{secretReplyTo.value.username}</span>
                        </>
                      ) : (
                        <>
                          <LuReply class="w-3 h-3 text-purple-600" />
                          <span class="text-gray-600">Replying to</span>
                          <span class="font-semibold text-purple-600">{replyingTo.value.username}</span>
                        </>
                      )}
                    </div>
                    <button
                      onClick$={() => {
                        replyingTo.value = null;
                        secretReplyTo.value = null;
                      }}
                      class="text-gray-400 hover:text-gray-600"
                    >
                      <LuX class="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Input */}
                <div class="px-5 py-4 border-t border-gray-200">
                  <div class="flex items-center gap-2">
                    <input
                      type="text"
                      bind:value={newMessage}
                      onKeyPress$={handleKeyPress}
                      placeholder={secretReplyTo.value ? "Send secret message..." : "Type a message..."}
                      class="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      onClick$={secretReplyTo.value ? handleSendSecretReply : handleSendMessage}
                      class={`p-2 rounded-lg transition-colors ${
                        secretReplyTo.value 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      <LuSend class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Members Sidebar */}
          {showMembers.value && (
            <div class="w-64 bg-white border border-gray-200 rounded-xl p-4 overflow-hidden flex flex-col">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-semibold text-gray-900 flex items-center gap-2">
                  <LuUsers class="w-4 h-4" />
                  Members
                </h3>
                <span class="text-xs text-gray-500">{members.value.length}</span>
              </div>

              <div class="flex-1 overflow-y-auto space-y-2">
                {members.value.map((member) => (
                  <button
                    key={member.id}
                    onClick$={() => member.user_id !== auth.user.value?.id && handleUserClick(member.user_id, member.username)}
                    disabled={member.user_id === auth.user.value?.id}
                    class="w-full flex items-center gap-2.5 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left disabled:cursor-default disabled:hover:bg-transparent"
                  >
                    <div class="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <div class="flex-1 min-w-0">
                      <span class="text-sm font-medium text-gray-900 block truncate">{member.username}</span>
                      <span class={`text-xs flex items-center gap-1 ${member.is_online ? 'text-green-600' : 'text-gray-400'}`}>
                        <div class={`w-1.5 h-1.5 rounded-full ${member.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        {member.is_online ? "Online" : "Offline"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Menu Modal */}
      {showUserMenu.value && selectedUser.value && (
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                {selectedUser.value.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">{selectedUser.value.username}</h3>
              </div>
            </div>

            <div class="space-y-2">
              <button
                onClick$={handleDirectMessage}
                class="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                <LuMessageSquare class="w-4 h-4 text-gray-600" />
                <span>Direct Message</span>
              </button>
              <button
                onClick$={handleSecretReply}
                class="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-blue-50 text-blue-600 rounded-lg transition-colors text-left"
              >
                <LuLock class="w-4 h-4" />
                <span>Secret Reply</span>
              </button>
              {!auth.user.value?.is_guest && (
                <button
                  onClick$={handleSendFriendRequest}
                  class="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                  <LuUserPlus class="w-4 h-4 text-gray-600" />
                  <span>Send Friend Request</span>
                </button>
              )}
              {!auth.user.value?.is_guest && (
                <button
                  onClick$={handleBlockUser}
                  class="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-red-50 text-red-600 rounded-lg transition-colors text-left"
                >
                  <LuBan class="w-4 h-4" />
                  <span>Block User</span>
                </button>
              )}
            </div>

            <button
              onClick$={() => showUserMenu.value = false}
              class="w-full mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
});

export const head = {
  title: "Room Chat - Anonymous Chat",
};
