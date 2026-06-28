import { PrivyProvider } from "@privy-io/react-auth";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <PrivyProvider
    appId={import.meta.env.VITE_PRIVY_APP_ID}
  >
    <App />
  </PrivyProvider>
);