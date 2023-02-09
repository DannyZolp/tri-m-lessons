import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { App } from "./App";
import { NotificationsProvider } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";

const app = import.meta.env.DEV
  ? initializeApp({
      apiKey: import.meta.env.VITE_API_KEY,
      authDomain: import.meta.env.VITE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_APP_ID,
      measurementId: import.meta.env.VITE_MEASUREMENT_ID
    })
  : initializeApp();

const analytics = getAnalytics(app);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <ModalsProvider>
        <NotificationsProvider>
          <App app={app} />
        </NotificationsProvider>
      </ModalsProvider>
    </MantineProvider>
  </React.StrictMode>
);
