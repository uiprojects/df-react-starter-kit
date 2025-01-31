import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { PublicClientApplication } from "@azure/msal-browser";
import logo from "../assets/DF-Logo.svg";
import microsoftIcon from "../images/microsoftIcon.svg";
import { getDiligenceFabricSDK } from "../services/DFService";
import config from "../config/default.json";
import { useCookies } from 'react-cookie';
import { FaEye, FaEyeSlash } from 'react-icons/fa'


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
  const [icon, setIcon] = useState("FaEyeSlash");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [rememberMeCheck, setRememberMeCheck] = useState(false);
  const [cookies, setCookie, removeCookie] = useCookies(['username']);
  const [msalApp, setMsalApp] = useState<PublicClientApplication | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (cookies.username) {
      setUsername(cookies.username);
      setRememberMe(true);
      setRememberMeCheck(true)
    }


    const fetchMsalConfig = async () => {
      try {
        const client = getDiligenceFabricSDK()
        const AuthenticationTypeList = {
          TenantID: undefined,
          AuthenticationTypeCode: 'MS',
          CalledBy: undefined
        }
        const response = await client.getAuthenticationTypeService().getAuthenticationType(AuthenticationTypeList)

        const msalConfig = {
          auth: {
            clientId: response.Result.ClientOrAppIDConfig,
            authority: `https://login.microsoftonline.com/common`,
            redirectUri: window.location.origin + "/login",
          },
          cache: {
            cacheLocation: "sessionStorage",
            storeAuthStateInCookie: false,
          },
        };

        const Instance = new PublicClientApplication(msalConfig);
        await Instance.initialize();
        await Instance.handleRedirectPromise()
        setMsalApp(Instance)

      }
      catch (error) {
         console.log(error)
      }
    }

    fetchMsalConfig();

  }, [cookies]);

  const toggleShowPassword = () => {
    setType(type === "text" ? "password" : "text");
  };

  const handleUsernameChange = (e: any) => {
    setUsername(e.target.value);
    const newUserName = e.target.value
    if (newUserName === cookies.username) {
      setRememberMeCheck(true)
    }
    else {
      setRememberMeCheck(false);
    }
  };

  const handleLogin = async (authRequest: any) => {

    try {
      setLoading(true);
      const client = getDiligenceFabricSDK();

      const response = await client.getAuthService().login(authRequest);

      if (rememberMe && authRequest.AuthenticationTypeCode == 'FORM') {
        setCookie('username', username, { path: '/' });
      }
      else {
        removeCookie('username');
      }

      if (response.Result && response.Result.TenantID === config.DF_TENANT_ID) {
        localStorage.setItem("userData", JSON.stringify(response.Result));
        Toast.fire({
          icon: "success",
          text: "Login successful!",
          background: "green",
          color: "white",
        });
        navigate("/home");
      }
      else {
        throw new Error(response.Message || "Login failed");
      }
    }
    catch (err) {
      console.error("Login error:", err);
      Toast.fire({
        icon: "error",
        text: (err as Error).message || "Login failed",
        background: "red",
        color: "white",
      });
    }
    finally {
      setLoading(false);
    }

  }

  const formLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    const authRequest = {
      username: username,
      password: password,
      AuthenticationTypeCode: "FORM",
    };

    await handleLogin(authRequest);

  };

  const microsoftLogin = async () => {
    try {

      const loginResponse = await msalApp?.loginPopup({
        scopes: ["openid", "profile", "User.Read"],
      });

      if (loginResponse) {
        await handleLogin(
          {
            username: loginResponse.account.username,
            accessToken: loginResponse.accessToken,
            AuthenticationTypeCode: "MS",
          }
        )
      }
    }
    catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-3 py-3 mx-auto md:h-screen lg:py-0 bg-primary-100">
      <a
        href="https://ubtiinc.com"
        className="flex items-center mb-4 text-2xl font-semibold text-gray-900 dark:text-white"
      >
        <img className="w-70 h-40 mr-2" src={logo} alt="UBTI" />
      </a>
      <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
        <form onSubmit={formLogin}>
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
                onChange={(e) => handleUsernameChange(e)}
                required
                className="w-full p-2.5 bg-gray-50 border border-bg-primary-100 rounded-lg focus:ring-primary-200 text-gray-900 focus: border-bg-primary-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              />
            </div>
            <div className="relative">
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
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-primary-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white pr-10" 
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                className="mt-[1.7rem] absolute inset-y-0 right-0 flex items-center pr-3"
                aria-label="Toggle password visibility"
              >
                {type === 'password' ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <div className="flex items-center justify-between">

              {!rememberMeCheck && (
                <div className="flex items-start">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    className="w-4 h-4 text-primary-200 bg-gray-100 border-gray-300 rounded focus:ring-primary-200 dark:focus:ring-blue-600 dark:ring-offset-gray-800"
                  />
                  <label
                    htmlFor="remember"
                    className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300"
                  >
                    Remember me
                  </label>
                </div>
              )}
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm font-medium text-primary-600 dark:text-black-500 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="flex flex-col items-center">
              <button
                type="submit"
                disabled={loading}
                className="w-full p-2.5 bg-primary-50 text-white rounded-lg"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
              <button
                type="button"
                onClick={microsoftLogin}
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
