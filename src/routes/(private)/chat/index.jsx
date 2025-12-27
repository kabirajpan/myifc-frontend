import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import { useAuth } from "../../../context/auth";
import { useChatContext } from "../../../store/chat.store";
import { useUserContext } from "../../../store/user.store";
import { chatApi } from "../../../api/chat-enhanced";
import { authApi } from "../../../api/auth";
import { friendsApi } from "../../../api/friends";
import { wsService } from "../../../api/websocket";
import { ChatContainer } from "../../../components/chat/ChatContainer.jsx";
import { ChatSidebar } from "../../../components/chat/ChatSidebar.jsx";
import { UserList } from "../../../components/chat/UserList.jsx";
import { ImageViewer } from "../../../components/ui/ImageViewer.jsx";
import { LuUserPlus, LuBan } from "@qwikest/icons/lucide";

// User Menu Component
export const UserMenu = component$(
  ({
    showUserMenu,
    userMenuPosition,
    selectedUser,
    auth,
    onClose,
    onSendFriendRequest,
    onBlockUser,
  }) => {
    if (!showUserMenu || !selectedUser) return null;

    return (
      <>
        <div class="fixed inset-0 z-50" onClick$={onClose} />
        <div
          class="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[160px]"
          style={`top: ${userMenuPosition.top}px; left: ${userMenuPosition.left}px;`}
        >
          {!auth.user.value?.is_guest && (
            <>
              <button
                onClick$={onSendFriendRequest}
                class="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors text-left"
              >
                <LuUserPlus class="w-3.5 h-3.5 text-gray-600" />
                <span>Add Friend</span>
              </button>
              <button
                onClick$={onBlockUser}
                class="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-50 text-red-600 transition-colors text-left"
              >
                <LuBan class="w-3.5 h-3.5" />
                <span>Block User</span>
              </button>
            </>
          )}
        </div>
      </>
    );
  },
);

const buildImageViewerData = (messages) => {
  return messages
    .filter(m => m.type === 'image' || m.type === 'gif')
    .map(m => ({
      id: m.id,
      url: m.content,
      sender_username: m.sender_username,
      sender_gender: m.sender_gender,
      caption: m.caption,
      created_at: m.created_at,
      reactions: m.reactions || [],
    }));
};

const findImageIndex = (images, messageId) => {
  return images.findIndex(img => img.id === messageId);
};

export default component$(() => {
  const location = useLocation();
  const nav = useNavigate();
  const auth = useAuth();

  // Use stores
  const chat = useChatContext();
  const users = useUserContext();

  const otherUserId = location.url.searchParams.get("user");
  const otherUserName = location.url.searchParams.get("name");

  // Local UI state
  const selectedUser = useSignal(null);
  const showUserMenu = useSignal(false);
  const userMenuPosition = useSignal({ top: 0, left: 0 });

  // Load chats and setup WebSocket
  const loadChats = $(async () => {
    try {
      const sessionsData = await chatApi.getSessions();
      chat.state.chatList = sessionsData.chats || [];

      const usersData = await authApi.getOnlineUsers();
      users.state.onlineUsers = (usersData.users || []).filter((u) => u.id !== auth.user.value?.id);
    } catch (err) {
      chat.state.error = err.message;
    }
  });

  const loadMessages = $(async (sessionId) => {
    try {
      const messagesData = await chatApi.getMessages(sessionId);
      chat.state.messages = (messagesData.messages || []).map((msg) => ({
        ...msg,
        isOwn: msg.sender_id === auth.user.value?.id,
      }));

      if (chat.state.messages.length > 0) {
        const otherUserMessage = chat.state.messages.find((m) => !m.isOwn);
        if (otherUserMessage?.sender_gender) {
          chat.state.otherUserGender = otherUserMessage.sender_gender;
        }
      }

      await chatApi.markAsRead(sessionId);
    } catch (err) {
      chat.state.error = err.message;
    }
  });

  // Update chat list item without full reload
  const updateChatListItem = $((messageData) => {
    const sessionId = messageData.session_id;
    const message = messageData.message;

    const existingChatIndex = chat.state.chatList.findIndex(
      c => c.session_id === sessionId
    );

    if (existingChatIndex !== -1) {
      const updatedChats = [...chat.state.chatList];
      const chatItem = updatedChats[existingChatIndex];

      let lastMessage = message.content;
      if (message.type === 'image') lastMessage = 'Image';
      else if (message.type === 'gif') lastMessage = 'GIF';
      else if (message.type === 'audio') lastMessage = 'Voice message';
      else if (message.caption) lastMessage = message.caption;

      updatedChats[existingChatIndex] = {
        ...chatItem,
        last_message: lastMessage,
        last_message_time: message.created_at,
        unread_count: message.sender_id === auth.user.value?.id
          ? chatItem.unread_count
          : chatItem.unread_count + 1
      };

      updatedChats.sort((a, b) =>
        (b.last_message_time || 0) - (a.last_message_time || 0)
      );

      chat.state.chatList = updatedChats;
    } else {
      loadChats();
    }
  });

  // Update own chat list when sending a message
  const updateOwnChatList = $((messageContent, messageType, caption) => {
    if (!chat.state.currentSessionId) return;

    const chatIndex = chat.state.chatList.findIndex(
      c => c.session_id === chat.state.currentSessionId
    );

    if (chatIndex === -1) return;

    const updatedChats = [...chat.state.chatList];
    const chatItem = updatedChats[chatIndex];

    let lastMessage = messageContent;
    if (messageType === 'image') lastMessage = caption || 'Image';
    else if (messageType === 'gif') lastMessage = caption || 'GIF';
    else if (messageType === 'audio') lastMessage = caption || 'Voice message';

    updatedChats[chatIndex] = {
      ...chatItem,
      last_message: lastMessage,
      last_message_time: Date.now(),
      unread_count: 0
    };

    updatedChats.sort((a, b) =>
      (b.last_message_time || 0) - (a.last_message_time || 0)
    );

    chat.state.chatList = updatedChats;
  });

  // Initialize
  useVisibleTask$(async ({ cleanup }) => {
    try {
      chat.state.loading = true;
      wsService.connect();

      const unsubscribe = wsService.onMessage((data) => {
        if (data.type === "new_message") {
          if (data.data.session_id === chat.state.currentSessionId) {
            const newMsg = {
              ...data.data.message,
              isOwn: data.data.message.sender_id === auth.user.value?.id,
            };

            const exists = chat.state.messages.some(m => m.id === newMsg.id);
            if (!exists) {
              chat.state.messages = [...chat.state.messages, newMsg];

              if (chat.state.imageViewer.isBuilt && (newMsg.type === 'image' || newMsg.type === 'gif')) {
                chat.state.imageViewer.images = [
                  ...chat.state.imageViewer.images,
                  {
                    id: newMsg.id,
                    url: newMsg.content,
                    sender_username: newMsg.sender_username,
                    sender_gender: newMsg.sender_gender,
                    caption: newMsg.caption,
                    created_at: newMsg.created_at,
                    reactions: newMsg.reactions || [],
                  }
                ];
              }
            }

            if (!newMsg.isOwn && newMsg.sender_gender) {
              chat.state.otherUserGender = newMsg.sender_gender;
            }

            if (!newMsg.isOwn) {
              chatApi.markAsRead(chat.state.currentSessionId).then(() => {
                chat.state.chatList = chat.state.chatList.map(c =>
                  c.session_id === chat.state.currentSessionId
                    ? { ...c, unread_count: 0 }
                    : c
                );
              });
            }
          }

          updateChatListItem(data.data);
        }

        if (data.type === "message_read") {
          chat.state.messages = chat.state.messages.map(m =>
            m.id === data.message_id ? { ...m, is_read: true } : m
          );
        }

        if (data.type === "user_online" || data.type === "user_offline") {
          users.state.onlineUsers = data.users || [];
        }
      });

      await loadChats();

      if (otherUserId) {
        const sessionData = await chatApi.createSession(otherUserId);
        chat.state.currentSessionId = sessionData.session.id;
        await loadMessages(chat.state.currentSessionId);
        chat.showChatList.value = false;
      }

      chat.state.loading = false;

      return () => {
        unsubscribe();
        wsService.disconnect();
      };
    } catch (err) {
      chat.state.error = err.message;
      chat.state.loading = false;
    }
  });

  const handleSendMessage = $(async ({ content, type, caption }) => {
    if (!chat.state.currentSessionId) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      sender_id: auth.user.value.id,
      sender_username: auth.user.value.username,
      sender_gender: auth.user.value.gender,
      content: content,
      type: type,
      caption: caption,
      created_at: new Date().toISOString(),
      isOwn: true,
      is_read: false,
      sending: true,
      reply_to_message_id: chat.state.replyingTo?.id || null,
      ...(chat.state.replyingTo && {
        reply_to_message_content: chat.state.replyingTo.content,
        reply_to_message_sender: chat.state.replyingTo.username,
        reply_to_message_gender: chat.state.replyingTo.gender,
        reply_to_message_time: chat.state.replyingTo.created_at,
        reply_to_message_type: chat.state.replyingTo.type || "text",
        reply_to_message_caption: chat.state.replyingTo.caption || null,
      }),
    };

    chat.state.messages = [...chat.state.messages, tempMessage];

    const replyId = chat.state.replyingTo?.id || null;
    chat.state.replyingTo = null;

    try {
      const messageData = await chatApi.sendMessage(
        chat.state.currentSessionId,
        content,
        type,
        replyId,
        caption
      );

      chat.state.messages = chat.state.messages.map(m =>
        m.id === tempId ? { ...messageData.data, isOwn: true } : m
      );

      updateOwnChatList(content, type, caption);

      chat.state.successMessage = type === 'text' ? "Message sent!" : `${type.charAt(0).toUpperCase() + type.slice(1)} sent!`;
      setTimeout(() => (chat.state.successMessage = null), 3000);
    } catch (err) {
      chat.state.messages = chat.state.messages.filter(m => m.id !== tempId);
      chat.state.error = err.message || 'Failed to send message';
    }
  });

  const handleChatSelect = $(async (chatItem) => {
    try {
      chat.state.imageViewer.isOpen = false;
      chat.state.imageViewer.images = [];
      chat.state.imageViewer.currentIndex = 0;
      chat.state.imageViewer.isBuilt = false;

      chat.state.loading = true;
      chat.state.currentSessionId = chatItem.session_id;

      if (chatItem.other_user_gender) {
        chat.state.otherUserGender = chatItem.other_user_gender;
      }

      await loadMessages(chatItem.session_id);
      await nav(`/chat?user=${chatItem.other_user_id}&name=${chatItem.other_user_name}`);

      chat.showChatList.value = false;
      chat.state.loading = false;
    } catch (err) {
      chat.state.error = err.message;
      chat.state.loading = false;
    }
  });

  const handleUsernameClick = $((message) => {
    if (message.sender_id === auth.user.value?.id) return;

    let contentForReply = message.content;
    if (message.type === 'image' || message.type === 'gif') {
      contentForReply = message.caption || 'Image';
    } else if (message.type === 'audio') {
      contentForReply = message.caption || 'Voice message';
    }

    chat.state.replyingTo = {
      id: message.id,
      username: message.sender_username,
      content: contentForReply,
      gender: message.sender_gender,
      created_at: message.created_at,
      type: message.type,
      caption: message.caption,
    };
  });

  const handleDeleteMessage = $(async (messageId) => {
    if (!confirm("Delete this media? This cannot be undone.")) return;

    try {
      chat.state.deletingMessageId = messageId;
      await chatApi.deleteMessage(messageId);
      chat.state.messages = chat.state.messages.filter((m) => m.id !== messageId);
      chat.state.successMessage = "Media deleted";
      setTimeout(() => (chat.state.successMessage = null), 3000);
    } catch (err) {
      chat.state.error = err.message;
    } finally {
      chat.state.deletingMessageId = null;
    }
  });

  const handleSendFriendRequest = $(async () => {
    if (auth.user.value?.is_guest) {
      chat.state.error = "Guest users cannot send friend requests";
      showUserMenu.value = false;
      return;
    }

    try {
      await friendsApi.sendRequest(selectedUser.value.user_id);
      chat.state.successMessage = "Friend request sent!";
      setTimeout(() => (chat.state.successMessage = null), 3000);
      showUserMenu.value = false;
    } catch (err) {
      chat.state.error = err.message;
      showUserMenu.value = false;
    }
  });

  const handleBlockUser = $(async () => {
    if (auth.user.value?.is_guest) {
      chat.state.error = "Guest users cannot block users";
      showUserMenu.value = false;
      return;
    }

    if (!confirm(`Are you sure you want to block ${selectedUser.value.username}?`)) {
      showUserMenu.value = false;
      return;
    }

    try {
      await friendsApi.blockUser(selectedUser.value.user_id);
      chat.state.successMessage = "User blocked";
      setTimeout(() => (chat.state.successMessage = null), 3000);
      showUserMenu.value = false;
    } catch (err) {
      chat.state.error = err.message;
      showUserMenu.value = false;
    }
  });

  const currentSession = chat.state.chatList.find(
    c => c.session_id === chat.state.currentSessionId
  );

  return (
    <div class="fixed inset-0 top-16 flex flex-col sm:flex-row sm:gap-3 sm:p-3 bg-gray-50 sm:bg-transparent">
      {/* Chat Sidebar */}
      <div class={`${chat.showChatList.value ? "flex" : "hidden"} sm:flex`}>
        <ChatSidebar
          mode="dm"
          items={chat.state.chatList}
          currentItemId={chat.state.currentSessionId}
          searchQuery={chat.state.searchQuery}
          loading={chat.state.loading}
          onSearchChange={$((q) => (chat.state.searchQuery = q))}
          onItemSelect={handleChatSelect}
          showSecondaryAction={false}
        />
      </div>

      {/* Chat Container */}
      <div class={`${!chat.showChatList.value ? "flex" : "hidden"} sm:flex flex-1`}>
        <ChatContainer
          mode="dm"
          currentChat={currentSession}
          messages={chat.state.messages}
          currentUserId={auth.user.value?.id}
          otherUserGender={chat.state.otherUserGender}
          onBack={$(() => (chat.showChatList.value = true))}
          onShowUsers={$(() => (chat.showOnlineUsers.value = !chat.showOnlineUsers.value))}
          onSendMessage={handleSendMessage}
          onMessageClick={$((id) => (chat.selectedMessageId.value = chat.selectedMessageId.value === id ? null : id))}
          onUsernameClick={handleUsernameClick}
          onDeleteMessage={handleDeleteMessage}
          onImageClick={$((messageId, url) => {
            if (!chat.state.imageViewer.isBuilt) {
              chat.state.imageViewer.images = buildImageViewerData(chat.state.messages);
              chat.state.imageViewer.isBuilt = true;
            }
            const index = findImageIndex(chat.state.imageViewer.images, messageId);
            if (index !== -1) {
              chat.state.imageViewer.currentIndex = index;
              chat.state.imageViewer.isOpen = true;
            }
          })}
          selectedMessageId={chat.selectedMessageId.value}
          deletingMessageId={chat.state.deletingMessageId}
          replyingTo={chat.state.replyingTo}
          onCancelReply={$(() => (chat.state.replyingTo = null))}
          successMessage={chat.state.successMessage}
          error={chat.state.error}
          onClearError={$(() => (chat.state.error = null))}
          onClearSuccess={$(() => (chat.state.successMessage = null))}
          headerAction={
            <button
              onClick$={(e) => {
                if (otherUserId === auth.user.value?.id) return;
                const rect = e.target.getBoundingClientRect();
                userMenuPosition.value = { top: rect.bottom + 5, left: rect.left };
                selectedUser.value = { 
                  user_id: otherUserId, 
                  username: otherUserName, 
                  gender: chat.state.otherUserGender 
                };
                showUserMenu.value = true;
              }}
              class="text-xs text-gray-600 hover:text-gray-900"
            >
              •••
            </button>
          }
        />
      </div>

      {/* Online Users Sidebar */}
      {chat.showOnlineUsers.value && (
        <UserList
          isOpen={chat.showOnlineUsers.value}
          onClose={$(() => (chat.showOnlineUsers.value = false))}
          users={users.state.onlineUsers}
          currentUserId={auth.user.value?.id}
          mode="dm"
          title="Online Now"
          onUserAction={$(async (user) => {
            chat.showOnlineUsers.value = false;
            await nav(`/chat?user=${user.id}&name=${user.username}`);
            window.location.reload();
          })}
        />
      )}

      {/* User Menu */}
      <UserMenu
        showUserMenu={showUserMenu.value}
        userMenuPosition={userMenuPosition.value}
        selectedUser={selectedUser.value}
        auth={auth}
        onClose={$(() => (showUserMenu.value = false))}
        onSendFriendRequest={handleSendFriendRequest}
        onBlockUser={handleBlockUser}
      />

      {/* Image Viewer */}
      <ImageViewer
        imageUrl={
          chat.state.imageViewer.isOpen && chat.state.imageViewer.images[chat.state.imageViewer.currentIndex]
            ? chat.state.imageViewer.images[chat.state.imageViewer.currentIndex].url
            : null
        }
        isOpen={chat.state.imageViewer.isOpen}
        onClose={$(() => {
          chat.state.imageViewer.isOpen = false;
        })}
        messageData={
          chat.state.imageViewer.isOpen && chat.state.imageViewer.images[chat.state.imageViewer.currentIndex]
            ? chat.state.imageViewer.images[chat.state.imageViewer.currentIndex]
            : null
        }
        onPrevious={$(() => {
          if (chat.state.imageViewer.currentIndex > 0) {
            chat.state.imageViewer.currentIndex--;
          }
        })}
        onNext={$(() => {
          if (chat.state.imageViewer.currentIndex < chat.state.imageViewer.images.length - 1) {
            chat.state.imageViewer.currentIndex++;
          }
        })}
        hasPrevious={chat.state.imageViewer.currentIndex > 0}
        hasNext={chat.state.imageViewer.currentIndex < chat.state.imageViewer.images.length - 1}
        onReact={$(async (messageId, emoji) => {
          try {
            await chatApi.reactToMessage(messageId, emoji);
            chat.state.messages = chat.state.messages.map(m => {
              if (m.id === messageId) {
                const reactions = m.reactions || [];
                return { ...m, reactions: [...reactions, { id: Date.now(), emoji, user_id: auth.user.value.id }] };
              }
              return m;
            });
            const imgIndex = chat.state.imageViewer.currentIndex;
            const currentImg = chat.state.imageViewer.images[imgIndex];
            if (currentImg) {
              const reactions = currentImg.reactions || [];
              chat.state.imageViewer.images[imgIndex] = {
                ...currentImg,
                reactions: [...reactions, { id: Date.now(), emoji, user_id: auth.user.value.id }]
              };
            }
            chat.state.successMessage = "Reaction added!";
            setTimeout(() => (chat.state.successMessage = null), 2000);
          } catch (err) {
            chat.state.error = err.message || "Failed to add reaction";
          }
        })}
        onReport={$(async (messageId, reason, details) => {
          try {
            await chatApi.reportMessage(messageId, reason, details);
            chat.state.successMessage = "Report submitted successfully";
            setTimeout(() => (chat.state.successMessage = null), 3000);
          } catch (err) {
            chat.state.error = err.message || "Failed to submit report";
          }
        })}
        onShare={$(async (messageId) => {
          try {
            const result = await chatApi.generateShareLink(messageId);
            if (result.share_url) {
              await navigator.clipboard.writeText(result.share_url);
              chat.state.successMessage = "Share link copied!";
            } else {
              const currentImg = chat.state.imageViewer.images[chat.state.imageViewer.currentIndex];
              await navigator.clipboard.writeText(currentImg.url);
              chat.state.successMessage = "Image URL copied!";
            }
            setTimeout(() => (chat.state.successMessage = null), 2000);
          } catch (err) {
            chat.state.error = "Failed to generate share link";
          }
        })}
      />
    </div>
  );
});

export const head = {
  title: "Chat",
};