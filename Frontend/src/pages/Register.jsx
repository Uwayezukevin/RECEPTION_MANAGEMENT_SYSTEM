// src/pages/Register.jsx - White Theme
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  FaUserPlus, 
  FaEnvelope, 
  FaLock, 
  FaUser, 
  FaEye, 
  FaEyeSlash,
  FaKey,
  FaSpinner,
  FaArrowLeft,
  FaUserTie
} from "react-icons/fa";
import { MdAdminPanelSettings } from "react-icons/md";
import API from "../service/api";
import toast from "react-hot-toast";
import logo from "../assets/image.png";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminSecret, setShowAdminSecret] = useState(false);
  const [selectedRole, setSelectedRole] = useState("receptionist");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    adminSecret: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    if (selectedRole === "admin" && !formData.adminSecret) {
      toast.error("Admin secret key is required to register as admin");
      return;
    }
    
    setLoading(true);
    
    try {
      const registrationData = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: selectedRole
      };
      
      if (selectedRole === "admin") {
        registrationData.adminSecret = formData.adminSecret;
      }
      
      const response = await API.register(registrationData);
      
      if (response.data.success) {
        toast.success(response.data.msg);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.response?.data?.msg || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-6">
            <img src={logo} alt="Logo" className="h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
            <p className="text-gray-500 mt-1">Register as a staff member</p>
          </div>

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Register as
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("receptionist");
                  setFormData({ ...formData, adminSecret: "" });
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  selectedRole === "receptionist"
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                }`}
              >
                <FaUserTie className="text-lg" />
                <span className="font-medium">Receptionist</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("admin")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  selectedRole === "admin"
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                }`}
              >
                <MdAdminPanelSettings className="text-lg" />
                <span className="font-medium">Admin</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {selectedRole === "admin" && (
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
                    required={selectedRole === "admin"}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 rounded-lg font-semibold hover:bg-primary-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <FaUserPlus />
                  Register as {selectedRole === "admin" ? "Admin" : "Receptionist"}
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-1">
                <FaArrowLeft className="text-xs" />
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;