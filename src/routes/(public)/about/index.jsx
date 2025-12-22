import { component$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';


export default component$(() => {
  return (
		
    <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section class="container mx-auto px-4 py-16 md:py-24">
        <div class="max-w-4xl mx-auto text-center">
          <h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            About <span class="text-blue-600">MyIFC</span>
          </h1>
          <p class="text-xl md:text-2xl text-gray-600 mb-8">
            Privacy-first, ephemeral messaging for the modern web
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section class="container mx-auto px-4 py-12">
        <div class="max-w-4xl mx-auto">
          <div class="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <h2 class="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p class="text-lg text-gray-700 leading-relaxed mb-4">
              In a world where every message, photo, and conversation is stored forever, 
              we believe there's a better way. MyIFC was built on the principle that 
              conversations should be temporary, natural, and most importantly—private.
            </p>
            <p class="text-lg text-gray-700 leading-relaxed">
              Just like real-life conversations disappear into the air, your digital 
              conversations should too. No permanent records, no data mining, no worries.
            </p>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section class="container mx-auto px-4 py-12">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
            What Makes Us Different
          </h2>
          
          <div class="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div class="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-shadow">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-4">24-Hour Auto-Delete</h3>
              <p class="text-gray-600">
                All messages automatically disappear after 24 hours. No manual deletion needed, 
                no permanent traces left behind.
              </p>
            </div>

            {/* Feature 2 */}
            <div class="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-shadow">
              <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-4">Privacy First</h3>
              <p class="text-gray-600">
                Guest mode available—no email required. Chat anonymously without creating 
                an account or sharing personal information.
              </p>
            </div>

            {/* Feature 3 */}
            <div class="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-shadow">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-4">Public Rooms</h3>
              <p class="text-gray-600">
                Join or create public chat rooms. Connect with others instantly. 
                Rooms expire 10 minutes after creator leaves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section class="container mx-auto px-4 py-12">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          
          <div class="space-y-8">
            <div class="flex gap-6 items-start">
              <div class="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                1
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">Choose Your Style</h3>
                <p class="text-gray-600">
                  Start as a guest for instant access, or register for additional features 
                  like friend lists and creating public rooms.
                </p>
              </div>
            </div>

            <div class="flex gap-6 items-start">
              <div class="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                2
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">Start Chatting</h3>
                <p class="text-gray-600">
                  Send direct messages to anyone or join public rooms. Share text, images, 
                  GIFs, and more in real-time.
                </p>
              </div>
            </div>

            <div class="flex gap-6 items-start">
              <div class="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                3
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">Relax & Forget</h3>
                <p class="text-gray-600">
                  Everything disappears automatically. Log out and your conversations 
                  vanish. Come back tomorrow for a fresh start.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section class="container mx-auto px-4 py-12 mb-16">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
            Our Core Values
          </h2>
          
          <div class="grid md:grid-cols-2 gap-8">
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8">
              <h3 class="text-xl font-bold text-gray-900 mb-3">🔒 Privacy</h3>
              <p class="text-gray-700">
                Your conversations are yours alone. We don't read, analyze, or sell your data.
              </p>
            </div>

            <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-8">
              <h3 class="text-xl font-bold text-gray-900 mb-3">⚡ Simplicity</h3>
              <p class="text-gray-700">
                No bloat, no confusion. Just straightforward messaging that works.
              </p>
            </div>

            <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8">
              <h3 class="text-xl font-bold text-gray-900 mb-3">🌍 Accessibility</h3>
              <p class="text-gray-700">
                Free forever. No premium tiers, no paywalls. Chat should be accessible to everyone.
              </p>
            </div>

            <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-8">
              <h3 class="text-xl font-bold text-gray-900 mb-3">🚀 Innovation</h3>
              <p class="text-gray-700">
                We're constantly improving and adding features that respect your privacy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section class="container mx-auto px-4 py-16">
        <div class="max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 class="text-3xl md:text-4xl font-bold mb-6">
            Ready to Chat Without Consequences?
          </h2>
          <p class="text-xl mb-8 opacity-90">
            Join thousands of users who value their privacy
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/guest" 
                  class="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Try as Guest
            </Link>
            <Link href="/auth/register" 
                  class="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
	
  );
});
