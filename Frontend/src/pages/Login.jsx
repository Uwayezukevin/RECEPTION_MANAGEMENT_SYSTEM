// src/pages/Login.jsx - White Theme
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { 
  FaEnvelope, 
  FaLock, 
  FaSignInAlt, 
  FaSpinner,
  FaUserTie
} from "react-icons/fa";
import { MdAdminPanelSettings } from "react-icons/md";
import logo from "../assets/image.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("receptionist");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await login(email, password);
      
      if (response.user.role !== selectedRole) {
        toast.error(`This account is registered as ${response.user.role}. Please select the correct role.`);
        setLoading(false);
        return;
      }
      
      if (response.user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (response.user.role === "receptionist") {
        navigate("/receptionist-dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast.error(error.response?.data?.msg || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <img src={logo} alt="Logo" className="h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
            <p className="text-gray-500 mt-1">Sign in to your account</p>
          </div>

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Login as
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole("receptionist")}
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="user@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  Signing in...
                </>
              ) : (
                <>
                  <FaSignInAlt />
                  Sign In as {selectedRole === "admin" ? "Admin" : "Receptionist"}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;