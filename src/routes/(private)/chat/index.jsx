import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import { useAuth } from "../../../context/auth";
import { useChatContext } from "../../../store/chat.store";
import { useUserContext } from "../../../store/user.store";
import { chatApi } from "../../../api/chat-enhanced";
import { authApi } from "../../../api/auth";
import { friendsApi } from "../../../api/friends";
import { wsService } from "../../../api/websocket";
import { MediaUpload, MediaPreview } from "../../../components/ui/MediaUpload.jsx";
import { ImageViewer } from "../../../components/ui/ImageViewer.jsx";
import { EmojiPicker } from "../../../components/ui/EmojiPicker.jsx";
import { getGenderColor, getGenderBorderColor, formatTime } from "../../../utils/helpers";
import { mediaApi } from "../../../api/media.js";

import {
  LuMessageSquare,
  LuSend,
  LuUsers,
  LuSearch,
  LuAlertCircle,
  LuX,
  LuCheck,
  LuArrowLeft,
  LuSmile,
  LuReply,
  LuCheckCircle,
  LuUserPlus,
  LuBan,
  LuCornerUpLeft,
  LuTrash2,
  LuDownload,
  LuPlay,
  LuPause,
  LuImage,
  LuFilm,
  LuMic,
} from "@qwikest/icons/lucide";

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

// MessageBubble component
export const MessageBubble = component$(
  ({
    msg,
    isOwn,
    showTime,
    onMessageClick,
    onUsernameClick,
    onDeleteMessage,
    onImageClick,
    deletingMessageId,
  }) => {
    const hasReply = msg.reply_to_message_id && msg.reply_to_message_content;
    const isMediaMessage = ["image", "gif", "audio"].includes(msg.type);
    const audioRef = useSignal(null);
    const isPlaying = useSignal(false);

    const toggleAudio = $(() => {
      if (!audioRef.value) return;
      if (isPlaying.value) {
        audioRef.value.pause();
        isPlaying.value = false;
      } else {
        audioRef.value.play();
        isPlaying.value = true;
      }
    });

    const renderMediaContent = () => {
      if (msg.type === "image" || msg.type === "gif") {
        return (
          <div class="mb-2">
            {/* ✅ Button bar above image */}
            <div class="flex items-center gap-2 mb-2">
              <button
                onClick$={() => onImageClick(msg.id, msg.content)}
                class="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                title="View full size"
              >
                <LuImage class="w-3 h-3" />
                <span>View</span>
              </button>

              {!isOwn && (
                <button
                  class="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors flex items-center gap-1"
                  title="Report"
                >
                  <LuAlertCircle class="w-3 h-3" />
                  <span>Report</span>
                </button>
              )}

              {isOwn && (
                <button
                  onClick$={() => onDeleteMessage(msg.id)}
                  disabled={deletingMessageId === msg.id}
                  class="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                  title="Delete"
                >
                  {deletingMessageId === msg.id ? (
                    <div class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <LuTrash2 class="w-3 h-3" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              )}
            </div>


            {/* ✅ Image aligned: right if isOwn, left if receiver */}
            <div class={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <img
                src={msg.content}
                alt={msg.type}
                class="max-w-[150px] max-h-[100px] rounded-lg shadow-sm cursor-pointer hover:opacity-90 transition-opacity object-cover"
                onClick$={() => onImageClick(msg.id, msg.content)}
              />
            </div>
          </div>
        );
      }

      if (msg.type === "audio") {
        return (
          <div class="mb-2">
            {/* ✅ Caption on TOP */}
            {msg.caption && (
              <p class="text-sm text-gray-700 mb-2">{msg.caption}</p>
            )}
            <div class="flex items-center gap-2 bg-gray-100 rounded-lg p-2 max-w-xs">
              <button
                onClick$={toggleAudio}
                class="p-2 bg-pink-600 text-white rounded-full hover:bg-pink-700 transition-colors"
              >
                {isPlaying.value ? <LuPause class="w-4 h-4" /> : <LuPlay class="w-4 h-4" />}
              </button>
              <audio
                ref={audioRef}
                src={msg.content}
                onEnded$={() => (isPlaying.value = false)}
                class="hidden"
              />
              <span class="text-xs text-gray-600">Audio message</span>

              <a
                href={msg.content}
                download
                class="ml-auto p-1.5 text-gray-600 hover:text-pink-600 transition-colors"
                onClick$={(e) => e.stopPropagation()}
              >
                <LuDownload class="w-4 h-4" />
              </a>
            </div>
          </div>
        );
      }
      return null;
    };

    return (
      <div key={msg.id} class="group">
        {isOwn ? (
          <div class="flex items-start justify-end gap-2 px-2 py-1.5 hover:bg-gray-50 rounded">
            <div class="flex-1 min-w-0 flex flex-col items-end gap-1">
              {hasReply && (
                <div class={`w-full max-w-[80%] sm:max-w-[65%] md:max-w-[50%] lg:max-w-[40%] xl:max-w-[30%] ${isOwn ? 'bg-pink-50 border-l-2 border-pink-300' : 'bg-gray-100 border-l-2 border-gray-300'} rounded-r p-1.5 mb-1`}>
                  <div class="flex items-start gap-1.5">
                    <LuCornerUpLeft class={`w-3 h-3 ${isOwn ? 'text-pink-500' : 'text-gray-500'} mt-0.5 flex-shrink-0`} />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-1.5 mb-0.5">
                        <div class={`text-xs font-medium ${getGenderColor(msg.reply_to_message_gender)}`}>
                          {msg.reply_to_message_sender}
                        </div>
                        <div class="text-xs text-gray-500">{formatTime(msg.reply_to_message_time)}</div>
                      </div>
                      {/* ✅ Show media type icon for media replies */}
                      {(msg.reply_to_message_type === 'image' || msg.reply_to_message_type === 'gif') && (
                        <div class="flex items-center gap-1 mb-0.5">
                          <LuImage class="w-3 h-3 text-gray-500" />
                          <span class="text-xs text-gray-700">Image</span>
                        </div>
                      )}
                      {msg.reply_to_message_type === 'audio' && (
                        <div class="flex items-center gap-1 mb-0.5">
                          <LuMic class="w-3 h-3 text-gray-500" />
                          <span class="text-xs text-gray-700">Voice message</span>
                        </div>
                      )}
                      {/* ✅ Show caption if available */}
                      {msg.reply_to_message_caption && (
                        <p class="text-xs text-gray-700">{msg.reply_to_message_caption}</p>
                      )}
                      {/* ✅ Show text content for text messages */}
                      {msg.reply_to_message_type === 'text' && (
                        <p class="text-xs text-gray-700 truncate">{msg.reply_to_message_content}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div class="flex items-start gap-2 justify-end">
                {/* Time on the left */}
                {showTime && (
                  <span class="text-xs text-gray-500 flex-shrink-0 self-end">
                    {formatTime(msg.created_at)}
                  </span>
                )}

                <div class="flex-1 min-w-0">
                  {/* Message text only - no username */}
                  {msg.type === "text" && (
                    <span
                      onClick$={() => onMessageClick(msg.id)}
                      class="text-sm text-gray-900 cursor-pointer break-words whitespace-pre-wrap inline-block text-right w-full"
                    >
                      {msg.content}
                    </span>
                  )}

                  {/* Media caption only - no username */}
                  {isMediaMessage && msg.caption && (
                    <span class="text-sm text-gray-900 break-words whitespace-pre-wrap inline-block text-right w-full">
                      {msg.caption}
                    </span>
                  )}
                </div>

                {/* Avatar on right */}
                <div class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[12px] font-semibold border-2 bg-white border-pink-600 text-pink-600 cursor-default mt-0.5">
                  {msg.sender_username?.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* ✅ Media AFTER username (without caption since it's shown above) */}
              {isMediaMessage && renderMediaContent()}
            </div>
          </div>
        ) : (
          <div class="flex items-start gap-2 px-2 py-1.5 hover:bg-gray-50 rounded">

            <div class="flex-1 min-w-0 flex flex-col gap-1">
              {hasReply && (
                <div class="w-full max-w-[80%] sm:max-w-[65%] md:max-w-[50%] lg:max-w-[40%] xl:max-w-[30%] bg-gray-100 border-l-2 border-gray-300 rounded-r p-1.5">
                  <div class="flex items-start gap-1.5">
                    <LuCornerUpLeft class="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-1.5 mb-0.5">
                        <div class={`text-xs font-medium ${getGenderColor(msg.reply_to_message_gender)}`}>
                          {msg.reply_to_message_sender}
                        </div>
                        <div class="text-xs text-gray-500">{formatTime(msg.reply_to_message_time)}</div>
                      </div>
                      {/* ✅ Add media type icons for media replies */}
                      {(msg.reply_to_message_type === 'image' || msg.reply_to_message_type === 'gif') && (
                        <div class="flex items-center gap-1 mb-0.5">
                          <LuImage class="w-3 h-3 text-gray-500" />
                          <span class="text-xs text-gray-700">Image</span>
                        </div>
                      )}
                      {msg.reply_to_message_type === 'audio' && (
                        <div class="flex items-center gap-1 mb-0.5">
                          <LuMic class="w-3 h-3 text-gray-500" />
                          <span class="text-xs text-gray-700">Voice message</span>
                        </div>
                      )}
                      {/* ✅ Show caption if available */}
                      {msg.reply_to_message_caption && (
                        <p class="text-xs text-gray-700">{msg.reply_to_message_caption}</p>
                      )}
                      {/* ✅ Show text content for text messages */}
                      {msg.reply_to_message_type === 'text' && (
                        <p class="text-xs text-gray-700 truncate">{msg.reply_to_message_content}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div class="flex items-start gap-2">
                {/* Avatar */}
                <div
                  class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[12px] font-semibold border-2 bg-white mt-0.5"
                  style={`color: ${getGenderBorderColor(msg.sender_gender)}; border-color: ${getGenderBorderColor(msg.sender_gender)};`}
                >
                  {msg.sender_username?.charAt(0).toUpperCase()}
                </div>

                <div class="flex-1 min-w-0">
                  {/* Flexible container */}
                  <div class="flex flex-wrap items-baseline gap-x-1.5">
                    {/* Message text */}
                    {msg.type === "text" && (
                      <span
                        onClick$={() => onMessageClick(msg.id)}
                        class="text-sm text-gray-900 cursor-pointer break-words whitespace-pre-wrap flex-1 min-w-0"
                      >
                        {/* Username with colon */}
                        <button
                          onClick$={() => onUsernameClick(msg)}
                          class={`font-bold text-sm hover:underline flex-shrink-0 ${getGenderColor(msg.sender_gender)}`}
                        >
                          {msg.sender_username}: {" "}
                        </button>
                        {msg.content}
                      </span>
                    )}

                    {/* Media caption */}
                    {isMediaMessage && msg.caption && (
                      <span class="text-sm text-gray-900 break-words whitespace-pre-wrap flex-1 min-w-0">
                        {msg.caption}
                      </span>
                    )}

                    {/* Time on the right */}
                    {showTime && (
                      <span class="text-xs text-gray-500 flex-shrink-0 ml-auto">
                        {formatTime(msg.created_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ✅ Media FIRST for receiver (before username line) */}
              {isMediaMessage && renderMediaContent()}
            </div>
          </div>
        )}
        {isOwn && msg.is_read && (
          <div class="flex justify-end pr-2 mt-0.5">
            <LuCheck class="w-3 h-3 text-pink-600" />
          </div>
        )}
      </div>
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
  const newMessage = useSignal("");
  const messageContainerRef = useSignal(null);
  const showEmojiPicker = useSignal(false);
  const isAtBottom = useSignal(true);
  const previousMessagesLength = useSignal(0);
  const viewerImage = useSignal(null);
  const showImageViewer = useSignal(false);
  const selectedUser = useSignal(null);
  const showUserMenu = useSignal(false);
  const userMenuPosition = useSignal({ top: 0, left: 0 });
  const selectedMedia = useSignal(null); // { file, type, preview, publicId, uploading }

  // Scroll functions
  const scrollToBottom = $(() => {
    if (messageContainerRef.value) {
      messageContainerRef.value.scrollTop = messageContainerRef.value.scrollHeight;
      isAtBottom.value = true;
    }
  });

  const checkIfAtBottom = $(() => {
    if (!messageContainerRef.value) return;
    const container = messageContainerRef.value;
    const threshold = 100;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    isAtBottom.value = distanceFromBottom <= threshold;
  });

  // Auto-scroll on new messages
  useVisibleTask$(({ track }) => {
    track(() => chat.state.messages);
    if (!messageContainerRef.value || chat.state.messages.length === 0) return;

    const isUserScrollingUp = !isAtBottom.value;
    const isNewMessage = chat.state.messages.length > previousMessagesLength.value;
    const isInitialLoad = previousMessagesLength.value === 0;

    if (isInitialLoad || (!isUserScrollingUp && isNewMessage)) {
      scrollToBottom();
    }
    previousMessagesLength.value = chat.state.messages.length;
  });

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

    // Check if chat session exists in list
    const existingChatIndex = chat.state.chatList.findIndex(
      c => c.session_id === sessionId
    );

    if (existingChatIndex !== -1) {
      // Update existing chat
      const updatedChats = [...chat.state.chatList];
      const chatItem = updatedChats[existingChatIndex];

      // Determine last message preview
      let lastMessage = message.content;
      if (message.type === 'image') lastMessage = 'Image';
      else if (message.type === 'gif') lastMessage = 'GIF';
      else if (message.type === 'audio') lastMessage = 'Voice message';
      else if (message.caption) lastMessage = message.caption;

      // Update the chat item
      updatedChats[existingChatIndex] = {
        ...chatItem,
        last_message: lastMessage,
        last_message_time: message.created_at,
        unread_count: message.sender_id === auth.user.value?.id
          ? chatItem.unread_count
          : chatItem.unread_count + 1
      };

      // Sort by most recent
      updatedChats.sort((a, b) =>
        (b.last_message_time || 0) - (a.last_message_time || 0)
      );

      chat.state.chatList = updatedChats;
    } else {
      // New session - reload chat list to get it
      console.log('New session detected, reloading chat list');
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

    // Determine last message preview
    let lastMessage = messageContent;
    if (messageType === 'image') lastMessage = caption || 'Image';
    else if (messageType === 'gif') lastMessage = caption || 'GIF';
    else if (messageType === 'audio') lastMessage = caption || 'Voice message';

    // Update the chat item
    updatedChats[chatIndex] = {
      ...chatItem,
      last_message: lastMessage,
      last_message_time: Date.now(),
      unread_count: 0 // Your own messages don't increase unread
    };

    // Sort by most recent
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
        console.log('📨 WebSocket message received:', data);

        if (data.type === "new_message") {
          console.log('✅ New message event');

          // ✅ ADD THESE 3 LINES:
          console.log('🔍 Current session ID:', chat.state.currentSessionId);
          console.log('🔍 Message session ID:', data.data?.session_id);
          console.log('🔍 Messages count BEFORE:', chat.state.messages.length);

          // Update messages if it's for current session
          if (data.data.session_id === chat.state.currentSessionId) {
            const newMsg = {
              ...data.data.message,
              isOwn: data.data.message.sender_id === auth.user.value?.id,
            };

            const exists = chat.state.messages.some(m => m.id === newMsg.id);
            if (!exists) {
              chat.state.messages = [...chat.state.messages, newMsg];

              // ✅ If image viewer is open and new image arrives, append to viewer array
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

              console.log('🔍 Messages count AFTER:', chat.state.messages.length);

              // Auto-scroll if at bottom
              if (isAtBottom.value) {
                setTimeout(() => scrollToBottom(), 50);
              }
            }

            if (!newMsg.isOwn && newMsg.sender_gender) {
              chat.state.otherUserGender = newMsg.sender_gender;
            }

            // Mark as read if it's the current session and not own message
            if (!newMsg.isOwn) {
              chatApi.markAsRead(chat.state.currentSessionId).then(() => {
                // Update unread count in chat list
                chat.state.chatList = chat.state.chatList.map(c =>
                  c.session_id === chat.state.currentSessionId
                    ? { ...c, unread_count: 0 }
                    : c
                );
              });
            }
          }

          // ✅ IMPORTANT: Update chat list for ALL messages (current session or not)
          updateChatListItem(data.data);
        }

        // Handle other WebSocket events
        if (data.type === "message_read") {
          // Update read status in real-time
          chat.state.messages = chat.state.messages.map(m =>
            m.id === data.message_id ? { ...m, is_read: true } : m
          );
        }

        if (data.type === "user_online" || data.type === "user_offline") {
          // Update online status in real-time
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



  const handleMediaSend = $(async (messageText) => {
    if (!chat.state.currentSessionId) return;
    if (!selectedMedia.value) return;

    if (selectedMedia.value.uploading) {
      chat.state.error = 'Please wait for upload to complete';
      return;
    }

    if (!selectedMedia.value.publicId) {
      chat.state.error = 'Upload failed, please try again';
      selectedMedia.value = null;
      return;
    }

    const mediaType = selectedMedia.value.type;
    const publicId = selectedMedia.value.publicId;
    const caption = messageText && messageText.trim() ? messageText.trim() : null;

    // Create temp message for instant UI update
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      sender_id: auth.user.value.id,
      sender_username: auth.user.value.username,
      sender_gender: auth.user.value.gender,
      content: selectedMedia.value.preview,
      type: mediaType,
      caption: caption,
      created_at: new Date().toISOString(),
      isOwn: true,
      is_read: false,
      sending: true,
      reply_to_message_id: chat.state.replyingTo?.id || null,
      // ✅ Add reply preview data for media messages too
      ...(chat.state.replyingTo && {
        reply_to_message_content: chat.state.replyingTo.content,
        reply_to_message_sender: chat.state.replyingTo.username,
        reply_to_message_gender: chat.state.replyingTo.gender,
        reply_to_message_time: chat.state.replyingTo.created_at,
        reply_to_message_type: chat.state.replyingTo.type || "text",
        reply_to_message_caption: chat.state.replyingTo.caption || null,
      }),
    };

    // Add to UI immediately (instant feedback!)
    chat.state.messages = [...chat.state.messages, tempMessage];

    // Clear inputs
    const replyId = chat.state.replyingTo?.id || null;
    selectedMedia.value = null;
    chat.state.replyingTo = null;
    newMessage.value = "";

    scrollToBottom();

    try {
      // Send to backend
      const messageData = await chatApi.sendMessage(
        chat.state.currentSessionId,
        publicId,
        mediaType,
        replyId,
        caption
      );

      // Replace temp message with real message (with signed URL)
      chat.state.messages = chat.state.messages.map(m =>
        m.id === tempId ? { ...messageData.data, isOwn: true } : m
      );

      updateOwnChatList(publicId, mediaType, caption);

      chat.state.successMessage = `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} sent!`;
      setTimeout(() => (chat.state.successMessage = null), 3000);
    } catch (err) {
      // Remove temp message on error
      chat.state.messages = chat.state.messages.filter(m => m.id !== tempId);
      chat.state.error = err.message || 'Failed to send media';
      console.error('Media send error:', err);
    }
  });

  const handleSendMessage = $(async () => {
    console.log('🔍 Send clicked:', {
      hasMedia: !!selectedMedia.value,
      messageText: newMessage.value,
      trimmed: newMessage.value?.trim(),
      sessionId: chat.state.currentSessionId,
    });

    // Handle media message
    if (selectedMedia.value) {
      await handleMediaSend(newMessage.value);
      return;
    }

    // Validate text message
    const messageText = newMessage.value?.trim();
    if (!messageText) {
      console.log('❌ Empty message');
      return;
    }

    if (!chat.state.currentSessionId) {
      console.log('❌ No session ID');
      chat.state.error = 'No chat session found';
      return;
    }

    // Create temp message
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      sender_id: auth.user.value.id,
      sender_username: auth.user.value.username,
      sender_gender: auth.user.value.gender,
      content: messageText,
      created_at: new Date().toISOString(),
      isOwn: true,
      is_read: false,
      type: "text",
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

    // Add to UI immediately
    chat.state.messages = [...chat.state.messages, tempMessage];

    // Clear input and reply state
    const replyId = chat.state.replyingTo?.id || null;
    chat.state.replyingTo = null;
    newMessage.value = "";

    // Scroll to bottom
    setTimeout(() => scrollToBottom(), 50);

    try {
      // Send to backend
      const messageData = await chatApi.sendMessage(
        chat.state.currentSessionId,
        messageText,
        "text",
        replyId
      );

      // Replace temp message with real one
      chat.state.messages = chat.state.messages.map(m =>
        m.id === tempId ? { ...messageData.data, isOwn: true } : m
      );

      updateOwnChatList(messageText, "text", null);

      console.log('✅ Message sent successfully');
    } catch (err) {
      console.error('❌ Send failed:', err);
      // Remove temp message on error
      chat.state.messages = chat.state.messages.filter(m => m.id !== tempId);
      chat.state.error = err.message || 'Failed to send message';
    }
  });

  const handleKeyPress = $((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  const handleChatSelect = $(async (chatItem) => {
    try {

      // ✅ Reset image viewer when switching chats
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

    // For media messages, use caption if available, otherwise show media type
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

  const filteredChats = chat.state.chatList.filter((c) =>
    c.other_user_name.toLowerCase().includes(chat.state.searchQuery.toLowerCase())
  );

  const getCurrentOtherUserGender = () => {
    if (chat.state.otherUserGender) return chat.state.otherUserGender;
    const onlineUser = users.state.onlineUsers.find((u) => u.id === otherUserId);
    if (onlineUser?.gender) return onlineUser.gender;
    const chatItem = chat.state.chatList.find((c) => c.other_user_id === otherUserId);
    if (chatItem?.other_user_gender) return chatItem.other_user_gender;
    return "";
  };

  const currentOtherUserGender = getCurrentOtherUserGender();

  const renderMessages = () => {
    if (chat.state.messages.length === 0) {
      return (
        <div class="flex flex-col items-center justify-center py-8">
          <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
            <LuMessageSquare class="w-5 h-5 text-gray-400" />
          </div>
          <p class="text-xs text-gray-500">No messages yet</p>
          <p class="text-xs text-gray-400 mt-0.5">Start the conversation!</p>
        </div>
      );
    }

    return chat.state.messages.map((msg) => (
      <MessageBubble
        key={msg.id}
        msg={msg}
        isOwn={msg.isOwn}
        showTime={chat.selectedMessageId.value === msg.id}
        onMessageClick={$((id) => (chat.selectedMessageId.value = chat.selectedMessageId.value === id ? null : id))}
        onUsernameClick={handleUsernameClick}
        onDeleteMessage={handleDeleteMessage}
        onImageClick={$((messageId, url) => {
          // Build image array if not already built
          if (!chat.state.imageViewer.isBuilt) {
            chat.state.imageViewer.images = buildImageViewerData(chat.state.messages);
            chat.state.imageViewer.isBuilt = true;
          }

          // Find and set current image
          const index = findImageIndex(chat.state.imageViewer.images, messageId);
          if (index !== -1) {
            chat.state.imageViewer.currentIndex = index;
            chat.state.imageViewer.isOpen = true;
          }
        })}
        deletingMessageId={chat.state.deletingMessageId}
      />
    ));
  };

  return (
    <div class="fixed inset-0 top-16 flex flex-col sm:flex-row sm:gap-3 sm:p-3 bg-gray-50 sm:bg-transparent">
      {/* Chat List Sidebar */}
      <div class={`${chat.showChatList.value ? "flex" : "hidden"} sm:flex w-full sm:w-72 lg:w-80 bg-white sm:border sm:border-gray-200 sm:rounded-lg flex-col overflow-hidden h-full`}>
        <div class="px-3 py-3 border-b border-gray-200">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-base font-semibold text-gray-900">Messages</h2>
            <span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {chat.state.chatList.length}
            </span>
          </div>
          <div class="relative">
            <LuSearch class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={chat.state.searchQuery}
              onInput$={(e) => (chat.state.searchQuery = e.target.value)}
              class="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          {chat.state.loading && chat.state.chatList.length === 0 && (
            <div class="flex items-center justify-center py-8">
              <div class="text-center">
                <div class="w-6 h-6 border-2 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                <p class="text-xs text-gray-500">Loading...</p>
              </div>
            </div>
          )}

          {!chat.state.loading && filteredChats.length === 0 && (
            <div class="flex flex-col items-center justify-center py-8 px-3">
              <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <LuMessageSquare class="w-5 h-5 text-gray-400" />
              </div>
              <p class="text-xs text-gray-500 text-center">
                {chat.state.searchQuery ? "No chats found" : "No conversations yet"}
              </p>
            </div>
          )}

          <div class="divide-y divide-gray-100">
            {filteredChats.map((chatItem) => (
              <div
                key={chatItem.session_id}
                onClick$={() => handleChatSelect(chatItem)}
                class={`px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors ${chat.state.currentSessionId === chatItem.session_id ? "bg-pink-50" : ""
                  }`}
              >
                <div class="flex items-start gap-2">
                  <div class="relative flex-shrink-0">
                    <div
                      class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium border-2 bg-white"
                      style={`color: ${getGenderBorderColor(chatItem.other_user_gender)}; border-color: ${getGenderBorderColor(chatItem.other_user_gender)};`}
                    >
                      {chatItem.other_user_name.charAt(0).toUpperCase()}
                    </div>
                    <span class={`absolute bottom-0 right-0 w-2.5 h-2.5 ${chatItem.other_user_online ? "bg-green-500" : "bg-gray-400"} rounded-full border-2 border-white`}></span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-0.5">
                      <span class={`font-medium text-xs truncate ${getGenderColor(chatItem.other_user_gender)}`}>
                        {chatItem.other_user_name}
                      </span>
                      <span class="text-xs text-gray-500 flex-shrink-0 ml-1">
                        {formatTime(chatItem.last_message_time)}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <p class="text-xs text-gray-600 truncate flex-1 flex items-center gap-1">
                        {chatItem.last_message === 'Image' && <LuImage class="w-3 h-3 flex-shrink-0" />}
                        {chatItem.last_message === 'GIF' && <LuFilm class="w-3 h-3 flex-shrink-0" />}
                        {chatItem.last_message === 'Voice message' && <LuMic class="w-3 h-3 flex-shrink-0" />}
                        <span class="truncate">{chatItem.last_message || "No messages"}</span>
                      </p>
                      {chatItem.unread_count > 0 && (
                        <span class="ml-1 bg-pink-600 text-white text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                          {chatItem.unread_count}
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
      <div class={`${!chat.showChatList.value ? "flex" : "hidden"} sm:flex flex-1 bg-white sm:border sm:border-gray-200 sm:rounded-lg flex-col overflow-hidden h-full`}>
        {!chat.state.currentSessionId ? (
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
            <div class="flex-shrink-0 px-3 py-2.5 border-b border-gray-200 flex items-center justify-between bg-white">
              <div class="flex items-center gap-2">
                <button
                  onClick$={() => (chat.showChatList.value = true)}
                  class="sm:hidden p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                  aria-label="Back to chats"
                >
                  <LuArrowLeft class="w-4 h-4" />
                </button>
                <button
                  onClick$={(e) => {
                    if (otherUserId === auth.user.value?.id) return;
                    const rect = e.target.getBoundingClientRect();
                    userMenuPosition.value = { top: rect.bottom + 5, left: rect.left };
                    selectedUser.value = { user_id: otherUserId, username: otherUserName, gender: currentOtherUserGender };
                    showUserMenu.value = true;
                  }}
                  class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 bg-white hover:border-pink-400 transition-colors"
                  style={`color: ${getGenderBorderColor(currentOtherUserGender)}; border-color: ${getGenderBorderColor(currentOtherUserGender)};`}
                >
                  {otherUserName?.charAt(0).toUpperCase()}
                </button>
                <div>
                  <h2 class={`font-semibold text-sm ${getGenderColor(currentOtherUserGender)}`}>
                    {otherUserName || "Chat"}
                  </h2>
                  <p class="text-xs text-gray-500">Direct message</p>
                </div>
              </div>
              <button
                onClick$={() => (chat.showOnlineUsers.value = !chat.showOnlineUsers.value)}
                class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LuUsers class="w-3.5 h-3.5" />
                <span>{users.state.onlineUsers.length}</span>
              </button>
            </div>

            {chat.state.error && (
              <div class="flex-shrink-0 mx-3 mt-2 flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded-lg">
                <LuAlertCircle class="w-4 h-4 text-red-500 flex-shrink-0" />
                <p class="text-xs text-red-600 flex-1">{chat.state.error}</p>
                <button onClick$={() => (chat.state.error = null)} class="text-red-400 hover:text-red-600">
                  <LuX class="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {chat.state.successMessage && (
              <div class="flex-shrink-0 mx-3 mt-2 flex items-center gap-2 p-2 bg-green-50 border border-green-100 rounded-lg">
                <LuCheckCircle class="w-4 h-4 text-green-500 flex-shrink-0" />
                <p class="text-xs text-green-600">{chat.state.successMessage}</p>
              </div>
            )}

            <div ref={messageContainerRef} onScroll$={checkIfAtBottom} class="flex-1 overflow-y-auto p-3 space-y-1">
              {chat.state.loading && chat.state.messages.length === 0 && (
                <div class="flex items-center justify-center py-8">
                  <div class="text-center">
                    <div class="w-6 h-6 border-2 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                    <p class="text-xs text-gray-500">Loading...</p>
                  </div>
                </div>
              )}

              {renderMessages()}

              {!isAtBottom.value && chat.state.messages.length > 0 && (
                <div class="sticky bottom-4 flex justify-center">
                  <button
                    onClick$={scrollToBottom}
                    class="px-3 py-1.5 bg-pink-600 text-white text-xs font-medium rounded-full shadow-lg hover:bg-pink-700 transition-colors flex items-center gap-1"
                  >
                    <LuArrowLeft class="w-3 h-3 rotate-90" />
                    Scroll to latest
                  </button>
                </div>
              )}
            </div>

            {/* Reply Preview */}
            {chat.state.replyingTo && (
              <div class="flex-shrink-0 px-3 py-2 bg-pink-50 border-t border-pink-100 flex items-start justify-between">
                <div class="flex items-start gap-2 flex-1 min-w-0">
                  <LuReply class="w-3 h-3 text-pink-600 mt-0.5 flex-shrink-0" />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5 mb-0.5">
                      <span class="text-xs text-gray-600">Replying to</span>
                      <span class={`text-xs font-semibold ${getGenderColor(chat.state.replyingTo.gender)}`}>
                        {chat.state.replyingTo.username}
                      </span>
                      <span class="text-xs text-gray-500">{formatTime(chat.state.replyingTo.created_at)}</span>
                    </div>
                    <p class="text-xs text-gray-700 truncate">{chat.state.replyingTo.content}</p>
                  </div>
                </div>
                <button
                  onClick$={() => (chat.state.replyingTo = null)}
                  class="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
                >
                  <LuX class="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Media Preview - Shows above input when media is selected */}
            {selectedMedia.value && (
              <div class="flex-shrink-0 px-3 py-2 border-t border-gray-200 bg-gray-50">
                <MediaPreview
                  file={selectedMedia.value.file}
                  preview={selectedMedia.value.preview}
                  type={selectedMedia.value.type}
                  onRemove={$(() => (selectedMedia.value = null))}
                />
                {/* Show uploading indicator */}
                {selectedMedia.value.uploading && (
                  <div class="flex items-center gap-2 text-xs text-gray-600 mt-1">
                    <div class="w-3 h-3 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading...</span>
                  </div>
                )}
                {selectedMedia.value.publicId && !selectedMedia.value.uploading && (
                  <div class="flex items-center gap-1 text-xs text-green-600 mt-1">
                    <LuCheckCircle class="w-3 h-3" />
                    <span>Ready to send</span>
                  </div>
                )}
              </div>
            )}

            {/* Message Input */}
            <div class="flex-shrink-0 px-3 py-2.5 border-t border-gray-200 bg-white">
              <div class="flex items-end gap-2">
                <div class="flex-1 relative flex items-end border border-gray-200 rounded-lg focus-within:ring-1 focus-within:ring-pink-500 focus-within:border-transparent">
                  <textarea
                    value={newMessage.value}
                    onInput$={(e) => {
                      newMessage.value = e.target.value;

                      // Auto-expand textarea
                      if (e.target.value.includes('\n')) {
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                      } else {
                        e.target.style.height = '28px';
                      }
                    }}
                    onKeyDown$={handleKeyPress}
                    placeholder={
                      selectedMedia.value
                        ? "Add a message (optional)..."
                        : chat.state.replyingTo
                          ? `Reply to ${chat.state.replyingTo.username}...`
                          : "Type a message..."
                    }
                    class="flex-1 px-3 py-1.5 text-xs focus:outline-none rounded-lg resize-none h-[28px] min-h-[28px] max-h-[120px] overflow-y-auto leading-[1.2] placeholder:leading-[1.2]"
                    rows="1"
                  />
                  <div class="relative">
                    <button
                      onClick$={() => (showEmojiPicker.value = !showEmojiPicker.value)}
                      class="p-2 text-gray-400 hover:text-pink-600 transition-colors"
                      aria-label="Add emoji"
                    >
                      <LuSmile class="w-4 h-4" />
                    </button>
                    <EmojiPicker
                      show={showEmojiPicker.value}
                      onEmojiSelect={$((emoji) => {
                        newMessage.value = newMessage.value + emoji;
                        showEmojiPicker.value = false;
                      })}
                      onClose={$(() => (showEmojiPicker.value = false))}
                    />
                  </div>
                  <MediaUpload
                    onMediaSelect={$(async (media) => {
                      // Set media with uploading state
                      selectedMedia.value = {
                        ...media,
                        uploading: true,
                        publicId: null
                      };

                      try {
                        // Upload immediately in background
                        let uploadResult;
                        if (media.type === 'image') {
                          uploadResult = await mediaApi.uploadImage(media.file);
                        } else if (media.type === 'gif') {
                          uploadResult = await mediaApi.uploadGif(media.file);
                        } else if (media.type === 'audio') {
                          uploadResult = await mediaApi.uploadAudio(media.file);
                        }

                        // Update with public_id
                        selectedMedia.value = {
                          ...selectedMedia.value,
                          uploading: false,
                          publicId: uploadResult.data.public_id
                        };
                      } catch (err) {
                        chat.state.error = 'Failed to upload media';
                        selectedMedia.value = null;
                      }
                    })}
                    onClose={$(() => { })}
                  />
                </div>
                <button
                  onClick$={handleSendMessage}
                  disabled={selectedMedia.value?.uploading || (!selectedMedia.value && !newMessage.value?.trim())}
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

      {/* Online Users Sidebar */}
      {chat.showOnlineUsers.value && (
        <>
          <div class="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick$={() => (chat.showOnlineUsers.value = false)} />
          <div class="fixed top-16 right-0 bottom-0 w-72 bg-white shadow-2xl z-50 lg:relative lg:top-0 lg:w-64 lg:border lg:border-gray-200 lg:rounded-lg p-3 overflow-hidden flex flex-col">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <LuUsers class="w-4 h-4" />
                Online Now
              </h3>
              <button
                onClick$={() => (chat.showOnlineUsers.value = false)}
                class="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <LuX class="w-4 h-4" />
              </button>
            </div>

            {users.state.onlineUsers.length === 0 && (
              <div class="flex-1 flex items-center justify-center">
                <p class="text-xs text-gray-500">No one online</p>
              </div>
            )}

            <div class="flex-1 overflow-y-auto space-y-2">
              {users.state.onlineUsers.map((user) => (
                <div
                  key={user.id}
                  class="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div class="flex items-center gap-2 flex-1">
                    <div class="relative">
                      <div
                        class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 bg-white"
                        style={`color: ${getGenderBorderColor(user.gender)}; border-color: ${getGenderBorderColor(user.gender)};`}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <span class={`text-xs font-medium block truncate ${getGenderColor(user.gender)}`}>
                        {user.username}
                      </span>
                      <span class="text-xs text-gray-500">{user.is_guest ? "Guest" : "User"}</span>
                    </div>
                  </div>
                  <button
                    onClick$={async () => {
                      chat.showOnlineUsers.value = false;
                      await nav(`/chat?user=${user.id}&name=${user.username}`);
                      window.location.reload();
                    }}
                    class="p-1.5 text-pink-600 hover:bg-pink-50 rounded-lg transition-colors flex-shrink-0"
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

      <UserMenu
        showUserMenu={showUserMenu.value}
        userMenuPosition={userMenuPosition.value}
        selectedUser={selectedUser.value}
        auth={auth}
        onClose={$(() => (showUserMenu.value = false))}
        onSendFriendRequest={handleSendFriendRequest}
        onBlockUser={handleBlockUser}
      />

      {chat.state.imageViewer.isOpen && console.log('🔍 Image Viewer Debug:', {
        isOpen: chat.state.imageViewer.isOpen,
        currentIndex: chat.state.imageViewer.currentIndex,
        totalImages: chat.state.imageViewer.images.length,
        currentImageData: chat.state.imageViewer.images[chat.state.imageViewer.currentIndex],
        allImages: chat.state.imageViewer.images
      })}

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
        // Navigation
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
        // Actions
        onReact={$(async (messageId, emoji) => {
          try {
            await chatApi.reactToMessage(messageId, emoji);
            // Update in messages array
            chat.state.messages = chat.state.messages.map(m => {
              if (m.id === messageId) {
                const reactions = m.reactions || [];
                return { ...m, reactions: [...reactions, { id: Date.now(), emoji, user_id: auth.user.value.id }] };
              }
              return m;
            });
            // Update in image viewer array
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
              // Fallback: copy image URL
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
