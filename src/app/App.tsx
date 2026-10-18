


import React, { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import Routes from "./routes";
import { getSession } from "../services/apiClient";
import { ToastProvider } from "../components/ui";

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(getSession() !== null);

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
