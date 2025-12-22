import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { Link, routeLoader$ } from "@builder.io/qwik-city";
import { useAuth } from "../../../context/auth";
import { authApi } from "../../../api/auth";

// Server-side data loader for rooms count
export const useDashboardData = routeLoader$(async () => {
  try {
    const response = await fetch('http://localhost:8000/api/rooms/public');
    const data = await response.json();
    
    return {
      roomsCount: data.count || 0,
      rooms: data.rooms || []
    };
  } catch (error) {
    return { roomsCount: 0, rooms: [] };
  }
});

export default component$(() => {
  const auth = useAuth();
  const dashboardData = useDashboardData();
  const onlineUsersCount = useSignal(0);
  const loading = useSignal(true);

  // Fetch online users count
  useVisibleTask$(async () => {
    try {
      const data = await authApi.getOnlineUsers();
      onlineUsersCount.value = data.count || 0;
    } catch (error) {
      console.error("Failed to fetch online users:", error);
    } finally {
      loading.value = false;
    }
  });

  return (
    <div class="space-y-8">
      {/* Welcome Section */}
      <div class="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-8 text-white">
        <h1 class="text-3xl md:text-4xl font-bold mb-2">
          Welcome back, {auth.user.value?.username}! 👋
        </h1>
        <p class="text-purple-100">
          {auth.user.value?.is_guest 
            ? "You're browsing as a guest. Register to save your chats!"
            : "Ready to connect and chat?"}
        </p>
      </div>

      {/* Stats Grid */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Online Users */}
        <div class="bg-white rounded-xl p-6 shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-medium">Online Users</p>
              <p class="text-3xl font-bold text-purple-600 mt-2">
                {loading.value ? "..." : onlineUsersCount.value}
              </p>
            </div>
            <div class="text-4xl">👥</div>
          </div>
        </div>

        {/* Active Rooms */}
        <div class="bg-white rounded-xl p-6 shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-medium">Active Rooms</p>
              <p class="text-3xl font-bold text-green-600 mt-2">
                {dashboardData.value.roomsCount}
              </p>
            </div>
            <div class="text-4xl">🏠</div>
          </div>
        </div>

        {/* Your Status */}
        <div class="bg-white rounded-xl p-6 shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-medium">Your Status</p>
              <p class="text-2xl font-bold text-indigo-600 mt-2 capitalize">
                {auth.user.value?.is_guest ? "Guest" : "Member"}
              </p>
            </div>
            <div class="text-4xl">
              {auth.user.value?.is_guest ? "👻" : "✅"}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/chat"
            class="bg-white hover:bg-purple-50 rounded-xl p-6 shadow-md transition-all group"
          >
            <div class="text-4xl mb-3">💬</div>
            <h3 class="text-xl font-semibold text-gray-800 group-hover:text-purple-600">
              Start Chatting
            </h3>
            <p class="text-gray-600 text-sm mt-2">
              Send direct messages to other users
            </p>
          </Link>

          <Link
            href="/rooms"
            class="bg-white hover:bg-purple-50 rounded-xl p-6 shadow-md transition-all group"
          >
            <div class="text-4xl mb-3">🏠</div>
            <h3 class="text-xl font-semibold text-gray-800 group-hover:text-purple-600">
              Browse Rooms
            </h3>
            <p class="text-gray-600 text-sm mt-2">
              Join public chat rooms and meet new people
            </p>
          </Link>

          <Link
            href="/users"
            class="bg-white hover:bg-purple-50 rounded-xl p-6 shadow-md transition-all group"
          >
            <div class="text-4xl mb-3">👥</div>
            <h3 class="text-xl font-semibold text-gray-800 group-hover:text-purple-600">
              Find Users
            </h3>
            <p class="text-gray-600 text-sm mt-2">
              See who's online and start chatting
            </p>
          </Link>
        </div>
      </div>

      {/* Guest Notice */}
      {auth.user.value?.is_guest && (
        <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div class="flex items-start">
            <div class="text-3xl mr-4">⚠️</div>
            <div>
              <h3 class="text-lg font-semibold text-yellow-800 mb-2">
                You're using a guest account
              </h3>
              <p class="text-yellow-700 mb-4">
                Guest accounts are temporary. Register to save your chats and make friends!
              </p>
              <Link
                href="/auth/register"
                class="inline-block bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export const head = {
  title: "Dashboard - Anonymous Chat",
};
