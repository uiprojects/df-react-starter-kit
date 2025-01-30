import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getDiligenceFabricSDK } from "../../services/DFService";
import { showToast } from "../../utils/toastUtils";


const ChangePassword: React.FC = () => {

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const navigate = useNavigate();

  const initialValues = { oldPassword: "", newPassword: "", confirmPassword: "" };
  const [formValues, setFormValues] = useState(initialValues)
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value })

    if (formErrors[name] && value) {
      setFormErrors({ ...formErrors, [name]: undefined });
    }
  }

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setFormErrors(validate(formValues));
    setIsSubmit(true);  
  }

  useEffect(() => {
    console.log(formErrors)
    if (Object.keys(formErrors).length == 0 && isSubmit) {
      changeuserPassword(formValues)
    }
  }, [formErrors])

  const validate = (values: any) => {
    const errors = {}

    if (!values.oldPassword) {
      errors.oldPassword = 'Old password is required';
    }
  
    if (!values.newPassword) {
      errors.newPassword = "New password is required";
    }
  
    if (!values.confirmPassword) {
      errors.confirmPassword = "Confirm password is required";
    }
  
    if (values.newPassword !== values.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    return errors
  }


  const changeuserPassword = async ( passwordData : any ) => {
  
    setIsLoading(true)

    try {
      const client = getDiligenceFabricSDK();

      const response = await client.getAuthService().changePassword({ oldPassword: passwordData.oldPassword, isResetPassword: 1, dfUPassword: passwordData.newPassword });

      if (response.Result) {
        localStorage.setItem("userData", JSON.stringify(response.Result));

        showToast("Password changed successfully!", "success")
        setIsLoading(false)
        navigate(-1);
      }
      else {
        throw new Error(response.Message || "Change Password failed");
      }
    }
    catch (error) {
      showToast("Password Change Failed", "error")
      console.error("Error Change Password:", error);
      setError("Change Password Failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center mt-5 px-4">
      <div className="relative w-full max-w-lg">
        {/* Logo Positioned Outside the Box */}
        <div className="absolute top-[-60px] left-1/2 transform -translate-x-1/2">
          <img
            src="src\assets\DF-Logo.svg"
            className="h-36 w-auto max-w-full"
            alt="Logo"
          />
        </div>
        <div className="pt-10">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h4 className="text-2xl font-bold text-gray-800 text-left mb-6">
              Reset Password
            </h4>
            {error ? (<div className="text-center text-red-500">{error}</div>) : null}
            {/* Password Reset Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="oldPassword"
                  className="block text-lg font-medium text-gray-700"
                >
                  Old Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="oldPassword"
                  className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:ring-primary-50 focus:border-primary-50 text-base"
                  placeholder="Old Password"
                  value={formValues.oldPassword}
                  onChange={handleChange}
                />
                <p className="text-red-600">{formErrors.oldPassword}</p>
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-lg font-medium text-gray-700"
                >
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:ring-primary-50 focus:border-primary-50 text-base"
                  placeholder="New Password"
                  value={formValues.newPassword}
                  onChange={handleChange}
                />
                <p className="text-red-600">{formErrors.newPassword}</p>

              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-lg font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:ring-primary-50 focus:border-primary-50 text-base"
                  placeholder="Confirm Password"
                  value={formValues.confirmPassword}
                  onChange={handleChange}
                />
                <p className="text-red-600">{formErrors.confirmPassword}</p>
              </div>
              {/* Error Message */}
              {formError && (
                <p className="text-sm text-red-500 font-medium mt-2">{formError}</p>
              )}

              <button type="submit" className="flex w-full justify-center rounded-md bg-primary-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" disabled={isLoading}>


                {isLoading ? (
                  <div className="w-5 h-5 mt-1 text-center mr-2 rounded-full animate-spin
                  border-4 border-solid border-white-500 border-t-transparent"></div>
                ) : (null)}

                {!isLoading ? (
                  'Change Password'
                ) : (

                  'Changing Password'
                )}
              </button>

              <div className="text-center mt-4">
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex text-gray-600 underline"
                >
                  Cancel Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>


  );
};

export default ChangePassword;
