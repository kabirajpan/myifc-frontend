import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import { useAuth } from "../../../context/auth";
import { chatApi } from "../../../api/chat";
import { authApi } from "../../../api/auth";
import { wsService } from "../../../api/websocket";
import { 
  LuMessageSquare, 
  LuSend, 
  LuUsers,
  LuSearch,
  LuAlertCircle,
  LuX,
  LuClock,
  LuCheck
} from '@qwikest/icons/lucide';

export default component$(() => {
  const location = useLocation();
  const nav = useNavigate();
  const auth = useAuth();
  
  const otherUserId = location.url.searchParams.get("user");
  const otherUserName = location.url.searchParams.get("name");
  
  const currentSessionId = useSignal(null);
  const messages = useSignal([]);
  const newMessage = useSignal("");
  const showOnlineUsers = useSignal(false);
  const loading = useSignal(true);
  const error = useSignal("");
  const chatList = useSignal([]);
  const onlineUsers = useSignal([]);
  const searchQuery = useSignal("");
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  useVisibleTask$(async () => {
    try {
      loading.value = true;
      
      wsService.connect();
      
      const unsubscribe = wsService.onMessage((data) => {
        if (data.type === 'new_message') {
          if (data.data.session_id === currentSessionId.value) {
            messages.value = [
              ...messages.value,
              {
                ...data.data.message,
                isOwn: false
              }
            ];
            
            chatApi.markAsRead(currentSessionId.value);
          }
          
          chatApi.getSessions().then(sessionsData => {
            chatList.value = sessionsData.chats || [];
          });
        }
      });
      
      const sessionsData = await chatApi.getSessions();
      chatList.value = sessionsData.chats || [];
      
      const usersData = await authApi.getOnlineUsers();
      onlineUsers.value = (usersData.users || []).filter(
        u => u.id !== auth.user.value?.id
      );
      
      if (otherUserId) {
        const sessionData = await chatApi.createSession(otherUserId);
        currentSessionId.value = sessionData.session.id;
        
        const messagesData = await chatApi.getMessages(currentSessionId.value);
        messages.value = messagesData.messages || [];
        
        await chatApi.markAsRead(currentSessionId.value);
      }
      
      loading.value = false;
      
      return () => {
        unsubscribe();
        wsService.disconnect();
      };
    } catch (err) {
      error.value = err.message;
      loading.value = false;
    }
  });

  const handleSendMessage = $(async () => {
    if (!newMessage.value.trim() || !currentSessionId.value) return;

    try {
      const messageData = await chatApi.sendMessage(
        currentSessionId.value,
        newMessage.value
      );
      
      messages.value = [
        ...messages.value,
        {
          id: messageData.data.id,
          sender_id: auth.user.value.id,
          sender_username: auth.user.value.username,
          content: messageData.data.content,
          created_at: messageData.data.created_at,
          isOwn: true,
        }
      ];
      
      newMessage.value = "";
      
      const sessionsData = await chatApi.getSessions();
      chatList.value = sessionsData.chats || [];
    } catch (err) {
      error.value = err.message;
    }
  });

  const handleKeyPress = $((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  const handleChatSelect = $(async (chat) => {
    try {
      loading.value = true;
      currentSessionId.value = chat.session_id;
      
      const messagesData = await chatApi.getMessages(chat.session_id);
      messages.value = (messagesData.messages || []).map(msg => ({
        ...msg,
        isOwn: msg.sender_id === auth.user.value.id
      }));
      
      await chatApi.markAsRead(chat.session_id);
      await nav(`/chat?user=${chat.other_user_id}&name=${chat.other_user_name}`);
      
      loading.value = false;
    } catch (err) {
      error.value = err.message;
      loading.value = false;
    }
  });

  const handleStartChat = $(async (user) => {
    await nav(`/chat?user=${user.id}&name=${user.username}`);
    window.location.reload();
  });

  // Filter chat list
  const filteredChats = chatList.value.filter((chat) => {
    return chat.other_user_name.toLowerCase().includes(searchQuery.value.toLowerCase());
  });

  const onlineUsersCount = onlineUsers.value.length;

  return (
    <div class="flex gap-4 h-[calc(100vh-10rem)]">
      {/* Chat List Sidebar */}
      <div class="w-80 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden">
        {/* Sidebar Header */}
        <div class="px-4 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-semibold text-gray-900">Messages</h2>
            <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
              {chatList.value.length}
            </span>
          </div>
          
          {/* Search */}
          <div class="relative">
            <LuSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery.value}
              onInput$={(e) => (searchQuery.value = e.target.value)}
              class="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Chat List */}
        <div class="flex-1 overflow-y-auto">
          {loading.value && chatList.value.length === 0 && (
            <div class="flex items-center justify-center py-12">
              <div class="text-center">
                <div class="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p class="text-sm text-gray-500">Loading chats...</p>
              </div>
            </div>
          )}
          
          {!loading.value && filteredChats.length === 0 && (
            <div class="flex flex-col items-center justify-center py-12 px-4">
              <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <LuMessageSquare class="w-6 h-6 text-gray-400" />
              </div>
              <p class="text-sm text-gray-500 text-center">
                {searchQuery.value ? "No chats found" : "No conversations yet"}
              </p>
            </div>
          )}
          
          <div class="divide-y divide-gray-100">
            {filteredChats.map((chat) => (
              <div
                key={chat.session_id}
                onClick$={() => handleChatSelect(chat)}
                class={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                  currentSessionId.value === chat.session_id ? 'bg-purple-50' : ''
                }`}
              >
                <div class="flex items-start gap-3">
                  {/* Avatar */}
                  <div class="relative flex-shrink-0">
                    <div class="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                      {chat.other_user_name.charAt(0).toUpperCase()}
                    </div>
                    {chat.other_user_online && (
                      <span class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  
                  {/* Chat Info */}
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                      <span class="font-medium text-gray-900 text-sm truncate">
                        {chat.other_user_name}
                      </span>
                      <span class="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatTime(chat.last_message_time)}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <p class="text-xs text-gray-600 truncate flex-1">
                        {chat.last_message || 'No messages'}
                      </p>
                      {chat.unread_count > 0 && (
                        <span class="ml-2 bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                          {chat.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div class="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden">
        {!currentSessionId.value ? (
          <div class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LuMessageSquare class="w-8 h-8 text-gray-400" />
              </div>
              <h3 class="text-base font-medium text-gray-900 mb-1">No chat selected</h3>
              <p class="text-sm text-gray-500">Choose a conversation to start messaging</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div class="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                  {otherUserName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 class="font-semibold text-gray-900">{otherUserName || 'Chat'}</h2>
                  <p class="text-xs text-gray-500">Direct message</p>
                </div>
              </div>
              
              <button
                onClick$={() => (showOnlineUsers.value = !showOnlineUsers.value)}
                class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LuUsers class="w-4 h-4" />
                <span>{onlineUsersCount}</span>
              </button>
            </div>

            {/* Error Message */}
            {error.value && (
              <div class="mx-4 mt-3 flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                <LuAlertCircle class="w-5 h-5 text-red-500 flex-shrink-0" />
                <p class="text-sm text-red-600">{error.value}</p>
              </div>
            )}

            {/* Messages Area */}
            <div class="flex-1 overflow-y-auto p-5 space-y-4">
              {loading.value && messages.value.length === 0 && (
                <div class="flex items-center justify-center py-12">
                  <div class="text-center">
                    <div class="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p class="text-sm text-gray-500">Loading messages...</p>
                  </div>
                </div>
              )}
              
              {!loading.value && messages.value.length === 0 && (
                <div class="flex flex-col items-center justify-center py-12">
                  <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <LuMessageSquare class="w-6 h-6 text-gray-400" />
                  </div>
                  <p class="text-sm text-gray-500">No messages yet</p>
                  <p class="text-xs text-gray-400 mt-1">Start the conversation!</p>
                </div>
              )}
              
              {messages.value.map((msg) => (
                <div
                  key={msg.id}
                  class={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div class="max-w-xs lg:max-w-md">
                    {!msg.isOwn && (
                      <p class="text-xs text-gray-500 mb-1 px-3">{msg.sender_username}</p>
                    )}
                    <div
                      class={`px-4 py-2.5 rounded-2xl text-sm ${
                        msg.isOwn
                          ? 'bg-purple-600 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-900 rounded-bl-md'
                      }`}
                    >
                      <p class="leading-relaxed">{msg.content}</p>
                    </div>
                    <div class="flex items-center gap-1 mt-1 px-3">
                      <LuClock class="w-3 h-3 text-gray-400" />
                      <p class="text-xs text-gray-500">{formatTime(msg.created_at)}</p>
                      {msg.isOwn && msg.is_read && (
                        <LuCheck class="w-3 h-3 text-purple-600 ml-1" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div class="px-5 py-4 border-t border-gray-200">
              <div class="flex items-end gap-2">
                <input
                  type="text"
                  bind:value={newMessage}
                  onKeyPress$={handleKeyPress}
                  placeholder="Type a message..."
                  class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none"
                />
                <button
                  onClick$={handleSendMessage}
                  disabled={!newMessage.value.trim()}
                  class="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <LuSend class="w-4 h-4" />
                  <span class="text-sm font-medium">Send</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Online Users Sidebar */}
      {showOnlineUsers.value && (
        <div class="w-72 bg-white border border-gray-200 rounded-xl p-4 overflow-hidden flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-900 flex items-center gap-2">
              <LuUsers class="w-4 h-4" />
              Online Now
            </h3>
            <button
              onClick$={() => (showOnlineUsers.value = false)}
              class="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              <LuX class="w-4 h-4" />
            </button>
          </div>
          
          {onlineUsers.value.length === 0 && (
            <div class="flex-1 flex items-center justify-center">
              <p class="text-sm text-gray-500">No one online</p>
            </div>
          )}
          
          <div class="flex-1 overflow-y-auto space-y-2">
            {onlineUsers.value.map((user) => (
              <div
                key={user.id}
                class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="relative">
                    <div class="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                  </div>
                  <div>
                    <span class="text-sm font-medium text-gray-900 block">
                      {user.username}
                    </span>
                    <span class="text-xs text-gray-500">
                      {user.is_guest ? 'Guest' : 'User'}
                    </span>
                  </div>
                </div>
                <button
                  onClick$={() => handleStartChat(user)}
                  class="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Start chat"
                >
                  <LuMessageSquare class="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export const head = {
  title: "Chat",
};
