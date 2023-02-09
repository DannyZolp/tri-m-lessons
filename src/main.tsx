import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { App } from "./App";
import { NotificationsProvider } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <ModalsProvider>
        <NotificationsProvider>
          <App />
        </NotificationsProvider>
      </ModalsProvider>
    </MantineProvider>
  </React.StrictMode>
);
