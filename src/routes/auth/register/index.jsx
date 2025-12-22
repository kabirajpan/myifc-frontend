import { component$, useSignal, $ } from "@builder.io/qwik";
import { Link, useNavigate } from "@builder.io/qwik-city";
import { authApi } from "../../../api/auth";
import { ApiError } from "../../../api/client";
import {
  LuUser,
  LuMail,
  LuLock,
  LuUserPlus,
  LuCheckCircle,
  LuHome,
  LuAlertCircle,
  LuShield,
  LuCalendar,
  LuEye,
  LuEyeOff,
  LuUserCircle,
  LuChevronDown
} from '@qwikest/icons/lucide';

export default component$(() => {
  const navigate = useNavigate();
  
  const username = useSignal("");
  const email = useSignal("");
  const password = useSignal("");
  const confirmPassword = useSignal("");
  const name = useSignal("");
  const gender = useSignal("male");
  const age = useSignal("");
  
  const showPassword = useSignal(false);
  const showConfirmPassword = useSignal(false);
  const error = useSignal("");
  const success = useSignal(false);
  const loading = useSignal(false);

  const handleRegister = $(async () => {
    // Reset errors
    error.value = "";
    loading.value = true;

    // Validation
    if (password.value !== confirmPassword.value) {
      error.value = "Passwords do not match";
      loading.value = false;
      return;
    }

    if (age.value && parseInt(age.value) < 18) {
      error.value = "You must be at least 18 years old";
      loading.value = false;
      return;
    }

    try {
      await authApi.register({
        username: username.value,
        email: email.value,
        password: password.value,
        name: name.value,
        gender: gender.value,
        age: parseInt(age.value),
      });
      
      success.value = true;
      loading.value = false;
      
      // Auto redirect to login after 3 seconds
      setTimeout(async () => {
        await navigate("/auth/login");
      }, 3000);
      
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
            <LuUserPlus class="w-5 h-5 text-white" />
          </div>
          <div class="text-left">
            <h1 class="text-xl sm:text-2xl font-bold text-gray-900">Join Anonymous Chat</h1>
            <p class="text-gray-600 text-xs sm:text-sm">Create secure account</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div class="w-full max-w-sm">
        {/* Success State */}
        {success.value ? (
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 text-center">
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LuCheckCircle class="w-6 h-6 text-green-600" />
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Account Created!</h2>
            <p class="text-gray-600 text-sm mb-6">Redirecting to login...</p>
            <div class="space-y-3">
              <Link
                href="/auth/login"
                class="block w-full bg-pink-600 text-white font-medium py-2.5 rounded-lg hover:bg-pink-700 transition-colors text-center text-sm"
              >
                Sign In Now
              </Link>
              <Link
                href="/"
                class="block w-full bg-transparent text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-center border border-gray-300 text-sm"
              >
                Return Home
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Register Form */}
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              {error.value && (
                <div class="mb-4 border border-red-300 bg-red-50 p-3 rounded-lg">
                  <div class="flex items-start space-x-2">
                    <LuAlertCircle class="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div class="text-xs">
                      <p class="text-red-700 font-semibold">Registration Failed</p>
                      <p class="text-red-600 mt-0.5">{error.value}</p>
                    </div>
                  </div>
                </div>
              )}

              <form preventdefault:submit onSubmit$={handleRegister} class="space-y-4">
                {/* Username */}
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LuUser class="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      bind:value={username}
                      class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-transparent text-sm"
                      placeholder="Choose username"
                      required
                      disabled={loading.value}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LuMail class="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      bind:value={email}
                      class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-transparent text-sm"
                      placeholder="Enter email"
                      required
                      disabled={loading.value}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LuLock class="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type={showPassword.value ? "text" : "password"}
                      bind:value={password}
                      class="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-transparent text-sm"
                      placeholder="Create password"
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

                {/* Confirm Password */}
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LuLock class="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword.value ? "text" : "password"}
                      bind:value={confirmPassword}
                      class="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-transparent text-sm"
                      placeholder="Confirm password"
                      required
                      disabled={loading.value}
                    />
                    <button
                      type="button"
                      onClick$={() => showConfirmPassword.value = !showConfirmPassword.value}
                      class="absolute inset-y-0 right-0 pr-3 flex items-center"
                      aria-label={showConfirmPassword.value ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword.value ? (
                        <LuEyeOff class="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <LuEye class="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Display Name (Optional) */}
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">
                    Display Name <span class="text-gray-500">(Optional)</span>
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LuUserCircle class="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      bind:value={name}
                      class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-transparent text-sm"
                      placeholder="Appear as"
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
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <LuUserPlus class="w-4 h-4" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div class="my-4 flex items-center">
                <div class="flex-1 border-t border-gray-300"></div>
                <span class="px-3 text-xs text-gray-500">Already have account?</span>
                <div class="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Sign In Link */}
              <div class="text-center">
                <Link 
                  href="/auth/login" 
                  class="inline-flex items-center justify-center space-x-2 w-full bg-transparent text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors border border-gray-300 text-sm"
                >
                  <LuUser class="w-4 h-4" />
                  <span>Sign in to existing account</span>
                </Link>
              </div>
            </div>

            {/* Privacy Notice */}
            <div class="mt-4 bg-gray-900 text-gray-300 rounded-lg p-3">
              <div class="flex items-start space-x-2">
                <LuShield class="w-4 h-4 text-pink-400 mt-0.5 flex-shrink-0" />
                <div class="text-xs">
                  <p class="font-medium">Your privacy matters</p>
                  <p class="text-gray-400 mt-0.5">
                    We collect minimal info. Email is for account recovery only.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

export const head = {
  title: "Create Account | Anonymous Chat",
  meta: [
    {
      name: "description",
      content: "Create a secure anonymous chat account. Join private conversations without revealing your identity.",
    },
  ],
};
