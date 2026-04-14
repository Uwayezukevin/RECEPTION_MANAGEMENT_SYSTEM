// src/pages/Home.jsx - Improved Version, No Navigation
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
  FaStar,
  FaAward,
  FaGlobe,
  FaMobileAlt,
  FaLock,
  FaCloudUploadAlt,
  FaHeadset,
} from "react-icons/fa";
import { MdAdminPanelSettings, MdMeetingRoom, MdSecurity } from "react-icons/md";
import { MdLocationOn, MdEmail } from "react-icons/md";
import logo from "../assets/image.png";

const Home = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const visitorRegistrationUrl = `${window.location.origin}/visitor-service`;

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
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary-50 to-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center mb-6">
            <img src={logo} className="h-20 sm:h-24 w-auto" alt="MININFRA LOGO" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Welcome to the
            <span className="block text-primary-600 mt-2">
              Internal MININFRA Management System
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            A complete digital solution for visitor management, service requests, 
            and meeting attendance tracking with real-time updates and digital signatures.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/visitor-service"
              className="group flex flex-col items-center justify-center bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:border-primary-300 transition-all duration-300"
            >
              <div className="w-28 h-28 mb-3">
                <QRCodeSVG 
                  value={visitorRegistrationUrl}
                  size={112}
                  level="H"
                />
              </div>
              <span className="text-gray-700 font-semibold text-center">
                Visitor Registration
              </span>
              <span className="text-gray-400 text-xs mt-1">Scan QR code to continue</span>
            </Link>
            
            {!user && (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <FaSignInAlt className="text-lg" />
                <span className="font-semibold">Staff Login</span>
                <FaArrowRight />
              </Link>
            )}
          </div>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-12">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <MdSecurity className="text-blue-500" />
              <span>Secure Platform</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <FaGlobe className="text-primary-500" />
              <span>24/7 Global Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">100%</div>
              <p className="text-gray-600 text-sm">Digital Process</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">Real-time</div>
              <p className="text-gray-600 text-sm">Status Updates</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">Digital</div>
              <p className="text-gray-600 text-sm">Signatures</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">24/7</div>
              <p className="text-gray-600 text-sm">Access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Core Modules Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Our Core Modules</h2>
            <p className="text-lg text-gray-600">Complete solutions for modern reception management</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Visitor Module Card */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FaUserCheck className="text-green-600 text-2xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Visitor Management</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Complete digital visitor registration and service request system with real-time tracking.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-3"><FaCheckCircle className="text-green-500 text-sm flex-shrink-0" /> <span>QR Code based visitor registration</span></li>
                <li className="flex items-center gap-3"><FaCheckCircle className="text-green-500 text-sm flex-shrink-0" /> <span>Service request submission and tracking</span></li>
                <li className="flex items-center gap-3"><FaCheckCircle className="text-green-500 text-sm flex-shrink-0" /> <span>Real-time status updates via WebSocket</span></li>
                <li className="flex items-center gap-3"><FaCheckCircle className="text-green-500 text-sm flex-shrink-0" /> <span>Email notifications for request updates</span></li>
                <li className="flex items-center gap-3"><FaCheckCircle className="text-green-500 text-sm flex-shrink-0" /> <span>Visitor history and analytics</span></li>
              </ul>
            </div>

            {/* Meeting Module Card */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MdMeetingRoom className="text-purple-600 text-2xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Meeting Management</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Digital meeting attendance tracking with electronic signatures and real-time reporting.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-3"><FaCheckCircle className="text-green-500 text-sm flex-shrink-0" /> <span>Schedule and manage company meetings</span></li>
                <li className="flex items-center gap-3"><FaCheckCircle className="text-green-500 text-sm flex-shrink-0" /> <span>Digital signature capture for attendance</span></li>
                <li className="flex items-center gap-3"><FaCheckCircle className="text-green-500 text-sm flex-shrink-0" /> <span>QR code based participant sign-in</span></li>
                <li className="flex items-center gap-3"><FaCheckCircle className="text-green-500 text-sm flex-shrink-0" /> <span>Export reports (PDF, Excel, HTML) with signatures</span></li>
                <li className="flex items-center gap-3"><FaCheckCircle className="text-green-500 text-sm flex-shrink-0" /> <span>Real-time participant tracking</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-lg text-gray-600">Simple, fast, and convenient process for all users</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: FaQrcode, title: "1. Scan QR Code", desc: "Scan QR code at reception to start registration", color: "bg-blue-100", iconColor: "text-blue-600" },
              { icon: FaClipboardList, title: "2. Fill Details", desc: "Complete registration and select services", color: "bg-green-100", iconColor: "text-green-600" },
              { icon: FaFileSignature, title: "3. Digital Signature", desc: "Sign digitally for meeting attendance", color: "bg-purple-100", iconColor: "text-purple-600" },
              { icon: FaEnvelope, title: "4. Get Updates", desc: "Receive real-time status notifications", color: "bg-orange-100", iconColor: "text-orange-600" }
            ].map((step, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300 group">
                <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <step.icon className={`${step.iconColor} text-2xl`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Features Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Key Features</h2>
            <p className="text-lg text-gray-600">Everything you need for a seamless experience</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: FaRocket, title: "Fast Registration", desc: "Quick and easy visitor check-in process" },
              { icon: FaBell, title: "Real-time Notifications", desc: "Instant updates on request status via WebSocket" },
              { icon: FaFileSignature, title: "Digital Signatures", desc: "Electronic signature capture for meetings" },
              { icon: FaCalendarAlt, title: "Meeting Management", desc: "Schedule and track meeting attendance" },
              { icon: FaQrcode, title: "QR Code Access", desc: "Easy sign-in via QR code scanning" },
              { icon: FaChartLine, title: "Export Reports", desc: "PDF, Excel, HTML exports with signatures" }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <feature.icon className="text-primary-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-gray-500 text-sm">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
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
            {[
              { icon: FaLaptopCode, name: "React + Vite", desc: "Frontend", color: "text-blue-600" },
              { icon: FaDatabase, name: "Node.js + Express", desc: "Backend API", color: "text-green-600" },
              { icon: FaDatabase, name: "MongoDB", desc: "Database", color: "text-green-600" },
              { icon: FaHandshake, name: "Socket.io", desc: "Real-time Updates", color: "text-purple-600" }
            ].map((tech, idx) => (
              <div key={idx} className="text-center p-6 bg-gray-50 rounded-2xl hover:shadow-md transition-all">
                <tech.icon className={`text-4xl ${tech.color} mx-auto mb-3`} />
                <p className="text-gray-800 font-semibold text-sm">{tech.name}</p>
                <p className="text-gray-500 text-xs mt-1">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied users who have streamlined their reception management process.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/visitor-service"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary-600 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-md"
            >
              <FaUserCheck />
              Register as Visitor
              <FaArrowRight />
            </Link>
            {!user && (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-3 bg-primary-700 text-white rounded-xl font-semibold hover:bg-primary-800 transition-all"
              >
                <FaSignInAlt />
                Staff Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="Logo" className="h-10 w-auto" />
              <div>
                <p className="text-white font-semibold text-sm">MININFRA Reception System</p>
                <p className="text-gray-500 text-xs">© 2026 All rights reserved</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-gray-500 text-xs">
              <span className="flex items-center gap-1"><MdLocationOn /> Kigali, Rwanda</span>
              <span className="flex items-center gap-1"><FaPhone /> +250 788 123 456</span>
              <span className="flex items-center gap-1"><MdEmail /> support@mininfra.gov.rw</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;