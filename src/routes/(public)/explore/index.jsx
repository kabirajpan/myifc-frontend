import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { roomsApi } from "../../../api/rooms";

export default component$(() => {
  const rooms = useSignal([]);
  const loading = useSignal(true);
  const error = useSignal("");

  // Load rooms
  const loadRooms = $(async () => {
    try {
      loading.value = true;
      const data = await roomsApi.getAllRooms();
      rooms.value = data.rooms || [];
      loading.value = false;
    } catch (err) {
      error.value = err.message;
      loading.value = false;
    }
  });

  useVisibleTask$(async () => {
    await loadRooms();
  });

  return (
  
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div class="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div class="mb-12 text-center">
            <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Explore Chat Rooms
            </h1>
            <p class="text-xl text-gray-600 mb-8">
              Join public rooms and start chatting instantly
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/guest"
                class="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Join as Guest
              </Link>
              <Link
                href="/auth/register"
                class="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Sign Up to Create Rooms
              </Link>
            </div>
          </div>

          {/* Stats Bar */}
          <div class="mb-8 bg-white rounded-xl shadow-lg p-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div class="text-3xl font-bold text-blue-600">
                  {loading.value ? "..." : rooms.value.length}
                </div>
                <div class="text-gray-600">Active Rooms</div>
              </div>
              <div>
                <div class="text-3xl font-bold text-purple-600">
                  {loading.value ? "..." : rooms.value.reduce((sum, r) => sum + (r.member_count || 0), 0)}
                </div>
                <div class="text-gray-600">Active Users</div>
              </div>
              <div>
                <div class="text-3xl font-bold text-green-600">24h</div>
                <div class="text-gray-600">Message Lifetime</div>
              </div>
            </div>
          </div>

          {error.value && (
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error.value}
            </div>
          )}

          {/* Info Banner */}
          <div class="mb-8 bg-gradient-to-r from-blue-100 to-purple-100 border-l-4 border-blue-600 p-6 rounded-lg">
            <h3 class="font-bold text-gray-900 mb-2">🔒 Privacy First</h3>
            <p class="text-gray-700">
              All messages auto-delete after 24 hours. Join as a guest (no email required) 
              or register to create your own rooms. All conversations are private and temporary.
            </p>
          </div>

          {loading.value && (
            <div class="text-center py-12">
              <div class="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
              <p class="text-gray-600 mt-4 text-lg">Loading rooms...</p>
            </div>
          )}

          {!loading.value && rooms.value.length === 0 && (
            <div class="text-center py-16 bg-white rounded-xl shadow-lg">
              <div class="text-6xl mb-4">💬</div>
              <p class="text-gray-600 text-xl mb-2">No active rooms yet.</p>
              <p class="text-gray-500">Be the first to create one!</p>
              <Link
                href="/auth/register"
                class="inline-block mt-6 bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Rooms Grid */}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.value.map((room) => (
              <div
                key={room.id}
                class="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all transform hover:-translate-y-1"
              >
                <div class="flex items-start justify-between mb-4">
                  <h3 class="text-xl font-bold text-gray-800 flex-1">{room.name}</h3>
                  {!!room.is_admin_room && (
                    <span class="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-semibold">
                      OFFICIAL
                    </span>
                  )}
                </div>

                {room.description && (
                  <p class="text-gray-600 text-sm mb-4 line-clamp-2">{room.description}</p>
                )}

                <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span class="font-medium">{room.member_count || 0} online</span>
                  </div>
                  <span class="text-xs">by @{room.creator_username}</span>
                </div>

                {room.will_expire && (
                  <div class="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Closes in {room.time_left_minutes} min</span>
                  </div>
                )}

                <Link
                  href="/auth/guest"
                  class="block w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors"
                >
                  Join Room →
                </Link>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          {!loading.value && rooms.value.length > 0 && (
            <div class="mt-16 text-center bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12 text-white">
              <h2 class="text-3xl font-bold mb-4">Ready to Start Chatting?</h2>
              <p class="text-xl mb-8 opacity-90">
                Join as a guest instantly or create an account to make your own rooms
              </p>
              <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/guest"
                  class="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Quick Guest Access
                </Link>
                <Link
                  href="/auth/register"
                  class="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors"
                >
                  Create Account
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
  
  );
});

export const head = {
  title: "Explore Rooms - Anonymous Chat",
  meta: [
    {
      name: "description",
      content: "Browse and join public chat rooms. Anonymous, secure, and temporary messaging.",
    },
  ],
};
