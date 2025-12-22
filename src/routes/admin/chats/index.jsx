import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { useAuth } from "../../../context/auth";
import { adminApi } from "../../../api/admin";
import { 
  LuSearch, 
  LuRefreshCw, 
  LuMessageSquare, 
  LuTrash2, 
  LuX, 
  LuAlertCircle,
  LuEye,
  LuClock,
  LuCheckCheck,
  LuCircle,
  LuUsers
} from '@qwikest/icons/lucide';

export default component$(() => {
  const auth = useAuth();
  const chats = useSignal([]);
  const loading = useSignal(true);
  const error = useSignal(null);
  const selectedChat = useSignal(null);
  const messages = useSignal([]);
  const loadingMessages = useSignal(false);
  const searchQuery = useSignal("");

  const isAdminOrMod = auth.user.value?.role === 'admin' || auth.user.value?.role === 'moderator';

  // Load chats
  const loadChats = $(async () => {
    try {
      loading.value = true;
      const data = await adminApi.getChats();
      chats.value = data.chats;
      error.value = null;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  });

  useVisibleTask$(async () => {
    if (isAdminOrMod) {
      await loadChats();
    }
  });

  // Load messages for a chat
  const loadMessages = $(async (sessionId) => {
    try {
      loadingMessages.value = true;
      const data = await adminApi.getChatMessages(sessionId);
      messages.value = data.messages;
    } catch (err) {
      alert(`Error loading messages: ${err.message}`);
    } finally {
      loadingMessages.value = false;
    }
  });

  // View chat messages
  const handleViewChat = $(async (chat) => {
    selectedChat.value = chat;
    await loadMessages(chat.id);
  });

  // Delete message
  const handleDeleteMessage = $(async (messageId) => {
    if (!confirm("Delete this message?")) return;

    try {
      await adminApi.deleteMessage(messageId);
      await loadMessages(selectedChat.value.id);
      alert("Message deleted");
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  });

  // Delete chat
  const handleDeleteChat = $(async (chatId) => {
    if (!confirm("Delete entire chat session? This will delete all messages!")) return;

    try {
      await adminApi.deleteChat(chatId);
      selectedChat.value = null;
      await loadChats();
      alert("Chat deleted");
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  });

  // Filter chats based on search
  const filteredChats = chats.value.filter((chat) => {
    const searchLower = searchQuery.value.toLowerCase();
    return (
      chat.user1_name.toLowerCase().includes(searchLower) ||
      chat.user2_name.toLowerCase().includes(searchLower) ||
      chat.last_message?.toLowerCase().includes(searchLower)
    );
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
          <h1 class="text-2xl font-semibold text-gray-900">Chats</h1>
          <p class="text-sm text-gray-500 mt-1">Monitor and moderate private conversations</p>
        </div>
        <button
          onClick$={loadChats}
          class="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LuRefreshCw class="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div class="relative">
        <LuSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search chats by username or message..."
          value={searchQuery.value}
          onInput$={(e) => (searchQuery.value = e.target.value)}
          class="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Error State */}
      {error.value && (
        <div class="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-lg">
          <LuAlertCircle class="w-5 h-5 text-red-500 flex-shrink-0" />
          <p class="text-sm text-red-600">{error.value}</p>
        </div>
      )}

      {/* Chats List */}
      {loading.value ? (
        <div class="flex items-center justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <div class="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm text-gray-500">Loading chats...</p>
          </div>
        </div>
      ) : filteredChats.length === 0 ? (
        <div class="flex flex-col items-center justify-center py-20">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <LuMessageSquare class="w-8 h-8 text-gray-400" />
          </div>
          <h3 class="text-base font-medium text-gray-900">No chats found</h3>
          <p class="text-sm text-gray-500 mt-1">
            {searchQuery.value ? "Try adjusting your search" : "No chat sessions exist yet"}
          </p>
        </div>
      ) : (
        <div class="grid grid-cols-1 gap-3">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              class="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-purple-200 transition-all"
            >
              <div class="flex items-start justify-between gap-4">
                {/* Chat Info */}
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <LuUsers class="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <h3 class="font-semibold text-gray-900 truncate">
                      {chat.user1_name} <span class="text-gray-400">↔</span> {chat.user2_name}
                    </h3>
                  </div>
                  
                  <p class="text-sm text-gray-600 truncate mb-2">
                    {chat.last_message || "No messages yet"}
                  </p>
                  
                  <div class="flex items-center gap-4 text-xs text-gray-500">
                    <span class="flex items-center gap-1">
                      <LuMessageSquare class="w-3 h-3" />
                      {chat.msg_count} messages
                    </span>
                    <span class="flex items-center gap-1">
                      <LuClock class="w-3 h-3" />
                      {new Date(chat.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div class="flex items-center gap-2">
                  <button
                    onClick$={() => handleViewChat(chat)}
                    class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View messages"
                  >
                    <LuEye class="w-4 h-4" />
                  </button>
                  <button
                    onClick$={() => handleDeleteChat(chat.id)}
                    class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete chat"
                  >
                    <LuTrash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Messages Modal */}
      {selectedChat.value && (
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div class="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <LuUsers class="w-5 h-5 text-gray-400" />
                  <h2 class="text-xl font-semibold text-gray-900">
                    {selectedChat.value.user1_name} <span class="text-gray-400">↔</span> {selectedChat.value.user2_name}
                  </h2>
                </div>
                <p class="text-sm text-gray-500">
                  {messages.value.length} messages in this conversation
                </p>
              </div>
              <button
                onClick$={() => {
                  selectedChat.value = null;
                  messages.value = [];
                }}
                class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LuX class="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div class="flex-1 overflow-y-auto px-6 py-5">
              {loadingMessages.value ? (
                <div class="flex items-center justify-center py-12">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <p class="text-sm text-gray-500">Loading messages...</p>
                  </div>
                </div>
              ) : messages.value.length === 0 ? (
                <div class="flex flex-col items-center justify-center py-12">
                  <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <LuMessageSquare class="w-8 h-8 text-gray-400" />
                  </div>
                  <p class="text-sm text-gray-500">No messages in this chat</p>
                </div>
              ) : (
                <div class="space-y-3">
                  {messages.value.map((msg) => (
                    <div
                      key={msg.id}
                      class="group p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div class="flex items-start justify-between mb-2">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="text-sm font-semibold text-purple-600">
                            {msg.sender_name}
                          </span>
                          <span class="text-xs text-gray-400 flex items-center gap-1">
                            <LuClock class="w-3 h-3" />
                            {new Date(msg.created_at).toLocaleDateString()} at {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span class={`text-xs px-2 py-0.5 rounded ${
                            msg.type === "secret" 
                              ? "bg-orange-50 text-orange-600" 
                              : "bg-gray-200 text-gray-600"
                          }`}>
                            {msg.type}
                          </span>
                          {msg.is_read ? (
                            <span class="text-xs text-green-600 flex items-center gap-1">
                              <LuCheckCheck class="w-3 h-3" />
                              Read
                            </span>
                          ) : (
                            <span class="text-xs text-gray-400 flex items-center gap-1">
                              <LuCircle class="w-3 h-3" />
                              Unread
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
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div class="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick$={() => handleDeleteChat(selectedChat.value.id)}
                class="w-full px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <LuTrash2 class="w-4 h-4" />
                Delete Entire Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
