


import React, { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import Routes from "./routes";

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
    localStorage.getItem("isLoggedIn") === "true"
  );

  return (
    <BrowserRouter>
      <Routes isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
    </BrowserRouter>
  );
};

export default App;
