import { Routes as Switch, Route, Navigate } from "react-router-dom";
import Dashboard from "../Pages/Dashboard/Dashboard";
import Login from "../Pages/Auth/Login";
import Users from "../Pages/Users/Users";
import Admins from "../Pages/admins/Admins";
import DeliveryAreas from "../Pages/deliveryareas/DeliveryAreas";

import Layout from "../layouts/AdminLayout";

interface RoutesProps {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

const Routes: React.FC<RoutesProps> = ({ isLoggedIn, setIsLoggedIn }) => {
  const loggedIn = isLoggedIn || localStorage.getItem("isLoggedIn") === "true";

  if (!loggedIn) {
    return (
      <Switch>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Switch>
    );
  }

  return (
    <Layout setIsLoggedIn={setIsLoggedIn}>
      <Switch>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/admins" element={<Admins />} />
        <Route path="/delivery-areas" element={<DeliveryAreas />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Switch>
    </Layout>
  );

};

export default Routes;
