import React, { useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { PublicClientApplication } from "@azure/msal-browser";
import logo from "../images/your-logo.png";
import microsoftIcon from "../images/microsoftIcon.svg";
import { getDiligenceFabricSDK } from "../services/DFService";
import config from "../config/default.json";

const msalConfig = {
  auth: {
    clientId: "5d7bdfac-a817-4498-82c4-171db653e23a",
    authority: `https://login.microsoftonline.com/008502d6-3f79-46f0-ab37-9354e3fe80ff>`,
    redirectUri: window.location.origin + "/login",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  padding: "0.5em",
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

const Login: React.FC = () => {
  const [type, setType] = useState("password");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const toggleShowPassword = () => {
    setType(type === "text" ? "password" : "text");
  };

  const addPosts = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const client = getDiligenceFabricSDK();

      const authRequest = {
        username: username,
        password: password,
        AuthenticationTypeCode: "FORM",
      };
      const response = await client.getAuthService().login(authRequest);
      console.log(response.Result);
      console.log(response.Result.TenantID);

      if (response.Result && response.Result.TenantID === config.DF_TENANT_ID ) {
        localStorage.setItem("userData", JSON.stringify(response.Result));
        Toast.fire({
          icon: "success",
          text: "Login successful!",
          background: "green",
          color: "white",
        });
        navigate("/home");
      } else {
        throw new Error(response.Message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      Toast.fire({
        icon: "error",
        text: (err as Error).message || "Login failed",
        background: "red",
        color: "white",
      });
    } finally {
      setLoading(false);
    }
  };

  const microsoftSignIn = async () => {
    try {
      const loginResponse = await msalInstance.loginPopup({
        scopes: ["openid", "profile", "User.Read"],
      });
      console.log(loginResponse);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-3 py-3 mx-auto md:h-screen lg:py-0 bg-blue-800">
      <a
        href="https://ubtiinc.com"
        className="flex items-center mb-4 text-2xl font-semibold text-gray-900 dark:text-white"
      >
        <img className="w-90 h-20 mr-2" src={logo} alt="UBTI" />
      </a>
      <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
        <form onSubmit={addPosts}>
          <div className="p-6 mb-2 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
              Sign in to your account
            </h1>
            <div>
              <label
                htmlFor="username"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Username or Email
              </label>
              <input
                type="text"
                id="username"
                placeholder="name@example.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Password
              </label>
              <input
                type={type}
                id="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                className="text-blue-500"
              >
                Show/Hide Password
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-start">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800"
                />
                <label
                  htmlFor="remember"
                  className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300"
                >
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm font-medium text-blue-600 dark:text-blue-500 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="flex flex-col items-center">
              <button
                type="submit"
                disabled={loading}
                className="w-full p-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
              <button
                type="button"
                onClick={microsoftSignIn}
                className="mt-4 p-2.5 bg-gray-100 border border-gray-300 rounded text-gray-900 hover:bg-gray-200 flex items-center"
              >
                <img
                  className="w-6 h-6 mr-2"
                  src={microsoftIcon}
                  alt="Microsoft Icon"
                />
                Sign in with Microsoft
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
