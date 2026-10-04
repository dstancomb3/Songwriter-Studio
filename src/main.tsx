import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

import App from "./App.tsx";

import {
  StudioModalProvider,
} from "./components/ui/StudioModalProvider";

createRoot(
  document.getElementById(
    "root"
  )!
).render(
  <StrictMode>
    <StudioModalProvider>
      <App />
    </StudioModalProvider>
  </StrictMode>
);
