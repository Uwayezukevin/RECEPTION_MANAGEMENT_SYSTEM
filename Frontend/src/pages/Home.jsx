// src/pages/Home.jsx - Complete Project Description with Visitor & Meeting Modules
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { QRCodeSVG } from "qrcode.react";
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
  FaUsers,
  FaFileSignature,
  FaQrcode,
  FaHandshake,
  FaLaptopCode,
  FaDatabase,
  FaShieldVirus,
} from "react-icons/fa";
import { MdAdminPanelSettings, MdMeetingRoom } from "react-icons/md";
import { MdLocationOn } from "react-icons/md";
import logo from "../assets/image.png";

const Home = () => {
  const navigate = useNavigate();
  const { user, loading, isAdmin, isReceptionist } = useAuth();

  // Get the full URL for visitor registration
  const visitorRegistrationUrl = `${window.location.origin}/visitor-service`;

  const handleProtectedNavigation = (path, requiredRole = null) => {
    if (!user) {
      navigate("/login");
      return;
    }
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
                  <span>Reception</span>
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
              A complete digital solution for visitor management, service requests, and meeting attendance tracking with real-time updates and digital signatures.
            </p>
            
            {/* QR Code Section - Dynamic QR Code that redirects to /visitor-service */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
              <Link
                to="/visitor-service"
                className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 sm:p-4 shadow-lg hover:scale-105 transition-all duration-300"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 mb-2">
                  <QRCodeSVG 
                    value={visitorRegistrationUrl}
                    size={96}
                    level="H"
                    bgColor="transparent"
                    fgColor="#FFFFFF"
                  />
                </div>
                <span className="text-white text-xs sm:text-sm font-medium text-center leading-tight">
                  Scan to continue <br className="hidden sm:block" />
                  as a visitor
                </span>
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-8">
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
                Digital
              </div>
              <p className="text-white/80 text-sm sm:text-base">
                Signatures
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                24/7
              </div>
              <p className="text-white/80 text-sm sm:text-base">
                Access
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Main Modules Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            Our Core Modules
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/80 px-4">
            Complete solutions for visitor management and meeting tracking
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Visitor Module Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-white/20 hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <FaUserCheck className="text-green-400 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-white">Visitor Management</h3>
            </div>
            <p className="text-white/70 text-sm mb-4">
              Complete digital visitor registration and service request system
            </p>
            <ul className="space-y-2 text-white/80 text-sm">
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400 text-xs" />
                <span>QR Code based visitor registration</span>
              </li>
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400 text-xs" />
                <span>Service request submission and tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400 text-xs" />
                <span>Real-time status updates via WebSocket</span>
              </li>
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400 text-xs" />
                <span>Email notifications for request updates</span>
              </li>
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400 text-xs" />
                <span>Visitor history and analytics</span>
              </li>
            </ul>
          </div>

          {/* Meeting Module Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-white/20 hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <MdMeetingRoom className="text-purple-400 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-white">Meeting Management</h3>
            </div>
            <p className="text-white/70 text-sm mb-4">
              Digital meeting attendance tracking with electronic signatures
            </p>
            <ul className="space-y-2 text-white/80 text-sm">
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400 text-xs" />
                <span>Schedule and manage company meetings</span>
              </li>
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400 text-xs" />
                <span>Digital signature capture for attendance</span>
              </li>
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400 text-xs" />
                <span>QR code based participant sign-in</span>
              </li>
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400 text-xs" />
                <span>Export reports (PDF, Excel, HTML) with signatures</span>
              </li>
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400 text-xs" />
                <span>Real-time participant tracking</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white/5 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              How It Works
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/80 px-4">
              Simple, fast, and convenient process for all users
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center hover:transform hover:scale-105 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaQrcode className="text-white text-xl" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">1. Scan QR Code</h3>
              <p className="text-white/70 text-sm">Scan QR code at reception to start registration</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center hover:transform hover:scale-105 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaClipboardList className="text-white text-xl" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">2. Fill Details</h3>
              <p className="text-white/70 text-sm">Complete registration and select services</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center hover:transform hover:scale-105 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaFileSignature className="text-white text-xl" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">3. Digital Signature</h3>
              <p className="text-white/70 text-sm">Sign digitally for meeting attendance</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center hover:transform hover:scale-105 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaEnvelope className="text-white text-xl" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">4. Get Updates</h3>
              <p className="text-white/70 text-sm">Receive real-time status notifications</p>
            </div>
          </div>
        </div>
      </div>

      {/* Technology Stack Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            Technology Stack
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/80 px-4">
            Built with modern technologies for optimal performance
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center">
            <div className="bg-white/10 rounded-xl p-4">
              <FaLaptopCode className="text-3xl text-yellow-400 mx-auto mb-2" />
              <p className="text-white font-medium text-sm">React + Vite</p>
              <p className="text-white/50 text-xs">Frontend</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white/10 rounded-xl p-4">
              <FaDatabase className="text-3xl text-green-400 mx-auto mb-2" />
              <p className="text-white font-medium text-sm">Node.js + Express</p>
              <p className="text-white/50 text-xs">Backend API</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white/10 rounded-xl p-4">
              <FaShieldVirus className="text-3xl text-blue-400 mx-auto mb-2" />
              <p className="text-white font-medium text-sm">MongoDB</p>
              <p className="text-white/50 text-xs">Database</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white/10 rounded-xl p-4">
              <FaHandshake className="text-3xl text-purple-400 mx-auto mb-2" />
              <p className="text-white font-medium text-sm">Socket.io</p>
              <p className="text-white/50 text-xs">Real-time Updates</p>
            </div>
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
                MININFRA Reception System
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