import { component$, Slot, useVisibleTask$ } from "@builder.io/qwik";
import { useNavigate, Link } from "@builder.io/qwik-city";
import { useAuth } from "../../context/auth";
import AdminNavbar from "../../components/layout/admin-navbar";

export default component$(() => {
  const auth = useAuth();
  const nav = useNavigate();

  // Protect admin routes - check authentication and admin role ONLY
  useVisibleTask$(({ track }) => {
    track(() => auth.loading.value);
    track(() => auth.isAuthenticated.value);
    track(() => auth.user.value);

    if (!auth.loading.value) {
      // Check if not authenticated
      if (!auth.isAuthenticated.value) {
        setTimeout(() => {
          nav("/auth/login");
        }, 2000);
      }
      // Check if authenticated but not admin (moderators go to dashboard)
      else if (auth.user.value?.role !== 'admin') {
        setTimeout(() => {
          nav("/dashboard");
        }, 2000);
      }
    }
  });

  // Show loading while checking auth
  if (auth.loading.value) {
    return (
      <div class="min-h-screen bg-gradient-to-br from-red-600 via-purple-700 to-indigo-800 flex items-center justify-center">
        <div class="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  // Show unauthorized page if not authenticated
  if (!auth.isAuthenticated.value) {
    return (
      <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div class="text-center max-w-md">
          <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h1 class="text-3xl font-semibold text-gray-900 mb-2">Authentication Required</h1>
          <p class="text-gray-600 mb-8">
            Please sign in to access the admin panel
          </p>
          
          <div class="flex flex-col gap-3">
            <Link
              href="/auth/login"
              class="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/"
              class="text-gray-600 hover:text-gray-900 text-sm mt-2"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if not admin (only admins allowed)
  if (auth.user.value?.role !== 'admin') {
    return (
      <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div class="text-center max-w-md">
          <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          
          <h1 class="text-3xl font-semibold text-gray-900 mb-2">Admin Access Only</h1>
          <p class="text-gray-600 mb-8">
            This area is restricted to administrators only.
          </p>
          
          <div class="flex flex-col gap-3">
            <Link
              href="/dashboard"
              class="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              class="text-gray-600 hover:text-gray-900 text-sm mt-2"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show admin layout with admin navbar (only for admins)
  return (
    <div class="min-h-screen bg-gray-50">
      <AdminNavbar />
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Slot />
      </main>
    </div>
  );
});
