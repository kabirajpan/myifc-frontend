import { component$, isDev } from "@builder.io/qwik";
import { QwikCityProvider, RouterOutlet } from "@builder.io/qwik-city";
import { RouterHead } from "./components/router-head/router-head";
import { AuthProvider } from "./context/auth";
import { RoomProvider } from "./components/providers/RoomProvider.jsx"; // Add .jsx extension
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
            <RouterOutlet />
          </RoomProvider>
        </AuthProvider>
      </body>
    </QwikCityProvider>
  );
});