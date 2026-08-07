import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { showToast } from "../../utils/toastUtils";
import config from "../../config/default.json";
import { createPublicClient } from "../../services/DFService";



const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false); // Loading state
    const [workEmail, setWorkEmail] = useState("");

    const submitForgotPassword = async (event : React.FormEvent) => {
        event.preventDefault()
        console.log('function received')
        setIsLoading(true);

        try {
            // V3 SDK: POST /api/v3/Auth/forgot-password
            const client = createPublicClient();
            const result = await client.api.v3.auth.forgotPassword.post({
                email: workEmail,
                productCode: config.DF_PRODUCT_CODE
            });
            console.log('[ForgotPassword] Response:', result);
            
            if (result) {
                showToast("Email sent successfully","success")
                setIsLoading(false)
                navigate('/');
            } else {
                throw new Error("Forgot Password failed");
            }
        } catch (error) {
            showToast("Forgot password request failed","error")
            console.error("Error Forgot Password:", error);
        } finally {
            setIsLoading(false);
        }
    }


    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="relative">
        <h1 className="absolute left-1/2 -translate-x-1/2 mb-14">
          <img
            src="src/assets/DF-Logo.svg"
            className="h-24 w-auto max-w-full"
            alt="Logo"
          />
        </h1>
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full mt-20">
          {/* Logo */}

          <h4 className="text-2xl font-heading font-bold  text-gray-800 text-left mb-3">
            Forgot Password
          </h4>
          <p className="text-justify mb-4 text-sm text-Text/Secondary">
            Please enter the email to
            receive a link to reset your password.
          </p>

          {/* Email Login Form */}
          <form onSubmit={submitForgotPassword} className="space-y-6 mt-5">
            <div>
              <label
                htmlFor="email"
                className="block text-base font-medium text-gray-700 text-left"
              >
                Work Email
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 block w-full px-4 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-50 sm:text-sm"
                placeholder="name@email.com"
                onChange={(e) => setWorkEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="flex w-full justify-center rounded-md bg-primary-50 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" disabled={isLoading}>

              {isLoading ? (
                    <div className="w-5 h-5 mt-1 text-center mr-2 rounded-full animate-spin
                    border-4 border-solid border-white-500 border-t-transparent"></div>
                                ) : ( null )}
              {!isLoading ? ("Continue with Email") : ("Sending Email")}
            </button>
      
            <div className="text-center">

              <a href="/login" className="inline-flex  text-primary-50 underline">
                Cancel Reset Password
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>

     )

}

export default ForgotPassword