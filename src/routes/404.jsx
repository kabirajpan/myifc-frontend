import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

export default component$(() => {
  return (
    <div class="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center px-4">
      <div class="text-center">
        <h1 class="text-9xl font-bold text-white mb-4">404</h1>
        <h2 class="text-4xl font-semibold text-white mb-4">Page Not Found</h2>
        <p class="text-xl text-purple-200 mb-8">
          Oops! The page you're looking for doesn't exist.
        </p>
        
        <div class="flex gap-4 justify-center">
          <Link
            href="/"
            class="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            class="bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-400 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
});
