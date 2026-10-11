


import React, { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import Routes from "./routes";
import { getSession } from "../services/apiClient";

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(getSession() !== null);

  return (
    <BrowserRouter>
      <Routes isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
    </BrowserRouter>
  );
};

export default App;
