// src/pages/Home.jsx - White Theme, No Meetings Link
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
} from "react-icons/fa";
import { MdAdminPanelSettings, MdMeetingRoom } from "react-icons/md";
import { MdLocationOn } from "react-icons/md";
import logo from "../assets/image.png";

const Home = () => {
  const navigate = useNavigate();
  const { user, loading, isAdmin, isReceptionist } = useAuth();
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Auth Links */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-end items-center gap-3">
            {user ? (
              <>
                {isReceptionist() && (
                  <button
                    onClick={() => handleProtectedNavigation("/receptionist-dashboard")}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium"
                  >
                    <FaUserCheck className="inline mr-2 text-sm" />
                    Reception
                  </button>
                )}
                {isAdmin() && (
                  <button
                    onClick={() => handleProtectedNavigation("/admin/dashboard")}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all text-sm font-medium"
                  >
                    <MdAdminPanelSettings className="inline mr-2 text-sm" />
                    Admin Panel
                  </button>
                )}
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all text-sm font-medium flex items-center gap-2"
              >
                <FaSignInAlt className="text-sm" />
                Staff Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center mb-6">
            <img src={logo} className="h-16 sm:h-20 w-auto" alt="MININFRA LOGO" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Welcome to the
            <span className="block text-primary-600">
              Reception Management System
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            A complete digital solution for visitor management, service requests, and meeting attendance tracking with real-time updates and digital signatures.
          </p>
          
          {/* QR Code Section */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/visitor-service"
              className="flex flex-col items-center justify-center bg-white border-2 border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg hover:border-primary-300 transition-all duration-300"
            >
              <div className="w-24 h-24 mb-2">
                <QRCodeSVG 
                  value={visitorRegistrationUrl}
                  size={96}
                  level="H"
                />
              </div>
              <span className="text-gray-700 text-sm font-medium text-center">
                Scan to continue as a visitor
              </span>
            </Link>
            
            {!user && (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-md"
              >
                <FaSignInAlt />
                <span>Staff Login</span>
                <FaArrowRight />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">100%</div>
              <p className="text-gray-600 text-sm">Digital Process</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">Real-time</div>
              <p className="text-gray-600 text-sm">Status Updates</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">Digital</div>
              <p className="text-gray-600 text-sm">Signatures</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">24/7</div>
              <p className="text-gray-600 text-sm">Access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Main Modules Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Our Core Modules</h2>
            <p className="text-lg text-gray-600">Complete solutions for visitor management and meeting tracking</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Visitor Module Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-all hover:border-primary-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <FaUserCheck className="text-green-600 text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Visitor Management</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Complete digital visitor registration and service request system
              </p>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 text-xs" /> QR Code based visitor registration</li>
                <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 text-xs" /> Service request submission and tracking</li>
                <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 text-xs" /> Real-time status updates via WebSocket</li>
                <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 text-xs" /> Email notifications for request updates</li>
                <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 text-xs" /> Visitor history and analytics</li>
              </ul>
            </div>

            {/* Meeting Module Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-all hover:border-primary-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <MdMeetingRoom className="text-purple-600 text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Meeting Management</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Digital meeting attendance tracking with electronic signatures
              </p>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 text-xs" /> Schedule and manage company meetings</li>
                <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 text-xs" /> Digital signature capture for attendance</li>
                <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 text-xs" /> QR code based participant sign-in</li>
                <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 text-xs" /> Export reports (PDF, Excel, HTML) with signatures</li>
                <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 text-xs" /> Real-time participant tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-lg text-gray-600">Simple, fast, and convenient process for all users</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-md transition-all">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaQrcode className="text-primary-600 text-xl" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">1. Scan QR Code</h3>
              <p className="text-gray-600 text-sm">Scan QR code at reception to start registration</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-md transition-all">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaClipboardList className="text-primary-600 text-xl" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">2. Fill Details</h3>
              <p className="text-gray-600 text-sm">Complete registration and select services</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-md transition-all">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaFileSignature className="text-primary-600 text-xl" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">3. Digital Signature</h3>
              <p className="text-gray-600 text-sm">Sign digitally for meeting attendance</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-md transition-all">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaEnvelope className="text-primary-600 text-xl" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">4. Get Updates</h3>
              <p className="text-gray-600 text-sm">Receive real-time status notifications</p>
            </div>
          </div>
        </div>
      </div>

      {/* Technology Stack Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Technology Stack</h2>
            <p className="text-lg text-gray-600">Built with modern technologies for optimal performance</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <FaLaptopCode className="text-3xl text-primary-600 mx-auto mb-2" />
              <p className="text-gray-800 font-medium text-sm">React + Vite</p>
              <p className="text-gray-500 text-xs">Frontend</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <FaDatabase className="text-3xl text-primary-600 mx-auto mb-2" />
              <p className="text-gray-800 font-medium text-sm">Node.js + Express</p>
              <p className="text-gray-500 text-xs">Backend API</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <FaDatabase className="text-3xl text-primary-600 mx-auto mb-2" />
              <p className="text-gray-800 font-medium text-sm">MongoDB</p>
              <p className="text-gray-500 text-xs">Database</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <FaHandshake className="text-3xl text-primary-600 mx-auto mb-2" />
              <p className="text-gray-800 font-medium text-sm">Socket.io</p>
              <p className="text-gray-500 text-xs">Real-time Updates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
            <div className="flex items-center space-x-2">
              <FaIdCard className="text-gray-400 text-lg" />
              <span className="text-gray-400 font-semibold text-sm">MININFRA Reception System</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-gray-500 text-xs">
              <span>© 2026 Reception Management System</span>
              <span className="hidden sm:inline">|</span>
              <span className="flex items-center gap-1"><MdLocationOn className="text-xs" /> Kigali, Rwanda</span>
              <span className="hidden sm:inline">|</span>
              <span className="flex items-center gap-1"><FaPhone className="text-xs" /> Support</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;