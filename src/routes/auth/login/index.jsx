import { component$, useSignal, $ } from "@builder.io/qwik";
import { Link, useNavigate } from "@builder.io/qwik-city";
import { authApi } from "../../../api/auth";
import { ApiError } from "../../../api/client";
import { useAuth } from "../../../context/auth";
import {
  LuLock,
  LuUser,
  LuLogIn,
  LuUserPlus,
  LuEye,
  LuEyeOff,
  LuHome,
  LuAlertCircle,
  LuShield
} from '@qwikest/icons/lucide';

export default component$(() => {
  const nav = useNavigate();
  const auth = useAuth();
  
  const usernameOrEmail = useSignal("");
  const password = useSignal("");
  const showPassword = useSignal(false);
  const error = useSignal("");
  const loading = useSignal(false);

  const handleLogin = $(async () => {
    loading.value = true;
    error.value = "";
    
    try {
      const data = await authApi.login(usernameOrEmail.value, password.value);
      
      await auth.setAuth(data);
      
      // Redirect based on role
      if (data.user?.role === 'admin') {
        await nav("/admin/dashboard");
      } else {
        await nav("/dashboard");
      }
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
      {/* Header - Compact */}
      <div class="w-full max-w-sm mb-4 text-center">
        <Link href="/" class="inline-flex items-center space-x-2 text-gray-700 hover:text-pink-600 transition-colors mb-3 text-sm">
          <LuHome class="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        
        <div class="flex items-center justify-center space-x-2 mb-3">
          <div class="w-10 h-10 bg-gradient-to-br from-pink-600 to-pink-800 rounded-lg flex items-center justify-center">
            <LuShield class="w-5 h-5 text-white" />
          </div>
          <div class="text-left">
            <h1 class="text-xl sm:text-2xl font-bold text-gray-900">Welcome Back</h1>
            <p class="text-gray-600 text-xs sm:text-sm">Sign in to continue</p>
          </div>
        </div>
      </div>

      {/* Login Card - Compact */}
      <div class="w-full max-w-sm">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          {error.value && (
            <div class="mb-4 border border-red-300 bg-red-50 p-3 rounded-lg">
              <div class="flex items-start space-x-2">
                <LuAlertCircle class="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div class="text-xs">
                  <p class="text-red-700 font-semibold">Login Failed</p>
                  <p class="text-red-600 mt-0.5">{error.value}</p>
                </div>
              </div>
            </div>
          )}

          <form preventdefault:submit onSubmit$={handleLogin} class="space-y-4">
            {/* Username/Email Field */}
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Username or Email
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LuUser class="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  bind:value={usernameOrEmail}
                  class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-transparent text-sm"
                  placeholder="Enter username or email"
                  required
                  disabled={loading.value}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-medium text-gray-700">
                  Password
                </label>
                <Link 
                  href="/auth/forgot-password" 
                  class="text-xs text-pink-600 hover:text-pink-700 font-medium"
                >
                  Forgot?
                </Link>
              </div>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LuLock class="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type={showPassword.value ? "text" : "password"}
                  bind:value={password}
                  class="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-transparent text-sm"
                  placeholder="Enter password"
                  required
                  disabled={loading.value}
                />
                <button
                  type="button"
                  onClick$={() => showPassword.value = !showPassword.value}
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label={showPassword.value ? "Hide password" : "Show password"}
                >
                  {showPassword.value ? (
                    <LuEyeOff class="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <LuEye class="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading.value}
              class="w-full bg-pink-600 text-white font-medium py-2.5 rounded-lg hover:bg-pink-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
            >
              {loading.value ? (
                <>
                  <div class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LuLogIn class="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div class="my-4 flex items-center">
            <div class="flex-1 border-t border-gray-300"></div>
            <span class="px-3 text-xs text-gray-500">Or</span>
            <div class="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Guest Access Button */}
          <Link
            href="/auth/guest"
            class="w-full inline-flex items-center justify-center space-x-2 bg-transparent text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors border border-gray-300 text-sm mb-3"
          >
            <LuUser class="w-4 h-4" />
            <span>Continue as Guest</span>
          </Link>

          {/* Sign Up Link */}
          <div class="pt-4 border-t border-gray-200 text-center">
            <p class="text-gray-600 text-sm">
              No account?{" "}
              <Link 
                href="/auth/register" 
                class="text-pink-600 font-medium hover:text-pink-700 hover:underline inline-flex items-center space-x-1"
              >
                <LuUserPlus class="w-3 h-3" />
                <span>Create one</span>
              </Link>
            </p>
          </div>
        </div>

        {/* Security Notice - Compact */}
        <div class="mt-4 bg-gray-900 text-gray-300 rounded-lg p-3">
          <div class="flex items-start space-x-2">
            <LuShield class="w-4 h-4 text-pink-400 mt-0.5 flex-shrink-0" />
            <div class="text-xs">
              <p class="font-medium">Your privacy is protected</p>
              <p class="text-gray-400 mt-0.5">
                All chats are encrypted and auto-delete after 24 hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const head = {
  title: "Sign In | Anonymous Chat",
  meta: [
    {
      name: "description",
      content: "Sign in to your anonymous chat account. Secure, private, and encrypted messaging.",
    },
  ],
};
