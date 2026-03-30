// src/pages/RegisterReceptionist.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  FaUser, 
  FaEnvelope, 
  FaLock, 
  FaUserPlus, 
  FaArrowLeft,
  FaUserShield,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSignInAlt
} from "react-icons/fa";
import { MdEmail, MdLock, MdPerson } from "react-icons/md";
import API from "../service/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function RegisterReceptionist() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  // Check if user is receptionist (only receptionists can register new receptionists)
  const isReceptionist = user?.role === "receptionist";

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (form.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }
    
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    setLoading(true);

    try {
      const userData = {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      };

      console.log("Creating receptionist account:", userData);
      
      const res = await API.register(userData);
      
      toast.success(res.data.msg || "Receptionist account created successfully!");
      
      // Clear form
      setForm({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/receptionist-dashboard");
      }, 2000);
      
    } catch (err) {
      console.error("Registration error:", err);
      const errorMsg = err.response?.data?.msg || err.message || "Something went wrong";
      toast.error(errorMsg);
      
      if (errorMsg.includes("email")) {
        setErrors({ ...errors, email: errorMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  // If not receptionist, show access denied
  if (!isReceptionist && user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <FaExclamationTriangle className="text-red-500 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">Only receptionists can register new receptionists.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/receptionist-dashboard"
              className="inline-flex items-center justify-center space-x-2 bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
            >
              <FaArrowLeft />
              <span>Back to Dashboard</span>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center space-x-2 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <FaSignInAlt />
              <span>Login</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 transform transition-all duration-300">
        {/* Navigation Links */}
        <div className="flex justify-between items-center mb-6">
          <Link 
            to="/receptionist-dashboard" 
            className="inline-flex items-center space-x-2 text-gray-500 hover:text-primary-600 transition-colors group"
          >
            <FaArrowLeft className="text-sm group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
          
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 text-gray-500 hover:text-primary-600 transition-colors"
          >
            <FaSignInAlt className="text-sm" />
            <span className="text-sm">Login</span>
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full mb-4">
            <FaUserShield className="text-white text-3xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Register Receptionist</h2>
          <p className="text-gray-500">Create new receptionist account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <div className="relative">
              <MdPerson className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="fullName"
                placeholder="Enter full name"
                value={form.fullName}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
            </div>
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
            )}
          </div>
          
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <MdEmail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                placeholder="Enter email address"
                value={form.email}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>
          
          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <div className="relative">
              <MdLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                name="password"
                placeholder="Create a password (min. 6 characters)"
                value={form.password}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password}</p>
            )}
          </div>
          
          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <div className="relative">
              <MdLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-2 rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaUserPlus />}
            <span>{loading ? "Creating Account..." : "Register Receptionist"}</span>
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Already have an account?</span>
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-all duration-200 group"
          >
            <FaSignInAlt className="text-primary-500 group-hover:scale-110 transition-transform" />
            <span>Login to your account</span>
          </Link>
          <p className="text-xs text-gray-500 mt-2">
            Already registered? Login to manage visitors and requests
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <FaCheckCircle className="text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-blue-700">
                <span className="font-semibold">Note:</span> New receptionists will receive their login credentials via email. 
                They can login at the receptionist portal after account creation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}