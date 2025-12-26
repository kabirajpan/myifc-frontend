import {
    component$,
    Slot,
    useContextProvider,
    useVisibleTask$,
    $,
} from "@builder.io/qwik";
import { useRoomStore, RoomContext } from "../../store/room.store";
import { useAuth } from "../../context/auth";
import { wsService } from "../../api/websocket";
import { roomsApi } from "../../api/rooms";

export const RoomProvider = component$(() => {
    const auth = useAuth();
    const roomStore = useRoomStore();

    // Provide room context to all children
    useContextProvider(RoomContext, roomStore);

    // Initialize WebSocket and load room list (only once)
    useVisibleTask$(({ cleanup, track }) => {
        // Track authentication state
        const isAuth = track(() => auth.isAuthenticated.value);

        if (!isAuth) {
            console.log('⏸️ User not authenticated, skipping WS connection');
            return;
        }

        console.log('🚀 Initializing global room provider');

        // Connect WebSocket
        wsService.connect();

        // Load room list once
        const loadRoomList = async () => {
            if (roomStore.state.roomsLoaded) {
                console.log('✓ Rooms already loaded, skipping');
                return;
            }

            try {
                console.log('📋 Loading user rooms...');
                const response = await roomsApi.getUserRooms();
                roomStore.state.rooms = response.rooms || [];
                roomStore.state.roomsLoaded = true;
                console.log('✅ Loaded', roomStore.state.rooms.length, 'rooms');
            } catch (err) {
                console.error('❌ Failed to load rooms:', err);
                roomStore.state.error = err.message || "Failed to load rooms";
            }
        };

        loadRoomList();

        // Global WebSocket event handler
        const unsubscribe = wsService.onMessage((data) => {
            console.log('📨 Global WS event:', data.type);

            // Handle new messages (update room list)
            if (data.type === "new_message" && data.data?.room_id) {
                const roomId = data.data.room_id;
                const message = data.data.message;

                // Update room list preview
                let lastMessage = message.content;
                if (message.type === 'image') lastMessage = '📷 Image';
                else if (message.type === 'gif') lastMessage = '🎬 GIF';
                else if (message.type === 'audio') lastMessage = '🎵 Voice message';
                else if (message.caption) lastMessage = message.caption;

                roomStore.updateRoomInList(roomId, {
                    last_message: lastMessage,
                    last_message_time: message.created_at,
                    unread_count: message.sender_id === auth.user.value?.id
                        ? roomStore.state.rooms.find(r => r.id === roomId)?.unread_count || 0
                        : (roomStore.state.activeRoomId === roomId
                            ? 0
                            : (roomStore.state.rooms.find(r => r.id === roomId)?.unread_count || 0) + 1)
                });

                // Add message to cache if room is cached
                if (roomStore.state.roomsCache[roomId]) {
                    const newMsg = {
                        ...message,
                        isOwn: message.sender_id === auth.user.value?.id,
                    };
                    roomStore.addMessage(roomId, newMsg);
                }
            }

            // Handle user joined room
            if (data.type === "user_joined_room") {
                const roomId = data.room_id;
                if (roomStore.state.roomsCache[roomId]) {
                    // Reload members if this room is cached
                    loadRoomMembers(roomId);
                }
            }

            // Handle user left room
            if (data.type === "user_left_room") {
                const roomId = data.room_id;
                const userId = data.user_id;
                if (roomStore.state.roomsCache[roomId]?.members) {
                    roomStore.state.roomsCache[roomId].members =
                        roomStore.state.roomsCache[roomId].members.filter(m => m.id !== userId);
                }
            }

            // Handle reactions
            if (data.type === "message_reacted") {
                const roomId = data.room_id;
                const messageId = data.message_id;
                const reaction = data.reaction;

                // Find the message first
                const message = roomStore.state.roomsCache[roomId]?.messages?.find(m => m.id === messageId);
                if (message) {
                    roomStore.updateMessage(roomId, messageId, {
                        reactions: [...(message.reactions || []), reaction]
                    });
                }
            }

            if (data.type === "reaction_removed") {
                const roomId = data.room_id;
                const messageId = data.message_id;
                const reactionId = data.reaction_id;
              
                // Find the message first
                const message = roomStore.state.roomsCache[roomId]?.messages?.find(m => m.id === messageId);
                if (message) {
                  roomStore.updateMessage(roomId, messageId, {
                    reactions: (message.reactions || []).filter(r => r.id !== reactionId)
                  });
                }
              }

            // Handle new room created (add to list)
            if (data.type === "room_created" && data.room) {
                const exists = roomStore.state.rooms.some(r => r.id === data.room.id);
                if (!exists) {
                    roomStore.state.rooms = [...roomStore.state.rooms, data.room];
                }
            }
        });

        // Helper to load members
        const loadRoomMembers = async (roomId) => {
            try {
                const response = await roomsApi.getMembers(roomId);
                if (roomStore.state.roomsCache[roomId]) {
                    roomStore.state.roomsCache[roomId].members = response.members || [];
                }
            } catch (err) {
                console.error('Failed to load members:', err);
            }
        };

        // Cleanup on unmount or auth change
        cleanup(() => {
            console.log('🧹 Cleaning up global room provider');
            unsubscribe();
            // Don't disconnect WebSocket here - let it persist
        });
    });

    return <Slot />;
});