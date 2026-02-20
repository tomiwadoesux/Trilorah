import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import OutputApp from "./OutputApp.tsx";

// Create a dark overlay to make sure the frameless window works
document.body.style.backgroundColor = "transparent";
document.documentElement.style.backgroundColor = "transparent";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OutputApp />
  </StrictMode>,
);
