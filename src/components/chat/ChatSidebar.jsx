import { component$ } from "@builder.io/qwik";
import { LuSearch, LuPlus, LuDoorOpen, LuUsers, LuHash, LuMessageSquare, LuImage, LuFilm, LuMic } from "@qwikest/icons/lucide";
import { formatTime, getGenderColor, getGenderBorderColor } from "../../utils/helpers.js";

export const ChatSidebar = component$(({
    items, // rooms or chat sessions
    currentItemId,
    searchQuery,
    loading,
    mode = "room", // "room" | "dm"
    title,
    onSearchChange,
    onItemSelect,
    onPrimaryAction, // Create Room / New Chat
    onSecondaryAction, // Join Room / (optional)
    primaryActionLabel,
    primaryActionIcon = LuPlus,
    secondaryActionLabel,
    secondaryActionIcon = LuDoorOpen,
    showSecondaryAction = true,
}) => {

    const filteredItems = items.filter(item => {
        const searchName = mode === "room" ? item.name : item.other_user_name;
        return searchName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const displayTitle = title || (mode === "room" ? "Rooms" : "Messages");
    const emptyIcon = mode === "room" ? LuHash : LuMessageSquare;
    const emptyText = searchQuery
        ? (mode === "room" ? "No rooms found" : "No chats found")
        : (mode === "room" ? "No rooms joined yet" : "No conversations yet");
    const emptySubtext = !searchQuery
        ? (mode === "room" ? "Join or create a room to get started" : "Start chatting with someone")
        : null;

    const PrimaryIcon = primaryActionIcon;
    const SecondaryIcon = secondaryActionIcon;

    return (
        <div class="w-full sm:w-72 lg:w-80 bg-white sm:border sm:border-gray-200 sm:rounded-lg flex flex-col overflow-hidden h-full">
            {/* Header */}
            <div class="px-3 py-3 border-b border-gray-200">
                <div class="flex items-center justify-between mb-3">
                    <h2 class="text-base font-semibold text-gray-900">{displayTitle}</h2>
                    <span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                        <LuUsers class="w-3 h-3" />
                        {items.length}
                    </span>
                </div>

                {/* Action Buttons - Join Room First, Then Create Room */}
                {(onPrimaryAction || onSecondaryAction) && (
                    <div class="flex gap-2 mb-3">
                        {onSecondaryAction && showSecondaryAction && (
                            <button
                                onClick$={onSecondaryAction}
                                class={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-white ${mode === "room"
                                        ? "text-purple-600 border-purple-600 hover:bg-purple-50"
                                        : "text-pink-600 border-pink-600 hover:bg-pink-50"
                                    } border transition-colors`}
                                style="border-radius: 4px;"
                            >
                                <SecondaryIcon class="w-3.5 h-3.5" />
                                {secondaryActionLabel || "Join Room"}
                            </button>
                        )}
                        {onPrimaryAction && (
                            <button
                                onClick$={onPrimaryAction}
                                class={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium ${mode === "room"
                                        ? "bg-purple-600 hover:bg-purple-700"
                                        : "bg-pink-600 hover:bg-pink-700"
                                    } text-white transition-colors`}
                                style="border-radius: 4px;"
                            >
                                <PrimaryIcon class="w-3.5 h-3.5" />
                                {primaryActionLabel || (mode === "room" ? "Create Room" : "New Chat")}
                            </button>
                        )}
                    </div>
                )}

                {/* Search */}
                <div class="relative">
                    <LuSearch class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                        type="text"
                        placeholder={mode === "room" ? "Search rooms..." : "Search chats..."}
                        value={searchQuery}
                        onInput$={(e) => onSearchChange(e.target.value)}
                        class={`w-full pl-8 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 ${mode === "room"
                                ? "focus:ring-purple-500"
                                : "focus:ring-pink-500"
                            } focus:border-transparent`}
                    />
                </div>
            </div>

            {/* Items List */}
            <div class="flex-1 overflow-y-auto">
                {loading && items.length === 0 ? (
                    // Loading State
                    <div class="flex items-center justify-center py-8">
                        <div class="text-center">
                            <div class={`w-6 h-6 border-2 ${mode === "room" ? "border-purple-600" : "border-pink-600"
                                } border-t-transparent rounded-full animate-spin mx-auto mb-1`}></div>
                            <p class="text-xs text-gray-500">Loading...</p>
                        </div>
                    </div>
                ) : filteredItems.length === 0 ? (
                    // Empty State
                    <div class="flex flex-col items-center justify-center py-8 px-3">
                        <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                            {mode === "room" ? (
                                <LuHash class="w-5 h-5 text-gray-400" />
                            ) : (
                                <LuMessageSquare class="w-5 h-5 text-gray-400" />
                            )}
                        </div>
                        <p class="text-xs text-gray-500 text-center mb-1">{emptyText}</p>
                        {emptySubtext && (
                            <>
                                <p class="text-xs text-gray-400 text-center mb-3">{emptySubtext}</p>
                                <div class="flex gap-2">
                                    {onSecondaryAction && showSecondaryAction && (
                                        <button
                                            onClick$={onSecondaryAction}
                                            class={`px-3 py-1.5 text-xs font-medium bg-white ${mode === "room"
                                                    ? "text-purple-600 border-purple-600 hover:bg-purple-50"
                                                    : "text-pink-600 border-pink-600 hover:bg-pink-50"
                                                } border transition-colors`}
                                            style="border-radius: 4px;"
                                        >
                                            {secondaryActionLabel || "Join Room"}
                                        </button>
                                    )}
                                    {onPrimaryAction && (
                                        <button
                                            onClick$={onPrimaryAction}
                                            class={`px-3 py-1.5 text-xs font-medium ${mode === "room"
                                                    ? "bg-purple-600 hover:bg-purple-700"
                                                    : "bg-pink-600 hover:bg-pink-700"
                                                } text-white transition-colors`}
                                            style="border-radius: 4px;"
                                        >
                                            {primaryActionLabel || (mode === "room" ? "Create Room" : "New Chat")}
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    // Items List
                    <div class="divide-y divide-gray-100">
                        {filteredItems.map((item) => {
                            const isRoom = mode === "room";
                            const itemId = isRoom ? item.id : item.session_id;
                            const itemName = isRoom ? item.name : item.other_user_name;
                            const itemGender = isRoom ? null : item.other_user_gender;
                            const isActive = currentItemId === itemId;

                            return (
                                <div
                                    key={itemId}
                                    onClick$={() => onItemSelect(item)}
                                    class={`px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors ${isActive
                                            ? (mode === "room" ? "bg-purple-50" : "bg-pink-50")
                                            : ""
                                        }`}
                                >
                                    <div class="flex items-start gap-2">
                                        {/* Icon/Avatar */}
                                        <div class="flex-shrink-0 relative">
                                            {isRoom ? (
                                                <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                                                    <LuHash class="w-5 h-5 text-white" />
                                                </div>
                                            ) : (
                                                <>
                                                    <div
                                                        class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium border-2 bg-white"
                                                        style={`color: ${getGenderBorderColor(itemGender)}; border-color: ${getGenderBorderColor(itemGender)};`}
                                                    >
                                                        {itemName.charAt(0).toUpperCase()}
                                                    </div>
                                                    {item.other_user_online && (
                                                        <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Item Info */}
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center justify-between mb-0.5">
                                                <span class={`font-medium text-xs truncate ${isRoom
                                                        ? "text-gray-900"
                                                        : getGenderColor(itemGender)
                                                    }`}>
                                                    {itemName}
                                                </span>
                                                {item.last_message_time && (
                                                    <span class="text-xs text-gray-500 flex-shrink-0 ml-1">
                                                        {formatTime(item.last_message_time)}
                                                    </span>
                                                )}
                                            </div>
                                            <div class="flex items-center justify-between">
                                                <p class="text-xs text-gray-600 truncate flex-1 flex items-center gap-1">
                                                    {item.last_message === 'Image' && <LuImage class="w-3 h-3 flex-shrink-0" />}
                                                    {(item.last_message === 'GIF' || item.last_message === '🎬 GIF') && <LuFilm class="w-3 h-3 flex-shrink-0" />}
                                                    {(item.last_message === 'Voice message' || item.last_message === '🎵 Voice message') && <LuMic class="w-3 h-3 flex-shrink-0" />}
                                                    <span class="truncate">{item.last_message || "No messages yet"}</span>
                                                </p>
                                                {item.unread_count > 0 && (
                                                    <span class={`ml-1 ${mode === "room" ? "bg-purple-600" : "bg-pink-600"
                                                        } text-white text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0`}>
                                                        {item.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                            {isRoom && (
                                                <div class="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                                    <LuUsers class="w-3 h-3" />
                                                    <span>{item.member_count || 0} members</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
});