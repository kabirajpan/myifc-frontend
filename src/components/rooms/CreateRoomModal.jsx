import { component$, useSignal } from "@builder.io/qwik";
import { LuX, LuPlus } from "@qwikest/icons/lucide";

export const CreateRoomModal = component$(({ isOpen, onClose, onSubmit }) => {
  const roomName = useSignal("");
  const roomDescription = useSignal("");
  const isAdminRoom = useSignal(false);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div class="fixed inset-0 bg-black/50 z-50" onClick$={onClose} />
      
      {/* Modal */}
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 class="text-base font-semibold text-gray-900">Create New Room</h3>
            <button
              onClick$={onClose}
              class="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              <LuX class="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div class="p-4 space-y-4">
            {/* Room Name */}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Room Name <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={roomName.value}
                onInput$={(e) => (roomName.value = e.target.value)}
                placeholder="e.g., General Chat"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                maxLength={50}
              />
              <p class="text-xs text-gray-500 mt-1">{roomName.value.length}/50</p>
            </div>

            {/* Description */}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={roomDescription.value}
                onInput$={(e) => (roomDescription.value = e.target.value)}
                placeholder="What's this room about?"
                rows={3}
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                maxLength={200}
              />
              <p class="text-xs text-gray-500 mt-1">{roomDescription.value.length}/200</p>
            </div>

            {/* Admin Room Checkbox */}
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                id="adminRoom"
                checked={isAdminRoom.value}
                onChange$={(e) => (isAdminRoom.value = e.target.checked)}
                class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
              />
              <label for="adminRoom" class="text-sm text-gray-700">
                Admin Only Room
              </label>
            </div>
          </div>

          {/* Footer */}
          <div class="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick$={onClose}
              class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick$={() => {
                onSubmit({ 
                  name: roomName.value, 
                  description: roomDescription.value,
                  isAdminRoom: isAdminRoom.value 
                });
                roomName.value = "";
                roomDescription.value = "";
                isAdminRoom.value = false;
              }}
              disabled={!roomName.value.trim()}
              class="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <LuPlus class="w-4 h-4" />
              Create Room
            </button>
          </div>
        </div>
      </div>
    </>
  );
});