import { component$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import {
  LuMessageSquare,
  LuFacebook,
  LuTwitter,
  LuInstagram,
  LuLinkedin,
  LuSparkles,
  LuUsers,
  LuKey,
  LuHelpCircle,
  LuInfo,
  LuMail,
  LuBriefcase,
  LuFileText,
  LuShield,
  LuCookie,
  LuScale,
  LuLock,
  LuGlobe,
  LuClock
} from '@qwikest/icons/lucide';

export default component$(() => {
  const currentYear = new Date().getFullYear();

  return (
    <footer class="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div class="container mx-auto px-4 py-12">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div class="col-span-1 lg:col-span-2">
            <div class="flex items-center space-x-3 mb-4">
              <div class="w-10 h-10 bg-gradient-to-br from-pink-600 to-pink-800 rounded-lg flex items-center justify-center">
                <LuMessageSquare class="w-5 h-5 text-white" />
              </div>
              <span class="text-2xl font-bold text-white">Anonymous Chat</span>
            </div>
            <p class="text-gray-400 mb-6 max-w-md">
              Privacy-first, ephemeral messaging for the modern web. Chat anonymously and securely without leaving a trace.
            </p>
            <div class="flex space-x-3">
              {/* Social Icons */}
              <a 
                href="#" 
                class="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <LuFacebook class="w-4 h-4" />
              </a>
              <a 
                href="#" 
                class="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <LuTwitter class="w-4 h-4" />
              </a>
              <a 
                href="#" 
                class="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <LuInstagram class="w-4 h-4" />
              </a>
              <a 
                href="#" 
                class="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <LuLinkedin class="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 class="text-white font-bold text-lg mb-4 flex items-center space-x-2">
              <LuSparkles class="w-4 h-4 text-pink-500" />
              <span>Quick Links</span>
            </h3>
            <ul class="space-y-2">
              <li>
                <Link 
                  href="/" 
                  class="hover:text-pink-500 transition-colors flex items-center space-x-2"
                >
                  <LuMessageSquare class="w-4 h-4" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/explore" 
                  class="hover:text-pink-500 transition-colors flex items-center space-x-2"
                >
                  <LuUsers class="w-4 h-4" />
                  <span>Explore Rooms</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/features" 
                  class="hover:text-pink-500 transition-colors flex items-center space-x-2"
                >
                  <LuKey class="w-4 h-4" />
                  <span>Features</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/faq" 
                  class="hover:text-pink-500 transition-colors flex items-center space-x-2"
                >
                  <LuHelpCircle class="w-4 h-4" />
                  <span>FAQ</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 class="text-white font-bold text-lg mb-4 flex items-center space-x-2">
              <LuInfo class="w-4 h-4 text-pink-500" />
              <span>Company</span>
            </h3>
            <ul class="space-y-2">
              <li>
                <Link 
                  href="/about" 
                  class="hover:text-pink-500 transition-colors flex items-center space-x-2"
                >
                  <LuUsers class="w-4 h-4" />
                  <span>About Us</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/blog" 
                  class="hover:text-pink-500 transition-colors flex items-center space-x-2"
                >
                  <LuFileText class="w-4 h-4" />
                  <span>Blog</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  class="hover:text-pink-500 transition-colors flex items-center space-x-2"
                >
                  <LuMail class="w-4 h-4" />
                  <span>Contact</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/careers" 
                  class="hover:text-pink-500 transition-colors flex items-center space-x-2"
                >
                  <LuBriefcase class="w-4 h-4" />
                  <span>Careers</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Links Section */}
        <div class="mt-8 pt-8 border-t border-gray-800">
          <h3 class="text-white font-bold text-lg mb-4 flex items-center space-x-2">
            <LuShield class="w-4 h-4 text-pink-500" />
            <span>Legal & Privacy</span>
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link 
              href="/privacy" 
              class="hover:text-pink-500 transition-colors flex items-center space-x-2"
            >
              <LuLock class="w-4 h-4" />
              <span>Privacy Policy</span>
            </Link>
            <Link 
              href="/terms" 
              class="hover:text-pink-500 transition-colors flex items-center space-x-2"
            >
              <LuFileText class="w-4 h-4" />
              <span>Terms of Service</span>
            </Link>
            <Link 
              href="/cookies" 
              class="hover:text-pink-500 transition-colors flex items-center space-x-2"
            >
              <LuCookie class="w-4 h-4" />
              <span>Cookie Policy</span>
            </Link>
            <Link 
              href="/dmca" 
              class="hover:text-pink-500 transition-colors flex items-center space-x-2"
            >
              <LuScale class="w-4 h-4" />
              <span>DMCA</span>
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div class="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p class="text-gray-400 text-sm">
            © {currentYear} Anonymous Chat. All rights reserved.
          </p>
          <div class="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 mt-4 md:mt-0">
            <span class="text-sm text-gray-400 flex items-center space-x-1">
              <LuLock class="w-3 h-3 text-pink-500" />
              <span>End-to-end encrypted</span>
            </span>
            <span class="text-sm text-gray-400 flex items-center space-x-1">
              <LuClock class="w-3 h-3 text-pink-500" />
              <span>Auto-delete messages</span>
            </span>
            <span class="text-sm text-gray-400 flex items-center space-x-1">
              <LuGlobe class="w-3 h-3 text-pink-500" />
              <span>No data collection</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
});
