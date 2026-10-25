import { Routes as Switch, Route, Navigate } from "react-router-dom";
import Dashboard from "../Pages/Dashboard/Dashboard";
import Login from "../Pages/Auth/Login";
import Users from "../Pages/Users/Users";
import Admins from "../Pages/admins/Admins";
import DeliveryAreas from "../Pages/deliveryareas/DeliveryAreas";
import Notices from "../Pages/notices/Notices";
import Orders from "../Pages/orders/Orders";
import Sessions from "../Pages/sessions/Sessions";
import FoodItems from "../Pages/fooditems/FoodItems";
import DeliveryPersons from "../Pages/deliverypersons/DeliveryPersons";
import Reports from "../Pages/reports/Reports";
import Settings from "../Pages/settings/Settings";
import AuditLogs from "../Pages/auditlogs/AuditLogs";
import UiKit from "../Pages/UiKit/UiKit";

import { getSession } from "../services/apiClient";
import { ForgotPassword, ResetPassword } from "../Pages/Auth/PasswordReset";
import Layout from "../layouts/AdminLayout";

interface RoutesProps {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

// Public pages work whether or not a session exists: the emailed reset link must open even in a browser that's signed in.
const Routes: React.FC<RoutesProps> = (props) => (
  <Switch>
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="*" element={<AppRoutes {...props} />} />
  </Switch>
);

const AppRoutes: React.FC<RoutesProps> = ({ isLoggedIn, setIsLoggedIn }) => {
  if (!isLoggedIn) {
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
        {/* managing admins is super_admin only */}
        <Route path="/admins" element={getSession()?.role === "super_admin" ? <Admins /> : <Navigate to="/dashboard" />} />
        <Route path="/delivery-areas" element={<DeliveryAreas />} />
        <Route path="/notices" element={<Notices />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/food-items" element={<FoodItems />} />
        <Route path="/delivery-persons" element={<DeliveryPersons />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={getSession()?.role === "super_admin" ? <Settings /> : <Navigate to="/dashboard" />} />
        <Route path="/audit-logs" element={getSession()?.role === "super_admin" ? <AuditLogs /> : <Navigate to="/dashboard" />} />
        {import.meta.env.DEV && <Route path="/ui-kit" element={<UiKit />} />}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Switch>
    </Layout>
  );

};

export default Routes;
