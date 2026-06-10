import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AdminAuthProvider } from "./context/AdminAuthContext.jsx";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AdminAuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { background: "#1c1c1e", color: "#fff", borderRadius: "8px" },
          }}
        />
        <App />
      </AdminAuthProvider>
    </BrowserRouter>
  </StrictMode>
);
