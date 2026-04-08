// src/pages/RegisterReceptionist.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  FaUserPlus, 
  FaEnvelope, 
  FaLock, 
  FaUser, 
  FaEye, 
  FaEyeSlash,
  FaShieldAlt,
  FaKey,
  FaSpinner,
  FaArrowLeft,
  FaUserTie,  // ✅ Replace RiReceptionistLine with this
  FaUserCog   // ✅ Alternative for receptionist
} from "react-icons/fa";
import { MdAdminPanelSettings } from "react-icons/md";
import API from "../service/api";
import toast from "react-hot-toast";
import logo from "../assets/image.png";

const RegisterReceptionist = () => {
  const navigate = useNavigate();
  const { user: currentUser, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminSecret, setShowAdminSecret] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "receptionist",
    adminSecret: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Check if current user can register admin
  const canRegisterAdmin = () => {
    return currentUser && isAdmin();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    // If registering as admin, validate admin secret
    if (formData.role === "admin" && !formData.adminSecret) {
      toast.error("Admin secret key is required to register as admin");
      return;
    }
    
    setLoading(true);
    
    try {
      const registrationData = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };
      
      // Add admin secret only if registering as admin
      if (formData.role === "admin") {
        registrationData.adminSecret = formData.adminSecret;
      }
      
      const response = await API.register(registrationData);
      
      if (response.data.success) {
        toast.success(response.data.msg);
        
        // If current user is admin, stay on registration page to add more users
        if (isAdmin()) {
          // Reset form
          setFormData({
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
            role: "receptionist",
            adminSecret: ""
          });
        } else {
          // Redirect to login after 2 seconds
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.response?.data?.msg || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // If admin is logged in, show different UI
  const isAdminCreating = isAdmin();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-8 pb-0">
          <div className="text-center mb-6">
            <img src={logo} alt="Logo" className="h-16 mx-auto mb-4" />
            
            {isAdminCreating ? (
              <>
                <h2 className="text-2xl font-bold text-gray-800">Add New User</h2>
                <p className="text-gray-500 mt-1">Create receptionist or admin account</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
                <p className="text-gray-500 mt-1">Register as a receptionist</p>
              </>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="user@example.com"
                required
              />
            </div>
          </div>

          {/* Role Selection - Only show if admin is creating */}
          {isAdminCreating && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "receptionist", adminSecret: "" })}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    formData.role === "receptionist"
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-600"
                  }`}
                >
                  <FaUserTie className="text-lg" />  {/* ✅ Fixed icon */}
                  <span className="font-medium">Receptionist</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "admin" })}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    formData.role === "admin"
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-600"
                  }`}
                >
                  <MdAdminPanelSettings className="text-lg" />
                  <span className="font-medium">Admin</span>
                </button>
              </div>
            </div>
          )}

          {/* Admin Secret Key - Only show when registering as admin */}
          {(formData.role === "admin") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Secret Key
              </label>
              <div className="relative">
                <FaKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showAdminSecret ? "text" : "password"}
                  name="adminSecret"
                  value={formData.adminSecret}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="Enter admin secret key"
                  required={formData.role === "admin"}
                />
                <button
                  type="button"
                  onClick={() => setShowAdminSecret(!showAdminSecret)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showAdminSecret ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Contact system administrator for the secret key
              </p>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="••••••"
                required
              />
            </div>
          </div>

          {/* Role Info Box */}
          {!isAdminCreating && formData.role === "receptionist" && (
            <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
              <FaShieldAlt className="text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Receptionists can manage visitors, meetings, and service requests.
                Admin accounts can only be created by existing administrators.
              </p>
            </div>
          )}

          {isAdminCreating && formData.role === "admin" && (
            <div className="bg-purple-50 rounded-lg p-3 flex items-start gap-2">
              <MdAdminPanelSettings className="text-purple-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-purple-700">
                Admin users have full system access including user management,
                system settings, and all administrative functions.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-2 rounded-lg font-semibold hover:from-primary-700 hover:to-secondary-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                {isAdminCreating ? "Creating User..." : "Creating Account..."}
              </>
            ) : (
              <>
                <FaUserPlus />
                {isAdminCreating ? "Create User" : "Register"}
              </>
            )}
          </button>

          {/* Back to Login Link - Only show when not admin */}
          {!isAdminCreating && (
            <div className="text-center pt-2">
              <Link 
                to="/login" 
                className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-1"
              >
                <FaArrowLeft className="text-xs" />
                Back to Login
              </Link>
            </div>
          )}
          
          {/* Admin Note */}
          {!isAdminCreating && (
            <div className="text-center pt-2">
              <p className="text-xs text-gray-400">
                Need an admin account? Contact your system administrator.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default RegisterReceptionist;