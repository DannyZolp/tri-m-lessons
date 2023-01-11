import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider, Text } from "@mantine/core";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDAAZ9I3Xq09Ias2WuVNhm3X376zkwLTzM",
  authDomain: "tri-m-lessons.firebaseapp.com",
  projectId: "tri-m-lessons",
  storageBucket: "tri-m-lessons.appspot.com",
  messagingSenderId: "703890377241",
  appId: "1:703890377241:web:a5ac6ff21312fc8120f888",
  measurementId: "G-230JZ26ZFE"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <Text>Test</Text>
    </MantineProvider>
  </React.StrictMode>
);
