import { component$, useSignal } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { 
  LuMessageSquare,
  LuHome,
  LuInfo,
  LuShield,
  LuSearch,
  LuLogIn,
  LuUserPlus,
  LuUser,
  LuMenu,
  LuX
} from '@qwikest/icons/lucide';

export default component$(() => {
  const isMobileMenuOpen = useSignal(false);

  return (
    <>
      {/* Main Navigation */}
      <nav class="bg-gray-900 shadow-lg sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div class="flex items-center justify-between h-16">
            {/* Left side: Logo and mobile menu button */}
            <div class="flex items-center">
              {/* Mobile Menu Button - visible on sm and md */}
              <button
                class="lg:hidden mr-3 sm:mr-4 p-2 rounded-lg hover:bg-gray-800 text-gray-300"
                onClick$={() => (isMobileMenuOpen.value = !isMobileMenuOpen.value)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen.value ? (
                  <LuX class="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <LuMenu class="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </button>

              {/* Logo */}
              <Link href="/" class="flex items-center space-x-2">
                <div class="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-600 to-pink-800 rounded-lg flex items-center justify-center">
                  <LuMessageSquare class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span class="text-lg sm:text-xl font-bold text-white whitespace-nowrap">
                  Anonymous Chat
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links - visible from lg (1024px) */}
            <div class="hidden lg:flex items-center flex-1 justify-center">
              <div class="flex items-center space-x-6 xl:space-x-8">
                <Link 
                  href="/" 
                  class="flex items-center space-x-1 text-gray-300 hover:text-pink-500 font-medium transition-colors text-sm xl:text-base"
                >
                  <LuHome class="w-4 h-4 flex-shrink-0" />
                  <span class="whitespace-nowrap">Home</span>
                </Link>
                <Link 
                  href="/about" 
                  class="flex items-center space-x-1 text-gray-300 hover:text-pink-500 font-medium transition-colors text-sm xl:text-base"
                >
                  <LuInfo class="w-4 h-4 flex-shrink-0" />
                  <span class="whitespace-nowrap">About</span>
                </Link>
                <Link 
                  href="/features" 
                  class="flex items-center space-x-1 text-gray-300 hover:text-pink-500 font-medium transition-colors text-sm xl:text-base"
                >
                  <LuMessageSquare class="w-4 h-4 flex-shrink-0" />
                  <span class="whitespace-nowrap">Features</span>
                </Link>
                <Link 
                  href="/explore" 
                  class="flex items-center space-x-1 text-gray-300 hover:text-pink-500 font-medium transition-colors text-sm xl:text-base"
                >
                  <LuSearch class="w-4 h-4 flex-shrink-0" />
                  <span class="whitespace-nowrap">Explore</span>
                </Link>
                <Link 
                  href="/privacy" 
                  class="flex items-center space-x-1 text-gray-300 hover:text-pink-500 font-medium transition-colors text-sm xl:text-base"
                >
                  <LuShield class="w-4 h-4 flex-shrink-0" />
                  <span class="whitespace-nowrap">Privacy</span>
                </Link>
              </div>
            </div>

            {/* Desktop Auth Buttons - visible from lg (1024px) */}
            <div class="hidden lg:flex items-center ml-auto">
              <div class="flex items-center space-x-4 xl:space-x-6">
                <Link 
                  href="/auth/login" 
                  class="flex items-center space-x-1 text-gray-300 hover:text-pink-500 font-medium transition-colors text-sm xl:text-base"
                >
                  <LuLogIn class="w-4 h-4 flex-shrink-0" />
                  <span class="whitespace-nowrap">Login</span>
                </Link>
                <Link 
                  href="/auth/register" 
                  class="flex items-center space-x-1 bg-pink-600 text-white px-3 xl:px-4 py-2 rounded-lg font-medium hover:bg-pink-700 transition-colors text-sm xl:text-base"
                >
                  <LuUserPlus class="w-4 h-4 flex-shrink-0" />
                  <span class="whitespace-nowrap">Sign Up</span>
                </Link>
                <Link 
                  href="/auth/guest" 
                  class="flex items-center space-x-1 bg-transparent text-white px-3 xl:px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors border border-gray-600 text-sm xl:text-base"
                >
                  <LuUser class="w-4 h-4 flex-shrink-0" />
                  <span class="whitespace-nowrap">Guest</span>
                </Link>
              </div>
            </div>

            {/* Mobile/Tablet Auth Buttons - visible on sm and md (up to 1023px) */}
            <div class="lg:hidden flex items-center">
              <div class="flex items-center space-x-2 sm:space-x-3">
                <Link 
                  href="/auth/login" 
                  class="p-2 text-gray-300 hover:text-pink-500"
                  aria-label="Login"
                >
                  <LuLogIn class="w-5 h-5 sm:w-5 sm:h-5" />
                </Link>
                <Link 
                  href="/auth/register" 
                  class="p-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                  aria-label="Sign Up"
                >
                  <LuUserPlus class="w-5 h-5 sm:w-5 sm:h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile/Tablet Slide-in Menu - visible up to 1023px */}
      <div class={`fixed inset-0 z-50 lg:hidden ${isMobileMenuOpen.value ? 'block' : 'hidden'}`}>
        {/* Backdrop Overlay */}
        <div 
          class={`fixed inset-0 bg-black transition-opacity duration-300 ${
            isMobileMenuOpen.value ? 'opacity-50' : 'opacity-0 pointer-events-none'
          }`}
          onClick$={() => (isMobileMenuOpen.value = false)}
        />

        {/* Slide-in Panel */}
        <div 
          class={`fixed top-0 left-0 h-full w-72 sm:w-80 max-w-full bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen.value ? 'translate-x-0' : '-translate-x-full'
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
              onClick$={() => (isMobileMenuOpen.value = false)}
              aria-label="Close menu"
            >
              <LuX class="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <div class="p-4 overflow-y-auto h-[calc(100vh-80px)]">
            <div class="space-y-1">
              <Link 
                href="/" 
                class="flex items-center space-x-3 text-gray-300 hover:text-pink-500 hover:bg-gray-800 font-medium transition-colors p-3 rounded-lg"
                onClick$={() => isMobileMenuOpen.value = false}
              >
                <LuHome class="w-5 h-5 flex-shrink-0" />
                <span class="text-base sm:text-lg">Home</span>
              </Link>
              
              <Link 
                href="/about" 
                class="flex items-center space-x-3 text-gray-300 hover:text-pink-500 hover:bg-gray-800 font-medium transition-colors p-3 rounded-lg"
                onClick$={() => isMobileMenuOpen.value = false}
              >
                <LuInfo class="w-5 h-5 flex-shrink-0" />
                <span class="text-base sm:text-lg">About</span>
              </Link>
              
              <Link 
                href="/features" 
                class="flex items-center space-x-3 text-gray-300 hover:text-pink-500 hover:bg-gray-800 font-medium transition-colors p-3 rounded-lg"
                onClick$={() => isMobileMenuOpen.value = false}
              >
                <LuMessageSquare class="w-5 h-5 flex-shrink-0" />
                <span class="text-base sm:text-lg">Features</span>
              </Link>
              
              <Link 
                href="/explore" 
                class="flex items-center space-x-3 text-gray-300 hover:text-pink-500 hover:bg-gray-800 font-medium transition-colors p-3 rounded-lg"
                onClick$={() => isMobileMenuOpen.value = false}
              >
                <LuSearch class="w-5 h-5 flex-shrink-0" />
                <span class="text-base sm:text-lg">Explore Rooms</span>
              </Link>
              
              <Link 
                href="/privacy" 
                class="flex items-center space-x-3 text-gray-300 hover:text-pink-500 hover:bg-gray-800 font-medium transition-colors p-3 rounded-lg"
                onClick$={() => isMobileMenuOpen.value = false}
              >
                <LuShield class="w-5 h-5 flex-shrink-0" />
                <span class="text-base sm:text-lg">Privacy</span>
              </Link>
            </div>

            {/* Divider */}
            <div class="my-6 border-t border-gray-700" />

            {/* Auth Buttons */}
            <div class="space-y-3">
              <div class="text-xs text-gray-400 font-semibold uppercase tracking-wider px-3">
                Account
              </div>
              
              <Link 
                href="/auth/login" 
                class="flex items-center space-x-3 text-gray-300 hover:text-pink-500 hover:bg-gray-800 font-medium transition-colors p-3 rounded-lg"
                onClick$={() => isMobileMenuOpen.value = false}
              >
                <LuLogIn class="w-5 h-5 flex-shrink-0" />
                <span class="text-base sm:text-lg">Login</span>
              </Link>
              
              <Link 
                href="/auth/register" 
                class="flex items-center space-x-2 bg-pink-600 text-white p-3 rounded-lg font-medium hover:bg-pink-700 transition-colors"
                onClick$={() => isMobileMenuOpen.value = false}
              >
                <LuUserPlus class="w-5 h-5 flex-shrink-0" />
                <span class="text-base sm:text-lg font-medium">Sign Up</span>
              </Link>
              
              <Link 
                href="/auth/guest" 
                class="flex items-center space-x-2 bg-transparent text-white p-3 rounded-lg font-medium hover:bg-gray-800 transition-colors border border-gray-600"
                onClick$={() => isMobileMenuOpen.value = false}
              >
                <LuUser class="w-5 h-5 flex-shrink-0" />
                <span class="text-base sm:text-lg font-medium">Guest Mode</span>
              </Link>
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
