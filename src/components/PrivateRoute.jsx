import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, authReady } = useAuth();

  // Auth state hasn't finished loading yet (checking localStorage / verifying
  // token with the server) — don't redirect yet, or a logged-in user gets
  // bounced to /login for a split second on every refresh.
  if (!authReady) {
    return null; // or a spinner component if you have one
  }

  return user ? children : <Navigate to="/login" replace />;
}
