import React from "react";           // ✅ ADD THIS LINE
import { Route, Redirect } from "react-router-dom";

const ProtectedRoute = ({
  component: Component,
  user,
  allowedRoles,
  ...rest
}) => (
  <Route
    {...rest}
    render={(props) =>
      user && allowedRoles.includes(user.user_type) ? (
        <Component {...props} />
      ) : (
        <Redirect to="/dashboard/root" />
      )
    }
  />
);

export default ProtectedRoute;
