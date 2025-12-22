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
  LuBell,
  LuSettings,
  LuChevronDown
} from '@qwikest/icons/lucide';

export default component$(() => {
  const nav = useNavigate();
  const auth = useAuth();
  const location = useLocation();
  const mobileMenuOpen = useSignal(false);
  const profileDropdownOpen = useSignal(false);

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
      <nav class="bg-gray-900 shadow-lg sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div class="flex items-center justify-between h-16">
            {/* Left side: Mobile menu button + Logo */}
            <div class="flex items-center">
              {/* Mobile Menu Button - visible on sm and md */}
              <button
                class="lg:hidden mr-3 sm:mr-4 p-2 rounded-lg hover:bg-gray-800 text-gray-300"
                onClick$={() => (mobileMenuOpen.value = !mobileMenuOpen.value)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen.value ? (
                  <LuX class="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <LuMenu class="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </button>

              {/* Logo */}
              <Link href="/dashboard" class="flex items-center space-x-2">
                <div class="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-600 to-pink-800 rounded-lg flex items-center justify-center">
                  <LuMessageSquare class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span class="text-lg sm:text-xl font-bold text-white whitespace-nowrap">
                  Anonymous Chat
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links - Center */}
            <div class="hidden lg:flex items-center flex-1 justify-center">
              <div class="flex items-center space-x-6 xl:space-x-8">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      class={`flex items-center space-x-1 font-medium transition-colors text-sm xl:text-base ${
                        active ? 'text-pink-500' : 'text-gray-300 hover:text-pink-500'
                      }`}
                    >
                      <Icon class="w-4 h-4 flex-shrink-0" />
                      <span class="whitespace-nowrap">{item.label}</span>
                    </Link>
                  );
                })}

                {/* Admin Link - Only for admins */}
                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    class={`flex items-center space-x-1 font-medium transition-colors text-sm xl:text-base ${
                      isActive("/admin") ? 'text-red-400' : 'text-red-400 hover:text-red-300'
                    }`}
                  >
                    <LuShield class="w-4 h-4 flex-shrink-0" />
                    <span class="whitespace-nowrap">Admin</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Right Side: Profile Dropdown - All devices */}
            <div class="flex items-center ml-auto relative">
              <button
                onClick$={() => (profileDropdownOpen.value = !profileDropdownOpen.value)}
                class="flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div class="w-8 h-8 bg-gradient-to-br from-pink-600 to-pink-800 rounded-full flex items-center justify-center">
                  <span class="text-xs font-semibold text-white">
                    {auth.user.value?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span class="text-sm font-medium text-white hidden xl:inline">
                  {auth.user.value?.username}
                </span>
                <LuChevronDown class="w-4 h-4 text-gray-400 hidden sm:block" />
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen.value && (
                <>
                  {/* Backdrop */}
                  <div 
                    class="fixed inset-0 z-30"
                    onClick$={() => (profileDropdownOpen.value = false)}
                  />
                  
                  {/* Menu */}
                  <div class="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-40">
                    {/* User Info */}
                    <div class="px-3 py-2 border-b border-gray-200">
                      <p class="text-sm font-semibold text-gray-900">
                        {auth.user.value?.username}
                      </p>
                      <p class="text-xs text-gray-500 mt-0.5">{auth.user.value?.email || "User"}</p>
                      {(isModerator || isAdmin) && (
                        <div class="flex gap-1 mt-1">
                          {isModerator && (
                            <span class="text-xs bg-blue-500/20 text-blue-600 px-2 py-0.5 rounded font-medium">
                              MOD
                            </span>
                          )}
                          {isAdmin && (
                            <span class="text-xs bg-red-500/20 text-red-600 px-2 py-0.5 rounded font-medium">
                              ADMIN
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Menu Items */}
                    <Link
                      href="/settings"
                      onClick$={() => (profileDropdownOpen.value = false)}
                      class="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LuSettings class="w-4 h-4" />
                      <span>Settings</span>
                    </Link>

                    <Link
                      href="/notifications"
                      onClick$={() => (profileDropdownOpen.value = false)}
                      class="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LuBell class="w-4 h-4" />
                      <span>Notifications</span>
                      <span class="ml-auto w-2 h-2 bg-pink-500 rounded-full"></span>
                    </Link>

                    <div class="border-t border-gray-200 mt-1 pt-1">
                      <button
                        onClick$={async () => {
                          profileDropdownOpen.value = false;
                          await handleLogout();
                        }}
                        class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LuLogOut class="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile/Tablet Slide-in Menu */}
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
          <div class="flex items-center justify-between p-4 border-b border-gray-700">
            <div class="flex items-center space-x-2">
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

          {/* Navigation Links - ONLY navigation items */}
          <div class="p-4 overflow-y-auto h-[calc(100vh-80px)]">
            <div class="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick$={() => (mobileMenuOpen.value = false)}
                    class={`flex items-center space-x-3 font-medium transition-colors p-3 rounded-lg ${
                      active ? 'text-pink-500 bg-gray-800' : 'text-gray-300 hover:text-pink-500 hover:bg-gray-800'
                    }`}
                  >
                    <Icon class="w-5 h-5 flex-shrink-0" />
                    <span class="text-base sm:text-lg">{item.label}</span>
                  </Link>
                );
              })}

              {/* Admin Link - Mobile */}
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  onClick$={() => (mobileMenuOpen.value = false)}
                  class={`flex items-center space-x-3 font-medium transition-colors p-3 rounded-lg ${
                    isActive("/admin") ? 'text-red-400 bg-gray-800' : 'text-red-400 hover:text-red-300 hover:bg-gray-800'
                  }`}
                >
                  <LuShield class="w-5 h-5 flex-shrink-0" />
                  <span class="text-base sm:text-lg">Admin Panel</span>
                </Link>
              )}
            </div>

            {/* Footer Info */}
            <div class="mt-8 pt-4 border-t border-gray-700">
              <div class="text-center text-xs sm:text-sm text-gray-400">
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
