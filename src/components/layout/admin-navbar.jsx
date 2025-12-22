import { component$, $, useSignal } from "@builder.io/qwik";
import { Link, useNavigate, useLocation } from "@builder.io/qwik-city";
import { useAuth } from "../../context/auth";
import { 
  LuLayoutDashboard, 
  LuUsers, 
  LuMessageSquare, 
  LuHome,
  LuLogOut,
  LuMenu,
  LuX,
  LuShield
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
    return location.url.pathname === path;
  };

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LuLayoutDashboard },
    { href: "/admin/users", label: "Users", icon: LuUsers },
    { href: "/admin/chats", label: "Chats", icon: LuMessageSquare },
    { href: "/admin/rooms", label: "Rooms", icon: LuHome },
  ];

  return (
    <header class="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          {/* Logo & Badge */}
          <div class="flex items-center gap-3">
            <Link href="/admin/dashboard" class="flex items-center gap-2 group">
              <div class="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <LuShield class="w-5 h-5 text-white" />
              </div>
              <span class="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors hidden sm:block">
                Admin Panel
              </span>
            </Link>
            <span class="hidden md:inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md font-medium">
              {auth.user.value?.role?.toUpperCase()}
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav class="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  class={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-purple-50 text-purple-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon class="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Actions */}
          <div class="flex items-center gap-3">
            {/* User Info - Hidden on mobile */}
            <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
              <div class="w-7 h-7 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
                <span class="text-xs font-semibold text-white">
                  {auth.user.value?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span class="text-sm font-medium text-gray-700">
                {auth.user.value?.username}
              </span>
            </div>

            {/* Logout Button - Desktop */}
            <button
              onClick$={handleLogout}
              class="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LuLogOut class="w-4 h-4" />
              <span>Logout</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick$={() => (mobileMenuOpen.value = !mobileMenuOpen.value)}
              class="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen.value ? (
                <LuX class="w-5 h-5" />
              ) : (
                <LuMenu class="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen.value && (
        <div class="md:hidden border-t border-gray-200 bg-white">
          <nav class="px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick$={() => (mobileMenuOpen.value = false)}
                  class={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-purple-50 text-purple-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon class="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            
            {/* Mobile User Info */}
            <div class="pt-3 mt-3 border-t border-gray-200">
              <div class="flex items-center gap-3 px-3 py-2 mb-2">
                <div class="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
                  <span class="text-sm font-semibold text-white">
                    {auth.user.value?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{auth.user.value?.username}</p>
                  <p class="text-xs text-gray-500">{auth.user.value?.role}</p>
                </div>
              </div>
              
              <button
                onClick$={handleLogout}
                class="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LuLogOut class="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
});
