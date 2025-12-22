import { component$, useSignal, $ } from "@builder.io/qwik";
import { Link, useNavigate } from "@builder.io/qwik-city";
import { authApi } from "../../../api/auth";
import { ApiError } from "../../../api/client";
import { useAuth } from "../../../context/auth";
import {
  LuUser,
  LuUserPlus,
  LuUserCircle,
  LuCalendar,
  LuHome,
  LuAlertCircle,
  LuLock,
  LuSparkles,
  LuChevronDown
} from '@qwikest/icons/lucide';

export default component$(() => {
  const nav = useNavigate();
  const auth = useAuth();
  
  const username = useSignal("");
  const gender = useSignal("male");
  const age = useSignal("");
  const error = useSignal("");
  const loading = useSignal(false);

  const handleGuestLogin = $(async () => {
    loading.value = true;
    error.value = "";
    
    // Validation
    if (age.value && parseInt(age.value) < 18) {
      error.value = "You must be at least 18 years old";
      loading.value = false;
      return;
    }

    try {
      const data = await authApi.guestLogin(
        username.value,
        gender.value,
        parseInt(age.value)
      );
      
      await auth.setAuth(data);
      await nav("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        error.value = err.message;
      } else {
        error.value = "An unexpected error occurred";
      }
      loading.value = false;
    }
  });

  return (
    <div class="min-h-screen bg-gray-50 flex flex-col items-center px-4 pt-10 sm:pt-8">
      {/* Header */}
      <div class="w-full max-w-sm mb-6 text-center">
        <Link href="/" class="inline-flex items-center space-x-2 text-gray-700 hover:text-pink-600 transition-colors mb-3 text-sm">
          <LuHome class="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        
        <div class="flex items-center justify-center space-x-2 mb-3">
          <div class="w-10 h-10 bg-gradient-to-br from-pink-600 to-pink-800 rounded-lg flex items-center justify-center">
            <LuUserCircle class="w-5 h-5 text-white" />
          </div>
          <div class="text-left">
            <h1 class="text-xl sm:text-2xl font-bold text-gray-900">Guest Access</h1>
            <p class="text-gray-600 text-xs sm:text-sm">Join anonymously</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div class="w-full max-w-sm">
        {/* Guest Form Card */}
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          {/* Guest Benefits */}
          <div class="mb-4 bg-pink-50 border border-pink-200 rounded-lg p-3">
            <div class="flex items-start space-x-2">
              <LuSparkles class="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0" />
              <div class="text-xs">
                <p class="font-medium text-gray-800">Quick Access</p>
                <ul class="text-gray-600 mt-1 space-y-0.5">
                  <li>• Join chat rooms instantly</li>
                  <li>• No registration required</li>
                  <li>• Sessions expire after 24h</li>
                </ul>
              </div>
            </div>
          </div>

          {error.value && (
            <div class="mb-4 border border-red-300 bg-red-50 p-3 rounded-lg">
              <div class="flex items-start space-x-2">
                <LuAlertCircle class="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div class="text-xs">
                  <p class="text-red-700 font-semibold">Access Failed</p>
                  <p class="text-red-600 mt-0.5">{error.value}</p>
                </div>
              </div>
            </div>
          )}

          <form preventdefault:submit onSubmit$={handleGuestLogin} class="space-y-4">
            {/* Nickname */}
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Choose a Nickname *
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LuUser class="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  bind:value={username}
                  class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-transparent text-sm"
                  placeholder="Your nickname in chat"
                  required
                  disabled={loading.value}
                />
              </div>
            </div>

            {/* Gender and Age Row */}
            <div class="grid grid-cols-2 gap-3">
              {/* Gender */}
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <div class="relative">
                  <select
                    bind:value={gender}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-transparent text-sm appearance-none bg-white"
                    disabled={loading.value}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                  <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                    <LuChevronDown class="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Age */}
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">
                  Age *
                </label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LuCalendar class="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    bind:value={age}
                    min="18"
                    max="100"
                    class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-transparent text-sm"
                    placeholder="18+"
                    required
                    disabled={loading.value}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading.value}
              class="w-full bg-pink-600 text-white font-medium py-2.5 rounded-lg hover:bg-pink-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm mt-2"
            >
              {loading.value ? (
                <>
                  <div class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <LuUserCircle class="w-4 h-4" />
                  <span>Join as Guest</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div class="my-4 flex items-center">
            <div class="flex-1 border-t border-gray-300"></div>
            <span class="px-3 text-xs text-gray-500">Want permanent access?</span>
            <div class="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Registration Link */}
          <div class="text-center">
            <Link 
              href="/auth/register" 
              class="inline-flex items-center justify-center space-x-2 w-full bg-transparent text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors border border-gray-300 text-sm"
            >
              <LuUserPlus class="w-4 h-4" />
              <span>Create Permanent Account</span>
            </Link>
          </div>

          {/* Existing Account Link */}
          <div class="mt-3 text-center">
            <p class="text-gray-600 text-xs">
              Have an account?{" "}
              <Link 
                href="/auth/login" 
                class="text-pink-600 font-medium hover:text-pink-700 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Privacy Notice - Compact */}
        <div class="mt-4 bg-gray-900 text-gray-300 rounded-lg p-3">
          <div class="flex items-start space-x-2">
            <LuLock class="w-4 h-4 text-pink-400 mt-0.5 flex-shrink-0" />
            <div class="text-xs">
              <p class="font-medium">Guest Session Privacy</p>
              <p class="text-gray-400 mt-0.5">
                No personal info required. Chats are encrypted and auto-delete.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const head = {
  title: "Guest Access | Anonymous Chat",
  meta: [
    {
      name: "description",
      content: "Join anonymous chat rooms instantly as a guest. No registration required. Chat securely and privately.",
    },
  ],
};
