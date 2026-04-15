// src/pages/VisitorQrcode.jsx
import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { FaHome, FaDownload, FaPrint, FaShareAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import logo from "../assets/image.png";

const VisitorQrcode = () => {
  const navigate = useNavigate();
  const visitorUrl = `${window.location.origin}/visitor-service`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* QR Code Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-4 text-center">
            <img
              src={logo}
              alt="MININFRA Logo"
              className="h-12 mx-auto mb-2 bg-white rounded-lg p-1"
            />
            <h1 className="text-xl font-bold text-white">
              Visitor Registration
            </h1>
            <p className="text-primary-100 text-sm mt-1">
              Scan QR code to register
            </p>
          </div>

          {/* QR Code */}
          <div className="p-6 flex flex-col items-center">
            <div className="qr-code-canvas bg-white p-4 rounded-xl shadow-md border border-gray-200">
              <QRCodeSVG
                value={visitorUrl}
                size={220}
                level="H"
                includeMargin={true}
                className="mx-auto"
              />
            </div>

            {/* URL Display */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 break-all bg-gray-50 p-2 rounded-lg">
                {visitorUrl}
              </p>
            </div>

            {/* Instructions */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                📱 Scan this QR code with your phone camera
                <br />
                to access the visitor registration form
              </p>
            </div>
          </div>

          {/* Back Button */}
          <div className="px-6 pb-6">
            <button
              onClick={() => navigate(-1)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              <FaHome /> Back
            </button>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 text-center border-t border-gray-200">
            <p className="text-xs text-gray-400">
              This QR code links to the official visitor registration page
            </p>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Place this QR code at the reception desk for easy visitor access
          </p>
        </div>
      </div>
    </div>
  );
};

export default VisitorQrcode;
