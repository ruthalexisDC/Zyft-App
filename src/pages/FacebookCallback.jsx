import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { API_ORIGIN } from "../config";

//const API_URL = "http://localhost:5000/api/auth";
const API_URL = `${API_ORIGIN}/api/auth`;

export default function FacebookCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const error = params.get("error");

    if (error) {
      navigate("/register?error=" + encodeURIComponent(error));
      return;
    }

    if (!accessToken) {
      navigate("/register?error=no_token");
      return;
    }

    fetch(`${API_URL}/register/facebook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          navigate(data.user.onboardingComplete ? "/home" : "/onboarding");
        } else {
          throw new Error(data.message || "Registration failed");
        }
      })
      .catch((err) => {
        navigate("/register?error=" + encodeURIComponent(err.message));
      });
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-8 h-8 border-2 border-[#1877F2] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Completing registration...</p>
      </div>
    </div>
  );
}
