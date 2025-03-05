import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute= () => {
  const token = !!localStorage.getItem("token");

  //Outlet permet de balayer toutes les routes
  return token ? <Outlet /> : <Navigate to="/login" />;
}

export default PrivateRoute;
