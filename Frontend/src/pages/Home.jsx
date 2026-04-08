// src/pages/Home.jsx - Fixed with proper authentication
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaClipboardList,
  FaClock,
  FaEnvelope,
  FaCheckCircle,
  FaUserCheck,
  FaBuilding,
  FaPhone,
  FaArrowRight,
  FaIdCard,
  FaChartLine,
  FaBell,
  FaShieldAlt,
  FaRocket,
  FaSignInAlt,
  FaCalendarAlt,
  FaSpinner,
} from "react-icons/fa";
import { MdLocationOn, MdEmail,MdAdminPanelSettings } from "react-icons/md";
import logo from "../assets/image.png";
import QRCode from "../assets/frame (3).png";

const Home = () => {
  const navigate = useNavigate();
  const { user, loading, isAdmin, isReceptionist } = useAuth();

  // Handle navigation with authentication check
  const handleProtectedNavigation = (path, requiredRole = null) => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate("/login");
      return;
    }

    // Check role requirements
    if (requiredRole === "admin" && !isAdmin()) {
      navigate("/receptionist-dashboard");
      return;
    }

    if (requiredRole === "receptionist" && !isReceptionist() && !isAdmin()) {
      navigate("/admin/dashboard");
      return;
    }

    navigate(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-5xl text-white mx-auto mb-4" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800">
      {/* Header with Auth Links */}
      <div className="relative">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex gap-2 sm:gap-3">
          {user ? (
            <>
              {isReceptionist() && (
                <button
                  onClick={() => handleProtectedNavigation("/receptionist-dashboard")}
                  className="bg-green-500/20 backdrop-blur-md text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-green-500/30 transition-all duration-200 flex items-center space-x-2 text-sm sm:text-base border border-green-500/30"
                >
                  <FaCalendarAlt className="text-sm" />
                  <span>Dashboard</span>
                </button>
              )}
              {isAdmin() && (
                <button
                  onClick={() => handleProtectedNavigation("/admin/dashboard")}
                  className="bg-purple-500/20 backdrop-blur-md text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-purple-500/30 transition-all duration-200 flex items-center space-x-2 text-sm sm:text-base border border-purple-500/30"
                >
                  <MdAdminPanelSettings className="text-sm" />
                  <span>Admin Panel</span>
                </button>
              )}
              <button
                onClick={() => handleProtectedNavigation("/meetings")}
                className="bg-blue-500/20 backdrop-blur-md text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-500/30 transition-all duration-200 flex items-center space-x-2 text-sm sm:text-base border border-blue-500/30"
              >
                <FaCalendarAlt className="text-sm" />
                <span>Meetings</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-white/10 backdrop-blur-md text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-white/20 transition-all duration-200 flex items-center space-x-2 text-sm sm:text-base border border-white/20"
            >
              <FaSignInAlt className="text-sm" />
              <span>Staff Login</span>
            </Link>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-32 sm:w-40 lg:w-50 h-16 sm:h-20 mb-4 sm:mb-6">
              <img
                src={logo}
                className="object-cover h-12 sm:h-16 lg:h-20 w-auto"
                alt="MININFRA LOGO"
              />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 px-2">
              Welcome to the
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-400">
                Reception Management System
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
              Streamline your visitor registration and service requests. Fast,
              efficient, and completely digital.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Link
                to="/visitor-service"
                className="bg-gradient-to-r from-yellow-500 to-pink-500 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl hover:from-yellow-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg text-sm sm:text-base"
              >
                <FaUserCheck />
                <span>Register as Visitor</span>
                <FaArrowRight />
              </Link>
              
              {!user && (
                <Link
                  to="/login"
                  className="bg-white/10 backdrop-blur-md text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl hover:bg-white/20 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg text-sm sm:text-base border border-white/20"
                >
                  <FaSignInAlt />
                  <span>Staff Login</span>
                  <FaArrowRight />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white/5 backdrop-blur-sm py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                100%
              </div>
              <p className="text-white/80 text-sm sm:text-base">
                Digital Process
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                Real-time
              </div>
              <p className="text-white/80 text-sm sm:text-base">
                Status Updates
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                Email
              </div>
              <p className="text-white/80 text-sm sm:text-base">
                Notifications
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            How It Works
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/80 px-4">
            Simple, fast, and convenient process for all visitors
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 text-center hover:transform hover:scale-105 transition-all duration-300">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FaIdCard className="text-white text-xl sm:text-2xl" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">
              1. Register
            </h3>
            <p className="text-white/80 text-sm sm:text-base">
              Fill in your details to register as a visitor at the reception
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 text-center hover:transform hover:scale-105 transition-all duration-300">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FaClipboardList className="text-white text-xl sm:text-2xl" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">
              2. Request Service
            </h3>
            <p className="text-white/80 text-sm sm:text-base">
              Choose the service you need and submit your request
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 text-center hover:transform hover:scale-105 transition-all duration-300 sm:col-span-2 lg:col-span-1">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FaEnvelope className="text-white text-xl sm:text-2xl" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">
              3. Get Updates
            </h3>
            <p className="text-white/80 text-sm sm:text-base">
              Receive email notifications and check status anytime
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white/5 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              Key Features
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/80 px-4">
              Everything you need for a seamless experience
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white/10 rounded-xl p-4 sm:p-6 flex items-start space-x-3 sm:space-x-4">
              <FaRocket className="text-primary-400 text-xl sm:text-2xl mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white mb-1 sm:mb-2 text-sm sm:text-base">
                  Fast Registration
                </h3>
                <p className="text-white/70 text-xs sm:text-sm">
                  Quick and easy visitor check-in process
                </p>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-4 sm:p-6 flex items-start space-x-3 sm:space-x-4">
              <FaBell className="text-primary-400 text-xl sm:text-2xl mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white mb-1 sm:mb-2 text-sm sm:text-base">
                  Real-time Notifications
                </h3>
                <p className="text-white/70 text-xs sm:text-sm">
                  Get instant updates on your request status
                </p>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-4 sm:p-6 flex items-start space-x-3 sm:space-x-4">
              <FaCheckCircle className="text-primary-400 text-xl sm:text-2xl mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white mb-1 sm:mb-2 text-sm sm:text-base">
                  Status Tracking
                </h3>
                <p className="text-white/70 text-xs sm:text-sm">
                  Track your request progress anytime
                </p>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-4 sm:p-6 flex items-start space-x-3 sm:space-x-4">
              <FaEnvelope className="text-primary-400 text-xl sm:text-2xl mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white mb-1 sm:mb-2 text-sm sm:text-base">
                  Email Updates
                </h3>
                <p className="text-white/70 text-xs sm:text-sm">
                  Receive confirmation and status emails
                </p>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-4 sm:p-6 flex items-start space-x-3 sm:space-x-4">
              <FaClock className="text-primary-400 text-xl sm:text-2xl mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white mb-1 sm:mb-2 text-sm sm:text-base">
                  24/7 Access
                </h3>
                <p className="text-white/70 text-xs sm:text-sm">
                  Check your request status anytime
                </p>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-4 sm:p-6 flex items-start space-x-3 sm:space-x-4">
              <FaChartLine className="text-primary-400 text-xl sm:text-2xl mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white mb-1 sm:mb-2 text-sm sm:text-base">
                  Service Analytics
                </h3>
                <p className="text-white/70 text-xs sm:text-sm">
                  Track service request trends
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            Available Services
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/80 px-4">
            Choose from a variety of services
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white/10 rounded-xl p-4 sm:p-6 border border-white/20">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
              Government Services
            </h3>
            <ul className="space-y-2 text-white/80">
              <li className="flex items-center space-x-2 text-sm sm:text-base">
                <FaCheckCircle className="text-green-400 text-xs sm:text-sm flex-shrink-0" />
                <span>Rwanda Law Reform Commission</span>
              </li>
              <li className="flex items-center space-x-2 text-sm sm:text-base">
                <FaCheckCircle className="text-green-400 text-xs sm:text-sm flex-shrink-0" />
                <span>Prime Minister Head Office</span>
              </li>
              <li className="flex items-center space-x-2 text-sm sm:text-base">
                <FaCheckCircle className="text-green-400 text-xs sm:text-sm flex-shrink-0" />
                <span>MININFRA</span>
              </li>
              <li className="flex items-center space-x-2 text-sm sm:text-base">
                <FaCheckCircle className="text-green-400 text-xs sm:text-sm flex-shrink-0" />
                <span>MINIJUST</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/10 rounded-xl p-4 sm:p-6 border border-white/20">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
              Additional Services
            </h3>
            <ul className="space-y-2 text-white/80">
              <li className="flex items-center space-x-2 text-sm sm:text-base">
                <FaCheckCircle className="text-green-400 text-xs sm:text-sm flex-shrink-0" />
                <span>Document Processing</span>
              </li>
              <li className="flex items-center space-x-2 text-sm sm:text-base">
                <FaCheckCircle className="text-green-400 text-xs sm:text-sm flex-shrink-0" />
                <span>Information Requests</span>
              </li>
              <li className="flex items-center space-x-2 text-sm sm:text-base">
                <FaCheckCircle className="text-green-400 text-xs sm:text-sm flex-shrink-0" />
                <span>Consultation Services</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/20 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
            <div className="flex items-center space-x-2">
              <FaIdCard className="text-white text-lg sm:text-xl" />
              <span className="text-white font-semibold text-sm sm:text-base">
                Reception System
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-white/70 text-xs sm:text-sm">
              <span>© 2026 Reception Management System</span>
              <span className="hidden sm:inline">|</span>
              <span className="flex items-center space-x-1">
                <MdLocationOn className="text-xs" />
                <span>Kigali, Rwanda</span>
              </span>
              <span className="hidden sm:inline">|</span>
              <span className="flex items-center space-x-1">
                <FaPhone className="text-xs" />
                <span>Support</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;