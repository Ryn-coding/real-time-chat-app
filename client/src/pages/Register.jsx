import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../AuthContext"; // Assuming AuthContext provides 'login'

export default function Register() {
  // State for form input values
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  // State for validation errors, specific to each field or general
  const [errors, setErrors] = useState({});
  // State to indicate if an API call is in progress
  const [loading, setLoading] = useState(false);
  // State for displaying general messages (success/error) to the user
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  // Assuming useAuth provides a 'login' function to handle user session after registration
  const { login } = useAuth();

  // Handles changes to input fields and clears associated errors
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
    // Clear the specific error message for the field being typed into
    if (errors[name]) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
    }
    // Clear general message when user starts typing again
    if (message) {
      setMessage("");
    }
  };

  // Performs client-side validation on form fields
  const validateForm = () => {
    const newErrors = {};
    if (!form.username.trim()) {
      newErrors.username = "Username is required.";
    } else if (form.username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters.";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Email address is invalid.";
    }

    if (!form.password.trim()) {
      newErrors.password = "Password is required.";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }
    setErrors(newErrors); // Update the errors state
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  // Handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    // Perform client-side validation before attempting API call
    if (!validateForm()) {
      setMessage("Please correct the errors in the form.");
      return; // Stop execution if validation fails
    }

    setLoading(true); // Set loading state to true
    setMessage(""); // Clear any previous messages
    setErrors({}); // Clear any previous errors

    try {
      // Make the POST request to the register API endpoint
      const res = await axios.post("http://localhost:5000/api/auth/register", form);
      // Assuming successful registration should also log the user in
      login(res.data.user, res.data.token);
      // Navigate to the chat page upon successful registration and login
      navigate("/chat");
    } catch (err) {
      // Handle errors from the API call
      console.error("Registration error:", err);
      if (err.response && err.response.data && err.response.data.message) {
        // Display specific error message from the backend
        setMessage(err.response.data.message);
      } else {
        // Display a generic error message for network issues or unexpected errors
        setMessage("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false); // Always set loading state to false after attempt
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-pink-900 p-4 sm:p-6 lg:p-8 font-inter">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 sm:p-8 lg:p-10 w-full max-w-md border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:scale-[1.01]">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-center text-gray-800 dark:text-gray-100 mb-8 sm:mb-10 tracking-tight">
          Register
        </h2>

        {/* Display general messages (success/error) */}
        {message && (
          <div
            className={`p-3 mb-4 rounded-lg text-sm ${message.toLowerCase().includes("failed") || message.toLowerCase().includes("error")
                ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400"
                : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400"
              }`}
            role="alert"
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200 ease-in-out
            ${errors.username
                  ? "border-red-500 dark:border-red-400"
                  : "border-gray-300 dark:border-gray-600"
                }
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
              type="text"
              placeholder="Choose a username"
              value={form.username}
              onChange={handleChange}
              disabled={loading}
              aria-invalid={errors.username ? "true" : "false"}
              aria-describedby={errors.username ? "username-error" : undefined}
            />
            {errors.username && (
              <p id="username-error" className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.username}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200 ease-in-out
            ${errors.email
                  ? "border-red-500 dark:border-red-400"
                  : "border-gray-300 dark:border-gray-600"
                }
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
              type="email"
              placeholder="your.email@example.com"
              value={form.email}
              onChange={handleChange}
              disabled={loading}
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200 ease-in-out
            ${errors.password
                  ? "border-red-500 dark:border-red-400"
                  : "border-gray-300 dark:border-gray-600"
                }
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              disabled={loading}
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password && (
              <p id="password-error" className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.password}
              </p>
            )}
          </div>

          <button
            className={`w-full py-3 px-4 rounded-lg text-white font-semibold text-lg shadow-md transition duration-300 ease-in-out
          ${loading
                ? "bg-purple-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              }`}
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Registering...
              </span>
            ) : (
              "Register"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600 dark:text-gray-400 text-base">
          Already have an account?{" "}
          <Link
            className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-600 font-medium transition duration-200 ease-in-out"
            to="/login"
          >
            Login here
          </Link>
        </p>
      </div>
    </div>

  );
}
