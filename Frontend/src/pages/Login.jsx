// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaSignInAlt, FaUserPlus, FaUserShield, FaArrowLeft } from "react-icons/fa";
import { MdEmail, MdLock } from "react-icons/md";
import { FiLogIn } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userData = await login(form.email, form.password);
      
      // Only receptionist can login
      if (userData.user.role === "receptionist") {
        toast.success(`Welcome back, ${userData.user.fullName}!`);
        navigate("/receptionist-dashboard");
      } else {
        toast.error("Invalid access. Only receptionists can login.");
        localStorage.removeItem("user");
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 transform transition-all duration-300 hover:scale-105">
        {/* Back to Home Link */}
        <Link 
          to="/" 
          className="inline-flex items-center space-x-2 text-gray-500 hover:text-primary-600 transition-colors mb-6 group"
        >
          <FaArrowLeft className="text-sm group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back to Home</span>
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full mb-4">
            <FiLogIn className="text-white text-3xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Receptionist Login</h2>
          <p className="text-gray-500">Receptionist Dashboard Portal</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <MdEmail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <MdLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-2 rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSignInAlt />
            <span>{loading ? "Logging in..." : "Login"}</span>
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">New Receptionist?</span>
          </div>
        </div>

        {/* Register New Receptionist Link */}
        <div className="text-center space-y-4">
          <Link
            to="/register-receptionist"
            className="inline-flex items-center justify-center w-full space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-all duration-200 group"
          >
            <FaUserPlus className="text-primary-500 group-hover:scale-110 transition-transform" />
            <span>Register for new account</span>
            <FaUserShield className="text-secondary-500" />
          </Link>
          <p className="text-xs text-gray-500 mt-2">
            * Receptionists can manage visitors and service requests
          </p>
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700 text-center">
            <span className="font-semibold">Demo Credentials:</span><br />
            Email: reception@example.com / Password: reception123
          </p>
        </div>
      </div>
    </div>
  );
}