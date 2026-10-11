import { Routes as Switch, Route, Navigate } from "react-router-dom";
import Dashboard from "../Pages/Dashboard/Dashboard";
import Login from "../Pages/Auth/Login";
import Users from "../Pages/Users/Users";
import Admins from "../Pages/admins/Admins";
import DeliveryAreas from "../Pages/deliveryareas/DeliveryAreas";
import Notices from "../Pages/notices/Notices";

import { getSession } from "../services/apiClient";
import { ForgotPassword, ResetPassword } from "../Pages/Auth/PasswordReset";
import Layout from "../layouts/AdminLayout";

interface RoutesProps {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

const Routes: React.FC<RoutesProps> = ({ isLoggedIn, setIsLoggedIn }) => {
  if (!isLoggedIn) {
    return (
      <Switch>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Switch>
    );
  }

  return (
    <Layout setIsLoggedIn={setIsLoggedIn}>
      <Switch>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        {/* managing admins is super_admin only */}
        <Route path="/admins" element={getSession()?.role === "super_admin" ? <Admins /> : <Navigate to="/dashboard" />} />
        <Route path="/delivery-areas" element={<DeliveryAreas />} />
        <Route path="/notices" element={<Notices />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Switch>
    </Layout>
  );

};

export default Routes;
