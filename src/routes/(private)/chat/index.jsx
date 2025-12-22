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
  LuCheck,
  LuArrowLeft,
  LuMenu,
  LuSmile,
  LuImage
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
  const showChatList = useSignal(true); // For mobile view
  const loading = useSignal(true);
  const error = useSignal("");
  const chatList = useSignal([]);
  const onlineUsers = useSignal([]);
  const searchQuery = useSignal("");
  const messageContainerRef = useSignal(null);
  
  // Auto-scroll to bottom when messages change
  useVisibleTask$(({ track }) => {
    track(() => messages.value);
    
    if (messageContainerRef.value) {
      messageContainerRef.value.scrollTop = messageContainerRef.value.scrollHeight;
    }
  });
  
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
        // FIX: Map messages with isOwn property
        messages.value = (messagesData.messages || []).map(msg => ({
          ...msg,
          isOwn: msg.sender_id === auth.user.value?.id
        }));
        
        await chatApi.markAsRead(currentSessionId.value);
        showChatList.value = false; // Show chat view on mobile
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
      
      showChatList.value = false; // Switch to chat view on mobile
      loading.value = false;
    } catch (err) {
      error.value = err.message;
      loading.value = false;
    }
  });

  const handleStartChat = $(async (user) => {
    showOnlineUsers.value = false;
    await nav(`/chat?user=${user.id}&name=${user.username}`);
    window.location.reload();
  });

  const handleBackToList = $(() => {
    showChatList.value = true;
  });

  // Filter chat list
  const filteredChats = chatList.value.filter((chat) => {
    return chat.other_user_name.toLowerCase().includes(searchQuery.value.toLowerCase());
  });

  const onlineUsersCount = onlineUsers.value.length;

  return (
    <div class="fixed inset-0 top-16 flex flex-col sm:flex-row sm:gap-3 sm:p-3 bg-gray-50 sm:bg-transparent">
      {/* Mobile/Tablet: Chat List OR Chat View (toggle) */}
      {/* Desktop: Always show both */}
      
      {/* Chat List Sidebar - Hidden on mobile when chat is open */}
      <div class={`${showChatList.value ? 'flex' : 'hidden'} sm:flex w-full sm:w-72 lg:w-80 bg-white sm:border sm:border-gray-200 sm:rounded-lg flex-col overflow-hidden h-full`}>
        {/* Sidebar Header */}
        <div class="px-3 py-3 border-b border-gray-200">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-base font-semibold text-gray-900">Messages</h2>
            <span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {chatList.value.length}
            </span>
          </div>
          
          {/* Search */}
          <div class="relative">
            <LuSearch class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery.value}
              onInput$={(e) => (searchQuery.value = e.target.value)}
              class="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Chat List */}
        <div class="flex-1 overflow-y-auto">
          {loading.value && chatList.value.length === 0 && (
            <div class="flex items-center justify-center py-8">
              <div class="text-center">
                <div class="w-6 h-6 border-2 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                <p class="text-xs text-gray-500">Loading...</p>
              </div>
            </div>
          )}
          
          {!loading.value && filteredChats.length === 0 && (
            <div class="flex flex-col items-center justify-center py-8 px-3">
              <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <LuMessageSquare class="w-5 h-5 text-gray-400" />
              </div>
              <p class="text-xs text-gray-500 text-center">
                {searchQuery.value ? "No chats found" : "No conversations yet"}
              </p>
            </div>
          )}
          
          <div class="divide-y divide-gray-100">
            {filteredChats.map((chat) => (
              <div
                key={chat.session_id}
                onClick$={() => handleChatSelect(chat)}
                class={`px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors ${
                  currentSessionId.value === chat.session_id ? 'bg-pink-50' : ''
                }`}
              >
                <div class="flex items-start gap-2">
                  {/* Avatar */}
                  <div class="relative flex-shrink-0">
                    <div class="w-9 h-9 bg-gradient-to-br from-pink-600 to-pink-800 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {chat.other_user_name.charAt(0).toUpperCase()}
                    </div>
                    {chat.other_user_online && (
                      <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  
                  {/* Chat Info */}
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-0.5">
                      <span class="font-medium text-gray-900 text-xs truncate">
                        {chat.other_user_name}
                      </span>
                      <span class="text-xs text-gray-500 flex-shrink-0 ml-1">
                        {formatTime(chat.last_message_time)}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <p class="text-xs text-gray-600 truncate flex-1">
                        {chat.last_message || 'No messages'}
                      </p>
                      {chat.unread_count > 0 && (
                        <span class="ml-1 bg-pink-600 text-white text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
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

      {/* Main Chat Area - Hidden on mobile when list is showing */}
      <div class={`${!showChatList.value ? 'flex' : 'hidden'} sm:flex flex-1 bg-white sm:border sm:border-gray-200 sm:rounded-lg flex-col overflow-hidden h-full`}>
        {!currentSessionId.value ? (
          <div class="flex-1 flex items-center justify-center p-4">
            <div class="text-center">
              <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <LuMessageSquare class="w-6 h-6 text-gray-400" />
              </div>
              <h3 class="text-sm font-medium text-gray-900 mb-1">No chat selected</h3>
              <p class="text-xs text-gray-500">Choose a conversation to start</p>
            </div>
          </div>
        ) : (
          <div class="flex flex-col h-full">
            {/* Chat Header - Fixed at top */}
            <div class="flex-shrink-0 px-3 py-2.5 border-b border-gray-200 flex items-center justify-between bg-white">
              <div class="flex items-center gap-2">
                {/* Back button - Mobile only */}
                <button
                  onClick$={handleBackToList}
                  class="sm:hidden p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                  aria-label="Back to chats"
                >
                  <LuArrowLeft class="w-4 h-4" />
                </button>
                
                <div class="w-8 h-8 bg-gradient-to-br from-pink-600 to-pink-800 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {otherUserName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 class="font-semibold text-gray-900 text-sm">{otherUserName || 'Chat'}</h2>
                  <p class="text-xs text-gray-500">Direct message</p>
                </div>
              </div>
              
              <button
                onClick$={() => (showOnlineUsers.value = !showOnlineUsers.value)}
                class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LuUsers class="w-3.5 h-3.5" />
                <span>{onlineUsersCount}</span>
              </button>
            </div>

            {/* Error Message */}
            {error.value && (
              <div class="flex-shrink-0 mx-3 mt-2 flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded-lg">
                <LuAlertCircle class="w-4 h-4 text-red-500 flex-shrink-0" />
                <p class="text-xs text-red-600">{error.value}</p>
              </div>
            )}

            {/* Messages Area - Scrollable with ref for auto-scroll */}
            <div 
              ref={messageContainerRef}
              class="flex-1 overflow-y-auto p-3 space-y-3"
            >
              {loading.value && messages.value.length === 0 && (
                <div class="flex items-center justify-center py-8">
                  <div class="text-center">
                    <div class="w-6 h-6 border-2 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                    <p class="text-xs text-gray-500">Loading...</p>
                  </div>
                </div>
              )}
              
              {!loading.value && messages.value.length === 0 && (
                <div class="flex flex-col items-center justify-center py-8">
                  <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <LuMessageSquare class="w-5 h-5 text-gray-400" />
                  </div>
                  <p class="text-xs text-gray-500">No messages yet</p>
                  <p class="text-xs text-gray-400 mt-0.5">Start the conversation!</p>
                </div>
              )}
              
              {messages.value.map((msg) => (
                <div
                  key={msg.id}
                  class={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div class="max-w-[75%] sm:max-w-xs lg:max-w-md">
                    {!msg.isOwn && (
                      <p class="text-xs text-gray-500 mb-0.5 px-2">{msg.sender_username}</p>
                    )}
                    <div
                      class={`px-3 py-2 rounded-2xl text-xs ${
                        msg.isOwn
                          ? 'bg-pink-600 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-900 rounded-bl-md'
                      }`}
                    >
                      <p class="leading-relaxed">{msg.content}</p>
                    </div>
                    <div class="flex items-center gap-1 mt-0.5 px-2">
                      <LuClock class="w-2.5 h-2.5 text-gray-400" />
                      <p class="text-xs text-gray-500">{formatTime(msg.created_at)}</p>
                      {msg.isOwn && msg.is_read && (
                        <LuCheck class="w-2.5 h-2.5 text-pink-600 ml-0.5" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input - Fixed at bottom */}
<div class="flex-shrink-0 px-3 py-2.5 border-t border-gray-200 bg-white mb-2">
  <div class="flex items-end gap-2">
    <div class="flex-1 relative flex items-center border border-gray-200 rounded-lg focus-within:ring-1 focus-within:ring-pink-500 focus-within:border-transparent">
      <input
        type="text"
        bind:value={newMessage}
        onKeyPress$={handleKeyPress}
        placeholder="Type a message..."
        class="flex-1 px-3 py-2 text-xs focus:outline-none rounded-lg"
      />
      
      {/* Emoji Button */}
      <button
        class="p-2 text-gray-400 hover:text-pink-600 transition-colors"
        aria-label="Add emoji"
      >
        <LuSmile class="w-4 h-4" />
      </button>
      
      {/* Image Button */}
      <button
        class="p-2 text-gray-400 hover:text-pink-600 transition-colors"
        aria-label="Add image"
      >
        <LuImage class="w-4 h-4" />
      </button>
    </div>
    
    <button
      onClick$={handleSendMessage}
      disabled={!newMessage.value.trim()}
      class="px-3 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
    >
      <LuSend class="w-3.5 h-3.5" />
      <span class="text-xs font-medium hidden sm:inline">Send</span>
    </button>
  </div>
</div>
          </div>
        )}
      </div>

      {/* Online Users Sidebar - Overlay on mobile/tablet */}
      {showOnlineUsers.value && (
        <>
          {/* Mobile/Tablet Overlay */}
          <div 
            class="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick$={() => (showOnlineUsers.value = false)}
          />
          
          {/* Sidebar */}
          <div class="fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 lg:relative lg:w-64 lg:border lg:border-gray-200 lg:rounded-lg p-3 overflow-hidden flex flex-col">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold text-gray-900 text-sm flex items-center gap-2">
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
                <p class="text-xs text-gray-500">No one online</p>
              </div>
            )}
            
            <div class="flex-1 overflow-y-auto space-y-2">
              {onlineUsers.value.map((user) => (
                <div
                  key={user.id}
                  class="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div class="flex items-center gap-2">
                    <div class="relative">
                      <div class="w-8 h-8 bg-gradient-to-br from-pink-600 to-pink-800 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                    </div>
                    <div>
                      <span class="text-xs font-medium text-gray-900 block">
                        {user.username}
                      </span>
                      <span class="text-xs text-gray-500">
                        {user.is_guest ? 'Guest' : 'User'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick$={() => handleStartChat(user)}
                    class="p-1.5 text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                    title="Start chat"
                  >
                    <LuMessageSquare class="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
});

export const head = {
  title: "Chat",
};
