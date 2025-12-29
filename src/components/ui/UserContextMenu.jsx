import { component$, $, useSignal, useOnDocument } from "@builder.io/qwik";
import {
    LuMessageSquare,
    LuMail,
    LuAtSign,
    LuEyeOff,
    LuUser,
    LuFlag,
    LuPlus,
} from "@qwikest/icons/lucide";

export const UserContextMenu = component$(({
    isOpen,
    onClose,
    position,
    username,
    userId,
    gender,
    onMessage,
    onWhisper,
    onMention,
    onIgnore,
    onViewProfile,
    onReport,
    onReact,
    onOpenReactionPicker,
    avatarPosition,
}) => {
    const menuRef = useSignal();

    // Quick reaction emojis - reduced to 5
    const quickEmojis = ['❤️', '👍', '😂', '😮', '😢'];

    // Handle click outside to close
    useOnDocument(
        "click",
        $((event) => {
            if (isOpen && menuRef.value && !menuRef.value.contains(event.target)) {
                onClose();
            }
        })
    );

    if (!isOpen) return null;

    // Calculate position to ensure menu stays within viewport
    const menuStyle = {
        top: `${position.y}px`,
        left: `${position.x}px`,
    };

    return (
        <div
            ref={menuRef}
            class="fixed bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-[9999] w-52"
            style={menuStyle}
            onClick$={(e) => e.stopPropagation()}
        >
            {/* User Info Header - Compact */}
            <div class="px-3 py-2 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                <div class="flex items-center gap-2">
                    <div
                        class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 bg-white"
                        style={`color: ${gender === 'male' ? '#3b82f6' : gender === 'female' ? '#ec4899' : '#8b5cf6'}; border-color: ${gender === 'male' ? '#3b82f6' : gender === 'female' ? '#ec4899' : '#8b5cf6'};`}
                    >
                        {username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 class="font-semibold text-xs text-gray-900">{username}</h3>
                        <p class="text-[10px] text-gray-500">User Menu</p>
                    </div>
                </div>
            </div>

            {/* Menu Actions - Compact */}
            <div class="py-0.5">
                <button
                    onClick$={() => {
                        onMessage?.(userId, username);
                        onClose();
                    }}
                    class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 transition-colors text-left"
                >
                    <LuMessageSquare class="w-3.5 h-3.5 text-blue-600" />
                    <span class="text-xs text-gray-700">Message</span>
                </button>

                <button
                    onClick$={() => {
                        onWhisper?.(userId, username);
                        onClose();
                    }}
                    class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 transition-colors text-left"
                >
                    <LuMail class="w-3.5 h-3.5 text-purple-600" />
                    <span class="text-xs text-gray-700">Whisper</span>
                </button>

                <button
                    onClick$={() => {
                        onMention?.(username);
                        onClose();
                    }}
                    class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 transition-colors text-left"
                >
                    <LuAtSign class="w-3.5 h-3.5 text-green-600" />
                    <span class="text-xs text-gray-700">Mention</span>
                </button>

                <button
                    onClick$={() => {
                        onIgnore?.(userId, username);
                        onClose();
                    }}
                    class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 transition-colors text-left"
                >
                    <LuEyeOff class="w-3.5 h-3.5 text-gray-600" />
                    <span class="text-xs text-gray-700">Ignore</span>
                </button>

                <button
                    onClick$={() => {
                        onViewProfile?.(userId, username);
                        onClose();
                    }}
                    class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 transition-colors text-left"
                >
                    <LuUser class="w-3.5 h-3.5 text-indigo-600" />
                    <span class="text-xs text-gray-700">View Profile</span>
                </button>

                <button
                    onClick$={() => {
                        onReport?.(userId, username);
                        onClose();
                    }}
                    class="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-red-50 transition-colors text-left"
                >
                    <LuFlag class="w-3.5 h-3.5 text-red-600" />
                    <span class="text-xs text-red-600">Report</span>
                </button>
            </div>

            {/* Divider */}
            <div class="border-t border-gray-200"></div>

            {/* Quick Reactions - Compact */}
            <div class="p-2">
                <p class="text-[10px] text-gray-500 mb-1.5 font-medium">Quick Reactions</p>
                <div class="flex gap-1">
                    {quickEmojis.map((emoji) => (
                        <button
                            key={emoji}
                            onClick$={() => {
                                onReact?.(emoji);
                                onClose();
                            }}
                            class="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded transition-colors text-base"
                            title={`React with ${emoji}`}
                        >
                            {emoji}
                        </button>
                    ))}
                    <button
                        onClick$={() => {
                            onOpenReactionPicker?.();
                            onClose();
                        }}
                        class="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded transition-colors border border-gray-300"
                        title="More reactions"
                    >
                        <LuPlus class="w-3.5 h-3.5 text-gray-600" />
                    </button>
                </div>
            </div>
        </div>
    );
});