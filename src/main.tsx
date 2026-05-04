import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Register the PWA service worker for offline support and installability
const updateSW = registerSW({
  onNeedRefresh() {
    // When a new version is available, auto-update
    updateSW(true);
  },
  onOfflineReady() {
    console.log("App lista para uso sin conexión 🌸");
  },
});

createRoot(document.getElementById("root")!).render(<App />);
