import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const AuthCallback = () => {
  const navigate = useNavigate();

  const { login } = useAuth();

  useEffect(() => {
    try {
      const params = new URLSearchParams(
        window.location.search
      );

      const token = params.get("token");

      console.log("Token from URL:", token);

      if (!token) {
        navigate("/login?error=no_token", {
          replace: true,
        });

        return;
      }

      /**
       * Save token + user
       */
      login(token);

      console.log(
        "Token saved:",
        localStorage.getItem("token")
      );

      /**
       * Small delay ensures auth state updates
       */
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 100);

    } catch (error) {
      console.error("Auth callback failed:", error);

      navigate("/login?error=auth_failed", {
        replace: true,
      });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Signing you in...
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;