


import React, { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import Routes from "./routes";
import { getSession } from "../services/apiClient";
import { ToastProvider } from "../components/ui";
import ErrorBoundary from "../components/ErrorBoundary";

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(getSession() !== null);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Routes isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
