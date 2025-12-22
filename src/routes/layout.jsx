import { component$, Slot, useVisibleTask$ } from "@builder.io/qwik";
import { useNavigate, useLocation } from "@builder.io/qwik-city";
import { useAuth } from "../context/auth";

export default component$(() => {
  const auth = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const publicRoutes = ['/', '/about', '/features', '/explore', '/privacy', '/terms', '/contact', '/faq'];
  const authRoutes = ['/auth/login', '/auth/register', '/auth/guest'];

  useVisibleTask$(({ track }) => {
    track(() => auth.loading.value);
    track(() => auth.isAuthenticated.value);
    track(() => auth.user.value);
    track(() => loc.url.pathname);

    const currentPath = loc.url.pathname;

    if (auth.loading.value) return;

    const isPublicRoute = publicRoutes.some(route => currentPath === route || currentPath.startsWith(route));
    const isAuthRoute = authRoutes.some(route => currentPath.startsWith(route));
    const isAdminRoute = currentPath.startsWith('/admin');
    const isPrivateRoute = currentPath.startsWith('/dashboard') || currentPath.startsWith('/chat') || currentPath.startsWith('/rooms') || currentPath.startsWith('/friends') || currentPath.startsWith('/users') || currentPath.startsWith('/profile');

    const userRole = auth.user.value?.role;

    // If on public route, allow access for everyone
    if (isPublicRoute) {
      return;
    }

    // If authenticated and on auth page, redirect based on role
    if (auth.isAuthenticated.value && isAuthRoute) {
      if (userRole === 'admin') {
        nav("/admin/dashboard");
      } else {
        nav("/dashboard");
      }
      return;
    }

    // If admin trying to access user routes, redirect to admin dashboard
    if (auth.isAuthenticated.value && userRole === 'admin' && isPrivateRoute) {
      nav("/admin/dashboard");
      return;
    }

    // If regular user/moderator trying to access admin routes, redirect to dashboard
    if (auth.isAuthenticated.value && userRole !== 'admin' && isAdminRoute) {
      nav("/dashboard");
      return;
    }

    // If not authenticated and trying to access protected routes
    if (!auth.isAuthenticated.value && (isPrivateRoute || isAdminRoute)) {
      nav("/auth/login");
      return;
    }
  });

  if (auth.loading.value) {
    return (
      <div class="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center">
        <div class="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return <Slot />;
});
