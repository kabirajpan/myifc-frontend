import { component$, isDev } from "@builder.io/qwik";
import { QwikCityProvider, RouterOutlet } from "@builder.io/qwik-city";
import { RouterHead } from "./components/router-head/router-head";
import { AuthProvider } from "./context/auth";
import { RoomProvider } from "./components/providers/RoomProvider.jsx";
import { ChatProvider } from "./components/providers/ChatProvider.jsx";
import { UserProvider } from "./components/providers/UserProvider.jsx";
import "./global.css";

export default component$(() => {
  return (
    <QwikCityProvider>
      <head>
        <meta charset="utf-8" />
        {!isDev && (
          <link
            rel="manifest"
            href={`${import.meta.env.BASE_URL}manifest.json`}
          />
        )}
        <RouterHead />
      </head>
      <body lang="en">
        <AuthProvider>
          <RoomProvider>
            <ChatProvider>
              <UserProvider>
                <RouterOutlet />
              </UserProvider>
            </ChatProvider>
          </RoomProvider>
        </AuthProvider>
      </body>
    </QwikCityProvider>
  );
});