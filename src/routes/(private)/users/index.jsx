import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { authApi } from "../../../api/auth";
import { friendsApi } from "../../../api/friends";
import { useAuth } from "../../../context/auth";
import { 
  LuUsers, 
  LuMessageSquare, 
  LuUserPlus, 
  LuCheck, 
  LuClock,
  LuAlertCircle,
  LuCheckCircle,
  LuShield,
  LuUser
} from '@qwikest/icons/lucide';

export default component$(() => {
  const nav = useNavigate();
  const auth = useAuth();
  
  const users = useSignal([]);
  const loading = useSignal(true);
  const error = useSignal("");
  const successMessage = useSignal("");
  const friendStatuses = useSignal({});

  // Load online users and their friend statuses
  useVisibleTask$(async () => {
    try {
      loading.value = true;
      const data = await authApi.getOnlineUsers();
      
      // Filter out current user
      const filteredUsers = (data.users || []).filter(
        u => u.id !== auth.user.value?.id
      );
      users.value = filteredUsers;

      // Load friend status for each user (only for registered users)
      if (!auth.user.value?.is_guest) {
        const statuses = {};
        for (const user of filteredUsers) {
          if (!user.is_guest) {
            try {
              const status = await friendsApi.checkStatus(user.id);
              statuses[user.id] = status;
            } catch (err) {
              statuses[user.id] = { status: 'none' };
            }
          }
        }
        friendStatuses.value = statuses;
      }
      
      loading.value = false;
    } catch (err) {
      error.value = err.message;
      loading.value = false;
    }
  });

  const handleStartChat = $(async (userId, username) => {
    await nav(`/chat?user=${userId}&name=${username}`);
  });

  const handleSendFriendRequest = $(async (userId) => {
    try {
      await friendsApi.sendRequest(userId);
      successMessage.value = "Friend request sent!";
      setTimeout(() => successMessage.value = "", 3000);
      
      // Update status
      const status = await friendsApi.checkStatus(userId);
      friendStatuses.value = {
        ...friendStatuses.value,
        [userId]: status
      };
    } catch (err) {
      error.value = err.message;
      setTimeout(() => error.value = "", 3000);
    }
  });

  const getFriendButtonConfig = (user) => {
    if (auth.user.value?.is_guest || user.is_guest) {
      return null;
    }

    const status = friendStatuses.value[user.id];
    if (!status || status.status === 'none' || status.status === 'rejected') {
      return { text: "Add Friend", icon: LuUserPlus, canClick: true, color: "blue" };
    }

    switch (status.status) {
      case 'accepted':
        return { text: "Friends", icon: LuCheck, canClick: false, color: "green" };
      case 'pending':
        return status.is_requester 
          ? { text: "Pending", icon: LuClock, canClick: false, color: "gray" }
          : { text: "Accept Request", icon: LuCheck, canClick: true, color: "green" };
      case 'blocked':
        return { text: "Blocked", icon: LuShield, canClick: false, color: "red" };
      default:
        return { text: "Add Friend", icon: LuUserPlus, canClick: true, color: "blue" };
    }
  };

  return (
    <div class="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Active Users</h1>
        <p class="text-sm text-gray-500 mt-1 flex items-center gap-2">
          <LuUsers class="w-4 h-4" />
          {loading.value ? 'Loading...' : `${users.value.length} users currently online`}
        </p>
      </div>

      {/* Messages */}
      {error.value && (
        <div class="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-lg">
          <LuAlertCircle class="w-5 h-5 text-red-500 flex-shrink-0" />
          <p class="text-sm text-red-600">{error.value}</p>
        </div>
      )}

      {successMessage.value && (
        <div class="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-lg">
          <LuCheckCircle class="w-5 h-5 text-green-500 flex-shrink-0" />
          <p class="text-sm text-green-600">{successMessage.value}</p>
        </div>
      )}

      {/* Loading State */}
      {loading.value && (
        <div class="flex items-center justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <div class="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm text-gray-500">Loading users...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading.value && users.value.length === 0 && (
        <div class="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-xl">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <LuUsers class="w-8 h-8 text-gray-400" />
          </div>
          <h3 class="text-base font-medium text-gray-900 mb-1">No users online</h3>
          <p class="text-sm text-gray-500">Check back later!</p>
        </div>
      )}

      {/* Users Grid */}
      {!loading.value && users.value.length > 0 && (
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.value.map((user) => {
            const friendConfig = getFriendButtonConfig(user);
            
            return (
              <div
                key={user.id}
                class="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-purple-200 transition-all"
              >
                <div class="flex items-start justify-between mb-4">
                  {/* User Info */}
                  <div class="flex items-center gap-3">
                    <div class="relative">
                      <div class="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span class="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white bg-green-500"></span>
                    </div>
                    
                    <div>
                      <h3 class="font-semibold text-gray-900">{user.username}</h3>
                      <div class="flex items-center gap-1.5 mt-0.5">
                        <div class="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span class="text-xs text-gray-500">Online</span>
                        <span class="text-gray-300">•</span>
                        <span class="text-xs text-gray-500 flex items-center gap-1">
                          {user.is_guest ? (
                            <>
                              <LuUser class="w-3 h-3" />
                              Guest
                            </>
                          ) : (
                            <>
                              <LuCheck class="w-3 h-3" />
                              Registered
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div class="flex gap-2">
                  {/* Friend Request Button */}
                  {friendConfig && (
                    <button
                      onClick$={() => friendConfig.canClick && handleSendFriendRequest(user.id)}
                      disabled={!friendConfig.canClick}
                      class={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        friendConfig.color === 'blue' && friendConfig.canClick
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : friendConfig.color === 'green' && friendConfig.canClick
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : friendConfig.color === 'green' && !friendConfig.canClick
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : friendConfig.color === 'gray'
                          ? 'bg-gray-100 text-gray-600 border border-gray-200'
                          : 'bg-gray-100 text-gray-600'
                      } ${!friendConfig.canClick ? 'cursor-not-allowed' : ''}`}
                    >
                      <friendConfig.icon class="w-4 h-4" />
                      <span>{friendConfig.text}</span>
                    </button>
                  )}

                  {/* Chat Button */}
                  <button
                    onClick$={() => handleStartChat(user.id, user.username)}
                    class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    <LuMessageSquare class="w-4 h-4" />
                    <span>Chat</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export const head = {
  title: "Active Users - Anonymous Chat",
};
