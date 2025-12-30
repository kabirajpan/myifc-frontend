import { component$, useSignal } from "@builder.io/qwik";
import { LuX, LuSearch, LuUsers } from "@qwikest/icons/lucide";

export const JoinRoomModal = component$(({ isOpen, onClose, onJoin, publicRooms }) => {
  const searchQuery = useSignal("");
  
  const filteredRooms = (publicRooms || []).filter(room => 
    room.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    (room.description || '').toLowerCase().includes(searchQuery.value.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div class="fixed inset-0 bg-black/50 z-50" onClick$={onClose} />

      {/* Modal */}
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 class="text-base font-semibold text-gray-900">Join a Room</h3>
            <button
              onClick$={onClose}
              class="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              <LuX class="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div class="px-4 py-3 border-b border-gray-200">
            <div class="relative">
              <LuSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery.value}
                onInput$={(e) => (searchQuery.value = e.target.value)}
                placeholder="Search rooms..."
                class="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Room Grid */}
          <div class="flex-1 overflow-y-auto p-4">
            {filteredRooms.length === 0 ? (
              <div class="flex flex-col items-center justify-center py-8">
                <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                  <LuUsers class="w-6 h-6 text-gray-400" />
                </div>
                <p class="text-sm text-gray-500">No rooms found</p>
              </div>
            ) : (
              <div class="flex flex-wrap gap-3">
                {filteredRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick$={() => onJoin(room.id)}
                    class="flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc(25%-0.5625rem)] xl:w-[calc(16.666%-0.625rem)]"
                    style="border-radius: 4px;"
                  >
                    <span class="font-semibold truncate flex-1 text-left">
                      {room.name}
                    </span>
                    <div class="flex items-center gap-1 text-xs opacity-90 flex-shrink-0">
                      <LuUsers class="w-3 h-3" />
                      <span>{room.member_count || 0}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
});