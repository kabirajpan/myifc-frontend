import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
import { useAuth } from "../../../context/auth";
import { friendsApi } from "../../../api/friends";
import { 
  LuUsers, 
  LuUserPlus, 
  LuUserX, 
  LuCheck, 
  LuX, 
  LuAlertCircle,
  LuCheckCircle,
  LuClock,
  LuShield
} from '@qwikest/icons/lucide';

export default component$(() => {
  const auth = useAuth();
  
  const activeTab = useSignal("friends");
  const friends = useSignal([]);
  const pendingRequests = useSignal([]);
  const sentRequests = useSignal([]);
  const blockedUsers = useSignal([]);
  const loading = useSignal(true);
  const error = useSignal("");
  const successMessage = useSignal("");

  // Load all friend data
  const loadData = $(async () => {
    try {
      loading.value = true;
      error.value = "";

      const [friendsData, pendingData, sentData, blockedData] = await Promise.all([
        friendsApi.getFriends(),
        friendsApi.getPendingRequests(),
        friendsApi.getSentRequests(),
        friendsApi.getBlockedUsers()
      ]);

      friends.value = friendsData.friends || [];
      pendingRequests.value = pendingData.requests || [];
      sentRequests.value = sentData.requests || [];
      blockedUsers.value = blockedData.blocked || [];

      loading.value = false;
    } catch (err) {
      error.value = err.message;
      loading.value = false;
    }
  });

  useVisibleTask$(async () => {
    await loadData();
  });

  // Accept friend request
  const handleAccept = $(async (friendshipId) => {
    try {
      await friendsApi.acceptRequest(friendshipId);
      successMessage.value = "Friend request accepted!";
      setTimeout(() => successMessage.value = "", 3000);
      await loadData();
    } catch (err) {
      error.value = err.message;
    }
  });

  // Reject friend request
  const handleReject = $(async (friendshipId) => {
    try {
      await friendsApi.rejectRequest(friendshipId);
      successMessage.value = "Friend request rejected";
      setTimeout(() => successMessage.value = "", 3000);
      await loadData();
    } catch (err) {
      error.value = err.message;
    }
  });

  // Block user
  const handleBlock = $(async (userId) => {
    if (!confirm("Are you sure you want to block this user?")) return;
    
    try {
      await friendsApi.blockUser(userId);
      successMessage.value = "User blocked";
      setTimeout(() => successMessage.value = "", 3000);
      await loadData();
    } catch (err) {
      error.value = err.message;
    }
  });

  // Unblock user
  const handleUnblock = $(async (userId) => {
    try {
      await friendsApi.unblockUser(userId);
      successMessage.value = "User unblocked";
      setTimeout(() => successMessage.value = "", 3000);
      await loadData();
    } catch (err) {
      error.value = err.message;
    }
  });

  const tabs = [
    { id: "friends", label: "Friends", icon: LuUsers, count: friends.value.length },
    { id: "requests", label: "Requests", icon: LuUserPlus, count: pendingRequests.value.length },
    { id: "sent", label: "Sent", icon: LuClock, count: sentRequests.value.length },
    { id: "blocked", label: "Blocked", icon: LuUserX, count: blockedUsers.value.length },
  ];

  return (
    <div class="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Friends</h1>
        <p class="text-sm text-gray-500 mt-1">Manage your connections</p>
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

      {/* Guest User Notice */}
      {auth.user.value?.is_guest && (
        <div class="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
          <LuAlertCircle class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-yellow-800">Guest Account Limitation</p>
            <p class="text-sm text-yellow-700 mt-1">
              Guest users cannot use the friends feature. Please register to add friends!
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      {!auth.user.value?.is_guest && (
        <>
          <div class="flex items-center gap-2 border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab.value === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick$={() => activeTab.value = tab.id}
                  class={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    isActive
                      ? "text-purple-600 border-purple-600"
                      : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  <Icon class="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span class={`text-xs px-2 py-0.5 rounded-full ${
                    isActive 
                      ? "bg-purple-100 text-purple-700" 
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Loading State */}
          {loading.value && (
            <div class="flex items-center justify-center py-20">
              <div class="flex flex-col items-center gap-3">
                <div class="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                <p class="text-sm text-gray-500">Loading...</p>
              </div>
            </div>
          )}

          {/* Friends Tab */}
          {!loading.value && activeTab.value === "friends" && (
            <div class="space-y-3">
              {friends.value.length === 0 ? (
                <div class="flex flex-col items-center justify-center py-20">
                  <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <LuUsers class="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 class="text-base font-medium text-gray-900 mb-1">No friends yet</h3>
                  <p class="text-sm text-gray-500">Send some friend requests to get started!</p>
                </div>
              ) : (
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {friends.value.map((friend) => (
                    <div
                      key={friend.id}
                      class="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <div class="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {friend.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span class="font-medium text-gray-900 block">
                              {friend.username}
                            </span>
                            <span class={`text-xs flex items-center gap-1 ${
                              friend.is_online ? "text-green-600" : "text-gray-500"
                            }`}>
                              <div class={`w-1.5 h-1.5 rounded-full ${
                                friend.is_online ? "bg-green-500" : "bg-gray-400"
                              }`}></div>
                              {friend.is_online ? "Online" : "Offline"}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick$={() => handleBlock(friend.requester_id === auth.user.value.id ? friend.recipient_id : friend.requester_id)}
                          class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Block user"
                        >
                          <LuUserX class="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pending Requests Tab */}
          {!loading.value && activeTab.value === "requests" && (
            <div class="space-y-3">
              {pendingRequests.value.length === 0 ? (
                <div class="flex flex-col items-center justify-center py-20">
                  <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <LuUserPlus class="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 class="text-base font-medium text-gray-900 mb-1">No pending requests</h3>
                  <p class="text-sm text-gray-500">You're all caught up!</p>
                </div>
              ) : (
                <div class="space-y-3">
                  {pendingRequests.value.map((request) => (
                    <div
                      key={request.id}
                      class="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <div class="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {request.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span class="font-medium text-gray-900 block">
                              {request.username}
                            </span>
                            <span class="text-xs text-gray-500">wants to be friends</span>
                          </div>
                        </div>
                        <div class="flex items-center gap-2">
                          <button
                            onClick$={() => handleAccept(request.id)}
                            class="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5"
                          >
                            <LuCheck class="w-4 h-4" />
                            <span class="text-sm">Accept</span>
                          </button>
                          <button
                            onClick$={() => handleReject(request.id)}
                            class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <LuX class="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sent Requests Tab */}
          {!loading.value && activeTab.value === "sent" && (
            <div class="space-y-3">
              {sentRequests.value.length === 0 ? (
                <div class="flex flex-col items-center justify-center py-20">
                  <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <LuClock class="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 class="text-base font-medium text-gray-900 mb-1">No sent requests</h3>
                  <p class="text-sm text-gray-500">You haven't sent any friend requests</p>
                </div>
              ) : (
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sentRequests.value.map((request) => (
                    <div
                      key={request.id}
                      class="bg-white border border-gray-200 rounded-xl p-4"
                    >
                      <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center text-white font-semibold">
                          {request.username.charAt(0).toUpperCase()}
                        </div>
                        <div class="flex-1">
                          <span class="font-medium text-gray-900 block">
                            {request.username}
                          </span>
                          <span class="text-xs text-gray-500 flex items-center gap-1">
                            <LuClock class="w-3 h-3" />
                            Request pending...
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Blocked Users Tab */}
          {!loading.value && activeTab.value === "blocked" && (
            <div class="space-y-3">
              {blockedUsers.value.length === 0 ? (
                <div class="flex flex-col items-center justify-center py-20">
                  <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <LuShield class="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 class="text-base font-medium text-gray-900 mb-1">No blocked users</h3>
                  <p class="text-sm text-gray-500">You haven't blocked anyone</p>
                </div>
              ) : (
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {blockedUsers.value.map((blocked) => (
                    <div
                      key={blocked.id}
                      class="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <div class="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center text-white font-semibold">
                            {blocked.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span class="font-medium text-gray-900 block">
                              {blocked.username}
                            </span>
                            <span class="text-xs text-red-600 flex items-center gap-1">
                              <LuUserX class="w-3 h-3" />
                              Blocked
                            </span>
                          </div>
                        </div>
                        <button
                          onClick$={() => handleUnblock(blocked.recipient_id)}
                          class="px-3 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          Unblock
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
});

export const head = {
  title: "Friends - Anonymous Chat",
};
