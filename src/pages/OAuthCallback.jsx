import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { API_ORIGIN } from "../config";

const API_URL = `${API_ORIGIN}/api/v1/auth`;

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();

  const [error, setError] = useState("");
  const hasExchanged = useRef(false);

  useEffect(() => {
    const completeOAuthLogin = async () => {
      // Prevent the OAuth code from being exchanged twice
      if (hasExchanged.current) return;

      hasExchanged.current = true;

      const code = searchParams.get("code");

      if (!code) {
        setError("Authentication code is missing.");
        return;
      }

      try {
        // Step 1: Exchange one-time OAuth code for JWT
        const response = await fetch(`${API_URL}/exchange`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ code }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Failed to complete authentication.",
          );
        }

        // Your sendSuccess response puts the token in data.token
        const token = result?.data?.token;

        if (!token) {
          throw new Error("No authentication token received.");
        }

        // Step 2: Save JWT
        localStorage.setItem("token", token);

        // Step 3: Get the authenticated user
        const userResponse = await fetch(`${API_URL}/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        const userResult = await userResponse.json();

        if (!userResponse.ok) {
          throw new Error(userResult.message || "Failed to retrieve user.");
        }

        // Your /me endpoint returns data.user
        const user = userResult?.data?.user;

        if (!user) {
          throw new Error("User data not received.");
        }

        // Step 4: Save user
        localStorage.setItem("user", JSON.stringify(user));

        // Step 5: Update AuthContext
        setUser(user);

        // Step 6: Go to home
        navigate("/home", {
          replace: true,
        });
      } catch (err) {
        console.error("OAuth callback error:", err);

        setError(err.message || "Authentication failed.");

        // Return to login after showing the error
        setTimeout(() => {
          navigate("/login", {
            replace: true,
          });
        }, 2000);
      }
    };

    completeOAuthLogin();
  }, [navigate, searchParams, setUser]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-400 text-lg font-medium">Login failed</p>

          <p className="text-gray-400 text-sm mt-2">{error}</p>

          <p className="text-gray-500 text-xs mt-4">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

        <p className="text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
}
