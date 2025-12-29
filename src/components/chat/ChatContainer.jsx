import { component$, useSignal, $ } from "@builder.io/qwik";
import {
    LuSend,
    LuUsers,
    LuArrowLeft,
    LuSmile,
    LuReply,
    LuX,
    LuHash,
    LuCheckCircle,
    LuAlertCircle,
    LuMessageSquare,
    LuPanelLeft,
} from "@qwikest/icons/lucide";
import { MessageBubble } from "./MessageBubble";
import { EmojiPicker } from "../ui/EmojiPicker";
import { MediaUpload, MediaPreview } from "../ui/MediaUpload";
import { getGenderColor, getGenderBorderColor, formatTime } from "../../utils/helpers";
import { mediaApi } from "../../api/media.js";

export const ChatContainer = component$(
    ({
        mode = "room", // "room" | "dm"
        currentChat, // room object or DM session object
        messages,
        onBack,
        onShowUsers,
        onSendMessage,
        onMessageClick,
        onUsernameClick,
        onDeleteMessage,
        onImageClick,
        selectedMessageId,
        deletingMessageId,
        replyingTo,
        onCancelReply,
        successMessage,
        error,
        onClearError,
        onClearSuccess,
        currentUserId,

        onReactToMessage, // 👈 ADD THIS
        onRemoveReaction, // 👈 ADD THIS
        onOpenReactionPicker, // 👈 ADD THIS
        // DM-specific props
        otherUserGender, // For DM mode
        headerAction, // Optional: custom header action button
        onToggleUnifiedSidebar, // NEW: Toggle unified sidebar

        hasOlderMessages = false,
        isLoadingOlder = false,
        olderMessagesLoaded = false,
        onLoadOlderMessages,
        pagination,
        messageContainerRef, // ✅ NEW: Receive ref from parent
        onScrollToBottom, // ✅ NEW: Receive scroll function
    }) => {
        const newMessage = useSignal("");
        const showEmojiPicker = useSignal(false);
        const selectedMedia = useSignal(null);


        const isRoom = mode === "room";
        const accentColor = isRoom ? "purple" : "pink";

        // Header info
        const headerTitle = isRoom ? currentChat?.name : currentChat?.other_user_name || "Chat";
        const headerSubtitle = isRoom
            ? (currentChat?.description || "Room chat")
            : "Direct message";
        const headerIcon = isRoom ? LuHash : null;
        const userCount = isRoom ? (currentChat?.member_count || 0) : null;

        const handleSendMessage = $(async () => {
            // Handle media message
            if (selectedMedia.value) {
                if (selectedMedia.value.uploading) {
                    return; // Wait for upload
                }

                if (!selectedMedia.value.publicId) {
                    return; // Upload failed
                }

                const messageText = newMessage.value?.trim();
                onSendMessage({
                    content: selectedMedia.value.publicId,
                    type: selectedMedia.value.type,
                    caption: messageText || null,
                });

                newMessage.value = "";
                selectedMedia.value = null;
                showEmojiPicker.value = false;
                return;
            }

            // Handle text message
            const messageText = newMessage.value?.trim();
            if (!messageText) return;

            onSendMessage({
                content: messageText,
                type: "text",
                caption: null,
            });

            newMessage.value = "";
            showEmojiPicker.value = false;
        });

        const handleKeyPress = $((e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });

        const renderMessages = () => {
            if (messages.length === 0) {
                return (
                    <div class="flex flex-col items-center justify-center py-8">
                        <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                            <LuMessageSquare class="w-5 h-5 text-gray-400" />
                        </div>
                        <p class="text-xs text-gray-500">No messages yet</p>
                        <p class="text-xs text-gray-400 mt-0.5">
                            {isRoom ? "Be the first to say something!" : "Start the conversation!"}
                        </p>
                    </div>
                );
            }

            return (
                <>
                    {messages.map((msg, index) => {
                        // ✅ Show divider between OLD and NEW sections
                        // Find the boundary: last OLD message (right before first NEW message)
                        const isLastOldMessage = msg.section === 'old' &&
                            messages[index + 1]?.section === 'new';

                        return (
                            <div key={msg.id}>
                                <MessageBubble
                                    msg={msg}
                                    isOwn={msg.sender_id === currentUserId || msg.isOwn}
                                    showTime={selectedMessageId === msg.id}
                                    onMessageClick={onMessageClick}
                                    onUsernameClick={onUsernameClick}
                                    onDeleteMessage={onDeleteMessage}
                                    onImageClick={onImageClick}
                                    deletingMessageId={deletingMessageId}
                                    accentColor={accentColor}
                                    currentUserId={currentUserId} // 👈 ADD THIS
                                    onReactToMessage={onReactToMessage} // 👈 ADD THIS
                                    onRemoveReaction={onRemoveReaction} // 👈 ADD THIS
                                    onOpenReactionPicker={onOpenReactionPicker} // 👈 ADD THIS
                                />

                                {/* ✅ Divider between OLD and NEW sections */}
                                {isLastOldMessage && (
                                    <div class="flex items-center gap-3 my-4">
                                        <div class="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                                        <span class="text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                                            ↓ Current Messages (Latest 100)
                                        </span>
                                        <div class="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </>
            );
        };

        if (!currentChat) {
            return (
                <div class="flex-1 flex items-center justify-center p-4 bg-white sm:border sm:border-gray-200 sm:rounded-lg">
                    <div class="text-center">
                        <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            {isRoom ? (
                                <LuHash class="w-6 h-6 text-gray-400" />
                            ) : (
                                <LuMessageSquare class="w-6 h-6 text-gray-400" />
                            )}
                        </div>
                        <h3 class="text-sm font-medium text-gray-900 mb-1">
                            {isRoom ? "No room selected" : "No chat selected"}
                        </h3>
                        <p class="text-xs text-gray-500">
                            {isRoom ? "Choose a room to start chatting" : "Choose a conversation to start"}
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div class="flex-1 bg-white sm:border sm:border-gray-200 sm:rounded-lg flex flex-col overflow-hidden h-full">
                {/* Header */}
                <div class="flex-shrink-0 px-3 py-2.5 border-b border-gray-200 flex items-center justify-between bg-white">
                    <div class="flex items-center gap-2">
                        <button
                            onClick$={onBack}
                            class="sm:hidden p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                            aria-label={isRoom ? "Back to rooms" : "Back to chats"}
                        >
                            <LuArrowLeft class="w-4 h-4" />
                        </button>

                        {isRoom ? (
                            <div class={`w-8 h-8 rounded-lg bg-gradient-to-br from-${accentColor}-500 to-${accentColor}-700 flex items-center justify-center flex-shrink-0`}>
                                <LuHash class="w-5 h-5 text-white" />
                            </div>
                        ) : (
                            <div
                                class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 bg-white flex-shrink-0"
                                style={`color: ${getGenderBorderColor(otherUserGender)}; border-color: ${getGenderBorderColor(otherUserGender)};`}
                            >
                                {headerTitle?.charAt(0).toUpperCase()}
                            </div>
                        )}

                        <div>
                            <h2 class={`font-semibold text-sm ${isRoom ? "text-gray-900" : getGenderColor(otherUserGender)
                                }`}>
                                {headerTitle}
                            </h2>
                            <p class="text-xs text-gray-500">{headerSubtitle}</p>
                        </div>
                    </div>

                    <div class="flex items-center gap-2">
                        {headerAction}
                        {onShowUsers && (
                            <button
                                onClick$={onShowUsers}
                                class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <LuUsers class="w-3.5 h-3.5" />
                                {userCount !== null && <span>{userCount}</span>}
                            </button>
                        )}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div class="flex-shrink-0 mx-3 mt-2 flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded-lg">
                        <LuAlertCircle class="w-4 h-4 text-red-500 flex-shrink-0" />
                        <p class="text-xs text-red-600 flex-1">{error}</p>
                        <button onClick$={onClearError} class="text-red-400 hover:text-red-600">
                            <LuX class="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {/* Success Message */}
                {successMessage && (
                    <div class="flex-shrink-0 mx-3 mt-2 flex items-center gap-2 p-2 bg-green-50 border border-green-100 rounded-lg">
                        <LuCheckCircle class="w-4 h-4 text-green-500 flex-shrink-0" />
                        <p class="text-xs text-green-600">{successMessage}</p>
                    </div>
                )}

                {/* Messages Container */}
                <div ref={messageContainerRef} class="flex-1 overflow-y-auto p-3 space-y-1">
                    {/* ✅ Load Old Messages Button */}
                    {hasOlderMessages && !olderMessagesLoaded && (
                        <div class="flex flex-col items-center gap-2 mb-3">
                            <button
                                onClick$={onLoadOlderMessages}
                                disabled={isLoadingOlder}
                                class={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${isLoadingOlder
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : `bg-${accentColor}-50 text-${accentColor}-700 hover:bg-${accentColor}-100 border border-${accentColor}-200`
                                    }`}
                            >
                                {isLoadingOlder ? (
                                    <div class="flex items-center gap-2">
                                        <div class={`w-3 h-3 border-2 border-${accentColor}-600 border-t-transparent rounded-full animate-spin`}></div>
                                        <span>Loading old messages...</span>
                                    </div>
                                ) : (
                                    `⬆️ Load Old Messages (${pagination.value?.oldMessageCount || 0})`
                                )}
                            </button>
                            <p class="text-xs text-gray-500">
                                {pagination.value?.oldMessageCount || 0} older messages available
                            </p>
                        </div>
                    )}

                    {/* ✅ Old Messages Loaded Indicator */}
                    {olderMessagesLoaded && (
                        <div class="flex justify-center mb-3">
                            <div class="px-3 py-1.5 text-xs text-gray-500 bg-gray-50 rounded-full border border-gray-200">
                                📜 All {pagination.value?.totalCount || 0} messages loaded
                            </div>
                        </div>
                    )}

                    {renderMessages()}
                </div>

                {/* Reply Preview */}
                {replyingTo && (
                    <div class={`flex-shrink-0 px-3 py-2 bg-${accentColor}-50 border-t border-${accentColor}-100 flex items-start justify-between`}>
                        <div class="flex items-start gap-2 flex-1 min-w-0">
                            <LuReply class={`w-3 h-3 text-${accentColor}-600 mt-0.5 flex-shrink-0`} />
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-1.5 mb-0.5">
                                    <span class="text-xs text-gray-600">Replying to</span>
                                    <span class={`text-xs font-semibold ${getGenderColor(replyingTo.gender)}`}>
                                        {replyingTo.username}
                                    </span>
                                    <span class="text-xs text-gray-500">{formatTime(replyingTo.created_at)}</span>
                                </div>
                                <p class="text-xs text-gray-700 truncate">{replyingTo.content}</p>
                            </div>
                        </div>
                        <button
                            onClick$={onCancelReply}
                            class="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
                        >
                            <LuX class="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {/* Media Preview */}
                {selectedMedia.value && (
                    <div class="flex-shrink-0 px-3 py-2 border-t border-gray-200 bg-gray-50">
                        <MediaPreview
                            file={selectedMedia.value.file}
                            preview={selectedMedia.value.preview}
                            type={selectedMedia.value.type}
                            onRemove={$(() => (selectedMedia.value = null))}
                        />
                        {selectedMedia.value.uploading && (
                            <div class="flex items-center gap-2 text-xs text-gray-600 mt-1">
                                <div class={`w-3 h-3 border-2 border-${accentColor}-600 border-t-transparent rounded-full animate-spin`}></div>
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
                        {/* Toggle Unified Sidebar Button */}
                        {onToggleUnifiedSidebar && (
                            <button
                                onClick$={onToggleUnifiedSidebar}
                                class="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 self-end"
                                title="Toggle messages sidebar"
                                aria-label="Toggle messages sidebar"
                            >
                                <LuPanelLeft class="w-5 h-5 text-gray-600" />
                            </button>
                        )}

                        <div class={`flex-1 relative flex items-end border border-gray-200 rounded-lg focus-within:ring-1 focus-within:ring-${accentColor}-500 focus-within:border-transparent`}>
                            <textarea
                                value={newMessage.value}
                                onInput$={(e) => {
                                    newMessage.value = e.target.value;
                                    if (e.target.value.includes("\n")) {
                                        e.target.style.height = "auto";
                                        e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                                    } else {
                                        e.target.style.height = "28px";
                                    }
                                }}
                                onKeyDown$={handleKeyPress}
                                placeholder={
                                    selectedMedia.value
                                        ? "Add a caption (optional)..."
                                        : replyingTo
                                            ? `Reply to ${replyingTo.username}...`
                                            : "Type a message..."
                                }
                                class="flex-1 px-3 py-1.5 text-xs focus:outline-none rounded-lg resize-none h-[28px] min-h-[28px] max-h-[120px] overflow-y-auto leading-[1.2] placeholder:leading-[1.2]"
                                rows="1"
                            />
                            <div class="relative">
                                <button
                                    onClick$={() => {
                                        console.log('Smile button clicked, current value:', showEmojiPicker.value);
                                        showEmojiPicker.value = !showEmojiPicker.value;
                                        console.log('New value:', showEmojiPicker.value);
                                    }}
                                    class={`p-2 text-gray-400 hover:text-${accentColor}-600 transition-colors`}
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
                                        console.error('Upload failed:', err);
                                        selectedMedia.value = null;
                                    }
                                })}
                                onClose={$(() => { })}
                            />
                        </div>
                        <button
                            onClick$={handleSendMessage}
                            disabled={
                                selectedMedia.value?.uploading || (!selectedMedia.value && !newMessage.value?.trim())
                            }
                            class={`px-3 py-2 bg-${accentColor}-600 text-white rounded-lg hover:bg-${accentColor}-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5`}
                        >
                            <LuSend class="w-3.5 h-3.5" />
                            <span class="text-xs font-medium hidden sm:inline">Send</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }
);