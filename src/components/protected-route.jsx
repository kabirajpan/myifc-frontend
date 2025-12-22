import { component$, Slot, useVisibleTask$ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { useAuth } from "../context/auth";

export const ProtectedRoute = component$(() => {
  const auth = useAuth();
  const nav = useNavigate();

  useVisibleTask$(({ track }) => {
    track(() => auth.loading.value);
    track(() => auth.isAuthenticated.value);

    if (!auth.loading.value && !auth.isAuthenticated.value) {
      nav("/auth/login");
    }
  });

  // Show loading while checking auth
  if (auth.loading.value) {
    return (
      <div class="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center">
        <div class="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  // Show content if authenticated
  if (auth.isAuthenticated.value) {
    return <Slot />;
  }

  // Show nothing while redirecting
  return null;
});
