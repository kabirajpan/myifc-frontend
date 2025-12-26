import { component$ } from "@builder.io/qwik";
import { LuX, LuUsers, LuCrown, LuShield } from "@qwikest/icons/lucide";
import { getGenderColor, getGenderBorderColor } from "../../utils/helpers";

export const RoomMembersList = component$(({ isOpen, onClose, members, currentUserId }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div class="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick$={onClose} />
      
      {/* Members Panel */}
      <div class="fixed top-16 right-0 bottom-0 w-72 bg-white shadow-2xl z-50 lg:relative lg:top-0 lg:w-64 lg:border lg:border-gray-200 lg:rounded-lg p-3 overflow-hidden flex flex-col">
        {/* Header */}
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <LuUsers class="w-4 h-4" />
            Members
            <span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {members.length}
            </span>
          </h3>
          <button
            onClick$={onClose}
            class="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors lg:hidden"
          >
            <LuX class="w-4 h-4" />
          </button>
        </div>

        {/* Members List */}
        <div class="flex-1 overflow-y-auto space-y-2">
          {members.length === 0 ? (
            <div class="flex flex-col items-center justify-center py-8">
              <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <LuUsers class="w-5 h-5 text-gray-400" />
              </div>
              <p class="text-xs text-gray-500">No members</p>
            </div>
          ) : (
            members.map((member) => (
              <div
                key={member.id}
                class="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {/* Avatar */}
                <div class="relative flex-shrink-0">
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 bg-white"
                    style={`color: ${getGenderBorderColor(member.gender)}; border-color: ${getGenderBorderColor(member.gender)};`}
                  >
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                  {member.is_online && (
                    <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                  )}
                </div>

                {/* Member Info */}
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class={`text-xs font-medium truncate ${getGenderColor(member.gender)}`}>
                      {member.username}
                      {member.id === currentUserId && (
                        <span class="text-gray-500 font-normal"> (You)</span>
                      )}
                    </span>
                    {member.role === 'admin' && (
                      <LuCrown class="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" title="Admin" />
                    )}
                    {member.role === 'moderator' && (
                      <LuShield class="w-3.5 h-3.5 text-blue-500 flex-shrink-0" title="Moderator" />
                    )}
                  </div>
                  <span class="text-xs text-gray-500">
                    {member.is_online ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
});