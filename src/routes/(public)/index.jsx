import { component$ } from "@builder.io/qwik";
import { Link, routeLoader$ } from "@builder.io/qwik-city";
import {
  LuUsers,
  LuLock,
  LuMessageSquare,
  LuEye,
  LuShield,
  LuZap,
  LuUserPlus,
  LuLogIn,
  LuUser,
  LuAlertCircle
} from '@qwikest/icons/lucide';

// Server-side data loader - fetches public rooms
export const usePublicRooms = routeLoader$(async () => {
  try {
    const response = await fetch('http://localhost:8000/api/rooms/public');
    
    if (!response.ok) {
      return { rooms: [], error: 'Failed to fetch rooms' };
    }
    
    const data = await response.json();
    return { rooms: data.rooms || [], error: null };
  } catch (err) {
    console.error('Error fetching public rooms:', err);
    return { rooms: [], error: err.message || 'Failed to load rooms' };
  }
});

export default component$(() => {
  const roomsData = usePublicRooms();
  const rooms = roomsData.value.rooms;
  const error = roomsData.value.error;

  return (
    <div class="min-h-screen bg-white">
      {/* Hero Section */}
      <div class="bg-gray-900 text-white pt-20 pb-12 md:pt-24 md:pb-16">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto">
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Anonymous Chat
            </h1>
            <p class="text-lg sm:text-xl text-gray-300 mb-8">
              Connect with people anonymously. Chat securely. Stay private.
            </p>
            
            <div class="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Link
                href="/auth/login"
                class="inline-flex items-center justify-center space-x-2 bg-pink-600 text-white font-medium px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg hover:bg-pink-700 transition-colors"
              >
                <LuLogIn class="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Login</span>
              </Link>
              <Link
                href="/auth/register"
                class="inline-flex items-center justify-center space-x-2 bg-pink-700 text-white font-medium px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg hover:bg-pink-800 transition-colors border border-pink-500"
              >
                <LuUserPlus class="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Register</span>
              </Link>
              <Link
                href="/auth/guest"
                class="inline-flex items-center justify-center space-x-2 bg-transparent text-white font-medium px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg hover:bg-gray-800 transition-colors border border-gray-600"
              >
                <LuUser class="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Guest Access</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Active Rooms Section */}
        <div class="mb-12">
          <div class="mb-6">
            <h2 class="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Active Chat Rooms</h2>
            <p class="text-gray-600">Join a conversation or create your own</p>
          </div>

          {error ? (
            <div class="border border-red-300 bg-red-50 p-4 rounded-lg">
              <div class="flex items-start space-x-3">
                <LuAlertCircle class="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p class="text-red-700 font-semibold">Error loading rooms</p>
                  <p class="text-red-600 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          ) : rooms.length === 0 ? (
            <div class="border border-gray-300 bg-gray-50 p-6 sm:p-8 rounded-xl text-center">
              <div class="max-w-md mx-auto">
                <LuMessageSquare class="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 class="text-xl font-semibold text-gray-700 mb-2">No active rooms</h3>
                <p class="text-gray-600 mb-6">Be the first to create a chat room!</p>
                <Link
                  href="/auth/register"
                  class="inline-flex items-center justify-center space-x-2 bg-pink-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-pink-700 transition-colors"
                >
                  <LuUserPlus class="w-4 h-4" />
                  <span>Create Account</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile List View */}
              <div class="sm:hidden space-y-3">
                {rooms.map((room) => (
                  <div key={room.id} class="border border-gray-300 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex-1 min-w-0">
                        <h3 class="font-semibold text-pink-600 truncate">{room.name}</h3>
                        <p class="text-gray-500 text-xs truncate">
                          {room.description || 'No description'}
                        </p>
                      </div>
                      <div class="flex items-center space-x-3 ml-3">
                        <div class="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded">
                          <LuUsers class="w-3 h-3 text-gray-600" />
                          <span class="text-sm font-medium text-gray-700">{room.member_count}</span>
                        </div>
                        <Link
                          href="/auth/guest"
                          class="inline-flex items-center justify-center space-x-1 bg-pink-600 text-white font-medium px-3 py-1.5 rounded hover:bg-pink-700 transition-colors text-xs whitespace-nowrap"
                        >
                          <LuMessageSquare class="w-3 h-3" />
                          <span>Join</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div class="hidden sm:block border border-gray-300 rounded-xl overflow-hidden">
                <div class="bg-gray-900 text-white">
                  <div class="grid grid-cols-12">
                    <div class="col-span-5 py-3 px-4 font-semibold">Room Name</div>
                    <div class="col-span-4 py-3 px-4 font-semibold">Description</div>
                    <div class="col-span-1 py-3 px-4 font-semibold text-center">Members</div>
                    <div class="col-span-2 py-3 px-4 font-semibold text-center">Action</div>
                  </div>
                </div>
                <div class="divide-y divide-gray-200">
                  {rooms.map((room) => (
                    <div key={room.id} class="grid grid-cols-12 hover:bg-gray-50 transition-colors">
                      <div class="col-span-5 py-3 px-4">
                        <span class="font-semibold text-pink-600">{room.name}</span>
                      </div>
                      <div class="col-span-4 py-3 px-4 text-gray-600 text-sm">
                        {room.description || 'No description'}
                      </div>
                      <div class="col-span-1 py-3 px-4 text-center">
                        <div class="flex items-center justify-center space-x-1">
                          <LuUsers class="w-4 h-4 text-gray-500" />
                          <span class="font-medium text-gray-700">{room.member_count}</span>
                        </div>
                      </div>
                      <div class="col-span-2 py-3 px-4 text-center">
                        <Link
                          href="/auth/guest"
                          class="inline-flex items-center justify-center space-x-2 bg-pink-600 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-pink-700 transition-colors text-sm"
                        >
                          <LuMessageSquare class="w-3 h-3" />
                          <span>Join</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!error && rooms.length > 0 && (
            <div class="mt-8 border border-pink-200 bg-pink-50 p-4 sm:p-6 rounded-xl">
              <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p class="text-gray-700 font-medium">Want to create your own chat room?</p>
                  <p class="text-gray-600 text-sm">Start your own conversation with custom settings</p>
                </div>
                <Link
                  href="/auth/register"
                  class="inline-flex items-center justify-center space-x-2 bg-pink-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-pink-700 transition-colors whitespace-nowrap"
                >
                  <LuUserPlus class="w-4 h-4" />
                  <span>Sign Up Free</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div class="mb-8">
          <div class="mb-6">
            <h2 class="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Features</h2>
            <p class="text-gray-600">Why choose Anonymous Chat</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div class="border border-gray-300 bg-gray-50 p-5 sm:p-6 rounded-xl">
              <div class="flex items-center space-x-3 mb-4">
                <div class="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <LuLock class="w-5 h-5 text-pink-600" />
                </div>
                <h3 class="text-lg font-bold text-gray-800">Private & Secure</h3>
              </div>
              <p class="text-gray-600">
                Your conversations are encrypted and private. We don't store personal information or chat history.
              </p>
            </div>
            
            <div class="border border-gray-300 bg-gray-50 p-5 sm:p-6 rounded-xl">
              <div class="flex items-center space-x-3 mb-4">
                <div class="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <LuZap class="w-5 h-5 text-pink-600" />
                </div>
                <h3 class="text-lg font-bold text-gray-800">Real-time Chat</h3>
              </div>
              <p class="text-gray-600">
                Instant messaging with live updates. See messages as they arrive in real-time with no delays.
              </p>
            </div>
            
            <div class="border border-gray-300 bg-gray-50 p-5 sm:p-6 rounded-xl">
              <div class="flex items-center space-x-3 mb-4">
                <div class="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <LuEye class="w-5 h-5 text-pink-600" />
                </div>
                <h3 class="text-lg font-bold text-gray-800">Anonymous</h3>
              </div>
              <p class="text-gray-600">
                Chat without revealing your identity. No email, phone number, or personal information required.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div class="mt-12 border-t border-gray-300 pt-8">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div class="text-center">
              <div class="text-2xl sm:text-3xl font-bold text-pink-600">24/7</div>
              <div class="text-gray-600 text-sm mt-1">Active Support</div>
            </div>
            <div class="text-center">
              <div class="text-2xl sm:text-3xl font-bold text-pink-600">99.9%</div>
              <div class="text-gray-600 text-sm mt-1">Uptime</div>
            </div>
            <div class="text-center">
              <div class="text-2xl sm:text-3xl font-bold text-pink-600">∞</div>
              <div class="text-gray-600 text-sm mt-1">Rooms Limit</div>
            </div>
            <div class="text-center">
              <div class="text-2xl sm:text-3xl font-bold text-pink-600">0</div>
              <div class="text-gray-600 text-sm mt-1">Data Stored</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const head = {
  title: "Anonymous Chat - Connect Privately",
  meta: [
    {
      name: "description",
      content: "Anonymous chat platform for secure, private conversations. Join active rooms and connect anonymously.",
    },
  ],
};
