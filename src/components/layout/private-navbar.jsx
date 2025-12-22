import { component$, $, useSignal } from "@builder.io/qwik";
import { Link, useNavigate, useLocation } from "@builder.io/qwik-city";
import { useAuth } from "../../context/auth";
import { 
  LuLayoutDashboard, 
  LuMessageSquare, 
  LuHome,
  LuUsers,
  LuUserPlus,
  LuLogOut,
  LuMenu,
  LuX,
  LuShield,
  LuUser,
  LuBell,
  LuSettings,
  LuUserCircle
} from '@qwikest/icons/lucide';

export default component$(() => {
  const nav = useNavigate();
  const auth = useAuth();
  const location = useLocation();
  const mobileMenuOpen = useSignal(false);

  const handleLogout = $(async () => {
    await auth.logout();
    nav("/auth/login");
  });

  const isActive = (path) => {
    return location.url.pathname === path || location.url.pathname.startsWith(path + '/');
  };

  const isAdmin = auth.user.value?.role === 'admin';
  const isModerator = auth.user.value?.role === 'moderator';

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LuLayoutDashboard },
    { href: "/chat", label: "Messages", icon: LuMessageSquare },
    { href: "/rooms", label: "Rooms", icon: LuHome },
    { href: "/friends", label: "Friends", icon: LuUserPlus },
    { href: "/users", label: "Users", icon: LuUsers },
  ];

  return (
    <>
      {/* Main Navigation */}
      <header class="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4">
          <div class="flex items-center h-16">
            {/* Left: Mobile menu button */}
            <div class="lg:hidden flex items-center">
              <button
                class="mr-3 p-2 rounded-lg hover:bg-gray-800 text-gray-300"
                onClick$={() => (mobileMenuOpen.value = !mobileMenuOpen.value)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen.value ? (
                  <LuX class="w-5 h-5" />
                ) : (
                  <LuMenu class="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Logo */}
            <div class="flex-1 flex justify-center lg:justify-start lg:flex-none">
              <Link href="/dashboard" class="flex items-center gap-2">
                <div class="w-8 h-8 bg-gradient-to-br from-pink-600 to-pink-800 rounded-lg flex items-center justify-center">
                  <LuMessageSquare class="w-5 h-5 text-white" />
                </div>
                <span class="text-lg font-semibold text-white whitespace-nowrap hidden sm:block">
                  Anonymous Chat
                </span>
              </Link>
            </div>

            {/* Desktop Navigation - Right side */}
            <div class="hidden lg:flex flex-1 items-center justify-between ml-8">
              {/* Desktop Navigation Links */}
              <div class="flex items-center space-x-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      class={`group flex flex-col items-center space-y-0.5 text-gray-300 hover:text-pink-500 transition-colors min-w-[70px] ${
                        active ? 'text-pink-500' : ''
                      }`}
                    >
                      <Icon class="w-5 h-5" />
                      <span class="text-xs font-medium leading-tight group-hover:text-pink-500">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}

                {/* Settings Link */}
                <Link
                  href="/settings"
                  class={`group flex flex-col items-center space-y-0.5 text-gray-300 hover:text-pink-500 transition-colors min-w-[70px] ${
                    isActive("/settings") ? 'text-pink-500' : ''
                  }`}
                >
                  <LuSettings class="w-5 h-5" />
                  <span class="text-xs font-medium leading-tight group-hover:text-pink-500">
                    Settings
                  </span>
                </Link>

                {/* Admin Link - Only for admins */}
                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    class={`group flex flex-col items-center space-y-0.5 text-red-400 hover:text-red-300 transition-colors min-w-[70px] ${
                      isActive("/admin") ? 'text-red-300' : ''
                    }`}
                  >
                    <LuShield class="w-5 h-5" />
                    <span class="text-xs font-medium leading-tight group-hover:text-red-300">
                      Admin
                    </span>
                  </Link>
                )}
              </div>

              {/* Desktop Right Side: User & Actions */}
              <div class="flex items-center space-x-4">
                {/* Notification Bell */}
                <Link
                  href="/notifications"
                  class="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors relative"
                  aria-label="Notifications"
                >
                  <LuBell class="w-5 h-5" />
                  <span class="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
                </Link>

                {/* User Info */}
                <div class="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
                  <div class="w-7 h-7 bg-gradient-to-br from-pink-600 to-pink-800 rounded-full flex items-center justify-center">
                    <span class="text-xs font-semibold text-white">
                      {auth.user.value?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div class="hidden xl:flex items-center gap-2">
                    <span class="text-sm font-medium text-white">
                      {auth.user.value?.username}
                    </span>
                    {isModerator && (
                      <span class="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-medium">
                        MOD
                      </span>
                    )}
                    {isAdmin && (
                      <span class="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-medium">
                        ADMIN
                      </span>
                    )}
                  </div>
                </div>

                {/* Logout Button - Desktop */}
                <button
                  onClick$={handleLogout}
                  class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <LuLogOut class="w-4 h-4" />
                  <span class="hidden xl:inline">Logout</span>
                </button>
              </div>
            </div>

            {/* Mobile Right Side: Notification & User Icon */}
            <div class="lg:hidden flex items-center ml-auto">
              <div class="flex items-center space-x-2">
                <Link
                  href="/notifications"
                  class="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors relative"
                  aria-label="Notifications"
                >
                  <LuBell class="w-5 h-5" />
                  <span class="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
                </Link>
                <button
                  onClick$={() => (mobileMenuOpen.value = true)}
                  class="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg"
                  aria-label="User menu"
                >
                  <LuUserCircle class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Slide-in Menu */}
      <div class={`fixed inset-0 z-50 lg:hidden ${mobileMenuOpen.value ? 'block' : 'hidden'}`}>
        {/* Backdrop Overlay */}
        <div 
          class={`fixed inset-0 bg-black transition-opacity duration-300 ${
            mobileMenuOpen.value ? 'opacity-50' : 'opacity-0 pointer-events-none'
          }`}
          onClick$={() => (mobileMenuOpen.value = false)}
        />

        {/* Slide-in Panel */}
        <div 
          class={`fixed top-0 left-0 h-full w-72 sm:w-80 max-w-full bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out ${
            mobileMenuOpen.value ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Panel Header */}
          <div class="flex items-center justify-between p-4 border-b border-gray-800">
            <div class="flex items-center gap-2">
              <div class="w-10 h-10 bg-gradient-to-br from-pink-600 to-pink-800 rounded-lg flex items-center justify-center">
                <LuMessageSquare class="w-5 h-5 text-white" />
              </div>
              <span class="text-xl font-bold text-white">Menu</span>
            </div>
            <button
              class="p-2 rounded-lg hover:bg-gray-800 text-gray-300"
              onClick$={() => (mobileMenuOpen.value = false)}
              aria-label="Close menu"
            >
              <LuX class="w-6 h-6" />
            </button>
          </div>

          {/* User Info */}
          <div class="p-4 border-b border-gray-800">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-gradient-to-br from-pink-600 to-pink-800 rounded-full flex items-center justify-center">
                <span class="text-lg font-semibold text-white">
                  {auth.user.value?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p class="text-base font-medium text-white flex items-center gap-2">
                  {auth.user.value?.username}
                  {isModerator && (
                    <span class="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-medium">
                      MOD
                    </span>
                  )}
                  {isAdmin && (
                    <span class="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-medium">
                      ADMIN
                    </span>
                  )}
                </p>
                <p class="text-sm text-gray-400">{auth.user.value?.email || "User"}</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div class="p-4 overflow-y-auto h-[calc(100vh-180px)]">
            <div class="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick$={() => (mobileMenuOpen.value = false)}
                    class={`flex items-center gap-3 text-gray-300 hover:text-white hover:bg-gray-800 font-medium transition-colors p-3 rounded-lg ${
                      active ? 'bg-pink-600 text-white' : ''
                    }`}
                  >
                    <Icon class="w-5 h-5 flex-shrink-0" />
                    <span class="text-base">{item.label}</span>
                  </Link>
                );
              })}

              {/* Settings Link */}
              <Link
                href="/settings"
                onClick$={() => (mobileMenuOpen.value = false)}
                class={`flex items-center gap-3 text-gray-300 hover:text-white hover:bg-gray-800 font-medium transition-colors p-3 rounded-lg ${
                  isActive("/settings") ? 'bg-gray-800 text-white' : ''
                }`}
              >
                <LuSettings class="w-5 h-5 flex-shrink-0" />
                <span class="text-base">Settings</span>
              </Link>

              {/* Admin Link - Mobile */}
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  onClick$={() => (mobileMenuOpen.value = false)}
                  class={`flex items-center gap-3 text-red-400 hover:text-white hover:bg-red-600 font-medium transition-colors p-3 rounded-lg ${
                    isActive("/admin") ? 'bg-red-600 text-white' : ''
                  }`}
                >
                  <LuShield class="w-5 h-5 flex-shrink-0" />
                  <span class="text-base">Admin Panel</span>
                </Link>
              )}
            </div>

            {/* Divider */}
            <div class="my-4 border-t border-gray-800" />

            {/* Actions */}
            <div class="space-y-2">
              <Link
                href="/notifications"
                onClick$={() => (mobileMenuOpen.value = false)}
                class="flex items-center gap-3 text-gray-300 hover:text-white hover:bg-gray-800 font-medium transition-colors p-3 rounded-lg"
              >
                <LuBell class="w-5 h-5 flex-shrink-0" />
                <span class="text-base">Notifications</span>
              </Link>

              <button
                onClick$={handleLogout}
                class="w-full flex items-center gap-3 text-gray-300 hover:text-white hover:bg-gray-800 font-medium transition-colors p-3 rounded-lg mt-2"
              >
                <LuLogOut class="w-5 h-5 flex-shrink-0" />
                <span class="text-base">Logout</span>
              </button>
            </div>

            {/* Footer Info */}
            <div class="mt-8 pt-4 border-t border-gray-800">
              <div class="text-center text-xs text-gray-400">
                <p>Anonymous Chat v1.0</p>
                <p class="mt-1">Secure & Private Messaging</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
