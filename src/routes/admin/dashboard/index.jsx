import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { useAuth } from "../../../context/auth";
import { adminApi } from "../../../api/admin";
import { 
  LuUsers, 
  LuMessageSquare, 
  LuHome,
  LuUserX,
  LuRefreshCw,
  LuArrowRight,
  LuTrendingUp,
  LuClock,
  LuAlertCircle,
  LuShield,
  LuActivity
} from '@qwikest/icons/lucide';

export default component$(() => {
  const auth = useAuth();
  const stats = useSignal(null);
  const loading = useSignal(true);
  const error = useSignal(null);

  const loadStats = $(async () => {
    try {
      loading.value = true;
      const data = await adminApi.getStats();
      stats.value = data;
      error.value = null;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  });

  useVisibleTask$(async () => {
    await loadStats();
  });

  if (loading.value) {
    return (
      <div class="flex items-center justify-center py-20">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error.value) {
    return (
      <div class="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-lg">
        <LuAlertCircle class="w-5 h-5 text-red-500 flex-shrink-0" />
        <p class="text-sm text-red-600">{error.value}</p>
      </div>
    );
  }

  return (
    <div class="space-y-5">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p class="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <LuShield class="w-4 h-4" />
            Welcome back, {auth.user.value?.username}
          </p>
        </div>
        <button
          onClick$={loadStats}
          class="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LuRefreshCw class="w-4 h-4" />
        </button>
      </div>

      {/* Stats Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div class="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-purple-200 transition-all">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <LuUsers class="w-5 h-5 text-purple-600" />
            </div>
            <span class="text-xs text-gray-500">Total</span>
          </div>
          <p class="text-2xl font-semibold text-gray-900 mb-1">
            {stats.value?.users.total || 0}
          </p>
          <p class="text-xs text-gray-600 mb-3">Users</p>
          <div class="flex items-center justify-between text-xs">
            <span class="text-green-600 flex items-center gap-1">
              <div class="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              {stats.value?.users.online || 0} online
            </span>
            <span class="text-gray-400">{stats.value?.users.guests || 0} guests</span>
          </div>
        </div>

        {/* Active Chats */}
        <div class="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-200 transition-all">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <LuMessageSquare class="w-5 h-5 text-blue-600" />
            </div>
            <span class="text-xs text-gray-500">Active</span>
          </div>
          <p class="text-2xl font-semibold text-gray-900 mb-1">
            {stats.value?.chats.active || 0}
          </p>
          <p class="text-xs text-gray-600 mb-3">Chats</p>
          <div class="flex items-center justify-between text-xs">
            <span class="text-blue-600 flex items-center gap-1">
              <LuTrendingUp class="w-3 h-3" />
              {stats.value?.chats.total_messages || 0} messages
            </span>
            <span class="text-gray-400 flex items-center gap-1">
              <LuClock class="w-3 h-3" />
              {stats.value?.chats.messages_today || 0} today
            </span>
          </div>
        </div>

        {/* Active Rooms */}
        <div class="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-green-200 transition-all">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <LuHome class="w-5 h-5 text-green-600" />
            </div>
            <span class="text-xs text-gray-500">Active</span>
          </div>
          <p class="text-2xl font-semibold text-gray-900 mb-1">
            {stats.value?.rooms.active || 0}
          </p>
          <p class="text-xs text-gray-600 mb-3">Rooms</p>
          <div class="flex items-center justify-between text-xs">
            <span class="text-green-600 flex items-center gap-1">
              <LuActivity class="w-3 h-3" />
              {stats.value?.rooms.total_messages || 0} messages
            </span>
          </div>
        </div>

        {/* Banned Users */}
        <div class="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-red-200 transition-all">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <LuUserX class="w-5 h-5 text-red-600" />
            </div>
            <span class="text-xs text-gray-500">Total</span>
          </div>
          <p class="text-2xl font-semibold text-red-600 mb-1">
            {stats.value?.users.banned || 0}
          </p>
          <p class="text-xs text-gray-600 mb-3">Banned Users</p>
          <div class="flex items-center justify-between text-xs">
            <span class="text-red-600 flex items-center gap-1">
              <LuClock class="w-3 h-3" />
              {stats.value?.users.new_today || 0} today
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 class="text-base font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/users"
            class="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-purple-200 transition-all"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                <LuUsers class="w-5 h-5 text-purple-600" />
              </div>
              <LuArrowRight class="w-4 h-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 class="font-semibold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
              Manage Users
            </h3>
            <p class="text-xs text-gray-500">
              View, ban, promote, or delete users
            </p>
          </Link>

          <Link
            href="/admin/chats"
            class="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-200 transition-all"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <LuMessageSquare class="w-5 h-5 text-blue-600" />
              </div>
              <LuArrowRight class="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 class="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
              Moderate Chats
            </h3>
            <p class="text-xs text-gray-500">
              View and manage private chat sessions
            </p>
          </Link>

          <Link
            href="/admin/rooms"
            class="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-green-200 transition-all"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <LuHome class="w-5 h-5 text-green-600" />
              </div>
              <LuArrowRight class="w-4 h-4 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 class="font-semibold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
              Manage Rooms
            </h3>
            <p class="text-xs text-gray-500">
              Create and moderate chat rooms
            </p>
          </Link>
        </div>
      </div>

      {/* Additional Stats */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User Breakdown */}
        <div class="bg-white border border-gray-200 rounded-xl p-5">
          <h3 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuUsers class="w-4 h-4" />
            User Breakdown
          </h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Registered Users</span>
              <span class="text-sm font-semibold text-gray-900">
                {stats.value?.users.registered || 0}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Guest Users</span>
              <span class="text-sm font-semibold text-gray-900">
                {stats.value?.users.guests || 0}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Online Now</span>
              <span class="text-sm font-semibold text-green-600">
                {stats.value?.users.online || 0}
              </span>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-gray-100">
              <span class="text-sm text-gray-600">Banned</span>
              <span class="text-sm font-semibold text-red-600">
                {stats.value?.users.banned || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div class="bg-white border border-gray-200 rounded-xl p-5">
          <h3 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuActivity class="w-4 h-4" />
            Activity Summary
          </h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Total Messages (Chats)</span>
              <span class="text-sm font-semibold text-gray-900">
                {stats.value?.chats.total_messages || 0}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Total Messages (Rooms)</span>
              <span class="text-sm font-semibold text-gray-900">
                {stats.value?.rooms.total_messages || 0}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Messages Today</span>
              <span class="text-sm font-semibold text-blue-600">
                {stats.value?.chats.messages_today || 0}
              </span>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-gray-100">
              <span class="text-sm text-gray-600">New Users Today</span>
              <span class="text-sm font-semibold text-green-600">
                {stats.value?.users.new_today || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
