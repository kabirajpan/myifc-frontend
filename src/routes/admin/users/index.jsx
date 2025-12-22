import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { useAuth } from "../../../context/auth";
import { adminApi } from "../../../api/admin";
import { 
  LuSearch, 
  LuRefreshCw, 
  LuShield,
  LuUser,
  LuUserX,
  LuTrash2,
  LuX,
  LuAlertCircle,
  LuCrown,
  LuUserCheck,
  LuBan,
  LuCheckCircle,
  LuArrowUp
} from '@qwikest/icons/lucide';

export default component$(() => {
  const auth = useAuth();
  const users = useSignal([]);
  const loading = useSignal(true);
  const error = useSignal(null);
  const searchTerm = useSignal("");
  const roleFilter = useSignal("all");
  const selectedUser = useSignal(null);
  const showBanModal = useSignal(false);
  const banDuration = useSignal(1);
  const banReason = useSignal("");

  const isAdminOrMod = auth.user.value?.role === 'admin' || auth.user.value?.role === 'moderator';
  const isAdmin = auth.user.value?.role === 'admin';

  // Load users
  const loadUsers = $(async () => {
    try {
      loading.value = true;
      const filters = {};
      if (roleFilter.value && roleFilter.value !== "all") filters.role = roleFilter.value;
      if (searchTerm.value) filters.search = searchTerm.value;

      const data = await adminApi.getUsers(filters);
      users.value = data.users;
      error.value = null;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  });

  useVisibleTask$(async () => {
    if (isAdminOrMod) {
      await loadUsers();
    }
  });

  // Ban user
  const handleBan = $(async () => {
    if (!selectedUser.value) return;

    try {
      await adminApi.banUser(
        selectedUser.value.id,
        banDuration.value,
        banReason.value || "Violation of terms"
      );
      showBanModal.value = false;
      selectedUser.value = null;
      banReason.value = "";
      await loadUsers();
      alert("User banned successfully");
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  });

  // Unban user
  const handleUnban = $(async (userId) => {
    if (!confirm("Are you sure you want to unban this user?")) return;

    try {
      await adminApi.unbanUser(userId);
      await loadUsers();
      alert("User unbanned successfully");
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  });

  // Delete user (admin only)
  const handleDelete = $(async (userId) => {
    if (!confirm("Are you sure? This will permanently delete the user and all their data!")) return;

    try {
      await adminApi.deleteUser(userId);
      await loadUsers();
      alert("User deleted successfully");
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  });

  // Promote user (admin only)
  const handlePromote = $(async (userId, role) => {
    if (!confirm(`Promote user to ${role}?`)) return;

    try {
      await adminApi.promoteUser(userId, role);
      await loadUsers();
      alert(`User promoted to ${role}`);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  });

  // Filter users based on search
  const filteredUsers = users.value.filter((user) => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.value.toLowerCase());
    
    return matchesSearch;
  });

  if (!isAdminOrMod) {
    return (
      <div class="flex items-center justify-center min-h-[60vh]">
        <div class="text-center">
          <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <LuAlertCircle class="w-8 h-8 text-red-500" />
          </div>
          <h2 class="text-lg font-semibold text-gray-900">Access Denied</h2>
          <p class="text-sm text-gray-500 mt-1">You don't have permission to view this page</p>
        </div>
      </div>
    );
  }

  return (
    <div class="space-y-5">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Users</h1>
          <p class="text-sm text-gray-500 mt-1">Manage users and permissions</p>
        </div>
        <button
          onClick$={loadUsers}
          class="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LuRefreshCw class="w-4 h-4" />
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div class="flex items-center gap-3">
        <div class="flex-1 relative">
          <LuSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm.value}
            onInput$={(e) => (searchTerm.value = e.target.value)}
            class="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div class="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick$={() => {
              roleFilter.value = "all";
              loadUsers();
            }}
            class={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              roleFilter.value === "all"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All
          </button>
          <button
            onClick$={() => {
              roleFilter.value = "guest";
              loadUsers();
            }}
            class={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              roleFilter.value === "guest"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Guest
          </button>
          <button
            onClick$={() => {
              roleFilter.value = "user";
              loadUsers();
            }}
            class={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              roleFilter.value === "user"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            User
          </button>
          <button
            onClick$={() => {
              roleFilter.value = "moderator";
              loadUsers();
            }}
            class={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              roleFilter.value === "moderator"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Mod
          </button>
          <button
            onClick$={() => {
              roleFilter.value = "admin";
              loadUsers();
            }}
            class={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              roleFilter.value === "admin"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Admin
          </button>
          <button
            onClick$={() => {
              roleFilter.value = "banned";
              loadUsers();
            }}
            class={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              roleFilter.value === "banned"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Banned
          </button>
        </div>
      </div>

      {/* Error State */}
      {error.value && (
        <div class="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-lg">
          <LuAlertCircle class="w-5 h-5 text-red-500 flex-shrink-0" />
          <p class="text-sm text-red-600">{error.value}</p>
        </div>
      )}

      {/* Users Grid */}
      {loading.value ? (
        <div class="flex items-center justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <div class="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm text-gray-500">Loading users...</p>
          </div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div class="flex flex-col items-center justify-center py-20">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <LuUser class="w-8 h-8 text-gray-400" />
          </div>
          <h3 class="text-base font-medium text-gray-900">No users found</h3>
          <p class="text-sm text-gray-500 mt-1">
            {searchTerm.value ? "Try adjusting your search" : "No users match the selected filter"}
          </p>
        </div>
      ) : (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              class="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-purple-200 transition-all"
            >
              {/* User Header */}
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-semibold text-gray-900">{user.username}</h3>
                    <div class={`w-2 h-2 rounded-full ${user.is_online ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>
                  <p class="text-xs text-gray-500">{user.name || user.email || "No details"}</p>
                </div>
                <span
                  class={`px-2 py-1 text-xs font-medium rounded-md flex items-center gap-1 flex-shrink-0 ${
                    user.role === "admin"
                      ? "bg-red-50 text-red-700"
                      : user.role === "moderator"
                      ? "bg-orange-50 text-orange-700"
                      : user.role === "banned"
                      ? "bg-gray-900 text-white"
                      : user.role === "guest"
                      ? "bg-gray-50 text-gray-700"
                      : "bg-green-50 text-green-700"
                  }`}
                >
                  {user.role === "admin" && <LuCrown class="w-3 h-3" />}
                  {user.role === "moderator" && <LuShield class="w-3 h-3" />}
                  {user.role === "banned" && <LuBan class="w-3 h-3" />}
                  {user.role === "guest" && <LuUser class="w-3 h-3" />}
                  {user.role === "user" && <LuUserCheck class="w-3 h-3" />}
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>

              {/* User Stats */}
              <div class="flex items-center gap-3 text-xs text-gray-500 mb-4">
                <span class={`flex items-center gap-1 ${user.is_online ? 'text-green-600' : ''}`}>
                  {user.is_online ? <LuCheckCircle class="w-3 h-3" /> : null}
                  {user.is_online ? "Online" : "Offline"}
                </span>
                <span class="text-gray-300">•</span>
                <span>{user.is_guest ? "Guest Account" : "Registered"}</span>
              </div>

              {/* Actions */}
              <div class="flex items-center gap-2 pt-3 border-t border-gray-100">
                {user.role === "banned" ? (
                  <button
                    onClick$={() => handleUnban(user.id)}
                    class="flex-1 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 rounded-md transition-colors flex items-center justify-center gap-1"
                  >
                    <LuCheckCircle class="w-3 h-3" />
                    Unban
                  </button>
                ) : (
                  <button
                    onClick$={() => {
                      selectedUser.value = user;
                      showBanModal.value = true;
                    }}
                    class="flex-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center justify-center gap-1"
                  >
                    <LuUserX class="w-3 h-3" />
                    Ban
                  </button>
                )}

                {isAdmin && user.role !== "admin" && (
                  <>
                    {user.role !== "moderator" && (
                      <button
                        onClick$={() => handlePromote(user.id, "moderator")}
                        class="px-3 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-50 rounded-md transition-colors flex items-center gap-1"
                        title="Promote to Moderator"
                      >
                        <LuArrowUp class="w-3 h-3" />
                        Mod
                      </button>
                    )}
                    <button
                      onClick$={() => handleDelete(user.id)}
                      class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete User"
                    >
                      <LuTrash2 class="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal.value && selectedUser.value && (
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-xl font-semibold text-gray-900">Ban User</h2>
              <button
                onClick$={() => {
                  showBanModal.value = false;
                  selectedUser.value = null;
                  banReason.value = "";
                }}
                class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LuX class="w-5 h-5" />
              </button>
            </div>

            <div class="mb-4 p-3 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-600">
                User: <span class="font-semibold text-gray-900">{selectedUser.value.username}</span>
              </p>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Ban Duration
                </label>
                <select
                  value={banDuration.value}
                  onChange$={(e) => (banDuration.value = parseInt(e.target.value))}
                  class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value={1}>1 Day</option>
                  <option value={3}>3 Days</option>
                  <option value={7}>1 Week</option>
                  {isAdmin && <option value={0}>Permanent</option>}
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <textarea
                  value={banReason.value}
                  onInput$={(e) => (banReason.value = e.target.value)}
                  placeholder="Violation of community guidelines..."
                  class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div class="flex gap-3 pt-2">
                <button
                  onClick$={handleBan}
                  class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <LuUserX class="w-4 h-4" />
                  Ban User
                </button>
                <button
                  onClick$={() => {
                    showBanModal.value = false;
                    selectedUser.value = null;
                    banReason.value = "";
                  }}
                  class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
